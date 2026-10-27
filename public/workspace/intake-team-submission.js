// Institutional team submissions use the trusted server seam, never ordinary demo triage.
function intakeTeamCase(r){return r?.teamInitiation?.enabled===true||!!r?.teamFirstReviews?.length||!!r?.teamFirstReviewStatus}
function intakeTeamFrozen(r){return !!r?.teamFirstReviews?.length||!!r?.teamFirstReviewStatus}
function intakeTeamRevisionAllowed(r){
 if(!r||!['RETURNED','DRAFT'].includes(r.state))return false;
 if(r.teamFirstReviewStatus)return r.teamFirstReviewStatus.canRevise===true;
 const f=r.teamFirstReviews?.at(-1),d=(r.teamFirstReviewDecisions||[]).filter(d=>d.firstReviewId===f?.id);
 return !!f&&d.length===1&&d[0].decision==='RETURNED'&&d[0].submissionVersion===f.submissionVersion&&d[0].by===f.route.leadReviewer.personId;
}
const intakeTeamPriorEditable=intakeEditable;
intakeEditable=function(r){return (!intakeTeamFrozen(r)||intakeTeamRevisionAllowed(r))&&intakeTeamPriorEditable(r)};
const intakeTeamPriorSave=saveActivityIntake;
saveActivityIntake=function(e,id,revision){const before=id&&intakeRecord(id),allowed=intakeTeamRevisionAllowed(before),oldRevision=before?.revision,result=intakeTeamPriorSave(e,id,revision),r=id&&intakeRecord(id);if(allowed&&r?.revision===oldRevision+1){r.teamInitiation.teamVersion=(r.teamInvitationsPilot?.rounds?.at(-1)?.version||0)+1;render()}return result};
const intakeTeamPriorSubmit=submitActivityIntake;
submitActivityIntake=function(id,revision){if(intakeTeamCase(intakeRecord(id))&&!(typeof intakeTeamSubmissionAuthorized!=='undefined'&&intakeTeamSubmissionAuthorized))return toast('Use the controlled team submission after current member acceptance.');return intakeTeamPriorSubmit(id,revision)};
const intakeTeamPriorReview=reviewActivityIntake;
reviewActivityIntake=function(e,id,version){if(intakeTeamCase(intakeRecord(id)))return toast('This team intake requires its assigned first-review workflow.');return intakeTeamPriorReview(e,id,version)};
const intakeTeamPriorReviewForm=intakeReviewForm;
intakeReviewForm=function(id){if(intakeTeamCase(intakeRecord(id)))return toast('This team intake requires its assigned first-review workflow.');return intakeTeamPriorReviewForm(id)};
// Demo mentor controls cannot mutate institutional team assignment records.
const intakeTeamPriorAssignMentor=assignIntakeMentor;
assignIntakeMentor=function(e,id,version){if(intakeTeamCase(intakeRecord(id))){e.preventDefault();return toast('Use the controlled team mentor workflow.')}return intakeTeamPriorAssignMentor(e,id,version)};
const intakeTeamPriorRespondMentor=respondIntakeMentor;
respondIntakeMentor=function(e,id,assignmentId,version){if(intakeTeamCase(intakeRecord(id))){e.preventDefault();return toast('Use the controlled team mentor workflow.')}return intakeTeamPriorRespondMentor(e,id,assignmentId,version)};
const intakeTeamPriorWithdrawMentor=withdrawIntakeMentor;
withdrawIntakeMentor=function(e,id,assignmentId,version){if(intakeTeamCase(intakeRecord(id))){e.preventDefault();return toast('Use the controlled team mentor workflow.')}return intakeTeamPriorWithdrawMentor(e,id,assignmentId,version)};
// Demo supporting-unit controls cannot authorize institutional consultation.
const intakeTeamPriorRequestIntakeSupport=requestIntakeSupport;
requestIntakeSupport=function(e,id,...args){if(intakeTeamCase(intakeRecord(id))){e.preventDefault();return toast('Use the controlled team consultation workflow.')}return intakeTeamPriorRequestIntakeSupport(e,id,...args)};
const intakeTeamPriorRespondIntakeSupport=respondIntakeSupport;
respondIntakeSupport=function(e,id,...args){if(intakeTeamCase(intakeRecord(id))){e.preventDefault();return toast('Use the controlled team consultation workflow.')}return intakeTeamPriorRespondIntakeSupport(e,id,...args)};
const intakeTeamPriorWithdrawIntakeSupport=withdrawIntakeSupport;
withdrawIntakeSupport=function(e,id,...args){if(intakeTeamCase(intakeRecord(id))){e.preventDefault();return toast('Use the controlled team consultation workflow.')}return intakeTeamPriorWithdrawIntakeSupport(e,id,...args)};
const intakeTeamPriorVisible=intakeVisible;
intakeVisible=function(r,actor=uid){return intakeTeamCase(r)?r.student===actor:intakeTeamPriorVisible(r,actor)};
const intakeTeamPriorActions=intakePendingActions;
intakePendingActions=function(r){return intakeTeamCase(r)?r.student===uid&&intakeTeamRevisionAllowed(r)?['Revise returned team proposal and renew member acceptance']:[]:intakeTeamPriorActions(r)};
const intakeTeamPriorNotificationActions=notificationActions;
notificationActions=function(today=localDay()){return intakeTeamPriorNotificationActions(today).filter(n=>!(n.route==='Activity Intake'&&intakeTeamCase(intakeRecord(n.sourceId))))};
const intakeTeamPriorNotificationAccess=notificationAccess;
notificationAccess=function(n,actor=uid){if(n.route==='Activity Intake'&&intakeTeamCase(intakeRecord(n.sourceId)))return false;return intakeTeamPriorNotificationAccess(n,actor)};
function intakeTeamSubmissionView(r){
 if(!intakeTeamCase(r))return r;
 const latest=r.teamFirstReviews?.at(-1);
 if(latest){const d=(r.teamFirstReviewDecisions||[]).find(d=>d.firstReviewId===latest.id);r.teamFirstReviewStatus={id:latest.id,version:latest.version,submissionVersion:latest.submissionVersion,state:r.state==='SUBMITTED'?(d?.decision==='REVIEWED'?'FIRST_REVIEWED':'SUBMITTED'):r.state==='RETURNED'?'RETURNED':r.state==='DRAFT'&&d?.decision==='RETURNED'?'REVISION_IN_PROGRESS':'SOURCE_CHANGED',route:latest.route.leadReviewer.route,canRevise:intakeTeamRevisionAllowed(r)}};
 const final=latest&&(r.teamFinalReviews||[]).findLast(d=>d.firstReviewId===latest.id&&d.firstReviewVersion===latest.version&&d.submissionVersion===latest.submissionVersion&&['APPROVED','REJECTED'].includes(d.decision));
 if(final){r.teamFinalReviewStatus={id:final.id,version:final.version,submissionVersion:final.submissionVersion,decision:final.decision};if(r.student===uid)r.teamFinalReviewFeedback={reason:final.reason};}
 if(r.teamStart)r.teamStartStatus={projectId:r.teamStart.projectId,state:'STARTED',startVersion:r.teamStart.version,at:r.teamStart.at};
 if(r.teamHandoff)r.teamHandoffStatus={projectId:r.teamHandoff.projectId,state:r.teamStart?'STARTED':'CREATED',executionAuthorized:false};
 delete r.teamStart;delete r.teamHandoff;delete r.teamFinalReviews;
 r.mentorAssignments=(r.mentorAssignments||[]).map(a=>({id:a.id,version:a.version,mentor:a.mentor,state:a.state}));
 r.supportRequests=(r.supportRequests||[]).map(q=>({id:q.id,target:q.target,version:q.version,state:q.state}));
 delete r.teamConsultationScopes;
 delete r.teamFirstReviews;delete r.teamFirstReviewDecisions;delete r.teamInvitationsPilot;delete r.teamPilotSource;
 return r;
}
const intakeTeamPriorProgress=intakeProgressSummary;
intakeProgressSummary=function(r){
 if(r.teamStartStatus||r.teamStart)return {step:'Team activity started',responsible:'Team lead and accepted mentor',next:'Start is recorded against the existing final approval. Further task tracking uses the controlled activity workflow.'};
 if(r.teamHandoffStatus||r.teamHandoff)return {step:'Linked team draft created',responsible:'Authorized activity workflow',next:'The approved team and mentor are retained. Draft editing, submission and permission to start require the controlled activity workflow.'};
 const currentReview=r.teamFirstReviews?.at(-1),final=r.teamFinalReviewStatus||(r.teamFinalReviews||[]).findLast(d=>d.firstReviewId===currentReview?.id&&d.submissionVersion===currentReview?.submissionVersion);if(final&&['APPROVED','REJECTED'].includes(final.decision))return {step:final.decision==='APPROVED'?'Final approval recorded':'Final rejection recorded',responsible:final.decision==='APPROVED'?'Authorized activity handoff authority':'Configured final reviewer',next:final.decision==='APPROVED'?'Controlled activity handoff and permission to start remain separate.':'The decision is retained. Contact the review authority about next options.'};
 if(intakeTeamRevisionAllowed(r))return {step:'Team revision requested',responsible:'Initiating student',next:'Revise the draft, renew invitations and obtain fresh member acceptance before controlled resubmission. Earlier submissions remain unchanged.'};
 if(intakeTeamFrozen(r)&&r.state==='SUBMITTED'){const d=r.teamFirstReviewStatus?.state==='FIRST_REVIEWED'||r.teamFirstReviewDecisions?.some(d=>d.firstReviewId===r.teamFirstReviews?.at(-1)?.id&&d.decision==='REVIEWED');return {step:d?'First review recorded':'Team submitted for first review',responsible:d?'Authorized follow-up authority':'Assigned first reviewer',next:d?'Mentor/consultation setup, final approval and start remain separate.':'The submitted team and proposal are frozen. The assigned reviewer uses the scoped queue; submission grants no approval or permission to start.'}};
 return intakeTeamPriorProgress(r);
};
