// Isolated trusted-loader contract validator. No live route/engine imports.
// Both input and configuration must be server-loaded, never browser assertions.
import {prepareAuthorizationContext} from './identity-grant-adapter.mjs';
import {permissionTimestamp as at} from './permission-policy.mjs';
export const clubActionAssignmentsConfiguration=Object.freeze({tenantId:'KCC',workspaceId:'KCC-OWNER-DEMO',version:1,authorities:Object.freeze([]),assignments:Object.freeze([])});
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const id=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200&&!v.includes('*');
const integer=v=>Number.isSafeInteger(v)&&v>0;
const exact=(v,keys,optional=[])=>obj(v)&&keys.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>keys.includes(k)||optional.includes(k));
const unique=rows=>new Set(rows.map(r=>r.id)).size===rows.length;
const scopeKeys=['tenantId','workspaceId','clubId','cycle','evaluationId','evaluationVersion','annualVersion','criterionKey','closureId'];
const validScope=s=>exact(s,scopeKeys)&&scopeKeys.every(k=>['evaluationVersion','annualVersion'].includes(k)?integer(s[k]):id(s[k]));
const sameScope=(a,b)=>scopeKeys.every(k=>a[k]===b[k]);
const interval=r=>at(r.validFrom)!==null&&at(r.validUntil)!==null&&at(r.validFrom)<at(r.validUntil)&&(r.revokedAt===undefined||at(r.revokedAt)!==null);
const active=(r,time)=>at(r.validFrom)<=time&&time<at(r.validUntil)&&(r.revokedAt===undefined||time<at(r.revokedAt));
export function prepareClubActionAssignment(input={},configuration=clubActionAssignmentsConfiguration){
 const fail=reason=>({ok:false,capabilityOnly:true,reason,adapterVersion:'CLUB-ACTION-PILOT-1'});
 if(!exact(input,['session','authority','now','workspace','resource']))return fail('UNTRUSTED_OR_MISSING_INPUT');
 const context=prepareAuthorizationContext(input);if(!context.ok)return fail(context.reason);
 const {workspace:w,resource:r,authority}=input,c=configuration,time=at(input.now);
 if(!exact(w,['id','revision','data'])||!id(w.id)||!Number.isSafeInteger(w.revision)||w.revision<0||!obj(w.data)||!Array.isArray(w.data.clubEvaluations))return fail('INVALID_WORKSPACE');
 const scope=Object.fromEntries(scopeKeys.map(k=>[k,r?.[k]]));
 if(!exact(r,[...scopeKeys,'workspaceRevision'])||!validScope(scope)||r.workspaceId!==w.id||r.tenantId!==context.principal.tenantId||r.workspaceRevision!==w.revision)return fail('INVALID_OR_STALE_RESOURCE');
 const evaluations=w.data.clubEvaluations.filter(e=>e?.id===r.evaluationId);if(evaluations.length!==1)return fail('ASSESSMENT_UNAVAILABLE');const evaluation=evaluations[0];
 if(evaluation.clubId!==r.clubId||evaluation.cycle!==r.cycle||evaluation.version!==r.evaluationVersion||evaluation.annualVersion!==r.annualVersion||evaluation.state!=='VERIFIED'||!Array.isArray(evaluation.criteria))return fail('VERIFIED_ASSESSMENT_REQUIRED');
 const criteria=evaluation.criteria.filter(c=>c?.key===r.criterionKey);if(criteria.length!==1||!criteria[0].action||criteria[0].action.state!=='OPEN'||!id(criteria[0].action.owner))return fail('EXACT_OPEN_ACTION_REQUIRED');
 if(!exact(c,['tenantId','workspaceId','version','authorities','assignments'])||c.tenantId!==r.tenantId||c.workspaceId!==r.workspaceId||!integer(c.version)||!Array.isArray(c.authorities)||!Array.isArray(c.assignments))return fail('INVALID_CONFIGURATION');
 const authorityKeys=['id','version','scope','approverPersonIds','validFrom','validUntil'];
 if(!c.authorities.every(a=>exact(a,authorityKeys,['revokedAt'])&&id(a.id)&&integer(a.version)&&validScope(a.scope)&&Array.isArray(a.approverPersonIds)&&a.approverPersonIds.length>0&&a.approverPersonIds.every(id)&&new Set(a.approverPersonIds).size===a.approverPersonIds.length&&interval(a))||!unique(c.authorities))return fail('INVALID_ASSIGNMENT_AUTHORITY');
 const rowKeys=['id','version','scope','authorityId','authorityVersion','ownerActorId','reviewerActorId','status','requestedByPersonId','approvedByPersonId','approvedAt','approvalReference','validFrom','validUntil'];
 if(!c.assignments.every(a=>exact(a,rowKeys,['revokedAt'])&&id(a.id)&&integer(a.version)&&validScope(a.scope)&&id(a.authorityId)&&integer(a.authorityVersion)&&[a.ownerActorId,a.reviewerActorId,a.requestedByPersonId,a.approvedByPersonId,a.approvalReference].every(id)&&['PENDING','APPROVED','REVOKED'].includes(a.status)&&at(a.approvedAt)!==null&&interval(a))||!unique(c.assignments))return fail('INVALID_ASSIGNMENTS');
 const rows=c.assignments.filter(a=>sameScope(a.scope,scope));if(rows.length!==1)return fail(rows.length?'AMBIGUOUS_ASSIGNMENT':'NO_ASSIGNMENT');const row=rows[0];
 const authorities=c.authorities.filter(a=>a.id===row.authorityId&&a.version===row.authorityVersion&&sameScope(a.scope,scope));if(authorities.length!==1)return fail('NO_SCOPED_AUTHORITY');const approving=authorities[0];
 if(row.status!=='APPROVED'||!active(row,time)||!active(approving,time))return fail('ASSIGNMENT_INACTIVE');
 const activePerson=p=>authority.people.some(v=>v.personId===p&&v.status==='ACTIVE');
 const person=actor=>Object.hasOwn(context.personMap,actor)&&activePerson(context.personMap[actor])?context.personMap[actor]:null;
 const owner=person(row.ownerActorId),reviewer=person(row.reviewerActorId),sourceOwner=person(criteria[0].action.owner);
 if(!owner||!reviewer||!sourceOwner)return fail('UNRESOLVED_PARTICIPANT');
 if(owner!==sourceOwner)return fail('SOURCE_OWNER_MISMATCH');if(owner===reviewer)return fail('SAME_PERSON_REVIEW');
 if(!activePerson(row.requestedByPersonId)||!activePerson(row.approvedByPersonId)||!approving.approverPersonIds.includes(row.approvedByPersonId)||row.requestedByPersonId===row.approvedByPersonId||[owner,reviewer].includes(row.approvedByPersonId)||at(row.approvedAt)>time||at(row.approvedAt)>at(row.validFrom)||at(row.approvedAt)<at(approving.validFrom)||at(row.approvedAt)>=at(approving.validUntil))return fail('INVALID_INDEPENDENT_APPROVAL');
 if(![owner,reviewer].includes(context.principal.personId))return fail('PERSON_NOT_ASSIGNED');
 const starts=Math.max(at(row.validFrom),at(approving.validFrom)),ends=Math.min(at(row.validUntil),at(approving.validUntil),row.revokedAt?at(row.revokedAt):Infinity,approving.revokedAt?at(approving.revokedAt):Infinity);
 const assignment={id:row.id,version:row.version,ownerPersonId:owner,reviewerPersonId:reviewer,sourceOwnerActorId:criteria[0].action.owner,clubId:r.clubId,cycle:r.cycle,evaluationId:r.evaluationId,evaluationVersion:r.evaluationVersion,criterionKey:r.criterionKey,validFrom:new Date(starts).toISOString(),validUntil:new Date(ends).toISOString(),binding:{scope,configurationVersion:c.version,authorityId:approving.id,authorityVersion:approving.version}};
 return {ok:true,capabilityOnly:true,adapterVersion:'CLUB-ACTION-PILOT-1',actorPersonId:context.principal.personId,assignment:structuredClone(assignment),workspaceRevision:w.revision,contextValidUntil:new Date(Math.min(at(context.validUntil),ends)).toISOString(),provenance:{authorizationVersion:context.authorizationVersion,identityLink:structuredClone(context.provenance.identityLink),assignmentId:row.id,assignmentVersion:row.version,approvalReference:row.approvalReference,approvedByPersonId:row.approvedByPersonId,approvedAt:row.approvedAt}};
}
