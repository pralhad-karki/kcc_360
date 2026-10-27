import {planTargetProofSummary} from './plan-target-proof.mjs';
import {savePlanAmendment} from './plan-amendment-save.mjs';
import {assertAmendmentBaselineCurrent,canDraftPlanAmendment} from './plan-amendment.mjs';
import {newPlanApproval,decidePlanApproval} from './plan-approval-policy.mjs';
import {savePlanApproval} from './plan-approval-save.mjs';
import {PlanApprovalAccessError} from './plan-approval-runtime.mjs';
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const fail=(v,status,message)=>{if(!v)throw new PlanApprovalAccessError(status,message)};
const actions=['CREATE','SUBMIT','UNIT_FORWARD','FINANCE_FORWARD','APPROVE','RETURN','REJECT','WITHDRAW'];
function current(source){const rows=source.workspace.data.planApprovalRecords??[];fail(Array.isArray(rows),503,'Plan review storage is unavailable.');const found=rows.filter(r=>r.planId===source.plan.id&&r.planVersion===source.plan.version);fail(found.length<=1,503,'Plan review storage needs review.');return found[0]??null}
function available(source,record){
 const draft=newPlanApproval({plan:source.plan,now:source.context.now});
 if(!record){
  // Earlier approved/submitted legacy plans need a separate reviewed adoption;
  // opening this page cannot manufacture Finance/Principal history for them.
  if(source.plan.content.source?.record.state!=='DRAFT')return [];
  try{decidePlanApproval(draft,{action:'SUBMIT',expectedRevision:1,expectedBinding:draft.sourceBinding,reason:'Access preview'},source.context);return ['CREATE']}catch{return []}
 }
 if(record.sourceBinding!==draft.sourceBinding)return [];
 try{assertAmendmentBaselineCurrent(source.workspace.data,source.plan)}catch{return []}
 return actions.filter(a=>a!=='CREATE').filter(action=>{try{decidePlanApproval(record,{action,expectedRevision:record.revision,expectedBinding:record.sourceBinding,reason:'Access preview'},source.context);return true}catch{return false}});
}
function sourceDetails(plan){
 const raw=plan.content.source.proposedRecord??plan.content.source.record,headerKeys=['title','year','department','programme','batch','semester','course','objective'],itemKeys=['id','title','type','start','end','reportDue','duration','participants','venue','budget','funding','outcomes','output','outputs','competencies','evidence','evaluation','portfolio','resources','risks','risk','kpi','baseline','target','sdg','lead','mentor','milestones','priority','status','cancelReason','executionAuthorization'];
 const pick=(object,keys)=>Object.fromEntries(keys.filter(k=>['string','number'].includes(typeof object[k])).map(k=>[k,object[k]]));
 if(plan.kind==='DEPARTMENTAL'){headerKeys.push('unitCode','cycle','objectives');itemKeys.push('serviceArea','responsible','mentorEvaluator','deliverable','budgetReference')}
 return {heading:pick(raw,headerKeys),items:(raw.items??[]).map(i=>pick(i,itemKeys))};
}
async function projection(source){
 const record=current(source),draft=newPlanApproval({plan:source.plan,now:source.context.now});
 const amendment=(source.workspace.data.planAmendments??[]).find(a=>a.planId===source.plan.id&&a.planVersion===source.plan.version);
 const versions=(source.workspace.data.planApprovalRecords??[]).filter(r=>r.planId===source.plan.id).map(r=>({version:r.planVersion,state:r.state})).sort((a,b)=>a.version-b.version);
 let baselineCurrent=true;try{assertAmendmentBaselineCurrent(source.workspace.data,source.plan)}catch{baselineCurrent=false}
 return {baselineCurrent,versions,amendmentDateOnly:!!source.plan.content.targetProofs,amendmentEligible:canDraftPlanAmendment(source),amendment:amendment?{id:amendment.id,baselineVersion:amendment.baselineVersion,baselineApproved:amendment.baselineApproved,previousVersion:amendment.previousVersion,changes:amendment.changes,reason:amendment.reason}:null,planId:source.plan.id,planVersion:source.plan.version,title:source.plan.content.title,kind:source.plan.kind,sourceDetails:sourceDetails(source.plan),targetContributions:planTargetProofSummary(source.plan),budget:source.plan.content.budget,unitId:source.plan.unitId,state:record?.state??'NOT_STARTED',reviewRevision:record?.revision??0,workspaceRevision:source.workspace.revision,bindingHash:await hash(draft.sourceBinding),sourceCurrent:!record||record.sourceBinding===draft.sourceBinding,validUntil:source.validUntil,actions:available(source,record),decisions:(record?.decisions??[]).map(d=>({action:d.action,from:d.from,to:d.to,stage:d.authority.slot,reason:d.reason,at:d.at,planVersion:d.planVersion})),executionAuthorized:false};
}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export async function readPlanApprovalReview({runtime,subject,reference}){
 fail(runtime?.enabled&&typeof runtime.loadTrusted==='function',503,'Institutional plan review is not activated.');
 const one=await projection(await runtime.loadTrusted({subject,reference})),two=await projection(await runtime.loadTrusted({subject,reference}));
 // Expiry may advance slightly; content, available actions and versions may not.
 fail(same({...one,validUntil:null},{...two,validUntil:null}),409,'Plan or reviewer authority changed. Refresh before retrying.');return two;
}
export async function decidePlanApprovalReview({runtime,db,subject,body,clock=()=>new Date().toISOString()}){
 fail(runtime?.enabled&&typeof runtime.loadTrusted==='function',503,'Institutional plan review is not activated.');
 if(body?.action==='DRAFT_AMENDMENT')return draftPlanAmendmentReview({runtime,db,subject,body,clock});
 const fields=['operationId','planId','planVersion','action','expectedWorkspaceRevision','expectedReviewRevision','bindingHash','reason','confirm'];
 fail(body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).length===fields.length&&fields.every(k=>Object.hasOwn(body,k))&&body.confirm===true&&actions.includes(body.action)&&typeof body.bindingHash==='string'&&/^[a-f0-9]{64}$/.test(body.bindingHash),400,'Only current plan references and confirmed review fields may be submitted.');
 const command=structuredClone(body),reference={planId:command.planId,planVersion:command.planVersion};
 // Save owns cloning, double source reads, fresh authority/expiry, receipts,
 // exact revisions and transactional audit/CAS. No browser identity is accepted.
 try{
  const initial=await runtime.loadTrusted({subject,reference}),binding=newPlanApproval({plan:initial.plan,now:initial.context.now}).sourceBinding;
  fail(await hash(binding)===command.bindingHash,409,'Plan content changed. Refresh before retrying.');
  const result=await savePlanApproval({db,clock,request:{operationId:command.operationId,planId:command.planId,planVersion:command.planVersion,action:command.action,expectedWorkspaceRevision:command.expectedWorkspaceRevision,expectedReviewRevision:command.expectedReviewRevision,expectedBinding:binding,reason:command.reason},loadTrusted:async()=>{
   const source=await runtime.loadTrusted({subject,reference});
   fail(command.action!=='CREATE'||source.plan.content.source?.record.state==='DRAFT',409,'Legacy plan adoption requires a separately reviewed version.');
   const draft=newPlanApproval({plan:source.plan,now:source.context.now});
   fail(await hash(draft.sourceBinding)===command.bindingHash,409,'Plan content changed. Refresh before retrying.');return source;
  }});return result;
 }catch(e){if(e instanceof PlanApprovalAccessError)throw e;throw new PlanApprovalAccessError(409,'Plan review was not saved. Refresh to inspect its current state before retrying.');}
}

