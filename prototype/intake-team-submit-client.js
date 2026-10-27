// Lead-only submission controls consume a scoped capability; the server revalidates every write.
let intakeTeamSubmitContext=null,intakeTeamSubmitGeneration=0,intakeTeamSubmitLock=null;
function intakeTeamSubmitReferences(){try{return cleanIntakeTeamAccess(db?.intakeTeamAccess).leadProposals.filter(p=>p.submission)}catch{return []}}
function intakeTeamSubmitCurrent(d){return sharedReady&&db===d.snapshot&&uid===d.actor&&sharedActor===d.actor&&sharedRevision===d.revision&&page==='Activity Intake'&&JSON.stringify(intakeTeamSubmitReferences().find(p=>p.proposalId===d.proposalId))===d.reference}
function resetIntakeTeamSubmit(){intakeTeamSubmitContext=null;intakeTeamSubmitGeneration++;if(intakeTeamSubmitLock){intakeTeamSubmitLock=null;lockShared(false)}if(document.querySelector('#intake-team-submit-form')&&$('#modal').open)closeModal()}
function openIntakeTeamSubmit(index){
 const ps=intakeTeamSubmitReferences();if(!sharedReady||sharedBusy||page!=='Activity Intake'||!Number.isSafeInteger(index)||index<0||!ps[index])return;
 const p=ps[index],s=p.submission;intakeTeamSubmitContext={...p,snapshot:db,actor:sharedActor,revision:sharedRevision,reference:JSON.stringify(p)};
 modal(`<form id="intake-team-submit-form"><h2>${s.mode==='RESUBMISSION'?'Resubmit revised team proposal':'Submit team proposal'}</h2><p>${esc(s.title)} · ${esc(p.proposalId)}</p><p>Draft revision ${p.proposalVersion} · team version ${s.teamVersion}. Every listed member has accepted this current version.</p><h3>Confirmed team</h3>${tableHTML(['Student','Name','Lead'],s.members.map(m=>[esc(m.studentId),esc(m.displayName),m.studentId===p.leadStudentId?'Yes':'No']))}<label><input type="checkbox" name="confirmed" value="yes" required> I have reviewed the current proposal and complete confirmed team and want to submit this version for first review.</label><p>Submission preserves this version for review. Mentor assignment, final approval and permission to start remain separate.</p><button type="submit">${s.mode==='RESUBMISSION'?'Confirm resubmission':'Confirm submission'}</button></form>`);
 intakeTeamSubmitContext.marker=document.querySelector('#intake-team-submit-form');
}
async function submitConfirmedIntakeTeam(confirmed){
 const d=intakeTeamSubmitContext;
 if(!d||confirmed!==true||sharedBusy||!intakeTeamSubmitCurrent(d)||!$('#modal').open||document.querySelector('#intake-team-submit-form')!==d.marker)return toast('Refresh, review the current proposal and team, and confirm before submitting.');
 const token={},generation=++intakeTeamSubmitGeneration;intakeTeamSubmitLock=token;lockShared(true);
 try{
  const r=await sharedFetch('/api/workspace',{command:'submitIntakeTeamFirstReview',actor:d.actor,revision:d.revision,args:[{proposalId:d.proposalId,expectedTeamRevision:d.teamRevision,confirm:true}],context:{page:'Activity Intake'}});
  if(generation!==intakeTeamSubmitGeneration||!intakeTeamSubmitCurrent(d))return;
  const s=r?.submission;
  if(r?.kind!=='INTAKE_TEAM_COMMAND'||r.action!=='SUBMIT_FIRST_REVIEW'||r.actor!==d.actor||r.revision!==d.revision+1||s?.ok!==true||s.proposalId!==d.proposalId||s.firstReviewId!==d.proposalId+':first-review:'+d.submission.firstReviewVersion||s.submissionVersion!==d.submission.submissionVersion||s.teamRevision!==d.teamRevision||s.workspaceRevision!==r.revision||s.state!=='SUBMITTED'||s.executionAuthorized!==false)throw Error('Submission response changed.');
  // A command result cannot replace the workspace. Fetch the complete current projection.
  const fresh=await sharedFetch('/api/workspace');
  if(generation!==intakeTeamSubmitGeneration||!intakeTeamSubmitCurrent(d))return;
  if(fresh?.actor!==d.actor||!Number.isSafeInteger(fresh.revision)||fresh.revision<r.revision||!Array.isArray(fresh.data?.projects))throw Error('A fresh workspace is required.');
  closeModal();resetIntakeTeamSubmit();applyShared(fresh);toast('Team proposal submitted for first review. Approval and permission to start remain separate.');
 }catch(e){if(generation===intakeTeamSubmitGeneration&&intakeTeamSubmitCurrent(d)){closeModal();resetIntakeTeamSubmit();toast('Unable to confirm submission. Refresh the workspace and check its status before trying again.')}}finally{if(intakeTeamSubmitLock===token){intakeTeamSubmitLock=null;lockShared(false)}}
}
const teamSubmitPriorPanel=intakeTeamLeadPanel;
intakeTeamLeadPanel=function(){const ps=intakeTeamSubmitReferences();return teamSubmitPriorPanel()+(ps.length?`<section class="panel"><h2>Ready for first review</h2><p>Open the current proposal and confirmed team to review before submission.</p>${ps.map((p,i)=>`<button type="button" data-team-submit-index="${i}">${p.submission.mode==='RESUBMISSION'?'Resubmit revised team proposal':'Submit team proposal'} · ${esc(p.submission.title)}</button>`).join('')}</section>`:'')};
const teamSubmitPriorReset=resetIntakeTeamClient;
resetIntakeTeamClient=function(){resetIntakeTeamSubmit();return teamSubmitPriorReset()};
const teamSubmitPriorRefresh=refreshIntakeTeamAccess;
refreshIntakeTeamAccess=async function(){resetIntakeTeamSubmit();return teamSubmitPriorRefresh()};
document.addEventListener('click',event=>{const b=event.target.closest?.('[data-team-submit-index]');if(b)openIntakeTeamSubmit(Number(b.dataset.teamSubmitIndex))});
document.addEventListener('submit',event=>{if(event.target?.id!=='intake-team-submit-form')return;event.preventDefault();submitConfirmedIntakeTeam(new FormData(event.target).get('confirmed')==='yes')});
