import {assertAmendmentBaselineCurrent} from './plan-amendment.mjs';
// Server composition boundary, not connected to live routes or demo persona authority.
// loadTrusted must authenticate, project the exact existing plan, and freshly load
// current authority. Authority revocation must advance its DB fence before activation.
import {newPlanApproval,decidePlanApproval} from './plan-approval-policy.mjs';
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(x);
const integer=x=>Number.isSafeInteger(x)&&x>=0;
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const canonical=x=>Array.isArray(x)?x.map(canonical):object(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const digest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(x)))))).map(v=>v.toString(16).padStart(2,'0')).join('');
const actions=['CREATE','SUBMIT','UNIT_FORWARD','FINANCE_FORWARD','APPROVE','RETURN','REJECT','WITHDRAW'];
function validate(r){
 const keys=['operationId','planId','planVersion','action','expectedWorkspaceRevision','expectedReviewRevision','expectedBinding','reason'];
 check(object(r)&&Object.keys(r).length===keys.length&&keys.every(k=>Object.hasOwn(r,k))&&id(r.operationId)&&id(r.planId)&&integer(r.planVersion)&&r.planVersion>0&&actions.includes(r.action)&&integer(r.expectedWorkspaceRevision)&&integer(r.expectedReviewRevision)&&typeof r.expectedBinding==='string'&&r.expectedBinding.length<=1_000_000&&typeof r.reason==='string'&&r.reason.trim()&&r.reason.length<=4000,'INVALID_PLAN_APPROVAL_REQUEST');
}
function trusted(s,r){
 check(object(s)&&s.configuration?.enabled===true,'APPROVAL_SOURCE_NOT_ENABLED');
 const w=s.workspace,c=s.context,f=s.authorityFence;
 check(id(w?.id)&&integer(w.revision)&&object(w.data)&&object(c)&&object(c.principal)&&c.principal.active===true&&id(c.principal.personId)&&c.principal.tenantId===s.plan?.institutionId&&typeof s.subject==='string'&&s.subject.length>0&&s.subject.length<=200,'INVALID_TRUSTED_APPROVAL_CONTEXT');
 if(s.plan?.content?.targetProofs)check(Array.isArray(s.sourceFences)&&['KCC-ANNUAL-TARGETS:','KCC-STRATEGIC-CATALOG:'].every(prefix=>s.sourceFences.some(f=>f.workspaceId===prefix+s.plan.institutionId)),'TARGET_PROOF_FENCES_REQUIRED');
 if(s.sourceFences!==undefined)check(Array.isArray(s.sourceFences)&&s.sourceFences.length===2&&s.sourceFences.every(f=>id(f.workspaceId)&&integer(f.revision)&&![w.id,s.authorityFence?.workspaceId].includes(f.workspaceId))&&new Set(s.sourceFences.map(f=>f.workspaceId)).size===2,'INVALID_PLAN_SOURCE_FENCES');
 check(stamp(c.now)&&stamp(s.validUntil)&&c.now<s.validUntil,'APPROVAL_AUTHORITY_EXPIRED');
 check(id(f?.workspaceId)&&f.workspaceId!==w.id&&integer(f.revision)&&f.revision>0,'AUTHORIZATION_FENCE_REQUIRED');
 check(s.plan.id===r.planId&&s.plan.version===r.planVersion,'PLAN_SOURCE_MISMATCH');
 const draft=newPlanApproval({plan:s.plan,now:c.now});
 check(draft.sourceBinding===r.expectedBinding,'STALE_PLAN_CONTENT_OR_VERSION');
 check(c.plan&&same(c.plan,s.plan),'PLAN_CONTEXT_MISMATCH');
 return draft;
}
async function stage(request,input){
 const s=structuredClone(input),draft=trusted(s,request),{workspace:w,context:c}=s;
 const rows=w.data.planApprovalRecords??[];
 check(Array.isArray(rows)&&rows.every(r=>object(r)&&Array.isArray(r.operations)),'INVALID_APPROVAL_STORAGE');
 check(!(w.data.planAmendments??[]).some(a=>a.operationId===request.operationId),'OPERATION_ID_CONFLICT');
 const matches=rows.filter(r=>r.planId===request.planId&&r.planVersion===request.planVersion);
 check(matches.length<=1,'AMBIGUOUS_PLAN_APPROVAL');
 const old=matches[0],fingerprint=await digest({request,personId:c.principal.personId,workspaceId:w.id,institutionId:s.plan.institutionId});
 const receipts=rows.flatMap(record=>record.operations.filter(op=>op.id===request.operationId).map(op=>({record,op})));
 check(receipts.length<=1,'AMBIGUOUS_OPERATION_RECEIPT');
 if(receipts.length){
  const {record,op}=receipts[0];
  check(record.planId===request.planId&&record.planVersion===request.planVersion&&op.personId===c.principal.personId&&op.fingerprint===fingerprint,'OPERATION_ID_CONFLICT');
  // A retry is a read of a prior receipt, not a new decision. Still require the
  // same currently authorized actor/assignment; revoked access cannot read it.
  const command={action:request.action==='CREATE'?'SUBMIT':request.action,expectedRevision:op.before.revision,expectedBinding:request.expectedBinding,reason:request.reason};
  const candidate=decidePlanApproval(op.before,command,c);
  check(same(candidate.decisions.at(-1).authority,op.authority),'REPLAY_AUTHORITY_CHANGED');
  check(integer(op.response?.committedWorkspaceRevision)&&op.response.committedWorkspaceRevision<=w.revision,'INVALID_OPERATION_RECEIPT');
  return {replay:true,response:{...op.response,replayed:true},validUntil:s.validUntil,now:c.now,fingerprint};
 }
 assertAmendmentBaselineCurrent(w.data,s.plan);
 check(w.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 let before,review,authority;
 if(request.action==='CREATE'){
  check(!old&&request.expectedReviewRevision===0,'PLAN_APPROVAL_ALREADY_EXISTS');
  // Check owner capability without recording or inventing a submitted decision.
  authority=decidePlanApproval(draft,{action:'SUBMIT',expectedRevision:1,expectedBinding:draft.sourceBinding,reason:request.reason},c).decisions.at(-1).authority;
  const predecessors=rows.filter(r=>r.planId===request.planId).sort((a,b)=>b.planVersion-a.planVersion);
  check(!predecessors.length||predecessors[0].planVersion<request.planVersion,'NEWER_PLAN_REVIEW_EXISTS');
  review=newPlanApproval({plan:s.plan,previous:predecessors[0]??null,now:c.now});before=draft;
 }else{
  check(old&&old.revision===request.expectedReviewRevision,'REVIEW_REVISION_CONFLICT');
  before=structuredClone(old);delete before.operations;
  review=decidePlanApproval(before,{action:request.action,expectedRevision:request.expectedReviewRevision,expectedBinding:request.expectedBinding,reason:request.reason},c);
  authority=review.decisions.at(-1).authority;
 }
 const response={ok:true,replayed:false,planId:review.planId,planVersion:review.planVersion,reviewRevision:review.revision,state:review.state,committedWorkspaceRevision:w.revision+1,executionAuthorized:false};
 review.operations=structuredClone(old?.operations??[]);
 check(review.operations.length<100,'APPROVAL_HISTORY_LIMIT');
 review.operations.push({id:request.operationId,personId:c.principal.personId,fingerprint,authority,before,response,reason:request.reason.trim()});
 const data=structuredClone(w.data);data.planApprovalRecords??=[];
 const index=data.planApprovalRecords.findIndex(r=>r.planId===review.planId&&r.planVersion===review.planVersion);
 if(index<0)data.planApprovalRecords.push(review);else data.planApprovalRecords[index]=review;
 const payload=JSON.stringify(data);check(new TextEncoder().encode(payload).byteLength<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 // Clock and expiry are checked separately. Changing identities, assignments,
 // grants, configuration, source plan or fence between reads invalidates save.
 const authorityFingerprint=await digest({principal:c.principal,grants:c.grants,assignments:c.assignments,reviewers:c.reviewers,configuration:s.configuration,plan:s.plan,subject:s.subject,authorityFence:s.authorityFence,sourceFences:s.sourceFences??[],validUntil:s.validUntil});
 return {replay:false,payload,response,fingerprint,authorityFingerprint,authorityFence:s.authorityFence,sourceFences:s.sourceFences??[],workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,personId:c.principal.personId,now:c.now,validUntil:s.validUntil,audit:{kind:'AP001',operationId:request.operationId,planId:review.planId,planVersion:review.planVersion,reviewRevision:review.revision,action:request.action,state:review.state,authority,reasonReference:{field:'operations.reason',operationId:request.operationId},sourceDigest:await digest(s.plan),executionAuthorized:false}};
}
export async function savePlanApproval({db,loadTrusted,request,clock=()=>new Date().toISOString()}){
 check(db&&typeof db.prepare==='function'&&typeof db.batch==='function'&&typeof loadTrusted==='function'&&typeof clock==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const r=structuredClone(request);validate(r);
 const first=await stage(r,await loadTrusted());
 const next=await stage(r,await loadTrusted());
 const now=clock();check(stamp(now)&&now>=next.now&&now<next.validUntil,'APPROVAL_AUTHORITY_EXPIRED');
 check(first.fingerprint===next.fingerprint,'APPROVAL_CONTEXT_CHANGED');
 if(next.replay)return next.response;
 check(!first.replay&&first.authorityFingerprint===next.authorityFingerprint,'APPROVAL_AUTHORITY_CHANGED');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1,f=next.authorityFence;
 const extra=next.sourceFences||[];
 const fence='EXISTS (SELECT 1 FROM kcc_workspaces AS authority_fence WHERE authority_fence.id=? AND authority_fence.revision=?)'+extra.map(()=> ' AND EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND revision=?)').join('');
 const result=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=? AND '+fence).bind(next.payload,revision,commitId,now,next.workspaceId,next.revisionBefore,f.workspaceId,f.revision,...extra.flatMap(f=>[f.workspaceId,f.revision])),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=? AND revision=?)').bind(commitId,next.workspaceId,revision,next.subject,next.personId,'plan.approval.'+r.action.toLowerCase(),JSON.stringify(next.audit),now,next.workspaceId,commitId,revision)
 ]);
 check(result[0]?.meta?.changes===1,'WORKSPACE_OR_AUTHORITY_REVISION_CONFLICT');
 check(result[1]?.meta?.changes===1,'APPROVAL_AUDIT_NOT_COMMITTED');
 return next.response;
}
