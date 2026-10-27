import {validateConsultationManagement} from './intake-team-consultation-management.mjs';
// Scoped current consultation reads; stored assignments never grant access alone.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {validateTeamConsultationRecord} from './intake-team-consultation-response-save.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
async function rows(s){
 const person=s.identity?.principal?.personId;
 check(s.configuration?.enabled===true&&s.normalizationConfiguration?.enabled===true&&s.identity?.ok&&s.identity.principal?.active&&s.identity.personMap?.[s.actorId]===person&&Array.isArray(s.activePersonIds)&&s.activePersonIds.includes(person)&&Array.isArray(s.workspace?.data?.activityIntakes),'CURRENT_CONSULTATION_CONTEXT_REQUIRED');
 const output=[],records=s.workspace.data.activityIntakes;
 for(const r of records){const f=r.teamFirstReviews?.at(-1);if(!f||records.filter(x=>x.id===r.id).length!==1||!Array.isArray(r.supportRequests))continue;
  for(const q of r.supportRequests){let role=null;try{validateConsultationManagement(s,r,f,q,{withdrawn:true});role='COORDINATOR'}catch{if(s.identity.personMap[q.reviewer]===person)role='REPRESENTATIVE'}if(!role)continue;
   try{await validateReviewedTeamSource(s,{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion},{allowFinalized:true});const finalized=(r.teamFinalReviews||[]).some(d=>d.firstReviewId===f.id);const source=role==='COORDINATOR'?validateConsultationManagement(s,r,f,q,{withdrawn:true}):validateTeamConsultationRecord(s,r,f,q,{allowResponded:true}),c=r.submissions.at(-1).content;
    const item={proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,consultationId:q.id,consultationVersion:q.version,departmentId:source.departmentId,title:c.title,role,state:q.state,requestedAt:q.at,due:q.due,finalized,canRespond:!finalized&&role==='REPRESENTATIVE'&&q.state==='REQUESTED',canWithdraw:!finalized&&role==='COORDINATOR'&&q.state!=='WITHDRAWN'};
    output.push({item,detail:{proposal:Object.fromEntries(['title','type','programme','purpose','outputs','start','due'].map(k=>[k,c[k]])),responsibility:q.responsibility,deliverable:q.deliverable},...(role==='COORDINATOR'?{history:r.supportRequests.filter(x=>x.target===q.target).map(x=>({consultationId:x.id,consultationVersion:x.version,reviewer:x.reviewer,state:x.state,requestedAt:x.at,...(x.withdrawal?{withdrawnAt:x.withdrawal.at}:{})}))}:{}),...(q.response&&q.state!=='WITHDRAWN'?{feedback:{decision:q.response.decision,reason:q.response.reason}}:{})});
   }catch{/* Stale/revoked records do not expose private content or response controls. */}
  }
 }
 return output.sort((a,b)=>a.item.proposalId.localeCompare(b.item.proposalId)||a.item.departmentId.localeCompare(b.item.departmentId));
}
function fingerprint(s){return canonical({subject:s.subject,actorId:s.actorId,workspace:s.workspace,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},configuration:s.configuration,normalizationConfiguration:s.normalizationConfiguration})}
export async function readConsistentTeamConsultations({first,second,proposalId,consultationId,offset=0,limit=20}){
 check(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000&&Number.isSafeInteger(limit)&&limit>=1&&limit<=20,'INVALID_CONSULTATION_PAGE');
 const a=await rows(first),b=await rows(second);check(fingerprint(first)===fingerprint(second)&&canonical(a)===canonical(b),'SOURCE_CHANGED_BEFORE_SAVE');
 if(proposalId!==undefined||consultationId!==undefined){const result=b.find(x=>x.item.proposalId===proposalId&&x.item.consultationId===consultationId);check(result,'CONSULTATION_UNAVAILABLE');return result}
 return {items:b.slice(offset,offset+limit).map(x=>x.item),total:b.length,offset,limit};
}

