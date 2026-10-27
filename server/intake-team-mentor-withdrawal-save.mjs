// Controlled withdrawal preserves the original request and response; no execution is authorized.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {teamMentorAssigningAuthority} from './intake-team-mentor-save.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
export function teamMentorManagementSource(s,r,f,{withdrawn=false}={}){
 const a=r.mentorAssignments?.at(-1),history=r.mentorAssignments;
 check(a&&Array.isArray(history)&&history.every((x,i)=>x.version===i+1)&&new Set(history.map(x=>x.id)).size===history.length,'VALID_MENTOR_HISTORY_REQUIRED');
 const state=a.state==='WITHDRAWN'&&withdrawn?a.withdrawal?.priorState:a.state;
 check(['REQUESTED','ACCEPTED','REASSIGNMENT_REQUESTED'].includes(state),'CURRENT_MENTOR_ASSIGNMENT_REQUIRED');
 if(a.state==='WITHDRAWN')check(withdrawn&&id(a.withdrawal?.by)&&typeof a.withdrawal.reason==='string'&&a.withdrawal.reason.trim().length>0&&a.withdrawal.reason.length<=2000&&Date.parse(a.at)<=Date.parse(a.withdrawal.at)&&Date.parse(a.withdrawal.at)<=Date.parse(s.now),'VALID_MENTOR_WITHDRAWAL_REQUIRED');
 else check(!a.withdrawal,'CURRENT_MENTOR_ASSIGNMENT_REQUIRED');
 teamMentorAssigningAuthority(s,r,f,s.actorId);
 // Removal must remain possible when the old mentor is no longer active/eligible.
 const source=a.sourceSnapshot;
 check(source&&a.basis===canonical(source)&&source.firstReviewId===f.id&&source.firstReviewVersion===f.version&&source.submissionVersion===f.submissionVersion&&source.submissionDigest===f.submissionDigest&&source.teamRevision===f.teamRevision&&source.teamVersion===f.teamVersion&&canonical(source.routeBinding)===canonical(f.route.binding),'MENTOR_ASSIGNMENT_SOURCE_CHANGED_BEFORE_SAVE');
 check(Number.isFinite(Date.parse(a.at))&&Date.parse(a.at)<=Date.parse(s.now)&&['fit','capacity','reason'].every(k=>typeof a[k]==='string'&&a[k].trim().length>0&&a[k].length<=2000),'VALID_MENTOR_REQUEST_REQUIRED');
 if(state==='REQUESTED')check(!a.response,'UNANSWERED_ASSIGNMENT_REQUIRED');
 else check(a.response?.decision===state&&s.identity.personMap[a.response.by]===source.mentor.personId&&typeof a.response.reason==='string'&&a.response.reason.trim().length>0&&a.response.reason.length<=2000&&a.response.noUnresolvedConflict===(state==='ACCEPTED')&&Date.parse(a.at)<=Date.parse(a.response.at)&&Date.parse(a.response.at)<=Date.parse(s.now),'VALID_MENTOR_RESPONSE_REQUIRED');
 return source;
}
async function stage(request,input){
 const s=structuredClone(input),w=s.workspace;
 check(w?.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 await validateReviewedTeamSource(s,request);
 const data=structuredClone(w.data),r=data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),a=r.mentorAssignments?.at(-1),person=s.identity.principal.personId;
 check(a&&a.id===request.assignmentId&&a.version===request.assignmentVersion&&['REQUESTED','ACCEPTED','REASSIGNMENT_REQUESTED'].includes(a.state)&&!a.withdrawal&&r.mentorAssignments.filter(x=>x.id===a.id).length===1&&r.mentorAssignments.every((x,i)=>x.version===i+1),'CURRENT_MENTOR_ASSIGNMENT_REQUIRED');
 const source=teamMentorManagementSource(s,r,f);
 const priorState=a.state;
 a.withdrawal={by:s.actorId,at:s.now,reason:request.reason.trim(),priorState};a.state='WITHDRAWN';
 const event={time:s.now,actor:'Authorized mentor assigner',action:'Team mentor withdrawn'+' v'+a.version,project:r.id};r.history.unshift(event);data.audit.unshift(event);
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {priorState,payload,fingerprint:canonical({workspace:w,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},source}),workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,actor:person,institutionId:s.identity.principal.tenantId,now:s.now,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,assignmentId:a.id,assignmentVersion:a.version,state:a.state,workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamMentorWithdrawal({db,loadTrusted,request}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const keys=['proposalId','firstReviewId','submissionVersion','assignmentId','assignmentVersion','reason','confirm','expectedWorkspaceRevision'];
 check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&['proposalId','firstReviewId','assignmentId'].every(k=>id(request[k]))&&pos(request.submissionVersion)&&pos(request.assignmentVersion)&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&request.confirm===true&&typeof request.reason==='string'&&request.reason.trim().length>0&&request.reason.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(request.reason),'INVALID_MENTOR_WITHDRAWAL');
 const command=structuredClone(request),first=await stage(command,await loadTrusted()),next=await stage(command,await loadTrusted());check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1;
 const record=formatAuditRecordMetadata({correlationId:commitId,workspaceId:next.workspaceId,actorId:next.actor,action:'withdrawIntakeTeamMentor',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'INTAKE_MENTOR_ASSIGNMENT',id:command.assignmentId,versionBefore:command.assignmentVersion,versionAfter:command.assignmentVersion,stateBefore:next.priorState,stateAfter:'WITHDRAWN'},reason:{status:'REFERENCED',reference:{recordType:'INTAKE_MENTOR_ASSIGNMENT',recordId:command.assignmentId,recordVersion:command.assignmentVersion,field:'withdrawalReason'}}});
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,commitId,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,next.workspaceId,revision,next.subject,next.actor,'withdrawIntakeTeamMentor',record,next.now,next.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
