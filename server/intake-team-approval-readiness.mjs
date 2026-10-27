import {teamProposalPreview,approvedTeamHandoffPreview} from './intake-team-handoff-preview.mjs';
import {currentTeamFinalReview,finalReviewPrerequisiteDigest,finalReviewPreviewToken} from './intake-team-final-review.mjs';
import {teamConsultationScopeStatus,teamConsultationScopeSource,teamConsultationScopePreviewToken} from './intake-team-consultation-scope.mjs';
// Read-only readiness review. This never records approval or authorizes execution.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {teamMentorSourceSnapshot,teamMentorAssigningAuthority} from './intake-team-mentor-save.mjs';
import {validateTeamConsultationRecord} from './intake-team-consultation-response-save.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
function mentorStatus(s,r,f){
 const a=r.mentorAssignments?.at(-1);if(!a)return 'MISSING';
 try{
  check(id(a.id)&&['fit','capacity','reason'].every(k=>typeof a[k]==='string'&&a[k].trim().length>0&&a[k].length<=2000)&&r.mentorAssignments.every((x,i)=>x.version===i+1)&&new Set(r.mentorAssignments.map(x=>x.id)).size===r.mentorAssignments.length,'INVALID_HISTORY');
  const source=teamMentorSourceSnapshot(s,r,f,a.mentor,a.by);check(a.basis===canonical(source)&&canonical(a.sourceSnapshot)===canonical(source)&&Date.parse(a.at)<=Date.parse(s.now),'STALE_MENTOR');
  if(a.state==='WITHDRAWN'){check(a.withdrawal&&Date.parse(a.at)<=Date.parse(a.withdrawal.at)&&Date.parse(a.withdrawal.at)<=Date.parse(s.now),'INVALID_WITHDRAWAL');return 'WITHDRAWN'}
  check(!a.withdrawal,'WITHDRAWN_MENTOR');if(a.state==='REQUESTED'){check(!a.response,'INVALID_RESPONSE');return 'REQUESTED'}
  check(['ACCEPTED','REASSIGNMENT_REQUESTED'].includes(a.state)&&a.response?.decision===a.state&&s.identity.personMap[a.response.by]===source.mentor.personId&&typeof a.response.reason==='string'&&a.response.reason.trim().length>0&&a.response.reason.length<=2000&&a.response.noUnresolvedConflict===(a.state==='ACCEPTED')&&Date.parse(a.at)<=Date.parse(a.response.at)&&Date.parse(a.response.at)<=Date.parse(s.now),'INVALID_RESPONSE');return a.state;
 }catch{return 'STALE'}
}
export async function teamActivityPrerequisites(s,r,f){
 const mentor=mentorStatus(s,r,f),consultation={required:f.route.consultationRequired,scopeConfirmed:f.route.consultationRequired?false:null,totalIssued:0,requested:0,accepted:0,declined:0,withdrawn:0,stale:0},history=r.supportRequests||[];
 check(Array.isArray(history),'VALID_CONSULTATION_HISTORY_REQUIRED');const targets=[...new Set(history.map(q=>q.target))];
 for(const target of targets){const q=history.filter(x=>x.target===target).at(-1);consultation.totalIssued++;
  try{check(typeof target==='string'&&target.startsWith('DEPARTMENT:')&&id(target.slice(11)),'INVALID_DEPARTMENT');if(q.state==='WITHDRAWN'){check(q.withdrawal&&q.sourceSnapshot?.mentorSource?.firstReviewId===f.id&&Date.parse(q.at)<=Date.parse(q.withdrawal.at)&&Date.parse(q.withdrawal.at)<=Date.parse(s.now),'INVALID_WITHDRAWAL');consultation.withdrawn++;continue}
   validateTeamConsultationRecord(s,r,f,q,{allowResponded:true});consultation[q.state.toLowerCase()]++;
  }catch{consultation.stale++}
 }
 if(consultation.required){const scope=await teamConsultationScopeStatus(s,r,f);consultation.scopeConfirmed=scope.state==='CURRENT';consultation.scopeVersion=scope.version;}
 return {mentor,consultation};
}
async function projection(s,proposalId){
 check(id(proposalId)&&s.identity?.ok&&s.identity.principal?.active&&s.identity.personMap?.[s.actorId]===s.identity.principal.personId&&Array.isArray(s.activePersonIds)&&s.activePersonIds.includes(s.identity.principal.personId),'CURRENT_APPROVAL_REVIEW_CONTEXT_REQUIRED');
 const records=s.workspace?.data?.activityIntakes;check(Array.isArray(records),'CURRENT_PROPOSAL_REQUIRED');const matches=records.filter(r=>r.id===proposalId);check(matches.length===1,'UNIQUE_PROPOSAL_REQUIRED');const r=matches[0],f=r.teamFirstReviews?.at(-1);check(f,'REVIEWED_TEAM_REQUIRED');
 await validateReviewedTeamSource(s,{proposalId,firstReviewId:f.id,submissionVersion:f.submissionVersion},{allowFinalized:true});
 const finalReview=currentTeamFinalReview(r,f);if(finalReview)check(finalReview.sourceDigest===await finalReviewPrerequisiteDigest(r,f)&&Date.parse(finalReview.at)<=Date.parse(s.now),'FINAL_REVIEW_SOURCE_CHANGED_BEFORE_SAVE');
 const ref=f.route.approvalAuthority,person=s.identity.principal.personId,finals=s.authority.assignments.filter(a=>a.id===ref.assignmentId&&a.version===ref.assignmentVersion&&a.personId===ref.personId&&a.capability==='FINAL_APPROVE'&&a.role===ref.role&&!a.revokedAt&&a.availability==='AVAILABLE'&&Date.parse(a.validFrom)<=Date.parse(s.now)&&Date.parse(s.now)<Date.parse(a.validUntil)),finalAvailable=finals.length===1&&s.activePersonIds.includes(ref.personId),roles=[];
 try{teamMentorAssigningAuthority(s,r,f,s.actorId);roles.push('COORDINATOR')}catch{}
 if(finalAvailable&&ref.personId===person)roles.push('FINAL_APPROVER');check(roles.length,'CURRENT_APPROVAL_REVIEW_AUTHORITY_REQUIRED');
 const {mentor,consultation}=await teamActivityPrerequisites(s,r,f);
 let scopePreview;
 if(!finalReview&&consultation.required&&!consultation.scopeConfirmed&&roles.includes('COORDINATOR')){try{
  const source=await teamConsultationScopeSource(s,r,f,s.actorId),history=r.teamConsultationScopes||[];check(Array.isArray(history)&&history.every((x,i)=>x.version===i+1&&id(x.id))&&new Set(history.map(x=>x.id)).size===history.length,'VALID_SCOPE_HISTORY_REQUIRED');const expectedScopeVersion=history.at(-1)?.version||0;
  scopePreview={assignmentId:source.assignmentId,assignmentVersion:source.assignmentVersion,expectedScopeVersion,departmentIds:source.departments,previewToken:await teamConsultationScopePreviewToken(source,expectedScopeVersion),consultations:source.consultations.map(ref=>{const q=r.supportRequests.find(q=>q.id===ref.consultationId);return {consultationId:q.id,consultationVersion:q.version,departmentId:ref.departmentId,reviewer:q.reviewer,responsibility:q.responsibility,deliverable:q.deliverable,due:q.due,state:q.state}})};
 }catch{/* A preview is offered only after all current issued responsibilities are accepted. */}}
 const issues=[];if(mentor!=='ACCEPTED')issues.push('CURRENT_MENTOR_ACCEPTANCE_REQUIRED');if(!finalAvailable)issues.push('FINAL_AUTHORITY_UNAVAILABLE');if(consultation.required&&!consultation.scopeConfirmed)issues.push('CONSULTATION_SCOPE_UNCONFIRMED');if(consultation.requested||consultation.declined||consultation.stale||(consultation.withdrawn&&!consultation.scopeConfirmed))issues.push('CONSULTATION_RESPONSES_REQUIRE_REVIEW');
 let finalPreview;
 if(!finalReview&&roles.includes('FINAL_APPROVER')){
  const expectedFinalVersion=(r.teamFinalReviews||[]).at(-1)?.version||0;
  finalPreview={expectedFinalVersion,previewToken:await finalReviewPreviewToken(r,f,expectedFinalVersion),...teamProposalPreview(s,r,f)};
 }
 const handoffPreview=approvedTeamHandoffPreview(s,r,f,finalReview,issues);
 return {proposalId,firstReviewId:f.id,submissionVersion:f.submissionVersion,title:r.submissions.at(-1).content.title,roles,mentorStatus:mentor,consultation,finalAuthority:{role:ref.role,available:finalAvailable},...(scopePreview?{scopePreview}:{}),...(finalPreview?{finalPreview}:{}),...(handoffPreview?{handoffPreview}:{}),...(r.teamHandoff?{linkedActivity:{projectId:r.projectId,state:r.teamStart?'STARTED':'CREATED',startRecorded:!!r.teamStart,executionAuthorized:false}}:{}),status:finalReview?'FINAL_'+finalReview.decision:issues.length?'REVIEW_REQUIRED':'READY_FOR_FINAL_REVIEW',issues,...(finalReview?{finalDecision:{id:finalReview.id,version:finalReview.version,decision:finalReview.decision,reason:finalReview.reason}}:{}),canApprove:false,approvalRecorded:finalReview?.decision==='APPROVED',executionAuthorized:false};
}
function fingerprint(s){return canonical({subject:s.subject,actorId:s.actorId,workspace:s.workspace,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},configuration:s.configuration,normalizationConfiguration:s.normalizationConfiguration})}
async function queueProjection(s,offset,limit){
 check(s.configuration?.enabled===true&&s.normalizationConfiguration?.enabled===true&&s.identity?.ok&&s.identity.principal?.active&&s.identity.personMap?.[s.actorId]===s.identity.principal.personId&&Array.isArray(s.activePersonIds)&&s.activePersonIds.includes(s.identity.principal.personId)&&Array.isArray(s.workspace?.data?.activityIntakes),'CURRENT_APPROVAL_REVIEW_CONTEXT_REQUIRED');
 const items=[];for(const r of s.workspace.data.activityIntakes){try{const v=await projection(s,r.id);items.push(Object.fromEntries(['proposalId','firstReviewId','submissionVersion','title','roles','status'].map(k=>[k,v[k]])))}catch{/* No current authorized reviewed-team source. */}}
 items.sort((a,b)=>a.proposalId.localeCompare(b.proposalId));return {items:items.slice(offset,offset+limit),total:items.length,offset,limit};
}
export async function readConsistentTeamApprovalReadiness({first,second,proposalId,offset=0,limit=20}){
 check(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000&&Number.isSafeInteger(limit)&&limit>=1&&limit<=20,'INVALID_READINESS_PAGE');
 const a=proposalId===undefined?await queueProjection(first,offset,limit):await projection(first,proposalId),b=proposalId===undefined?await queueProjection(second,offset,limit):await projection(second,proposalId);check(fingerprint(first)===fingerprint(second)&&canonical(a)===canonical(b),'SOURCE_CHANGED_BEFORE_SAVE');return b;
}
