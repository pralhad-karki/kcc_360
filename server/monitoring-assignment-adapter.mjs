// Isolated trusted-loader adapter. No live route/engine imports this module.
// Caller must authenticate session and server-load authority, workspace and resource.
// Second argument is trusted deployment configuration, NEVER client request data.
import {prepareAuthorizationContext} from './identity-grant-adapter.mjs';
import {permissionTimestamp as at} from './permission-policy.mjs';
import {monitoringAssignmentsConfiguration} from './monitoring-assignments.mjs';
import {monitoringReviewPilotSummary} from './monitoring-review-pilot.mjs';
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const id=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200&&!v.includes('*');
const integer=v=>Number.isSafeInteger(v)&&v>0;
const exact=(v,keys,optional=[])=>obj(v)&&keys.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>keys.includes(k)||optional.includes(k));
const unique=(rows,key)=>new Set(rows.map(r=>r[key])).size===rows.length;
const scopeKeys=['tenantId','workspaceId','departmentId','programmeId','planId','planVersion','itemId','reviewId'];
const validScope=s=>exact(s,scopeKeys)&&scopeKeys.every(k=>k==='planVersion'?integer(s[k]):id(s[k]));
const sameScope=(a,b)=>scopeKeys.every(k=>a[k]===b[k]);
const interval=r=>at(r.validFrom)!==null&&at(r.validUntil)!==null&&at(r.validFrom)<at(r.validUntil)&&(r.revokedAt===undefined||at(r.revokedAt)!==null);
const active=(r,time)=>at(r.validFrom)<=time&&time<at(r.validUntil)&&(r.revokedAt===undefined||time<at(r.revokedAt));
export function prepareMonitoringAssignment(input={},configuration=monitoringAssignmentsConfiguration){
 const fail=reason=>({ok:false,capabilityOnly:true,reason,adapterVersion:'MONITORING-PILOT-1'});
 if(!exact(input,['session','authority','now','workspace','resource']))return fail('UNTRUSTED_OR_MISSING_INPUT');
 const context=prepareAuthorizationContext(input);if(!context.ok)return fail(context.reason);
 const {workspace:w,resource:r,authority}=input,c=configuration,time=at(input.now);
 if(!exact(w,['id','revision','data'])||!id(w.id)||!Number.isSafeInteger(w.revision)||w.revision<0||!obj(w.data)||!Array.isArray(w.data.plans))return fail('INVALID_WORKSPACE');
 if(!exact(r,[...scopeKeys,'workspaceRevision'])||!validScope(Object.fromEntries(scopeKeys.map(k=>[k,r[k]])))||r.workspaceId!==w.id||r.tenantId!==context.principal.tenantId||r.workspaceRevision!==w.revision)return fail('INVALID_OR_STALE_RESOURCE');
 const scope=Object.fromEntries(scopeKeys.map(k=>[k,r[k]]));
 const plans=w.data.plans.filter(p=>p?.id===r.planId);if(plans.length!==1)return fail('PLAN_UNAVAILABLE');const plan=plans[0];
 if(plan.version!==r.planVersion||!['APPROVED','IN_PROGRESS','COMPLETED'].includes(plan.state)||!Array.isArray(plan.items)||plan.items.filter(i=>i?.id===r.itemId).length!==1)return fail('APPROVED_PLAN_ITEM_REQUIRED');
 if(!exact(c,['tenantId','workspaceId','version','authorities','assignments'])||c.tenantId!==r.tenantId||c.workspaceId!==r.workspaceId||!integer(c.version)||!Array.isArray(c.authorities)||!Array.isArray(c.assignments))return fail('INVALID_CONFIGURATION');
 const authorityKeys=['id','version','scope','approverPersonIds','validFrom','validUntil'];
 if(!c.authorities.every(a=>exact(a,authorityKeys,['revokedAt'])&&id(a.id)&&integer(a.version)&&validScope(a.scope)&&Array.isArray(a.approverPersonIds)&&a.approverPersonIds.length>0&&a.approverPersonIds.every(id)&&new Set(a.approverPersonIds).size===a.approverPersonIds.length&&interval(a))||!unique(c.authorities,'id'))return fail('INVALID_MONITORING_AUTHORITY');
 const rowKeys=['id','version','scope','authorityId','authorityVersion','subjectActorId','submitterActorId','reviewerActorId','actionOwnerActorIds','status','requestedByPersonId','approvedByPersonId','approvedAt','approvalReference','validFrom','validUntil'];
 if(!c.assignments.every(a=>exact(a,rowKeys,['revokedAt'])&&id(a.id)&&integer(a.version)&&validScope(a.scope)&&id(a.authorityId)&&integer(a.authorityVersion)&&[a.subjectActorId,a.submitterActorId,a.reviewerActorId,a.requestedByPersonId,a.approvedByPersonId,a.approvalReference].every(id)&&Array.isArray(a.actionOwnerActorIds)&&a.actionOwnerActorIds.every(id)&&new Set(a.actionOwnerActorIds).size===a.actionOwnerActorIds.length&&['PENDING','APPROVED','REVOKED'].includes(a.status)&&at(a.approvedAt)!==null&&interval(a))||!unique(c.assignments,'id'))return fail('INVALID_MONITORING_ASSIGNMENTS');
 const rows=c.assignments.filter(a=>sameScope(a.scope,scope));if(rows.length!==1)return fail(rows.length?'AMBIGUOUS_ASSIGNMENT':'NO_MONITORING_ASSIGNMENT');const row=rows[0];
 const authorities=c.authorities.filter(a=>a.id===row.authorityId&&a.version===row.authorityVersion&&sameScope(a.scope,scope));if(authorities.length!==1)return fail('NO_SCOPED_AUTHORITY');const approving=authorities[0];
 if(row.status!=='APPROVED'||!active(row,time)||!active(approving,time))return fail('MONITORING_ASSIGNMENT_INACTIVE');
 const activePerson=p=>authority.people.some(v=>v.personId===p&&v.status==='ACTIVE');
 const person=actor=>Object.hasOwn(context.personMap,actor)&&activePerson(context.personMap[actor])?context.personMap[actor]:null;
 const subject=person(row.subjectActorId),submitter=person(row.submitterActorId),reviewer=person(row.reviewerActorId),owners=row.actionOwnerActorIds.map(person);
 if(!subject||!submitter||!reviewer||owners.some(p=>!p)||!person(plan.owner))return fail('UNRESOLVED_PARTICIPANT');
 if(subject!==person(plan.owner))return fail('PLAN_SUBJECT_MISMATCH');
 if([subject,submitter,...owners].includes(reviewer))return fail('SAME_PERSON_REVIEW_OR_CLOSURE');
 const participants=[subject,submitter,reviewer,...owners];
 if(!activePerson(row.requestedByPersonId)||!activePerson(row.approvedByPersonId)||!approving.approverPersonIds.includes(row.approvedByPersonId)||row.requestedByPersonId===row.approvedByPersonId||participants.includes(row.approvedByPersonId)||at(row.approvedAt)>time||at(row.approvedAt)>at(row.validFrom)||at(row.approvedAt)<at(approving.validFrom)||at(row.approvedAt)>=at(approving.validUntil))return fail('INVALID_INDEPENDENT_ASSIGNMENT_APPROVAL');
 if(!participants.includes(context.principal.personId))return fail('PERSON_NOT_ASSIGNED');
 const starts=Math.max(at(row.validFrom),at(approving.validFrom)),ends=Math.min(at(row.validUntil),at(approving.validUntil),row.revokedAt?at(row.revokedAt):Infinity,approving.revokedAt?at(approving.revokedAt):Infinity);
 const assignment={id:row.id,version:row.version,subjectPersonId:subject,submitterPersonId:submitter,reviewerPersonId:reviewer,actionOwnerPersonIds:[...new Set(owners)],validFrom:new Date(starts).toISOString(),validUntil:new Date(ends).toISOString(),binding:{configurationVersion:c.version,authorityId:approving.id,authorityVersion:approving.version,scope}};
 return {ok:true,capabilityOnly:true,adapterVersion:'MONITORING-PILOT-1',actorPersonId:context.principal.personId,assignment:structuredClone(assignment),scope:structuredClone(scope),workspaceRevision:w.revision,contextValidUntil:new Date(Math.min(at(context.validUntil),ends)).toISOString(),provenance:{authorizationVersion:context.authorizationVersion,identityLink:structuredClone(context.provenance.identityLink),assignmentId:row.id,assignmentVersion:row.version,configurationVersion:c.version,authorityId:approving.id,authorityVersion:approving.version,approvalReference:row.approvalReference,approvedByPersonId:row.approvedByPersonId,approvedAt:row.approvedAt}};
}