export async function draftPlanAmendmentReview({runtime,db,subject,body,clock=()=>new Date().toISOString()}){
 fail(runtime?.enabled&&typeof runtime.loadTrusted==='function',503,'Institutional plan review is not activated.');
 const keys=['operationId','planId','planVersion','action','expectedWorkspaceRevision','expectedReviewRevision','bindingHash','reason','confirm','changes'];
 fail(body&&typeof body==='object'&&!Array.isArray(body)&&Object.keys(body).length===keys.length&&keys.every(k=>Object.hasOwn(body,k))&&body.action==='DRAFT_AMENDMENT'&&body.confirm===true&&typeof body.bindingHash==='string'&&/^[a-f0-9]{64}$/.test(body.bindingHash),400,'Only confirmed amendment references and supported changes may be submitted.');
 const command=structuredClone(body),reference={planId:command.planId,planVersion:command.planVersion};
 try{const first=await runtime.loadTrusted({subject,reference}),binding=newPlanApproval({plan:first.plan,now:first.context.now}).sourceBinding;
  fail(await hash(binding)===command.bindingHash,409,'Plan content changed. Refresh before retrying.');
  return await savePlanAmendment({db,clock,request:{operationId:command.operationId,planId:command.planId,planVersion:command.planVersion,expectedWorkspaceRevision:command.expectedWorkspaceRevision,expectedReviewRevision:command.expectedReviewRevision,expectedBinding:binding,changes:command.changes,reason:command.reason},loadTrusted:async()=>{const source=await runtime.loadTrusted({subject,reference});fail(await hash(newPlanApproval({plan:source.plan,now:source.context.now}).sourceBinding)===command.bindingHash,409,'Plan content changed. Refresh before retrying.');return source}});
 }catch(e){if(e instanceof PlanApprovalAccessError)throw e;throw new PlanApprovalAccessError(409,'Amendment was not saved. Refresh to inspect the current version before retrying.');}
}
