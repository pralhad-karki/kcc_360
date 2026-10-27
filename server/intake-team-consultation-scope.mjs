// Explicit current coordinator confirmation; no implied final approval or delivery completion.
import {teamConsultationMentorSource} from './intake-team-consultation-save.mjs';
import {validateTeamConsultationRecord} from './intake-team-consultation-response-save.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
export const consultationScopeCanonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(consultationScopeCanonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(consultationScopeCanonical(v[k]))])):v);
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(consultationScopeCanonical(v))))).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function teamConsultationScopeSource(s,r,f,coordinatorActor){
 const a=r.mentorAssignments?.at(-1);check(a,'CURRENT_ACCEPTED_MENTOR_REQUIRED');const {mentorSource}=teamConsultationMentorSource(s,r,f,{assignmentId:a.id,assignmentVersion:a.version},coordinatorActor),history=r.supportRequests||[];check(Array.isArray(history),'VALID_CONSULTATION_HISTORY_REQUIRED');
 const latest=[...new Set(history.map(q=>q.target))].map(target=>history.filter(q=>q.target===target).at(-1)),active=latest.filter(q=>q.state!=='WITHDRAWN');check(active.length>0&&active.length<=100,'ISSUED_CONSULTATION_SCOPE_REQUIRED');
 const consultations=[];for(const q of active){const source=validateTeamConsultationRecord(s,r,f,q,{allowResponded:true});check(q.state==='ACCEPTED','ACCEPTED_CONSULTATION_SCOPE_REQUIRED');consultations.push({consultationId:q.id,consultationVersion:q.version,departmentId:source.departmentId,requestDigest:await digest(q)})}
 consultations.sort((a,b)=>a.departmentId.localeCompare(b.departmentId));check(consultations.every(x=>id(x.departmentId))&&new Set(consultations.map(x=>x.departmentId)).size===consultations.length,'UNIQUE_CONSULTATION_DEPARTMENTS_REQUIRED');
 return {mentorSource,assignmentId:a.id,assignmentVersion:a.version,mentorResponseDigest:await digest(a.response),consultations,departments:consultations.map(x=>x.departmentId)};
}
export async function teamConsultationScopeStatus(s,r,f){
 const history=r.teamConsultationScopes||[],latest=Array.isArray(history)?history.at(-1):null;if(!latest)return {state:Array.isArray(history)?'UNCONFIRMED':'STALE',version:0};
 try{check(history.every((x,i)=>x.version===i+1)&&new Set(history.map(x=>x.id)).size===history.length&&id(latest.id)&&id(latest.by)&&latest.state==='CONFIRMED'&&typeof latest.reason==='string'&&latest.reason.trim().length>0&&latest.reason.length<=2000&&Date.parse(latest.at)<=Date.parse(s.now),'VALID_SCOPE_HISTORY_REQUIRED');const source=await teamConsultationScopeSource(s,r,f,latest.by);check(consultationScopeCanonical(latest.departments)===consultationScopeCanonical(source.departments)&&latest.basis===consultationScopeCanonical(source)&&consultationScopeCanonical(latest.sourceSnapshot)===consultationScopeCanonical(source),'CONSULTATION_SCOPE_CHANGED_BEFORE_SAVE');return {state:'CURRENT',version:latest.version};}catch{return {state:'STALE',version:Number.isSafeInteger(latest.version)&&latest.version>0?latest.version:0}}
}

export async function teamConsultationScopePreviewToken(source,expectedScopeVersion){return digest({source,expectedScopeVersion})}
