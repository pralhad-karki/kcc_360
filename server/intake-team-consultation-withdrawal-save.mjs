// Authorized consultation withdrawal; retained history, no approval or execution.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {validateConsultationManagement} from './intake-team-consultation-management.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
async function stage(request,input){
 const s=structuredClone(input),w=s.workspace;
 check(w?.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 await validateReviewedTeamSource(s,request);
 const data=structuredClone(w.data),r=data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),person=s.identity.principal.personId;
 const matches=(r.supportRequests||[]).filter(q=>q.id===request.consultationId);check(matches.length===1,'UNIQUE_CONSULTATION_REQUIRED');const q=matches[0],departmentId=q.sourceSnapshot?.departmentId;
 check(q.version===request.consultationVersion,'CONSULTATION_REVISION_CONFLICT');
 const source=validateConsultationManagement(s,r,f,q),priorState=q.state;
 q.withdrawal={by:s.actorId,at:s.now,reason:request.reason.trim(),priorState};q.state='WITHDRAWN';
 const event={time:s.now,actor:'Authorized research coordinator',action:'Team consultation withdrawn'+' v'+q.version,project:r.id};r.history.unshift(event);data.audit.unshift(event);
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {priorState,payload,fingerprint:canonical({workspace:w,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},source}),workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,actor:person,institutionId:s.identity.principal.tenantId,now:s.now,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,consultationId:q.id,consultationVersion:q.version,departmentId,state:q.state,workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamConsultationWithdrawal({db,loadTrusted,request}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const keys=['proposalId','firstReviewId','submissionVersion','consultationId','consultationVersion','reason','confirm','expectedWorkspaceRevision'];
 check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&['proposalId','firstReviewId','consultationId'].every(k=>id(request[k]))&&pos(request.submissionVersion)&&pos(request.consultationVersion)&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&request.confirm===true&&typeof request.reason==='string'&&request.reason.trim().length>0&&request.reason.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(request.reason),'INVALID_CONSULTATION_WITHDRAWAL');
 const command=structuredClone(request),first=await stage(command,await loadTrusted()),next=await stage(command,await loadTrusted());check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1;
 const record=formatAuditRecordMetadata({correlationId:commitId,workspaceId:next.workspaceId,actorId:next.actor,action:'withdrawIntakeTeamConsultation',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'INTAKE_SUPPORT_REQUEST',id:command.consultationId,versionBefore:command.consultationVersion,versionAfter:command.consultationVersion,stateBefore:next.priorState,stateAfter:'WITHDRAWN'},reason:{status:'REFERENCED',reference:{recordType:'INTAKE_SUPPORT_REQUEST',recordId:command.consultationId,recordVersion:command.consultationVersion,field:'withdrawalReason'}}});
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,commitId,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,next.workspaceId,revision,next.subject,next.actor,'withdrawIntakeTeamConsultation',record,next.now,next.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
