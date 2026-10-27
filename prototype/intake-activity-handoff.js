// Individual academic intake -> existing draft proposal. Not institutional team activation.
function individualIntakeSource(r){
 if(!r||r.supportReviewOnly||!['Project','Workshop','Seminar'].includes(r.content?.type)||r.routing?.primaryUnit!=='ACADEMIC'||r.routing.clubId||r.content.clubId||r.teamInitiation||r.teamInvitationsPilot||!['s1','s2'].includes(r.student)||!intakeRoutingCurrent(r)||!intakeSupportComplete(r))return null;
 const a=intakeMentorLatest(r);if(!a||a.state!=='ACCEPTED'||!intakeMentorCurrent(r,a)||!['m1','m2'].includes(a.mentor)||a.mentor===r.student)return null;
 const supports=intakeSupportTargets(r).map(t=>{const q=intakeSupportLatest(r,t.key);return {target:t.key,id:q.id,version:q.version,reviewer:q.reviewer,state:q.state}});
 return {type:r.content.type==='Project'?'Course project':r.content.type,mentor:a.mentor,binding:JSON.stringify({id:r.id,revision:r.revision,submissionVersion:intakeLatest(r).version,student:r.student,mentorAssignmentId:a.id,mentorAssignmentVersion:a.version,mentor:a.mentor,routing:{primaryUnit:r.routing.primaryUnit,supportingUnits:r.routing.supportingUnits,clubId:r.routing.clubId||''},supports})};
}
function individualIntakeProjects(id){return db.projects.filter(p=>p.intakeProvenance?.intakeId===id)}
function individualIntakeProjectCurrent(p){
 if(!p?.intakeProvenance)return true;
 const r=intakeRecord(p.intakeProvenance.intakeId),s=individualIntakeSource(r),rows=r&&individualIntakeProjects(r.id);
 return !!s&&rows.length===1&&rows[0].id===p.id&&r.projectId===p.id&&r.individualHandoff?.projectId===p.id&&p.intakeProvenance.binding===s.binding&&p.programme===r.content.programme&&p.type===s.type&&p.owner===r.student&&p.mentor===s.mentor&&p.members.length===1&&p.members[0]===r.student;
}
function individualIntakeCanCreate(r,actor=uid){return actor==='c1'&&!!individualIntakeSource(r)&&!r.projectId&&!r.individualHandoff&&!individualIntakeProjects(r.id).length&&validProposalFields({title:r.content.title,description:r.content.purpose,programme:r.content.programme,type:individualIntakeSource(r).type,due:r.content.due})}
function individualIntakeHandoffForm(id){
 const r=intakeRecord(id),s=individualIntakeSource(r);if(!individualIntakeCanCreate(r)||!s)return toast('Use a current accepted individual academic intake with no existing activity.');
 modal(`<h2>Create linked draft proposal</h2><p>${esc(r.content.title)} · ${esc(s.type)}</p><p>Student: ${esc(name(r.student))} · Accepted mentor: ${esc(name(s.mentor))}</p><p>This creates one draft with the initiating student only. Existing proposal submission, independent approval and start checks remain required.</p><form onsubmit="handoffIndividualIntake(event,${esc(JSON.stringify(id))},${r.revision},${esc(JSON.stringify(s.binding))})"><label>Handoff reason<textarea name="reason" required maxlength="2000"></textarea></label><label><input type="checkbox" name="confirm" value="yes" required> I confirm the current source and individual participant.</label><button class="primary">Create draft proposal</button><button type="button" onclick="closeModal()">Cancel</button></form>`);
}
function handoffIndividualIntake(e,id,revision,binding){
 e.preventDefault();const r=intakeRecord(id),f=Object.fromEntries(new FormData(e.target)),s=individualIntakeSource(r);
 if(!intakeCoordinator()||!r||!Number.isSafeInteger(revision)||r.revision!==revision||!s||s.binding!==binding||f.confirm!=='yes'||!f.reason?.trim()||f.reason.trim().length>2000)return toast('Confirm the current individual intake and handoff reason.');
 const existing=individualIntakeProjects(id);
 if(existing.length||r.projectId||r.individualHandoff){if(existing.length===1&&individualIntakeProjectCurrent(existing[0]))return openProject(existing[0].id);return toast('The linked activity is inconsistent or changed. Resolve the source; do not create a duplicate.');}
 if(!individualIntakeCanCreate(r))return toast('Current accepted prerequisites and valid draft content are required.');
 const at=new Date().toISOString(),p={id:clubKey('P'),title:r.content.title,description:r.content.purpose,programme:r.content.programme,type:s.type,due:r.content.due,state:'CREATED',createdBy:uid,owner:r.student,mentor:s.mentor,members:[r.student],sdg:r.content.sdgs[0]||'',tasks:[],evidence:[],reflections:{},evaluations:{},certs:{},published:{},messages:[],history:[],planningMetadata:{semester:r.content.semester||null,course:r.content.course||null,start:r.content.start,output:r.content.outputs},intakeProvenance:{intakeId:r.id,intakeRevision:r.revision,submissionVersion:intakeLatest(r).version,binding:s.binding,by:uid,at}};
 db.projects.push(p);r.projectId=p.id;r.individualHandoff={projectId:p.id,by:uid,at,revision:r.revision,submissionVersion:intakeLatest(r).version,reason:f.reason.trim()};
 log(r,'Individual intake handed off to draft '+p.id);log(p,'Draft created from intake '+r.id+'; approval and start remain separate');closeModal();openProject(p.id);
}
function individualIntakeHandoffPanel(r){
 if(!r||r.supportReviewOnly||!intakeVisible(r)||!['Project','Workshop','Seminar'].includes(r.content?.type))return '';
 if(r.student!==uid&&!['c1','d1','a1'].includes(uid)&&!intakeMentorAccess(r,uid))return '';
 const rows=individualIntakeProjects(r.id),p=rows.length===1&&rows[0],linked=p&&r.projectId===p.id&&r.individualHandoff?.projectId===p.id;
 if(linked)return `<section class="card"><h3>Linked activity proposal</h3><p>${esc(p.id)} · ${esc(p.state)}${!individualIntakeProjectCurrent(p)?' · Intake source changed; review required before submission, approval or start.':''}</p>${canSee(p)?btn('Open linked activity',`openProject(${esc(JSON.stringify(p.id))})`):'<p>Activity access requires its existing permissions.</p>'}<p>Follow the activity’s own current approval and execution process.</p></section>`;
 return individualIntakeCanCreate(r)?`<section class="card"><h3>Continue to activity approval</h3><p>Current mentor and supporting responsibilities are accepted. Create a linked individual draft; this is not approval or permission to start.</p>${btn('Create linked draft proposal',`individualIntakeHandoffForm(${esc(JSON.stringify(r.id))})`,'primary')}</section>`:'';
}
const individualIntakePreviousMentorPanel=intakeMentorPanel;
intakeMentorPanel=function(r){return individualIntakePreviousMentorPanel(r)+individualIntakeHandoffPanel(r)};
const individualIntakePreviousPendingActions=intakePendingActions;
intakePendingActions=function(r){const titles=individualIntakePreviousPendingActions(r);if(individualIntakeCanCreate(r))titles.push('Create linked individual draft proposal');return titles};
const individualIntakePreviousCanSubmit=proposalCanSubmit;
proposalCanSubmit=function(p){return individualIntakePreviousCanSubmit(p)&&individualIntakeProjectCurrent(p)};
const individualIntakePreviousApprover=proposalApprover;
proposalApprover=function(p){return individualIntakePreviousApprover(p)&&individualIntakeProjectCurrent(p)};
const individualIntakePreviousAdvance=advance;
advance=function(next){const p=current();if(p?.intakeProvenance&&['PENDING_APPROVAL','APPROVED','STARTED'].includes(next)&&!individualIntakeProjectCurrent(p))return toast('Intake source or participant scope changed. Resolve it before submission, approval or start.');return individualIntakePreviousAdvance(next)};
function individualIntakeDraftScope(p){const r=p?.intakeProvenance&&intakeRecord(p.intakeProvenance.intakeId),s=individualIntakeSource(r);return s&&s.binding===p.intakeProvenance.binding?{programme:r.content.programme,type:s.type}:null}
const individualIntakePreviousEditDraft=editProposalDraft;
editProposalDraft=function(e){const p=current();if(p?.intakeProvenance){const scope=individualIntakeDraftScope(p),f=new FormData(e.target);if(!scope||f.get('programme')!==scope.programme||f.get('type')!==scope.type){e.preventDefault();return toast('Keep the linked intake programme and activity type. A scope change requires intake review.');}}return individualIntakePreviousEditDraft(e)};
const individualIntakePreviousEditForm=proposalEditForm;
proposalEditForm=function(){const p=current();if(!p?.intakeProvenance)return individualIntakePreviousEditForm();if(!proposalCanEdit(p))return;const scope=individualIntakeDraftScope(p);if(!scope)return toast('Resolve the current intake source before editing this linked proposal.');individualIntakePreviousEditForm();const node=document.querySelector('#modal');node.innerHTML=node.innerHTML.replace(/<select name="programme">[\s\S]*?<\/select>/,`<input name="programme" value="${esc(scope.programme)}" readonly>`).replace(/<select name="type">[\s\S]*?<\/select>/,`<input name="type" value="${esc(scope.type)}" readonly>`).replace('</form>','<p>Programme and activity type come from the linked intake. Changing them requires a reviewed intake; title, description and deadline corrections remain available here.</p></form>')};
