import {teamMentorManagementSource} from './intake-team-mentor-withdrawal-save.mjs';
// Fresh scoped projection only. Stored assignments never grant current access.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {teamMentorSourceSnapshot} from './intake-team-mentor-save.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
async function rows(s){
 check(s.configuration?.enabled===true&&s.normalizationConfiguration?.enabled===true&&s.identity?.ok&&s.identity.principal?.active&&s.identity.personMap?.[s.actorId]===s.identity.principal.personId&&Array.isArray(s.workspace?.data?.activityIntakes)&&Array.isArray(s.activePersonIds)&&s.activePersonIds.includes(s.identity.principal.personId),'CURRENT_MENTOR_CONTEXT_REQUIRED');
 const records=s.workspace.data.activityIntakes,person=s.identity.principal.personId,output=[];
 for(const r of records){
  const a=r.mentorAssignments?.at(-1),f=r.teamFirstReviews?.at(-1);
  if(!a||!f||records.filter(x=>x.id===r.id).length!==1)continue;
  let role=null;try{teamMentorAssigningAuthority(s,r,f,s.actorId);role='ASSIGNER'}catch{if(s.identity.personMap[a.mentor]===person)role='MENTOR'}
  if(!role)continue;
  try{
   await validateReviewedTeamSource(s,{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion},{allowFinalized:true});
   const finalized=(r.teamFinalReviews||[]).some(d=>d.firstReviewId===f.id);
   let source;
   if(role==='ASSIGNER')source=teamMentorManagementSource(s,r,f,{withdrawn:true});
   else {
   check(r.mentorAssignments.filter(x=>x.id===a.id).length===1&&r.mentorAssignments.every((x,i)=>x.version===i+1)&&['REQUESTED','ACCEPTED','REASSIGNMENT_REQUESTED'].includes(a.state)&&!a.withdrawal&&Number.isFinite(Date.parse(a.at))&&Date.parse(a.at)<=Date.parse(s.now)&&['fit','capacity','reason'].every(k=>typeof a[k]==='string'&&a[k].trim().length>0&&a[k].length<=2000),'VALID_MENTOR_REQUEST_REQUIRED');
   source=teamMentorSourceSnapshot(s,r,f,a.mentor,a.by);check(canonical(source)===canonical(a.sourceSnapshot)&&a.basis===canonical(source),'CURRENT_MENTOR_SOURCE_REQUIRED');
   if(a.state==='REQUESTED')check(!a.response,'UNANSWERED_ASSIGNMENT_REQUIRED');
   else check(a.response?.decision===a.state&&s.identity.personMap[a.response.by]===source.mentor.personId&&typeof a.response.reason==='string'&&a.response.reason.trim().length>0&&a.response.reason.length<=2000&&a.response.noUnresolvedConflict===(a.state==='ACCEPTED')&&Date.parse(a.at)<=Date.parse(a.response.at)&&Date.parse(a.response.at)<=Date.parse(s.now),'VALID_MENTOR_RESPONSE_REQUIRED');
   }
   const item={proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,assignmentId:a.id,assignmentVersion:a.version,title:r.submissions.at(-1).content.title,role,state:a.state,requestedAt:a.at,finalized,canRespond:!finalized&&role==='MENTOR'&&a.state==='REQUESTED',canWithdraw:!finalized&&role==='ASSIGNER'&&a.state!=='WITHDRAWN'};
   const c=r.submissions.at(-1).content,detail={proposal:Object.fromEntries(['title','type','programme','purpose','outputs','start','due'].map(k=>[k,c[k]])),fit:a.fit,consultationRequired:source.consultationRequired,members:f.team.rounds.at(-1).invitations.map(i=>({studentId:i.source.studentId,displayName:(name=>typeof name==='string'&&name.length<=200?name:i.source.studentId)(s.roster.students.find(x=>x.id===i.source.studentId&&x.institutionId===s.identity.principal.tenantId)?.displayName),isLead:i.source.studentId===f.team.rounds.at(-1).proposal.leadStudentId}))};
   output.push({item,detail,...(role==='ASSIGNER'?{history:r.mentorAssignments.map(x=>({assignmentId:x.id,assignmentVersion:x.version,mentor:x.mentor,state:x.state,requestedAt:x.at,...(x.withdrawal?{withdrawnAt:x.withdrawal.at}:{})}))}:{}),...(a.response&&a.state!=='WITHDRAWN'?{feedback:{decision:a.response.decision,reason:a.response.reason}}:{})});
  }catch{/* Changed/revoked/stale records disappear; no stale content or action is exposed. */}
 }
 return output.sort((a,b)=>a.item.proposalId.localeCompare(b.item.proposalId));
}
function fingerprint(s){return canonical({subject:s.subject,actorId:s.actorId,workspace:s.workspace,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},configuration:s.configuration,normalizationConfiguration:s.normalizationConfiguration})}
export async function readConsistentIntakeTeamMentors({first,second,proposalId,offset=0,limit=20}){
 const a=await rows(first),b=await rows(second);check(fingerprint(first)===fingerprint(second)&&canonical(a)===canonical(b),'SOURCE_CHANGED_BEFORE_SAVE');
 if(proposalId!==undefined){const result=b.find(x=>x.item.proposalId===proposalId);check(result,'MENTOR_ASSIGNMENT_UNAVAILABLE');return result}
 check(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000&&Number.isSafeInteger(limit)&&limit>=1&&limit<=20,'INVALID_MENTOR_PAGE');return {items:b.slice(offset,offset+limit).map(x=>x.item),total:b.length,offset,limit};
}

