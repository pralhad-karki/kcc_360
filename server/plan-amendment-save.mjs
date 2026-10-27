import {newPlanApproval} from './plan-approval-policy.mjs';
import {preparePlanAmendment,authorizeAmendmentOwner,amendmentEnabled,planValueDigest,samePlanValue} from './plan-amendment.mjs';
const check=(ok,m)=>{if(!ok)throw Error(m)};
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(x);
function validate(r){const fields=['operationId','planId','planVersion','expectedWorkspaceRevision','expectedReviewRevision','expectedBinding','changes','reason'];check(r&&typeof r==='object'&&!Array.isArray(r)&&Object.keys(r).length===fields.length&&fields.every(k=>Object.hasOwn(r,k))&&id(r.operationId)&&typeof r.planId==='string'&&Number.isSafeInteger(r.planVersion)&&r.planVersion>0&&Number.isSafeInteger(r.expectedWorkspaceRevision)&&r.expectedWorkspaceRevision>=0&&Number.isSafeInteger(r.expectedReviewRevision)&&r.expectedReviewRevision>0&&typeof r.expectedBinding==='string'&&Array.isArray(r.changes)&&typeof r.reason==='string'&&r.reason.trim()&&r.reason.length<=4000,'INVALID_AMENDMENT_REQUEST')}
async function stage(r,input){
 const s=structuredClone(input),w=s.workspace,c=s.context,f=s.authorityFence;
 check(s.configuration?.enabled===true&&w&&Number.isSafeInteger(w.revision)&&w.revision>=0&&typeof s.subject==='string'&&stamp(c?.now)&&stamp(s.validUntil)&&c.now<s.validUntil&&id(f?.workspaceId)&&f.workspaceId!==w.id&&Number.isSafeInteger(f.revision)&&f.revision>0,'INVALID_TRUSTED_AMENDMENT_CONTEXT');
 const sourceFences=s.sourceFences??[];
 if(s.plan?.content?.targetProofs)check(sourceFences.length===2&&['KCC-ANNUAL-TARGETS:','KCC-STRATEGIC-CATALOG:'].every(prefix=>sourceFences.some(x=>x.workspaceId===prefix+s.plan.institutionId)),'TARGET_PROOF_FENCES_REQUIRED');
 check(Array.isArray(sourceFences)&&sourceFences.every(x=>typeof x.workspaceId==='string'&&Number.isSafeInteger(x.revision)&&x.revision>=0&&![w.id,f.workspaceId].includes(x.workspaceId))&&new Set(sourceFences.map(x=>x.workspaceId)).size===sourceFences.length,'INVALID_AMENDMENT_SOURCE_FENCES');
 check(amendmentEnabled(s),'AMENDMENTS_NOT_ENABLED_FOR_SOURCE');authorizeAmendmentOwner(s);
 const binding=newPlanApproval({plan:s.plan,now:c.now}).sourceBinding;check(s.plan.id===r.planId&&s.plan.version===r.planVersion&&binding===r.expectedBinding&&samePlanValue(c.plan,s.plan),'AMENDMENT_SOURCE_CHANGED');
 const rows=w.data.planAmendments??[];check(Array.isArray(rows),'INVALID_AMENDMENT_STORAGE');
 const fingerprint=await planValueDigest({request:r,workspaceId:w.id,personId:c.principal.personId,institutionId:s.plan.institutionId});
 const previous=rows.filter(a=>a.operationId===r.operationId);check(previous.length<=1,'AMBIGUOUS_AMENDMENT_RECEIPT');
 check(!(w.data.planApprovalRecords??[]).some(review=>review.operations.some(op=>op.id===r.operationId)),'OPERATION_ID_CONFLICT');
 if(previous.length){const a=previous[0];check(a.requestFingerprint===fingerprint&&a.byPersonId===c.principal.personId&&a.response?.committedWorkspaceRevision<=w.revision,'OPERATION_ID_CONFLICT');return {replay:true,response:{...a.response,replayed:true},fingerprint,now:c.now,validUntil:s.validUntil}}
 check(w.revision===r.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 const {review,amendment}=preparePlanAmendment(s,r);review.operations=[];
 const response={ok:true,replayed:false,planId:review.planId,planVersion:review.planVersion,reviewRevision:review.revision,state:review.state,amendmentId:amendment.id,baselineVersion:amendment.baselineVersion,committedWorkspaceRevision:w.revision+1,executionAuthorized:false};
 const data=structuredClone(w.data);data.planAmendments??=[];data.planApprovalRecords??=[];
 data.planAmendments.push({...amendment,operationId:r.operationId,requestFingerprint:fingerprint,response});data.planApprovalRecords.push(review);
 const payload=JSON.stringify(data);check(new TextEncoder().encode(payload).byteLength<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 const authorityFingerprint=await planValueDigest({configuration:s.configuration,context:{...c,now:null},plan:s.plan,subject:s.subject,fence:f,sourceFences,validUntil:s.validUntil});
 return {replay:false,payload,response,fingerprint,authorityFingerprint,workspaceId:w.id,revisionBefore:w.revision,personId:c.principal.personId,subject:s.subject,now:c.now,validUntil:s.validUntil,fence:f,sourceFences,audit:{kind:'PLAN_AMENDMENT_DRAFT',operationId:r.operationId,planId:review.planId,planVersion:review.planVersion,baselineVersion:amendment.baselineVersion,previousVersion:amendment.previousVersion,amendmentId:amendment.id,changeCount:amendment.changes.length,reasonReference:{recordId:amendment.id,field:'reason'},executionAuthorized:false}};
}
export async function savePlanAmendment({db,loadTrusted,request,clock=()=>new Date().toISOString()}){
 check(db&&typeof db.prepare==='function'&&typeof db.batch==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');const r=structuredClone(request);validate(r);
 const first=await stage(r,await loadTrusted()),next=await stage(r,await loadTrusted()),now=clock();check(stamp(now)&&now>=next.now&&now<next.validUntil,'AMENDMENT_AUTHORITY_EXPIRED');check(first.fingerprint===next.fingerprint,'AMENDMENT_CONTEXT_CHANGED');if(next.replay)return next.response;check(!first.replay&&first.authorityFingerprint===next.authorityFingerprint,'AMENDMENT_AUTHORITY_CHANGED');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1,f=next.fence;
 const extra=next.sourceFences,sourceFenceSql=extra.map((_,i)=>` AND EXISTS (SELECT 1 FROM kcc_workspaces AS source_${i} WHERE source_${i}.id=? AND source_${i}.revision=?)`).join('');
 const result=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=? AND EXISTS (SELECT 1 FROM kcc_workspaces AS authority_fence WHERE authority_fence.id=? AND authority_fence.revision=?)'+sourceFenceSql).bind(next.payload,revision,commitId,now,next.workspaceId,next.revisionBefore,f.workspaceId,f.revision,...extra.flatMap(x=>[x.workspaceId,x.revision])),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=? AND revision=?)').bind(commitId,next.workspaceId,revision,next.subject,next.personId,'plan.amendment.draft',JSON.stringify(next.audit),now,next.workspaceId,commitId,revision)
 ]);check(result[0]?.meta?.changes===1,'WORKSPACE_OR_AUTHORITY_REVISION_CONFLICT');check(result[1]?.meta?.changes===1,'AMENDMENT_AUDIT_NOT_COMMITTED');return next.response;
}