// Pure protected projection, not an HTTP handler. Caller supplies trusted current
// storage snapshots/evidence. It grants no access to detailed feedback or files.
export function readProtectedMonitoringSummary(input={},configuration=monitoringAssignmentsConfiguration){
 const fail=reason=>({ok:false,reason});
 if(!exact(input,['session','authority','now','workspace','resource','evidenceRegistry']))return fail('UNTRUSTED_OR_MISSING_INPUT');
 const {evidenceRegistry,...trusted}=input,context=prepareMonitoringAssignment(trusted,configuration);
 if(!context.ok)return fail(context.reason);
 if(!Array.isArray(evidenceRegistry)||!evidenceRegistry.every(e=>obj(e)&&id(e.id)&&integer(e.version)&&typeof e.verified==='boolean')||!unique(evidenceRegistry,'id'))return fail('INVALID_EVIDENCE_REGISTRY');
 const records=input.workspace.data.monitoringReviews;
 if(!Array.isArray(records))return fail('REVIEW_UNAVAILABLE');
 const matches=records.filter(r=>r?.id===context.scope.reviewId);if(matches.length!==1)return fail('REVIEW_UNAVAILABLE');const review=matches[0];
 if(review.pilot!==true||review.unrated!==true||!integer(review.revision)||!['DRAFT','SUBMITTED','UNDER_REVIEW','RETURNED','APPROVED'].includes(review.state)||!Array.isArray(review.versions)||!Array.isArray(review.actions)||review.actions.some(a=>!obj(a)||!id(a.id)||!['OPEN','IN_PROGRESS','VERIFIED_CLOSED'].includes(a.state)||typeof a.due!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(a.due)||at(a.due+'T00:00:00Z')===null)||!unique(review.actions,'id'))return fail('INVALID_REVIEW_RECORD');
 const who=context.actorPersonId,a=context.assignment,ownReview=[a.subjectPersonId,a.submitterPersonId].includes(who),reviewer=who===a.reviewerPersonId;
 if(!ownReview&&reviewer&&['DRAFT','RETURNED'].includes(review.state))return fail('REVIEW_NOT_SUBMITTED');
 if(!ownReview&&!reviewer&&review.state!=='APPROVED')return fail('ACTION_STATUS_NOT_AVAILABLE');
 try{
  const plan=input.workspace.data.plans.find(p=>p.id===context.scope.planId),summary=monitoringReviewPilotSummary(review,{assignment:a,actorPersonId:who,now:input.now,plan,evidenceRegistry});
  const actions=summary.actions.filter(action=>ownReview||reviewer||review.actions.find(work=>work.id===action.id)?.ownerPersonId===who).map(action=>({id:action.id,state:action.state,due:review.actions.find(work=>work.id===action.id).due,verificationCurrent:action.verificationCurrent,overdue:action.overdue}));
  const record={id:summary.id,state:summary.state,revision:review.revision,unrated:true,reviewCurrent:summary.reviewCurrent,planId:summary.planId,planVersion:summary.planVersion,itemId:summary.itemId,visibility:ownReview||reviewer?'REVIEW_STATUS':'ASSIGNED_ACTION_STATUS',actions};
  if(ownReview||reviewer){
   if(summary.actualValue!==null&&(typeof summary.actualValue!=='number'||!Number.isFinite(summary.actualValue)))return fail('INVALID_REVIEW_RECORD');
   record.actualValue=summary.actualValue;
  }
  return {ok:true,record,authorization:{adapterVersion:context.adapterVersion,authorizationVersion:context.provenance.authorizationVersion,workspaceRevision:context.workspaceRevision,assignmentId:context.provenance.assignmentId,assignmentVersion:context.provenance.assignmentVersion,configurationVersion:context.provenance.configurationVersion,contextValidUntil:context.contextValidUntil}};
 }catch{return fail('REVIEW_BINDING_OR_RECORD_INVALID')}
}
