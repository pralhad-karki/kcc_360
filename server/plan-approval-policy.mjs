// Incremental AP-001 core. Trusted inputs only, no live routes/storage/grant provisioning.
// Reuses existing permission resolution; this module alone never authorizes execution.
import {resolvePermission}from './permission-policy.mjs';
export const PLAN_APPROVAL_POLICY='AP001_V1';
export const PLAN_KINDS=Object.freeze(['ACADEMIC','DEPARTMENTAL','COURSE','CLUB','RESEARCH','INSTITUTIONAL','PARTNERSHIP','JOINT_EVENT']);
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
function canonical(x){if(Array.isArray(x))return x.map(canonical);if(plain(x))return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));check(x===null||typeof x==='string'||typeof x==='boolean'||typeof x==='number'&&Number.isFinite(x),'INVALID_JSON_CONTENT');return x}
function planBinding(p){check(plain(p)&&id(p.id)&&positive(p.version)&&id(p.institutionId)&&id(p.unitId)&&PLAN_KINDS.includes(p.kind)&&id(p.ownerActorId)&&id(p.ownerPersonId)&&plain(p.content),'INVALID_PLAN');check(typeof p.content.title==='string'&&p.content.title.trim()&&Number.isFinite(p.content.budget)&&p.content.budget>=0,'PLAN_TITLE_AND_NONNEGATIVE_BUDGET_REQUIRED');return JSON.stringify(canonical(p))}
const slots={UNIT_REVIEW:'unit',FINANCE_ADMIN_REVIEW:'finance',PRINCIPAL_REVIEW:'principal'};
const roles={finance:'FINANCE_ADMINISTRATOR',principal:'PRINCIPAL'};
function authorize(plan,slot,context){
 const {principal,grants,assignments,now}=context;
 const matching=assignments?.filter(a=>a.stage===slot&&a.planId===plan.id&&a.planVersion===plan.version&&a.institutionId===plan.institutionId&&a.unitId===plan.unitId)||[];
 check(matching.length===1,'UNIQUE_SCOPED_ASSIGNMENT_REQUIRED');const a=matching[0];
 check(a.status==='ACTIVE'&&(!a.validFrom||stamp(a.validFrom)&&a.validFrom<=now)&&(!a.validUntil||stamp(a.validUntil)&&now<a.validUntil),'INACTIVE_REVIEW_ASSIGNMENT');
 check(id(a.id)&&positive(a.version)&&id(a.personId)&&id(a.grantId)&&positive(a.grantVersion)&&a.personId===principal?.personId,'CURRENT_ASSIGNED_REVIEWER_REQUIRED');
 const g=grants?.find(g=>g.id===a.grantId&&g.version===a.grantVersion);check(g&&(!roles[slot]||g.roleId===roles[slot]),'REVIEW_ROLE_REQUIRED');
 const permission=slot==='unit'?'PLAN.UNIT_REVIEW':slot==='finance'?'PLAN.FINANCE_REVIEW':'PLAN.FINAL_APPROVE';
 const result=resolvePermission({principal,grants,now,request:{permission,scope:{tenantId:plan.institutionId,departmentId:plan.unitId,recordId:plan.id},classification:'INTERNAL',relationships:['INSTITUTION_REVIEWER'],record:{owner:plan.ownerActorId}},personMap:{[plan.ownerActorId]:plan.ownerPersonId}});
 check(result.allowed,result.reason);check(result.grants.some(r=>(typeof r==='string'?r:r.id)===g.id),'ASSIGNED_GRANT_REQUIRED');
 return {assignmentId:a.id,assignmentVersion:a.version,grantId:g.id,grantVersion:g.version,personId:principal.personId,slot};
}
export function newPlanApproval({plan,previous=null,now}={}){
 check(stamp(now),'INVALID_TIME');const binding=planBinding(plan);
 if(previous){check(previous.policy===PLAN_APPROVAL_POLICY&&previous.planId===plan.id&&previous.institutionId===plan.institutionId&&previous.unitId===plan.unitId&&previous.kind===plan.kind&&previous.planVersion<plan.version&&['REVISION_REQUIRED','REJECTED','WITHDRAWN','APPROVED'].includes(previous.state),'VERSIONED_REVISION_REQUIRED')}
 return {policy:PLAN_APPROVAL_POLICY,planId:plan.id,planVersion:plan.version,institutionId:plan.institutionId,unitId:plan.unitId,kind:plan.kind,sourceBinding:binding,revision:1,state:'DRAFT',decisions:[],createdAt:now,previous:previous?{planVersion:previous.planVersion,revision:previous.revision,state:previous.state,sourceBinding:previous.sourceBinding}:null,executionAuthorized:false};
}
export function decidePlanApproval(record,command,context={}){
 check(record?.policy===PLAN_APPROVAL_POLICY&&positive(record.revision)&&Array.isArray(record.decisions),'INVALID_REVIEW_RECORD');
 check(stamp(context.now)&&context.now>=(record.decisions.at(-1)?.at||record.createdAt),'INVALID_OR_BACKDATED_DECISION_TIME');
 const plan=context.plan,binding=planBinding(plan);check(binding===record.sourceBinding&&plan.id===record.planId&&plan.version===record.planVersion,'STALE_PLAN_CONTENT_OR_VERSION');
 check(command?.expectedRevision===record.revision&&command.expectedBinding===record.sourceBinding,'STALE_REVIEW_REVISION');
 check(typeof command.reason==='string'&&command.reason.trim()&&command.reason.length<=4000,'REASON_REQUIRED');
 const action=command.action;let next,authority;
 if(action==='SUBMIT'||action==='WITHDRAW'){
  check(action==='SUBMIT'?record.state==='DRAFT':['UNIT_REVIEW','FINANCE_ADMIN_REVIEW','PRINCIPAL_REVIEW'].includes(record.state),'INVALID_TRANSITION');
  check(context.principal?.personId===plan.ownerPersonId,'PLAN_OWNER_REQUIRED');
  const p=resolvePermission({principal:context.principal,grants:context.grants,now:context.now,request:{permission:'PLAN.SUBMIT',scope:{tenantId:plan.institutionId,departmentId:plan.unitId,recordId:plan.id},classification:'INTERNAL',relationships:['PLAN_AUTHOR']}});check(p.allowed,p.reason);
  authority={personId:context.principal.personId,slot:'owner'};next=action==='SUBMIT'?'UNIT_REVIEW':'WITHDRAWN';
 }else{
  const slot=slots[record.state];check(slot,'INVALID_TRANSITION');authority=authorize(plan,slot,context);
  if(action==='RETURN'||action==='REJECT')next=action==='RETURN'?'REVISION_REQUIRED':'REJECTED';
  else{check((slot==='unit'&&action==='UNIT_FORWARD')||(slot==='finance'&&action==='FINANCE_FORWARD')||(slot==='principal'&&action==='APPROVE'),'INVALID_TRANSITION');next=slot==='unit'?'FINANCE_ADMIN_REVIEW':slot==='finance'?'PRINCIPAL_REVIEW':'APPROVED'}
  if(action==='APPROVE'){
   check(plan.originatingRole!=='PRINCIPAL','PRINCIPAL_ORIGINATED_POLICY_REQUIRED');
   // Revalidate exact recorded reviewer assignments and grants; revoked/changed authority is not silently reused.
   for(const [priorAction,priorSlot]of [['UNIT_FORWARD','unit'],['FINANCE_FORWARD','finance']]){
    const prior=record.decisions.findLast(d=>d.action===priorAction);check(prior&&prior.sourceBinding===binding,'PRIOR_REVIEW_REQUIRED');
    const reviewers=context.reviewers?.filter(p=>p.personId===prior.authority.personId)||[];check(reviewers.length===1,'CURRENT_PRIOR_REVIEWER_REQUIRED');
    const current=authorize(plan,priorSlot,{...context,principal:reviewers[0]});check(JSON.stringify(current)===JSON.stringify(prior.authority),'PRIOR_AUTHORITY_CHANGED');
   }
   check(record.decisions.at(-1)?.action==='FINANCE_FORWARD','FINANCE_REVIEW_MUST_PRECEDE_PRINCIPAL');
  }
 }
 const result=structuredClone(record);result.revision++;result.state=next;result.decisions.push({action,from:record.state,to:next,planVersion:plan.version,sourceBinding:binding,authority,reason:command.reason.trim(),at:context.now});
 if(next==='APPROVED')result.approvedSnapshot=structuredClone(plan);
 return result;
}
