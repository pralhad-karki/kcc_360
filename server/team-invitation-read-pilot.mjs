// Isolated read/notice contract; no live API, queue mutation, transport or grants.
import {normalizeExistingIntakePilot} from './intake-normalization-pilot.mjs';
import {resolveIntakeSourceContext} from './intake-source-adapter.mjs';
import {readOwnTeamInvitationPilot} from './team-invitations-pilot.mjs';
export function projectOwnTeamInvitationPilot(input={}){
 const unavailable=()=>({available:false,invitation:null});
 try{
  const normalized=normalizeExistingIntakePilot({configuration:input.normalizationConfiguration,intake:input.intake,identity:input.identity,roster:input.roster,academicMasters:input.academicMasters,now:input.now});if(!normalized.ok)return unavailable();
  const context=resolveIntakeSourceContext({...input,proposal:normalized.proposal,team:input.intake.teamInvitationsPilot,purpose:'INVITATION_READ'});if(!context.ok)return unavailable();
  const own=readOwnTeamInvitationPilot(input.intake.teamInvitationsPilot,context.serverContext),title=input.intake.content.title;
  if(typeof title!=='string'||!title.trim()||title.length>120||/[\u0000-\u001f]/.test(title))return unavailable();
  return {available:true,invitation:{...own,projectTitle:title}};
 }catch{return unavailable()}
}
export function teamInvitationNoticeSourcesPilot(input={}){
 const view=projectOwnTeamInvitationPilot(input),v=view.invitation;
 if(!view.available||!v.canAccept)return [];
 return [{key:`team-invitation:${v.proposalId}:${v.proposalVersion}:${v.teamVersion}:${v.ownInvitation.version}`,recipientPersonId:input.identity.principal.personId,sourceId:v.proposalId,proposalVersion:v.proposalVersion,teamVersion:v.teamVersion,invitationVersion:v.ownInvitation.version,title:'Respond to your team invitation',kind:'TEAM_INVITATION_PILOT'}];
}
export function teamInvitationNoticeCurrentPilot(notice,input){return teamInvitationNoticeSourcesPilot(input).some(n=>n.key===notice?.key&&n.recipientPersonId===notice.recipientPersonId&&n.sourceId===notice.sourceId&&n.kind===notice.kind)}
export function reconcileTeamInvitationNoticesPilot({recipientPersonId,previous=[],current=[]}){
 if(typeof recipientPersonId!=='string'||!recipientPersonId||![previous,current].every(Array.isArray)||[...previous,...current].some(n=>n.recipientPersonId!==recipientPersonId||n.kind!=='TEAM_INVITATION_PILOT')||new Set(previous.map(n=>n.key)).size!==previous.length||new Set(current.map(n=>n.key)).size!==current.length)throw Error('SCOPED_NOTICE_INPUT_REQUIRED');
 const keys=['key','recipientPersonId','sourceId','proposalVersion','teamVersion','invitationVersion','title','kind'],pick=n=>Object.fromEntries(keys.map(k=>[k,n[k]]));
 return [...current.map(n=>({...pick(n),state:'ACTIVE',readAt:previous.find(p=>p.key===n.key)?.readAt??null})),...previous.filter(p=>!current.some(n=>n.key===p.key)).map(p=>({...pick(p),state:current.some(n=>n.sourceId===p.sourceId)?'SUPERSEDED':'RESOLVED',readAt:p.readAt??null}))];
}
