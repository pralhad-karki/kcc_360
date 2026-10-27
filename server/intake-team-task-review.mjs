import {validInitialTeamSubmission,validInitialTeamEvidence,teamSubmissionText as text,teamTaskEvidenceBinding} from './intake-team-task-evidence.mjs';
import {finalReviewCanonical as canonical} from './intake-team-final-review.mjs';
const refs=['proposalId','firstReviewId','submissionVersion','finalDecisionId','finalDecisionVersion','projectId','startVersion'];
export const teamTaskReviewDecisions=Object.freeze(['VERIFIED','PARTIAL','RETURNED']);
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export const validTeamTaskScores=(scores,domains)=>exact(scores,domains)&&domains.every(k=>scores[k]===null||Number.isInteger(scores[k])&&scores[k]>=0&&scores[k]<=4);
export const teamTaskReviewBinding=t=>canonical(Object.fromEntries(Object.entries(t).filter(([k])=>!['done','workState','taskReviews'].includes(k))));
// New rounds use compact digests so retained history does not recursively duplicate itself.
export const teamTaskRoundLimit=100;
export const teamTaskHistoryDigest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))))).map(x=>x.toString(16).padStart(2,'0')).join('');
export const teamTaskRevisionChanged=(prior,contribution,evidence)=>contribution!==prior.contribution||canonical({...JSON.parse(teamTaskEvidenceBinding(evidence)),verified:false})!==canonical({...JSON.parse(prior.evidenceSnapshot),verified:false});
export const teamTaskResubmissionPrior=t=>({...t,submissions:t.submissions.slice(0,-1),taskReviews:t.taskReviews.slice(0,t.submissions.length-1),workState:t.taskReviews[t.submissions.length-2].decision,done:false});
export async function validControlledTeamTask(s,p,t,reference,d,validExecution){
 const subs=t.submissions||[],reviews=t.taskReviews||[];
 if(!Array.isArray(subs)||!Array.isArray(reviews)||subs.length>teamTaskRoundLimit)return false;
 if(!subs.length)return validInitialTeamSubmission(s,p,t,reference,d,validExecution);
 const reviewed=teamTaskReviewDecisions.includes(t.workState);
 if(!(reviewed&&reviews.length===subs.length||t.workState==='SUBMITTED'&&reviews.length===subs.length-1)||t.done!==(t.workState==='VERIFIED'))return false;
 const base={...t,submissions:subs.slice(0,1),taskReviews:[],workState:'SUBMITTED',done:false};
 if(!validInitialTeamSubmission(s,p,base,reference,d,validExecution))return false;
 const ref=Object.fromEntries(refs.map(k=>[k,reference[k]]));
 // Validate each chronological prefix, including historical reviews after shared evidence verification.
 for(let i=0;i<subs.length;i++){
  const n=i+1,sub=subs[i],priorReview=reviews[i-1],e=p.evidence?.[sub.evidenceIndex];
  const pending={...t,submissions:subs.slice(0,n),taskReviews:reviews.slice(0,i),workState:'SUBMITTED',done:false};
  if(i){
   const prior={...pending,submissions:subs.slice(0,i),workState:priorReview.decision,done:false},source=sub?.teamSubmissionSource;
   if(!['PARTIAL','RETURNED'].includes(priorReview.decision)||!exact(sub,['version','student','mappingVersion','contribution','evidenceIndex','evidenceSnapshot','time','teamSubmissionSource'])||sub.version!==n||sub.student!==t.assignee||sub.mappingVersion!==t.mappingVersion||!text(sub.contribution)||!Number.isSafeInteger(sub.evidenceIndex)||sub.evidenceIndex<0||!text(source?.reason)||s.identity.personMap[source.submittedBy]!==s.identity.personMap[t.assignee]||typeof sub.time!=='string'||!Number.isFinite(Date.parse(sub.time))||Date.parse(sub.time)>Date.parse(s.now)||Date.parse(sub.time)<Date.parse(priorReview.time)||t.execution?.blocked)return false;
   if(!validInitialTeamEvidence(s,p,e,reference,d,{allowVerified:true})||!(sub.evidenceSnapshot===teamTaskEvidenceBinding(e)&&(!e.verified||Date.parse(sub.time)>=Date.parse(e.verifiedAt))||e.verified&&sub.evidenceSnapshot===e.teamEvidenceVerification.beforeBinding&&Date.parse(sub.time)<=Date.parse(e.verifiedAt))||!teamTaskRevisionChanged(subs[i-1],sub.contribution,JSON.parse(sub.evidenceSnapshot)))return false;
   const history=n===2?{priorTaskBinding:canonical(prior)}:{priorTaskDigest:await teamTaskHistoryDigest(prior)};
   if(canonical(source)!==canonical({...ref,taskId:t.id,sourceDigest:d.sourceDigest,executionVersion:t.execution.version,priorWorkState:priorReview.decision,priorSubmissionVersion:i,priorReviewVersion:i,...history,reason:source.reason,submittedBy:source.submittedBy,feedbackAcknowledged:true}))return false;
  }
  const v=reviews[i];if(!v)continue;
  const source=v.teamReviewSource,person=s.identity.personMap[v.by];
  if(!exact(v,['version','submissionVersion','mappingVersion','student','decision','scores','feedback','criterionSnapshot','scale','evidenceBinding','by','time','teamReviewSource'])||v.version!==n||v.submissionVersion!==n||v.mappingVersion!==t.mappingVersion||v.student!==t.assignee||!teamTaskReviewDecisions.includes(v.decision)||i<subs.length-1&&v.decision==='VERIFIED'||i===subs.length-1&&v.decision!==t.workState||!validTeamTaskScores(v.scores,t.domains)||!text(v.feedback)||canonical(v.criterionSnapshot)!==canonical(t.domainCriteria)||v.scale!=='DEMO_0_4_V1'||!person||person!==s.identity.personMap[p.mentor]||person===s.identity.personMap[t.assignee]||person===s.identity.personMap[e?.by]||typeof v.time!=='string'||!Number.isFinite(Date.parse(v.time))||Date.parse(v.time)>Date.parse(s.now)||Date.parse(v.time)<Date.parse(sub.time))return false;
  const current=teamTaskEvidenceBinding(e),verified=e.verified===true;
  if(v.evidenceBinding===current){if(verified&&Date.parse(v.time)<Date.parse(e.verifiedAt))return false;}
  else if(v.decision==='VERIFIED'||!verified||v.evidenceBinding!==e.teamEvidenceVerification.beforeBinding||Date.parse(v.time)>Date.parse(e.verifiedAt))return false;
  if(v.decision==='VERIFIED'&&!verified)return false;
  const bindings=n<=2?{submissionBinding:canonical(sub),taskBinding:teamTaskReviewBinding(pending),...(i?{priorReviewBinding:canonical(priorReview)}:{})}:{submissionDigest:await teamTaskHistoryDigest(sub),taskDigest:await teamTaskHistoryDigest(teamTaskReviewBinding(pending)),priorReviewDigest:await teamTaskHistoryDigest(priorReview)};
  if(canonical(source)!==canonical({...ref,taskId:t.id,sourceDigest:d.sourceDigest,expectedReviewVersion:i,expectedEvidenceVersion:v.evidenceBinding===current&&verified?1:0,evidenceIndex:sub.evidenceIndex,...bindings,noConflict:true}))return false;
 }
 return true;
}