import {teamConsultationMentorSource,teamConsultationSourceSnapshot,teamConsultationSelectionToken} from './intake-team-consultation-save.mjs';
async function requestRows(s){
 check(s.configuration?.enabled===true&&s.normalizationConfiguration?.enabled===true&&s.identity?.ok&&s.identity.principal?.active&&s.identity.personMap?.[s.actorId]===s.identity.principal.personId&&Array.isArray(s.workspace?.data?.activityIntakes),'CURRENT_CONSULTATION_CONTEXT_REQUIRED');
 const output=[],records=s.workspace.data.activityIntakes;
 for(const r of records){try{const f=r.teamFirstReviews?.at(-1),a=r.mentorAssignments?.at(-1);if(!f||!a||records.filter(x=>x.id===r.id).length!==1||!Array.isArray(r.supportRequests||[]))continue;
  await validateReviewedTeamSource(s,{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion});const {p}=teamConsultationMentorSource(s,r,f,{assignmentId:a.id,assignmentVersion:a.version},s.actorId);
  const people=f.team.rounds.at(-1).invitations.map(i=>i.source.personId),departments=[...new Set(s.roster.students.filter(x=>people.includes(x.personId)&&x.institutionId===p.institutionId).map(x=>x.departmentId))].sort().filter(d=>{const previous=(r.supportRequests||[]).filter(q=>q.target==='DEPARTMENT:'+d).at(-1);if(!previous)return true;if(previous.state!=='WITHDRAWN')return false;try{validateConsultationManagement(s,r,f,previous,{withdrawn:true});return true}catch{return false}});if(!departments.length)continue;
  output.push({r,f,departments,item:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,assignmentId:a.id,assignmentVersion:a.version,title:r.submissions.at(-1).content.title}});
 }catch{/* Only a currently authorized coordinator with a current accepted mentor. */}}
 return output.sort((a,b)=>a.item.proposalId.localeCompare(b.item.proposalId));
}
async function selectionProjection(s,{proposalId,offset,limit}){
 const records=await requestRows(s);if(proposalId===undefined)return {items:records.slice(offset,offset+limit).map(x=>x.item),total:records.length,offset,limit};
 const found=records.find(x=>x.item.proposalId===proposalId);check(found,'CONSULTATION_REQUEST_UNAVAILABLE');const {r,f,item,departments}=found,c=r.submissions.at(-1).content,candidates=[];
 for(const departmentId of departments){for(const [reviewer] of Object.entries(s.identity.personMap).sort(([a],[b])=>a.localeCompare(b))){try{
  const source=teamConsultationSourceSnapshot(s,r,f,{assignmentId:item.assignmentId,assignmentVersion:item.assignmentVersion,departmentId,reviewer},s.actorId),entry=s.authority.assignments.find(x=>x.id===source.representative.id&&x.version===source.representative.version);
  candidates.push({departmentId,reviewer,expectedConsultationVersion:(r.supportRequests||[]).filter(q=>q.target==='DEPARTMENT:'+departmentId).at(-1)?.version||0,displayName:typeof entry.displayName==='string'&&entry.displayName.trim()&&entry.displayName.length<=200?entry.displayName:reviewer,selectionToken:await teamConsultationSelectionToken(source,reviewer)});break;
 }catch{/* One verified alias for the uniquely authorized independent department representative. */}}}
 return {item,proposal:Object.fromEntries(['title','type','programme','purpose','outputs','start','due'].map(k=>[k,c[k]])),candidates:candidates.slice(offset,offset+limit),total:candidates.length,offset,limit};
}
export async function readConsistentConsultationRequests({first,second,proposalId,offset=0,limit=20}){
 check(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000&&Number.isSafeInteger(limit)&&limit>=1&&limit<=20,'INVALID_CONSULTATION_PAGE');const a=await selectionProjection(first,{proposalId,offset,limit}),b=await selectionProjection(second,{proposalId,offset,limit});check(fingerprint(first)===fingerprint(second)&&canonical(a)===canonical(b),'SOURCE_CHANGED_BEFORE_SAVE');return b;
}
