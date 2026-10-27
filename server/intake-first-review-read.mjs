import {validTeamHandoffLink} from './intake-team-handoff-link.mjs';
// Read-only projections from fresh trusted sources. A stored route never grants access.
import {normalizeExistingIntakePilot} from './intake-normalization-pilot.mjs';
import {confirmedTeamRoutingPilot} from './team-invitations-pilot.mjs';
import {resolveIntakeRoutingPilot} from './intake-routing-pilot.mjs';
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))))).map(v=>v.toString(16).padStart(2,'0')).join('');
const check=(v,m)=>{if(!v)throw Error(m)};
const approved=(s,tenant,now)=>s?.institutionId===tenant&&s.status==='APPROVED'&&typeof s.id==='string'&&Number.isSafeInteger(s.version)&&s.version>0&&typeof s.approvalReference==='string'&&s.approvalReference.length>0&&Date.parse(s.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(s.validUntil);
function validate(s){
 const p=s.identity?.principal;
 check(s.configuration?.enabled===true&&s.normalizationConfiguration?.enabled===true&&s.identity?.ok&&p?.active&&s.identity.personMap?.[s.actorId]===p.personId&&s.identity.evaluatedAt===s.now&&Date.parse(s.now)<Date.parse(s.identity.validUntil)&&Array.isArray(s.workspace?.data?.activityIntakes),'CURRENT_REVIEW_CONTEXT_REQUIRED');
 check([s.roster,s.academicMasters,s.authority].every(x=>approved(x,p.tenantId,s.now))&&Array.isArray(s.roster.students)&&Array.isArray(s.authority.grants)&&Array.isArray(s.authority.assignments)&&Array.isArray(s.authority.policies),'CURRENT_REVIEW_SOURCES_REQUIRED');
}
export function firstReviewDecision(r,f){const matches=(r.teamFirstReviewDecisions||[]).filter(d=>d.firstReviewId===f.id);if(!matches.length)return null;const d=matches[0];return matches.length===1&&d.firstReviewVersion===f.version&&d.submissionVersion===f.submissionVersion&&d.by===f.route.leadReviewer.personId&&['RETURNED','REVIEWED'].includes(d.decision)&&typeof d.reason==='string'&&d.reason.trim()&&d.reason.length<=2000?d:{decision:'INVALID'}}
async function current(s,r,f){
 try{
  if(f.id!==r.id+':first-review:'+f.version||!['SUBMITTED','RETURNED'].includes(r.state)||(r.projectId&&!validTeamHandoffLink(r,s.workspace.data.projects,s.identity.personMap,s.now))||r.teamFirstReviews.some((v,i)=>v.version!==i+1||v.id!==r.id+':first-review:'+v.version)||f.state!=='SUBMITTED'||f.version!==r.teamFirstReviews.length||f.intakeRevision!==r.revision||f.teamRevision!==r.teamInvitationsPilot?.revision||f.teamVersion!==r.teamInitiation?.teamVersion||canonical(f.team)!==canonical(r.teamInvitationsPilot))return false;
  const submission=r.submissions?.at(-1);
  if(!submission||submission.version!==f.submissionVersion||submission.revision!==r.revision||canonical(submission.content)!==canonical(r.content)||await digest(submission)!==f.submissionDigest)return false;
  // Only a detached reconstruction is normalized; the frozen record is never reopened.
  const norm=normalizeExistingIntakePilot({...s,configuration:s.normalizationConfiguration,intake:{...r,state:'DRAFT'}});
  if(!norm.ok||canonical(norm.mapping)!==canonical(f.normalization)||f.by!==norm.mapping.personId)return false;
  const sources={rosterId:s.roster.id,rosterVersion:s.roster.version,authorityId:s.authority.id,authorityVersion:s.authority.version,proposalId:r.id,proposalVersion:r.revision,teamVersion:r.teamInitiation.teamVersion};
  if(canonical(sources)!==canonical(f.sourceReferences))return false;
  const policies=s.authority.policies.filter(p=>p.institutionId===s.identity.principal.tenantId&&p.kind===norm.proposal.kind);if(policies.length!==1)return false;
  const ctx={proposal:norm.proposal,students:s.roster.students.filter(x=>x.institutionId===norm.proposal.institutionId),grants:s.authority.grants,assignments:s.authority.assignments,policy:policies[0],now:s.now,actorPersonId:s.identity.principal.personId};
  const confirmed=confirmedTeamRoutingPilot(r.teamInvitationsPilot,ctx),route=resolveIntakeRoutingPilot({...ctx,...confirmed,expectedBinding:f.route.binding});
  return route.status==='READY_FOR_FIRST_REVIEW'&&canonical(route)===canonical(f.route);
 }catch{return false}
}
// Server-only source validation for subsequent commands; this grants no actor permission or read projection.
export async function validateReviewedTeamSource(s,reference,{allowFinalized=false}={}){
 validate(s);const matches=s.workspace.data.activityIntakes.filter(r=>r.id===reference.proposalId);check(matches.length===1,'CURRENT_REVIEWED_TEAM_REQUIRED');
 const r=matches[0],f=r.teamFirstReviews?.at(-1);
 check(f&&r.state==='SUBMITTED'&&f.id===reference.firstReviewId&&f.submissionVersion===reference.submissionVersion&&f.team?.rounds?.at(-1)?.proposal.institutionId===s.identity.principal.tenantId&&firstReviewDecision(r,f)?.decision==='REVIEWED'&&await current(s,r,f),'CURRENT_REVIEWED_TEAM_REQUIRED');
 check(Array.isArray(r.teamFinalReviews||[])&&(allowFinalized||!(r.teamFinalReviews||[]).some(d=>d.firstReviewId===f.id)),'TEAM_FINAL_REVIEW_ALREADY_RECORDED');
}
async function rows(s){
 validate(s);const output=[],records=s.workspace.data.activityIntakes,person=s.identity.principal.personId,tenant=s.identity.principal.tenantId;
 for(const r of records){
  if(records.filter(x=>x.id===r.id).length!==1||!r.teamFirstReviews?.length)continue;
  const f=r.teamFirstReviews.at(-1);if(f.normalization?.institutionId!==undefined&&f.normalization.institutionId!==tenant)continue;
  if(f.team?.rounds?.at(-1)?.proposal.institutionId!==tenant)continue;
  const own=f.team.rounds.at(-1).invitations.filter(i=>i.source.personId===person&&i.state==='ACCEPTED');
  const participant=own.length===1&&s.roster.students.filter(x=>x.id===own[0].source.studentId&&x.personId===person&&x.institutionId===tenant).length===1;
  const decision=firstReviewDecision(r,f),valid=decision?.decision!=='INVALID'&&await current(s,r,f),reviewer=valid&&f.route.leadReviewer.personId===person;
  if(!participant&&!reviewer)continue;
  const status=r.state==='WITHDRAWN'?'WITHDRAWN':decision?.decision==='RETURNED'&&r.state==='DRAFT'?'REVISION_IN_PROGRESS':decision?.decision==='RETURNED'&&r.state==='RETURNED'?'RETURNED':valid&&decision?.decision==='REVIEWED'?'FIRST_REVIEWED':valid&&!decision?'AWAITING_FIRST_REVIEW':'SOURCE_CHANGED';
  const item={proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,title:r.submissions?.find(x=>x.version===f.submissionVersion)?.content.title||r.id,role:reviewer?'REVIEWER':'PARTICIPANT',status,route:valid?f.route.leadReviewer.route:null,submittedAt:f.at,canDecide:reviewer&&status==='AWAITING_FIRST_REVIEW'};
  let detail=null;
  if(reviewer){
   const c=r.submissions.at(-1).content,keys=['title','type','programme','semester','course','purpose','outputs','start','due','sdgs','primaryUnit','supportingUnits','alignmentReason','mentorSuggestion'];
   detail={proposal:Object.fromEntries(keys.filter(k=>Object.hasOwn(c,k)).map(k=>[k,structuredClone(c[k])])),members:f.team.rounds.at(-1).invitations.map(i=>({studentId:i.source.studentId,displayName:(name=>typeof name==='string'&&name.length<=200?name:i.source.studentId)(s.roster.students.find(x=>x.id===i.source.studentId&&x.institutionId===tenant).displayName),isLead:i.source.studentId===f.team.rounds.at(-1).proposal.leadStudentId})),consultationRequired:f.route.consultationRequired};
  }
  const feedback=participant&&own[0].source.studentId===f.team.rounds.at(-1).proposal.leadStudentId&&decision&&decision.decision!=='INVALID'?{decision:decision.decision,reason:decision.reason}:null;
  output.push({item,detail,feedback});
 }
 return output.sort((a,b)=>a.item.proposalId.localeCompare(b.item.proposalId));
}
function fingerprint(s){return canonical({subject:s.subject,actorId:s.actorId,workspace:s.workspace,roster:s.roster,academicMasters:s.academicMasters,authority:s.authority,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},configuration:s.configuration,normalizationConfiguration:s.normalizationConfiguration})}
export async function readConsistentIntakeFirstReview({first,second,proposalId,offset=0,limit=20}){
 const a=await rows(first),b=await rows(second);check(fingerprint(first)===fingerprint(second)&&canonical(a)===canonical(b),'SOURCE_CHANGED_BEFORE_SAVE');
 if(proposalId!==undefined){const result=b.find(x=>x.item.proposalId===proposalId);check(result,'FIRST_REVIEW_UNAVAILABLE');return {item:result.item,...(result.detail?{detail:result.detail}:{}),...(result.feedback?{feedback:result.feedback}:{})}}
 check(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000&&Number.isSafeInteger(limit)&&limit>=1&&limit<=20,'INVALID_REVIEW_PAGE');
 const queued=b.filter(x=>x.item.role==='PARTICIPANT'||x.item.status==='AWAITING_FIRST_REVIEW');return {items:queued.slice(offset,offset+limit).map(x=>x.item),total:queued.length,offset,limit};
}