// Initial/replacement request discovery remains distinct from assignment status reads.
import {teamMentorAssigningAuthority,teamMentorSelectionToken} from './intake-team-mentor-save.mjs';
async function requestRows(s){
 check(s.configuration?.enabled===true&&s.normalizationConfiguration?.enabled===true&&s.identity?.ok&&s.identity.principal?.active&&s.identity.personMap?.[s.actorId]===s.identity.principal.personId&&Array.isArray(s.workspace?.data?.activityIntakes),'CURRENT_MENTOR_CONTEXT_REQUIRED');
 const output=[],records=s.workspace.data.activityIntakes;
 for(const r of records){try{
  const f=r.teamFirstReviews?.at(-1);if(!f||records.filter(x=>x.id===r.id).length!==1||!Array.isArray(r.mentorAssignments||[]))continue;
  const previous=r.mentorAssignments?.at(-1);if(previous){if(previous.state!=='WITHDRAWN')continue;teamMentorManagementSource(s,r,f,{withdrawn:true})}
  await validateReviewedTeamSource(s,{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion});teamMentorAssigningAuthority(s,r,f,s.actorId);
  output.push({r,f,item:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,title:r.submissions.at(-1).content.title,expectedAssignmentVersion:r.mentorAssignments?.at(-1)?.version||0}});
 }catch{/* No current assignment authority or reviewed source. */}}
 return output.sort((a,b)=>a.item.proposalId.localeCompare(b.item.proposalId));
}
async function requestProjection(s,{proposalId,offset,limit}){
 const records=await requestRows(s);
 if(proposalId===undefined)return {items:records.slice(offset,offset+limit).map(x=>x.item),total:records.length,offset,limit};
 const found=records.find(x=>x.item.proposalId===proposalId);check(found,'MENTOR_REQUEST_UNAVAILABLE');const {r,f,item}=found,c=r.submissions.at(-1).content,candidates=[],people=new Set();
 for(const [mentor,person] of Object.entries(s.identity.personMap).sort(([a],[b])=>a.localeCompare(b))){try{
  if(people.has(person)||!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(mentor))continue;
  const source=teamMentorSourceSnapshot(s,r,f,mentor,s.actorId),entry=s.authority.assignments.find(a=>a.id===source.mentor.id&&a.version===source.mentor.version);
  candidates.push({mentor,displayName:typeof entry.displayName==='string'&&entry.displayName.trim()&&entry.displayName.length<=200?entry.displayName:mentor,selectionToken:await teamMentorSelectionToken(source,mentor)});people.add(person);
 }catch{/* Only currently eligible independent active verified people are offered. */}}
 const suggestion=c.mentorSuggestion;
 return {item,proposal:Object.fromEntries(['title','type','programme','purpose','outputs','start','due'].map(k=>[k,c[k]])),consultationRequired:f.route.consultationRequired,...(suggestion&&typeof suggestion.name==='string'&&suggestion.name.length<=200&&typeof suggestion.reason==='string'&&suggestion.reason.length<=1000?{mentorSuggestion:{name:suggestion.name,reason:suggestion.reason}}:{}),candidates:candidates.slice(offset,offset+limit),total:candidates.length,offset,limit};
}
export async function readConsistentIntakeMentorRequests({first,second,proposalId,offset=0,limit=20}){
 check(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000&&Number.isSafeInteger(limit)&&limit>=1&&limit<=20,'INVALID_MENTOR_PAGE');
 const a=await requestProjection(first,{proposalId,offset,limit}),b=await requestProjection(second,{proposalId,offset,limit});check(fingerprint(first)===fingerprint(second)&&canonical(a)===canonical(b),'SOURCE_CHANGED_BEFORE_SAVE');return b;
}
