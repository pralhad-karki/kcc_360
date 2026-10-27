import {validateConsultationManagement} from './intake-team-consultation-management.mjs';
// Controlled multidisciplinary consultation request; reuses existing support request records.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {teamMentorSourceSnapshot,teamMentorAssigningAuthority} from './intake-team-mentor-save.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const text=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
export function teamConsultationMentorSource(s,r,f,request,coordinatorActor){
 const a=r.mentorAssignments?.at(-1),person=s.identity.personMap[coordinatorActor],p=f.team.rounds.at(-1).proposal;
 check(p.kind==='MULTIDISCIPLINARY_RESEARCH'&&f.route.consultationRequired===true&&f.route.leadReviewer.personId===person&&f.route.leadReviewer.route==='RESEARCH_COORDINATOR','CURRENT_RESEARCH_COORDINATOR_REQUIRED');teamMentorAssigningAuthority(s,r,f,coordinatorActor);
 check(a&&a.id===request.assignmentId&&a.version===request.assignmentVersion&&a.state==='ACCEPTED'&&!a.withdrawal&&r.mentorAssignments.every((x,i)=>x.version===i+1)&&new Set(r.mentorAssignments.map(x=>x.id)).size===r.mentorAssignments.length,'CURRENT_ACCEPTED_MENTOR_REQUIRED');
 const mentorSource=teamMentorSourceSnapshot(s,r,f,a.mentor,a.by);
 check(a.basis===canonical(mentorSource)&&canonical(a.sourceSnapshot)===canonical(mentorSource)&&a.response?.decision==='ACCEPTED'&&a.response.noUnresolvedConflict===true&&s.identity.personMap[a.response.by]===mentorSource.mentor.personId&&text(a.response.reason)&&Date.parse(a.at)<=Date.parse(a.response.at)&&Date.parse(a.response.at)<=Date.parse(s.now),'CURRENT_ACCEPTED_MENTOR_REQUIRED');
 return {mentorSource,a,person,p};
}
export async function teamConsultationSelectionToken(source,reviewer){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical({source,reviewer})));return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('')}
export function teamConsultationSourceSnapshot(s,r,f,request,coordinatorActor){
 const {mentorSource,a,person,p}=teamConsultationMentorSource(s,r,f,request,coordinatorActor);
 const team=f.team.rounds.at(-1).invitations.map(i=>i.source.personId),departments=new Set(s.roster.students.filter(x=>team.includes(x.personId)&&x.institutionId===p.institutionId).map(x=>x.departmentId));
 check(departments.has(request.departmentId),'PARTICIPATING_DEPARTMENT_REQUIRED');
 const delegates=s.authority.assignments.filter(x=>x.capability==='CONSULTATION_REVIEW'&&x.institutionId===p.institutionId&&x.kind===p.kind&&x.departmentId===request.departmentId&&!x.revokedAt&&Date.parse(x.validFrom)<=Date.parse(s.now)&&Date.parse(s.now)<Date.parse(x.validUntil));
 check(delegates.length===1&&id(delegates[0].id)&&pos(delegates[0].version)&&delegates[0].availability==='AVAILABLE'&&s.activePersonIds.includes(delegates[0].personId)&&s.identity.personMap[request.reviewer]===delegates[0].personId,'EXPLICIT_DEPARTMENT_REPRESENTATIVE_REQUIRED');
 const delegate=delegates[0];check(!team.includes(delegate.personId)&&delegate.personId!==person&&delegate.personId!==mentorSource.mentor.personId,'INDEPENDENT_DEPARTMENT_REPRESENTATIVE_REQUIRED');
 const sourceSnapshot={mentorSource,assignmentId:a.id,assignmentVersion:a.version,mentorResponse:structuredClone(a.response),departmentId:request.departmentId,representative:{id:delegate.id,version:delegate.version,personId:delegate.personId,capability:delegate.capability}};
 return sourceSnapshot;
}
async function stage(request,input,consultationId){
 const s=structuredClone(input),w=s.workspace;check(w?.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');await validateReviewedTeamSource(s,request);
 const data=structuredClone(w.data),r=data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),a=r.mentorAssignments?.at(-1),person=s.identity.principal.personId;
 const sourceSnapshot=teamConsultationSourceSnapshot(s,r,f,request,s.actorId);
 if(request.selectionToken!==undefined)check(request.selectionToken===await teamConsultationSelectionToken(sourceSnapshot,request.reviewer),'CONSULTATION_SELECTION_CHANGED_BEFORE_SAVE');
 const c=r.submissions.at(-1).content;check(date(c.start)&&date(c.due)&&request.due>=s.now.slice(0,10)&&request.due>=c.start&&request.due<=c.due,'CONSULTATION_DATE_OUTSIDE_ACTIVITY');
 const history=r.supportRequests||[],target='DEPARTMENT:'+request.departmentId;check(Array.isArray(history),'VALID_CONSULTATION_HISTORY_REQUIRED');
 const prior=history.filter(q=>q.target===target),previous=prior.at(-1);check(request.expectedConsultationVersion===(previous?.version||0)&&prior.every((q,i)=>q.version===i+1),'CONSULTATION_REVISION_CONFLICT');
 if(previous){check(previous.state==='WITHDRAWN','EXISTING_CONSULTATION_REQUIRES_CONTROLLED_REVISION');validateConsultationManagement(s,r,f,previous,{withdrawn:true})}
 check(new Set(history.map(q=>q.id)).size===history.length,'UNIQUE_CONSULTATION_HISTORY_REQUIRED');const version=prior.length+1;
 const q={id:consultationId,target,title:'Department '+request.departmentId,reviewer:request.reviewer,version,state:'REQUESTED',by:s.actorId,at:s.now,responsibility:request.responsibility.trim(),deliverable:request.deliverable.trim(),due:request.due,reason:request.reason.trim(),basis:canonical(sourceSnapshot),sourceSnapshot};r.supportRequests=[...history,q];
 const event={time:s.now,actor:'Authorized research coordinator',action:'Team department consultation requested v'+version,project:r.id};r.history.unshift(event);data.audit.unshift(event);
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {payload,fingerprint:canonical({workspace:w,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},sourceSnapshot}),workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,actor:person,institutionId:s.identity.principal.tenantId,now:s.now,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,assignmentId:a.id,assignmentVersion:a.version,consultationId,consultationVersion:version,departmentId:request.departmentId,state:'REQUESTED',workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamConsultationRequest({db,loadTrusted,request}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const keys=['proposalId','firstReviewId','submissionVersion','assignmentId','assignmentVersion','departmentId','reviewer','responsibility','deliverable','due','reason','expectedConsultationVersion','confirm','expectedWorkspaceRevision',...(request&&Object.hasOwn(request,'selectionToken')?['selectionToken']:[])];
 check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&['proposalId','firstReviewId','assignmentId','departmentId','reviewer'].every(k=>id(request[k]))&&pos(request.submissionVersion)&&pos(request.assignmentVersion)&&Number.isSafeInteger(request.expectedConsultationVersion)&&request.expectedConsultationVersion>=0&&request.confirm===true&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&['responsibility','deliverable','reason'].every(k=>text(request[k]))&&date(request.due)&&(request.selectionToken===undefined||typeof request.selectionToken==='string'&&/^[a-f0-9]{64}$/.test(request.selectionToken)),'INVALID_CONSULTATION_REQUEST');
 const command=structuredClone(request),consultationId=crypto.randomUUID(),first=await stage(command,await loadTrusted(),consultationId),next=await stage(command,await loadTrusted(),consultationId);check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1;
 const record=formatAuditRecordMetadata({correlationId:commitId,workspaceId:next.workspaceId,actorId:next.actor,action:'requestIntakeTeamConsultation',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'INTAKE_SUPPORT_REQUEST',id:consultationId,versionBefore:null,versionAfter:next.response.consultationVersion,stateBefore:null,stateAfter:'REQUESTED'},reason:{status:'REFERENCED',reference:{recordType:'INTAKE_SUPPORT_REQUEST',recordId:consultationId,recordVersion:next.response.consultationVersion,field:'reason'}}});
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,commitId,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,next.workspaceId,revision,next.subject,next.actor,'requestIntakeTeamConsultation',record,next.now,next.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
