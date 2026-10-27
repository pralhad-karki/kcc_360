// Isolated definition validator only. No live imports, grants, counting or decisions.
// Configuration, stable scope and active-person directory must be trusted server input.
import {permissionTimestamp as at} from './permission-policy.mjs';
export const workloadPolicyDefaults=Object.freeze({version:1,enabled:false,authorities:Object.freeze([]),policies:Object.freeze([])});
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const id=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200&&!v.includes('*');
const integer=v=>Number.isSafeInteger(v)&&v>0;
const exact=(v,keys,optional=[])=>obj(v)&&keys.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>keys.includes(k)||optional.includes(k));
const unique=rows=>rows.every(obj)&&new Set(rows.map(r=>r.id)).size===rows.length;
const scopeKeys=['tenantId','workspaceId','programmeId','semesterId','courseId','activityType','studentRole'];
const validScope=s=>exact(s,scopeKeys)&&scopeKeys.every(k=>id(s[k]));
const sameScope=(a,b)=>scopeKeys.every(k=>a[k]===b[k]);
const period=r=>at(r.validFrom)!==null&&at(r.validUntil)!==null&&at(r.validFrom)<at(r.validUntil)&&(r.revokedAt===undefined||at(r.revokedAt)!==null);
const end=r=>Math.min(at(r.validUntil),r.revokedAt===undefined?Infinity:at(r.revokedAt));
const active=(r,time)=>at(r.validFrom)<=time&&time<end(r);
const states=['APPROVED','STARTED','IN_PROGRESS','EXECUTION_COMPLETED','REFLECTION_PENDING','EVALUATION_PENDING'];
const measures={CONCURRENT_ACTIVITIES:'ACTIVITY_PERSON',ASSIGNED_TASKS_IN_CURRENT_ACTIVITIES:'TASK_PERSON'};
function validCounting(c,measure){return exact(c,['states','window','includePaused','includePending','deduplicateBy'])&&Array.isArray(c.states)&&c.states.length>0&&new Set(c.states).size===c.states.length&&c.states.every(s=>states.includes(s))&&c.window==='CURRENT_COMMITMENTS'&&c.includePaused===false&&c.includePending===false&&c.deduplicateBy===measures[measure]}
export function validateWorkloadPolicyPilot(configuration=workloadPolicyDefaults,{now,people=[]}={}){
 const fail=reason=>({ok:false,capabilityOnly:true,reason,reviewRequired:true});const c=configuration,time=at(now);
 if(time===null||!Array.isArray(people)||!people.every(p=>exact(p,['personId','status'])&&id(p.personId)&&['ACTIVE','INACTIVE'].includes(p.status))||new Set(people.map(p=>p.personId)).size!==people.length)return fail('INVALID_TRUSTED_CONTEXT');
 if(!exact(c,['version','enabled','authorities','policies'])||!integer(c.version)||typeof c.enabled!=='boolean'||!Array.isArray(c.authorities)||!Array.isArray(c.policies)||!unique(c.authorities)||!unique(c.policies))return fail('INVALID_CONFIGURATION');
 const activePerson=p=>people.some(row=>row.personId===p&&row.status==='ACTIVE');
 const authorityKeys=['id','version','scope','approverPersonIds','validFrom','validUntil'];
 if(!c.authorities.every(a=>exact(a,authorityKeys,['revokedAt'])&&id(a.id)&&integer(a.version)&&validScope(a.scope)&&period(a)&&Array.isArray(a.approverPersonIds)&&a.approverPersonIds.length>0&&new Set(a.approverPersonIds).size===a.approverPersonIds.length&&a.approverPersonIds.every(id)))return fail('INVALID_SCOPED_AUTHORITY');
 const policyKeys=['id','version','scope','measure','threshold','mode','counting','status','authorityId','authorityVersion','requestedByPersonId','approval','validFrom','validUntil'];
 for(const p of c.policies){
  if(!exact(p,policyKeys,['revokedAt'])||!id(p.id)||!integer(p.version)||!validScope(p.scope)||!Object.hasOwn(measures,p.measure)||!integer(p.threshold)||!['WARN','ENFORCE'].includes(p.mode)||!validCounting(p.counting,p.measure)||!['DRAFT','APPROVED','REVOKED'].includes(p.status)||!id(p.authorityId)||!integer(p.authorityVersion)||!id(p.requestedByPersonId)||!period(p))return fail('INVALID_POLICY_DEFINITION');
  const matches=c.authorities.filter(a=>a.id===p.authorityId&&a.version===p.authorityVersion&&sameScope(a.scope,p.scope));if(matches.length!==1)return fail('SCOPED_AUTHORITY_REQUIRED');const a=matches[0];
  if(p.status==='DRAFT'){if(p.approval!==null)return fail('DRAFT_APPROVAL_NOT_ALLOWED');continue}
  const approval=p.approval;if(!exact(approval,['approvedByPersonId','approvedAt','reference'])||!id(approval.approvedByPersonId)||!id(approval.reference)||at(approval.approvedAt)===null||at(approval.approvedAt)>time||at(approval.approvedAt)>at(p.validFrom)||!activePerson(p.requestedByPersonId)||!activePerson(approval.approvedByPersonId)||approval.approvedByPersonId===p.requestedByPersonId||!a.approverPersonIds.includes(approval.approvedByPersonId)||!active(a,at(approval.approvedAt)))return fail('INDEPENDENT_APPROVAL_REQUIRED');
 }
 const approved=c.policies.filter(p=>p.status==='APPROVED');
 for(let i=0;i<approved.length;i++)for(let j=i+1;j<approved.length;j++){const a=approved[i],b=approved[j];if(sameScope(a.scope,b.scope)&&a.measure===b.measure&&Math.max(at(a.validFrom),at(b.validFrom))<Math.min(end(a),end(b)))return fail('OVERLAPPING_POLICY_REVIEW_REQUIRED')}
 if(!c.enabled)return {ok:true,capabilityOnly:true,status:'DISABLED',configurationVersion:c.version,definitions:c.policies.length,candidates:[]};
 const candidates=[];for(const p of approved){const authority=c.authorities.find(a=>a.id===p.authorityId&&a.version===p.authorityVersion&&sameScope(a.scope,p.scope));if(active(p,time)&&active(authority,time))candidates.push({id:p.id,version:p.version,scope:structuredClone(p.scope),measure:p.measure,threshold:p.threshold,mode:p.mode,counting:structuredClone(p.counting),validUntil:new Date(Math.min(end(p),end(authority))).toISOString()})}
 return {ok:true,capabilityOnly:true,status:'VALIDATED_ONLY',configurationVersion:c.version,definitions:c.policies.length,candidates};
}

