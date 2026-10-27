// Read-only guidance for the existing intake; never an authorization decision.
function intakeProgressSummary(r){
 if(!r||!intakeVisible(r))return null;
 const result=(step,responsible,next)=>({step,responsible,next});
 if(r.supportReviewOnly||r.student!==uid&&!['c1','d1','a1'].includes(uid)&&!intakeMentorAccess(r,uid))return result('Supporting responsibility','Your assigned supporting representative','Review your current responsibility below. Your response does not approve or start the activity.');
 if(r.state==='WITHDRAWN')return result('Proposal withdrawn','No current intake action','The withdrawn proposal and its history remain available.');
 if(r.state==='DRAFT')return result('Preparing proposal','Student proposer','Complete the draft and submit it for routing review. A mentor suggestion is optional.');
 if(r.state==='RETURNED')return result('Revision requested','Student proposer','Review the recorded feedback, revise the draft and submit a new version.');
 if(r.state==='SUBMITTED')return intakeSubmissionCurrent(r)?result('Awaiting routing review','Programme Coordinator','The coordinator reviews the submitted version and confirms responsibilities or returns it for revision. Routing confirmation is not activity approval.'):result('Submitted source changed','Programme Coordinator','Resolve the changed submission before further review. Earlier decisions remain historical.');
 if(r.state!=='ROUTING_CONFIRMED')return null;
 if(!intakeRoutingCurrent(r))return result('Routing requires review','Programme Coordinator','The current source no longer matches the recorded routing. Resolve the source before further action.');
 const a=intakeMentorLatest(r);
 if(!a||!intakeMentorCurrent(r,a)||['WITHDRAWN','REASSIGNMENT_REQUESTED'].includes(a.state))return result('Mentor assignment required','Programme Coordinator','Review expertise, availability and conflicts, then request acceptance from an eligible mentor. The student suggestion is not an assignment.');
 if(a.state==='REQUESTED')return result('Awaiting mentor response',name(a.mentor),'The assigned mentor must accept or request reassignment. An assignment request does not authorize execution.');
 if(a.state!=='ACCEPTED')return result('Mentor assignment requires review','Programme Coordinator','Review the current assignment status before continuing.');
 if(!intakeSupportComplete(r))return result('Supporting responsibilities pending','Coordinator and assigned supporting representatives','The coordinator defines or revises requests; assigned representatives respond. Declined or changed requests require resolution.');
 if(r.projectId)return result('Activity workspace linked','Assigned activity participants and reviewers','Use the linked activity process for its current tasks and approvals. Intake readiness alone does not establish activity completion.');
 return r.content.type==='Internship'?result('Mentor and support prerequisites complete','Student, mentor and authorized placement reviewers','Continue the placement and readiness controls below. Letter issue, host acceptance and permission to commence remain separate.'):result('Intake prerequisites complete','Authorized activity preparers and approvers','Continue the activity-specific learning and approval process. Mentor/support acceptance alone does not permit the activity to start.');
}
function intakeProgressPanel(r){const s=intakeProgressSummary(r);return s?`<section class="card" aria-label="Intake progress"><h3>Current intake step</h3><p><strong>${esc(s.step)}</strong></p><p>Next responsible: ${esc(s.responsible)}</p><p>${esc(s.next)}</p></section>`:''}
const intakeProgressPreviousMentorPanel=intakeMentorPanel;
intakeMentorPanel=function(r){return intakeProgressPanel(r)+intakeProgressPreviousMentorPanel(r)};
