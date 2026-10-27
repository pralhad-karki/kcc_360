// Existing workspace transaction and immutable intake submissions; default-disabled dispatcher owns access.
import {firstReviewDecision} from './intake-first-review-read.mjs';
import {createEngine} from './engine.mjs';
import {normalizeExistingIntakePilot} from './intake-normalization-pilot.mjs';
import {resolveIntakeSourceContext} from './intake-source-adapter.mjs';
import {confirmedTeamRoutingPilot} from './team-invitations-pilot.mjs';
import {resolveIntakeRoutingPilot} from './intake-routing-pilot.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))))).map(v=>v.toString(16).padStart(2,'0')).join('');
async function stage(request,input){
 const loaded=structuredClone(input),w=loaded.workspace;
 check(w&&Number.isSafeInteger(w.revision)&&w.revision===request.expectedWorkspaceRevision&&Array.isArray(w.data?.activityIntakes),'WORKSPACE_REVISION_CONFLICT');
 const matches=w.data.activityIntakes.filter(r=>r.id===request.proposalId);check(matches.length===1,'UNIQUE_INTAKE_REQUIRED');const r=matches[0],team=r.teamInvitationsPilot;
 const prior=r.teamFirstReviews?.at(-1),returned=prior&&firstReviewDecision(r,prior)?.decision==='RETURNED';
 check(r.state==='DRAFT'&&!r.projectId&&(!prior||returned&&r.revision>prior.intakeRevision&&r.teamInitiation?.teamVersion>prior.teamVersion),'UNSUBMITTED_TEAM_DRAFT_REQUIRED');
 check(Number.isSafeInteger(request.expectedTeamRevision)&&request.expectedTeamRevision>0&&team?.revision===request.expectedTeamRevision,'TEAM_REVISION_CONFLICT');
 check(loaded.identity?.personMap?.[loaded.actorId]===loaded.identity?.principal?.personId&&loaded.actorId===r.student,'PROPOSAL_LEAD_REQUIRED');
 const norm=normalizeExistingIntakePilot({...loaded,configuration:loaded.normalizationConfiguration,intake:r});check(norm.ok,norm.reason);
 const source=resolveIntakeSourceContext({...loaded,proposal:norm.proposal,team,purpose:'ROUTING'});check(source.ok,source.reason);
 const confirmed=confirmedTeamRoutingPilot(team,source.serverContext),route=resolveIntakeRoutingPilot({...source.serverContext,...confirmed});check(route.status==='READY_FOR_FIRST_REVIEW',route.reason||'FIRST_REVIEW_ROUTE_REQUIRED');
 const {now,...context}=source.serverContext;
 const fingerprint=await digest({workspace:w,normalization:norm.mapping,context,route,subject:loaded.subject,actorId:loaded.actorId,authorizationVersion:loaded.identity.authorizationVersion});
 // Reuse the ordinary immutable submission implementation with an internal-only authorization option.
 const result=createEngine(w.data,loaded.actorId,{intakeTeamSubmission:true}).run('submitActivityIntake',[r.id,r.revision],{page:'Activity Intake'}),data=result.data,target=data.activityIntakes.find(x=>x.id===r.id),submission=target.submissions.at(-1);
 check(target.state==='SUBMITTED'&&target.submissions.length===r.submissions.length+1&&submission.revision===r.revision,'INTAKE_SUBMISSION_REJECTED');
 const reviewVersion=(r.teamFirstReviews?.length||0)+1;const frozen={id:r.id+':first-review:'+reviewVersion,version:reviewVersion,state:'SUBMITTED',submissionVersion:submission.version,intakeRevision:r.revision,teamRevision:team.revision,teamVersion:norm.proposal.teamVersion,by:source.serverContext.actorPersonId,at:loaded.now,normalization:norm.mapping,sourceReferences:source.sources,route,team:structuredClone(team),submissionDigest:await digest(submission)};
 target.teamFirstReviews=[...(r.teamFirstReviews||[]),frozen];
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {fingerprint,payload,workspaceId:w.id,revisionBefore:w.revision,subject:loaded.subject,actor:source.serverContext.actorPersonId,institutionId:norm.proposal.institutionId,now:loaded.now,record:{type:'INTAKE',id:r.id,versionBefore:submission.version-1||null,versionAfter:submission.version,stateBefore:r.state,stateAfter:'SUBMITTED'},response:{ok:true,proposalId:r.id,firstReviewId:frozen.id,submissionVersion:submission.version,teamRevision:team.revision,state:'SUBMITTED',route:route.leadReviewer.route,workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamFirstReview({db,loadTrusted,request}){
 check(db&&typeof db.prepare==='function'&&typeof db.batch==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 check(request&&Object.keys(request).length===3&&['proposalId','expectedWorkspaceRevision','expectedTeamRevision'].every(k=>Object.hasOwn(request,k))&&typeof request.proposalId==='string'&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0,'INVALID_FIRST_REVIEW_SUBMISSION');
 const command=structuredClone(request),first=await stage(command,await loadTrusted()),next=await stage(command,await loadTrusted());check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const id=crypto.randomUUID(),revision=next.revisionBefore+1;
 const audit=formatAuditRecordMetadata({correlationId:id,workspaceId:next.workspaceId,actorId:next.actor,action:'submitIntakeTeamFirstReview',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:next.record,reason:{status:'NOT_REQUIRED',reference:null}});
 const result=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,id,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(id,next.workspaceId,revision,next.subject,next.actor,'submitIntakeTeamFirstReview',audit,next.now,next.workspaceId,id)
 ]);
 check(result[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(result[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
