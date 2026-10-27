// Assigned department representative response; responsibility acceptance is not completion or final approval.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {teamConsultationSourceSnapshot} from './intake-team-consultation-save.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
export function validateTeamConsultationRecord(s,r,f,q,{allowResponded=false}={}){
 const departmentId=q.sourceSnapshot?.departmentId;check(r.supportRequests.filter(x=>x.id===q.id).length===1,'UNIQUE_CONSULTATION_REQUIRED');
 check(pos(q.version)&&['REQUESTED',...(allowResponded?['ACCEPTED','DECLINED']:[])].includes(q.state)&&!q.withdrawal&&q.target==='DEPARTMENT:'+departmentId&&r.supportRequests.filter(x=>x.target===q.target).every((x,i)=>x.version===i+1)&&r.supportRequests.filter(x=>x.target===q.target).at(-1)?.id===q.id,'CURRENT_PENDING_CONSULTATION_REQUIRED');
 check(Number.isFinite(Date.parse(q.at))&&Date.parse(q.at)<=Date.parse(s.now)&&['responsibility','deliverable','reason'].every(k=>typeof q[k]==='string'&&q[k].trim().length>0&&q[k].length<=2000)&&typeof q.due==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(q.due)&&Number.isFinite(Date.parse(q.due))&&new Date(q.due).toISOString().slice(0,10)===q.due&&q.due>=r.submissions.at(-1).content.start&&q.due<=r.submissions.at(-1).content.due,'VALID_CONSULTATION_REQUEST_REQUIRED');
 const source=teamConsultationSourceSnapshot(s,r,f,{assignmentId:q.sourceSnapshot.assignmentId,assignmentVersion:q.sourceSnapshot.assignmentVersion,departmentId,reviewer:q.reviewer},q.by);
 check(canonical(q.sourceSnapshot)===canonical(source)&&q.basis===canonical(source),'CONSULTATION_SOURCE_CHANGED_BEFORE_SAVE');
 if(q.state==='REQUESTED')check(!q.response,'UNANSWERED_CONSULTATION_REQUIRED');
 else check(q.response?.decision===q.state&&s.identity.personMap[q.response.by]===source.representative.personId&&typeof q.response.reason==='string'&&q.response.reason.trim().length>0&&q.response.reason.length<=2000&&q.response.authorityConfirmed===(q.state==='ACCEPTED')&&Date.parse(q.at)<=Date.parse(q.response.at)&&Date.parse(q.response.at)<=Date.parse(s.now),'VALID_CONSULTATION_RESPONSE_REQUIRED');
 return source;
}
async function stage(request,input){
 const s=structuredClone(input),w=s.workspace;
 check(w?.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 await validateReviewedTeamSource(s,request);
 const data=structuredClone(w.data),r=data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),person=s.identity.principal.personId;
 const matches=(r.supportRequests||[]).filter(q=>q.id===request.consultationId);check(matches.length===1,'UNIQUE_CONSULTATION_REQUIRED');const q=matches[0],departmentId=q.sourceSnapshot?.departmentId;
 check(q.version===request.consultationVersion,'CONSULTATION_REVISION_CONFLICT');
 check(Array.isArray(s.activePersonIds)&&s.activePersonIds.includes(person)&&s.identity.personMap[q.reviewer]===person,'CURRENT_ASSIGNED_REPRESENTATIVE_REQUIRED');
 const source=validateTeamConsultationRecord(s,r,f,q);
 q.response={decision:request.decision,reason:request.reason.trim(),by:s.actorId,at:s.now,authorityConfirmed:request.decision==='ACCEPTED'};q.state=request.decision;
 const event={time:s.now,actor:'Assigned department representative',action:'Team consultation response '+request.decision+' v'+q.version,project:r.id};r.history.unshift(event);data.audit.unshift(event);
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {payload,fingerprint:canonical({workspace:w,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},source}),workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,actor:person,institutionId:s.identity.principal.tenantId,now:s.now,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,consultationId:q.id,consultationVersion:q.version,departmentId,state:q.state,workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamConsultationResponse({db,loadTrusted,request}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const keys=['proposalId','firstReviewId','submissionVersion','consultationId','consultationVersion','decision','reason','authorityConfirmed','expectedWorkspaceRevision'];
 check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&['proposalId','firstReviewId','consultationId'].every(k=>id(request[k]))&&pos(request.submissionVersion)&&pos(request.consultationVersion)&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&['ACCEPTED','DECLINED'].includes(request.decision)&&typeof request.authorityConfirmed==='boolean'&&(request.decision==='ACCEPTED'?request.authorityConfirmed===true:request.authorityConfirmed===false)&&typeof request.reason==='string'&&request.reason.trim().length>0&&request.reason.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(request.reason),'INVALID_CONSULTATION_RESPONSE');
 const command=structuredClone(request),first=await stage(command,await loadTrusted()),next=await stage(command,await loadTrusted());check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1;
 const record=formatAuditRecordMetadata({correlationId:commitId,workspaceId:next.workspaceId,actorId:next.actor,action:'respondIntakeTeamConsultation',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'INTAKE_SUPPORT_REQUEST',id:command.consultationId,versionBefore:command.consultationVersion,versionAfter:command.consultationVersion,stateBefore:'REQUESTED',stateAfter:command.decision},reason:{status:'REFERENCED',reference:{recordType:'INTAKE_SUPPORT_REQUEST',recordId:command.consultationId,recordVersion:command.consultationVersion,field:'decisionReason'}}});
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,commitId,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,next.workspaceId,revision,next.subject,next.actor,'respondIntakeTeamConsultation',record,next.now,next.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
