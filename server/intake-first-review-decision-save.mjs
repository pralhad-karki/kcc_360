// Version-bound first review only. Neither decision grants final approval or execution.
import {readConsistentIntakeFirstReview} from './intake-first-review-read.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
async function stage(request,input){
 const s=structuredClone(input),w=s.workspace;
 check(w?.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 const view=await readConsistentIntakeFirstReview({first:s,second:s,proposalId:request.proposalId});
 check(view.item.role==='REVIEWER'&&view.item.canDecide&&view.item.firstReviewId===request.firstReviewId&&view.item.submissionVersion===request.submissionVersion,'CURRENT_FIRST_REVIEW_REQUIRED');
 const data=structuredClone(w.data),r=data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),actor=s.identity.principal.personId;
 const decision={firstReviewId:f.id,firstReviewVersion:f.version,submissionVersion:f.submissionVersion,decision:request.decision,by:actor,at:s.now,reason:request.reason.trim()};
 r.teamFirstReviewDecisions=[...(r.teamFirstReviewDecisions||[]),decision];
 if(request.decision==='RETURNED')r.state='RETURNED';
 const event={time:s.now,actor:'Assigned first reviewer',action:'Team first review '+request.decision+' · submitted v'+f.submissionVersion,project:r.id};r.history.unshift(event);data.audit.unshift(event);
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {payload,fingerprint:canonical({workspace:w,roster:s.roster,masters:s.academicMasters,authority:s.authority,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},item:view.item}),workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,actor,institutionId:s.identity.principal.tenantId,now:s.now,submissionVersion:f.submissionVersion,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,state:request.decision==='RETURNED'?'RETURNED':'FIRST_REVIEWED',workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeFirstReviewDecision({db,loadTrusted,request}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const keys=['proposalId','firstReviewId','submissionVersion','decision','reason','expectedWorkspaceRevision'];
 check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&['RETURNED','REVIEWED'].includes(request.decision)&&typeof request.reason==='string'&&request.reason.trim().length>0&&request.reason.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(request.reason),'INVALID_FIRST_REVIEW_DECISION');
 const command=structuredClone(request),first=await stage(command,await loadTrusted()),next=await stage(command,await loadTrusted());check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const id=crypto.randomUUID(),revision=next.revisionBefore+1;
 const record=formatAuditRecordMetadata({correlationId:id,workspaceId:next.workspaceId,actorId:next.actor,action:'decideIntakeTeamFirstReview',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'INTAKE',id:command.proposalId,versionBefore:next.submissionVersion,versionAfter:next.submissionVersion,stateBefore:'SUBMITTED',stateAfter:next.response.state},reason:{status:'REFERENCED',reference:{recordType:'INTAKE',recordId:command.proposalId,recordVersion:next.submissionVersion,field:'decisionReason'}}});
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,id,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(id,next.workspaceId,revision,next.subject,next.actor,'decideIntakeTeamFirstReview',record,next.now,next.workspaceId,id)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