// Pure scope matching only. Coverage and mappings must be freshly server-loaded;
// a caller's claim of completeness is not an authoritative MIS reconciliation.
export function matchWorkloadPolicyRecordsPilot({configuration=workloadPolicyDefaults,now,people=[],scope,personId,coverage,records}={}){
 const fail=reason=>({ok:false,capabilityOnly:true,reviewRequired:true,reason});
 const definitions=validateWorkloadPolicyPilot(configuration,{now,people});if(!definitions.ok)return definitions;
 if(definitions.status==='DISABLED')return {ok:true,capabilityOnly:true,status:'DISABLED',matches:[]};
 if(!validScope(scope)||!id(personId)||!people.some(p=>p.personId===personId&&p.status==='ACTIVE'))return fail('VERIFIED_SUBJECT_SCOPE_REQUIRED');
 const policies=definitions.candidates.filter(p=>sameScope(p.scope,scope));
 if(!policies.length)return {ok:true,capabilityOnly:true,status:'NO_MATCHING_POLICY',matches:[]};
 const coverageKeys=['sourceId','version','scope','personId','asOf','validUntil','complete'];const time=at(now);
 if(!exact(coverage,coverageKeys)||!id(coverage.sourceId)||!integer(coverage.version)||!validScope(coverage.scope)||!sameScope(coverage.scope,scope)||coverage.personId!==personId||coverage.complete!==true||at(coverage.asOf)===null||at(coverage.validUntil)===null||at(coverage.asOf)>time||time>=at(coverage.validUntil)||at(coverage.asOf)>=at(coverage.validUntil))return fail('CURRENT_COMPLETE_MAPPING_REQUIRED');
 if(!Array.isArray(records))return fail('SCOPED_RECORDS_REQUIRED');
 const recordKeys=['id','version','sourceVersion','scope','personId','kind','activityId','taskId','state','control','resolved'],knownStates=['CREATED','PENDING_APPROVAL',...states,'COMPLETION_VERIFIED','CLOSED','ARCHIVED'];
 const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
 const byId=new Map(),units=new Map();
 for(const r of records){
  if(!exact(r,recordKeys)||!id(r.id)||!integer(r.version)||!integer(r.sourceVersion)||!validScope(r.scope)||!id(r.personId)||!['ACTIVITY','TASK'].includes(r.kind)||!id(r.activityId)||(r.kind==='ACTIVITY'?r.taskId!==null:!id(r.taskId))||!knownStates.includes(r.state)||!['ACTIVE','POSTPONED','CANCELLED'].includes(r.control)||typeof r.resolved!=='boolean')return fail('INVALID_WORKLOAD_MAPPING');
  if(r.sourceVersion!==coverage.version||r.personId!==personId||!sameScope(r.scope,scope))return fail('RECORD_MAPPING_SCOPE_OR_VERSION_MISMATCH');
  if(byId.has(r.id)){if(canonical(byId.get(r.id))!==canonical(r))return fail('CONFLICTING_RECORD_VERSIONS');continue}
  const unit=JSON.stringify([r.kind,r.activityId,r.taskId,r.personId]);if(units.has(unit))return fail('AMBIGUOUS_COMMITMENT_MAPPING');units.set(unit,r.id);byId.set(r.id,r);
 }
 const candidates=[...byId.values()];
 const activities=new Map(candidates.filter(r=>r.kind==='ACTIVITY').map(r=>[r.activityId,r]));for(const task of candidates.filter(r=>r.kind==='TASK')){const parent=activities.get(task.activityId);if(!parent||['state','control','resolved'].some(k=>task[k]!==parent[k]))return fail('TASK_ACTIVITY_MAPPING_INCONSISTENT');}
 const matches=policies.map(p=>({policyId:p.id,policyVersion:p.version,measure:p.measure,records:candidates.filter(r=>(p.measure==='CONCURRENT_ACTIVITIES'?r.kind==='ACTIVITY':r.kind==='TASK')&&p.counting.states.includes(r.state)&&r.control==='ACTIVE'&&!r.resolved).map(r=>({id:r.id,version:r.version}))}));
 return {ok:true,capabilityOnly:true,status:'MATCHED_ONLY',configurationVersion:definitions.configurationVersion,coverageVersion:coverage.version,validUntil:new Date(Math.min(at(coverage.validUntil),...policies.map(p=>at(p.validUntil)))).toISOString(),matches};
}

// Counterfactual calculation only. Never issues warnings, permissions or blocks.
export function calculateWorkloadPolicyPilot(input={}){
 const matched=matchWorkloadPolicyRecordsPilot(input);
 if(!matched.ok)return {ok:false,capabilityOnly:true,status:'UNKNOWN',reviewRequired:true,reason:matched.reason,results:[]};
 if(matched.status==='DISABLED'||matched.status==='NO_MATCHING_POLICY')return {ok:true,capabilityOnly:true,status:matched.status==='DISABLED'?'DISABLED':'NOT_CONFIGURED',results:[]};
 const definitions=input.configuration.policies;
 const results=matched.matches.map(m=>{const definition=definitions.find(p=>p.id===m.policyId&&p.version===m.policyVersion),count=m.records.length,threshold=definition.threshold;return {policyId:m.policyId,policyVersion:m.policyVersion,measure:m.measure,count,threshold,comparison:count>threshold?'ABOVE':count===threshold?'AT':'BELOW',records:structuredClone(m.records)}});
 return {ok:true,capabilityOnly:true,status:'CALCULATED_ONLY',configurationVersion:matched.configurationVersion,coverageVersion:matched.coverageVersion,validUntil:matched.validUntil,results};
}
