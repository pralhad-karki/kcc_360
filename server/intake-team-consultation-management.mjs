// Current coordinator authority for managing retained consultation records.
import {teamMentorAssigningAuthority} from './intake-team-mentor-save.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const text=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=2000;
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
export function validateConsultationManagement(s,r,f,q,{withdrawn=false}={}){
 const person=s.identity.principal.personId,p=f.team.rounds.at(-1).proposal;
 check(p.kind==='MULTIDISCIPLINARY_RESEARCH'&&f.route.consultationRequired===true&&f.route.leadReviewer.personId===person&&f.route.leadReviewer.route==='RESEARCH_COORDINATOR','CURRENT_RESEARCH_COORDINATOR_REQUIRED');teamMentorAssigningAuthority(s,r,f,s.actorId);
 const source=q.sourceSnapshot,base=source?.mentorSource,history=(r.supportRequests||[]).filter(x=>x.target===q.target),state=q.state==='WITHDRAWN'&&withdrawn?q.withdrawal?.priorState:q.state;
 check(id(q.id)&&id(source?.departmentId)&&q.target==='DEPARTMENT:'+source.departmentId&&history.at(-1)?.id===q.id&&history.every((x,i)=>x.version===i+1)&&new Set((r.supportRequests||[]).map(x=>x.id)).size===r.supportRequests.length&&['REQUESTED','ACCEPTED','DECLINED'].includes(state),'CURRENT_CONSULTATION_REQUIRED');
 check(base&&q.basis===canonical(source)&&base.firstReviewId===f.id&&base.firstReviewVersion===f.version&&base.submissionVersion===f.submissionVersion&&base.submissionDigest===f.submissionDigest&&base.teamRevision===f.teamRevision&&base.teamVersion===f.teamVersion&&canonical(base.routeBinding)===canonical(f.route.binding),'CONSULTATION_SOURCE_CHANGED_BEFORE_SAVE');
 check(id(q.by)&&id(q.reviewer)&&Number.isFinite(Date.parse(q.at))&&Date.parse(q.at)<=Date.parse(s.now)&&['responsibility','deliverable','reason'].every(k=>text(q[k])),'VALID_CONSULTATION_REQUIRED');
 if(state==='REQUESTED')check(!q.response,'UNANSWERED_CONSULTATION_REQUIRED');
 else check(q.response?.decision===state&&id(q.response.by)&&text(q.response.reason)&&q.response.authorityConfirmed===(state==='ACCEPTED')&&Date.parse(q.at)<=Date.parse(q.response.at)&&Date.parse(q.response.at)<=Date.parse(s.now),'VALID_RETAINED_RESPONSE_REQUIRED');
 if(q.state==='WITHDRAWN')check(withdrawn&&id(q.withdrawal?.by)&&text(q.withdrawal.reason)&&Date.parse(q.at)<=Date.parse(q.withdrawal.at)&&Date.parse(q.withdrawal.at)<=Date.parse(s.now),'VALID_CONSULTATION_WITHDRAWAL_REQUIRED');else check(!q.withdrawal,'CURRENT_CONSULTATION_REQUIRED');
 // Withdrawal may remove an old commitment after mentor replacement or delegate revocation.
 // Current eligibility and fresh acceptance are mandatory when the replacement is requested/responded to.
 return source;
}
