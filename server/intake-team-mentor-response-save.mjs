// Assigned mentor response only. Acceptance never grants consultation/final approval or execution.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {teamMentorSourceSnapshot} from './intake-team-mentor-save.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
async function stage(request,input){
 const s=structuredClone(input),w=s.workspace;
 check(w?.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 await validateReviewedTeamSource(s,request);
 const data=structuredClone(w.data),r=data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),a=r.mentorAssignments?.at(-1),person=s.identity.principal.personId;
 check(a&&a.id===request.assignmentId&&a.version===request.assignmentVersion&&a.state==='REQUESTED'&&!a.response&&!a.withdrawal&&r.mentorAssignments.filter(x=>x.id===a.id).length===1&&r.mentorAssignments.every((x,i)=>x.version===i+1),'CURRENT_PENDING_MENTOR_ASSIGNMENT_REQUIRED');
 check(Array.isArray(s.activePersonIds)&&s.activePersonIds.includes(person)&&s.identity.personMap[a.mentor]===person,'CURRENT_ASSIGNED_MENTOR_REQUIRED');
 check(Number.isFinite(Date.parse(a.at))&&Date.parse(a.at)<=Date.parse(s.now)&&['fit','capacity','reason'].every(k=>typeof a[k]==='string'&&a[k].trim().length>0&&a[k].length<=2000),'VALID_MENTOR_REQUEST_REQUIRED');
 const source=teamMentorSourceSnapshot(s,r,f,a.mentor,a.by);
 check(canonical(a.sourceSnapshot)===canonical(source)&&a.basis===canonical(source),'MENTOR_ASSIGNMENT_SOURCE_CHANGED_BEFORE_SAVE');
 a.response={decision:request.decision,reason:request.reason.trim(),by:s.actorId,at:s.now,noUnresolvedConflict:request.decision==='ACCEPTED'};a.state=request.decision;
 const event={time:s.now,actor:'Assigned project mentor',action:'Team mentor response '+request.decision+' v'+a.version,project:r.id};r.history.unshift(event);data.audit.unshift(event);
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {payload,fingerprint:canonical({workspace:w,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},source}),workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,actor:person,institutionId:s.identity.principal.tenantId,now:s.now,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,assignmentId:a.id,assignmentVersion:a.version,state:a.state,workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamMentorResponse({db,loadTrusted,request}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const keys=['proposalId','firstReviewId','submissionVersion','assignmentId','assignmentVersion','decision','reason','noConflict','expectedWorkspaceRevision'];
 check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&['proposalId','firstReviewId','assignmentId'].every(k=>id(request[k]))&&pos(request.submissionVersion)&&pos(request.assignmentVersion)&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&['ACCEPTED','REASSIGNMENT_REQUESTED'].includes(request.decision)&&typeof request.noConflict==='boolean'&&(request.decision==='ACCEPTED'?request.noConflict===true:request.noConflict===false)&&typeof request.reason==='string'&&request.reason.trim().length>0&&request.reason.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(request.reason),'INVALID_MENTOR_RESPONSE');
 const command=structuredClone(request),first=await stage(command,await loadTrusted()),next=await stage(command,await loadTrusted());check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1;
 const record=formatAuditRecordMetadata({correlationId:commitId,workspaceId:next.workspaceId,actorId:next.actor,action:'respondIntakeTeamMentor',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'INTAKE_MENTOR_ASSIGNMENT',id:command.assignmentId,versionBefore:command.assignmentVersion,versionAfter:command.assignmentVersion,stateBefore:'REQUESTED',stateAfter:command.decision},reason:{status:'REFERENCED',reference:{recordType:'INTAKE_MENTOR_ASSIGNMENT',recordId:command.assignmentId,recordVersion:command.assignmentVersion,field:'decisionReason'}}});
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,commitId,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,next.workspaceId,revision,next.subject,next.actor,'respondIntakeTeamMentor',record,next.now,next.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
