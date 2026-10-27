// Trusted server discovery only. Never persists capabilities or treats them as command authorization.
import {normalizeExistingIntakePilot} from './intake-normalization-pilot.mjs';
import {resolveIntakeSourceContext} from './intake-source-adapter.mjs';
import {firstReviewDecision} from './intake-first-review-read.mjs';
import {resolveIntakeRoutingPilot} from './intake-routing-pilot.mjs';
import {createTeamInvitationsPilot,reviseTeamInvitationsPilot,confirmedTeamRoutingPilot} from './team-invitations-pilot.mjs';
import {projectOwnTeamInvitationPilot} from './team-invitation-read-pilot.mjs';
const empty=()=>({enabled:false,proposalIds:[],leadProposals:[]});
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
function fingerprint(s){return canonical({subject:s.subject,actorId:s.actorId,workspace:s.workspace,roster:s.roster,masters:s.academicMasters,authority:s.authority,configuration:s.configuration,normalizationConfiguration:s.normalizationConfiguration,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance}})}
export function projectIntakeTeamAccess(s={}){
 if(s.configuration?.enabled!==true||s.normalizationConfiguration?.enabled!==true||!s.identity?.ok||!s.identity.principal?.active||s.identity.personMap?.[s.actorId]!==s.identity.principal.personId||!Array.isArray(s.workspace?.data?.activityIntakes))return empty();
 const output={enabled:true,proposalIds:[],leadProposals:[]},records=s.workspace.data.activityIntakes;
 for(const intake of records){
  if(records.filter(r=>r.id===intake.id).length!==1)continue;
  const normalized=normalizeExistingIntakePilot({...s,configuration:s.normalizationConfiguration,intake});if(!normalized.ok)continue;
  const team=intake.teamInvitationsPilot;
  if(s.identity.personMap[intake.student]===s.identity.principal.personId){
   const directory=resolveIntakeSourceContext({...s,proposal:normalized.proposal,purpose:'DIRECTORY'});if(!directory.ok)continue;
   const item={proposalId:intake.id,proposalVersion:intake.revision,leadStudentId:normalized.proposal.leadStudentId,teamRevision:team?.revision??0,canPrepareInvitations:false,invitationAction:null};
   const management=resolveIntakeSourceContext({...s,proposal:normalized.proposal,team,purpose:'TEAM_MANAGEMENT'});
   if(management.ok){try{
    const ctx={...management.serverContext,memberIds:[normalized.proposal.leadStudentId]};
    // Validate the action with existing rules; discard the resulting draft, never save it.
    if(!team){createTeamInvitationsPilot(ctx);item.canPrepareInvitations=true;item.invitationAction='CREATE'}
    else{reviseTeamInvitationsPilot(team,{...ctx,expectedRevision:team.revision});item.canPrepareInvitations=true;item.invitationAction='REVISE'}
   }catch{/* Existing rounds cannot be replaced without an explicitly advanced source team version. */}}
   if(management.ok&&intake.state==='DRAFT'&&!intake.projectId){try{
    const previous=intake.teamFirstReviews?.at(-1);
    if(previous&&!(firstReviewDecision(intake,previous)?.decision==='RETURNED'&&intake.revision>previous.intakeRevision&&normalized.proposal.teamVersion>previous.teamVersion))throw Error('A current returned revision is required.');
    const confirmed=confirmedTeamRoutingPilot(team,management.serverContext),route=resolveIntakeRoutingPilot({...management.serverContext,...confirmed});
    if(route.status==='READY_FOR_FIRST_REVIEW')item.submission={title:intake.content.title,mode:previous?'RESUBMISSION':'INITIAL',teamVersion:normalized.proposal.teamVersion,firstReviewVersion:(intake.teamFirstReviews?.length||0)+1,submissionVersion:intake.submissions.length+1,members:confirmed.proposal.memberIds.map(id=>{const student=management.serverContext.students.find(s=>s.id===id);return {studentId:id,displayName:typeof student.displayName==='string'&&student.displayName.length<=200?student.displayName:id}})};
   }catch{/* Display only after current consent and unambiguous routing; each write revalidates. */}}
   if(Number.isSafeInteger(item.teamRevision)&&item.teamRevision>=0)output.leadProposals.push(item);
  }else if(projectOwnTeamInvitationPilot({...s,intake}).available)output.proposalIds.push(intake.id);
 }
 output.proposalIds.sort();output.leadProposals.sort((a,b)=>a.proposalId.localeCompare(b.proposalId));return output;
}
export function readConsistentIntakeTeamAccess({first,second}){
 const a=projectIntakeTeamAccess(first),b=projectIntakeTeamAccess(second);
 if(fingerprint(first)!==fingerprint(second)||canonical(a)!==canonical(b))throw Error('SOURCE_CHANGED_BEFORE_SAVE');
 return b;
}
