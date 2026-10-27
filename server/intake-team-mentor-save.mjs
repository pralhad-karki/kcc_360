// Controlled request only: existing assignment history, no demo identities or automatic acceptance.
import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const text=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
function mentorScopeAssignments(s,p,capability){
 return s.authority.assignments.filter(a=>a.capability===capability&&a.institutionId===p.institutionId&&a.kind===p.kind&&!a.revokedAt&&Date.parse(a.validFrom)<=Date.parse(s.now)&&Date.parse(s.now)<Date.parse(a.validUntil)&&a.availability==='AVAILABLE'&&id(a.id)&&pos(a.version)&&id(a.personId)&&(p.kind==='MULTIDISCIPLINARY_RESEARCH'||['programmeId','batchId','semesterId','courseId'].every(k=>a[k]===p[k])));
}
export function teamMentorAssigningAuthority(s,r,f,assignerActor){
 const p=f.team.rounds.at(-1).proposal,person=s.identity.personMap[assignerActor];
 check(id(person)&&Array.isArray(s.activePersonIds)&&s.activePersonIds.includes(person),'ACTIVE_ASSIGNER_REQUIRED');
 const authorities=mentorScopeAssignments(s,p,'MENTOR_ASSIGN');
 check(authorities.length===1&&authorities[0].personId===person,'EXPLICIT_MENTOR_ASSIGNMENT_AUTHORITY_REQUIRED');
 check(!f.team.rounds.at(-1).invitations.some(i=>i.source.personId===person),'INDEPENDENT_ASSIGNER_REQUIRED');return authorities[0];
}
export async function teamMentorSelectionToken(source,mentorActor){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical({source,mentorActor})));return Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('');
}
// Shared current-source validation for request and response; no grants are provisioned here.
export function teamMentorSourceSnapshot(s,r,f,mentorActor,assignerActor){
 const p=f.team.rounds.at(-1).proposal,person=s.identity.personMap[assignerActor],authority=teamMentorAssigningAuthority(s,r,f,assignerActor);
 const candidates=mentorScopeAssignments(s,p,'PROJECT_MENTOR').filter(a=>a.personId===s.identity.personMap[mentorActor]);
 check(candidates.length===1&&s.activePersonIds.includes(candidates[0].personId),'CURRENT_ELIGIBLE_MENTOR_REQUIRED');
 const mentor=candidates[0],memberPeople=f.team.rounds.at(-1).invitations.map(i=>i.source.personId);
 check(!memberPeople.includes(person),'INDEPENDENT_ASSIGNER_REQUIRED');
 check(mentor.personId!==person&&!memberPeople.includes(mentor.personId)&&mentorActor!==assignerActor&&mentorActor!==r.student,'INDEPENDENT_MENTOR_REQUIRED');
 const ref=a=>({id:a.id,version:a.version,personId:a.personId,capability:a.capability});
 const sourceSnapshot={firstReviewId:f.id,firstReviewVersion:f.version,submissionVersion:f.submissionVersion,submissionDigest:f.submissionDigest,teamRevision:f.teamRevision,teamVersion:f.teamVersion,sourceReferences:structuredClone(f.sourceReferences),normalization:structuredClone(f.normalization),routeBinding:f.route.binding,assigner:ref(authority),mentor:ref(mentor),consultationRequired:f.route.consultationRequired};
 return sourceSnapshot;
}
async function stage(request,input,assignmentId){
 const s=structuredClone(input),w=s.workspace;
 check(w?.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 await validateReviewedTeamSource(s,request);
 const data=structuredClone(w.data),r=data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),person=s.identity.principal.personId;
 const sourceSnapshot=teamMentorSourceSnapshot(s,r,f,request.mentor,s.actorId);
 if(request.selectionToken!==undefined)check(request.selectionToken===await teamMentorSelectionToken(sourceSnapshot,request.mentor),'MENTOR_SELECTION_CHANGED_BEFORE_SAVE');
 const history=r.mentorAssignments||[],previous=history.at(-1);
 check(Array.isArray(history)&&request.expectedAssignmentVersion===(previous?.version||0)&&history.every((a,i)=>a.version===i+1),'MENTOR_ASSIGNMENT_REVISION_CONFLICT');
 // A replacement starts only after explicit authorized withdrawal; older records are immutable.
 check(history.length===0||previous.state==='WITHDRAWN'&&previous.withdrawal&&id(previous.withdrawal.by)&&text(previous.withdrawal.reason)&&['REQUESTED','ACCEPTED','REASSIGNMENT_REQUESTED'].includes(previous.withdrawal.priorState)&&Date.parse(previous.at)<=Date.parse(previous.withdrawal.at)&&Date.parse(previous.withdrawal.at)<=Date.parse(s.now)&&previous.sourceSnapshot?.firstReviewId===f.id&&previous.sourceSnapshot.submissionDigest===f.submissionDigest&&previous.basis===canonical(previous.sourceSnapshot),'EXISTING_ASSIGNMENT_REQUIRES_CONTROLLED_REPLACEMENT');
 check(new Set(history.map(a=>a.id)).size===history.length,'INVALID_MENTOR_HISTORY');
 const version=history.length+1;
 const a={id:assignmentId,version,mentor:request.mentor,by:s.actorId,at:s.now,fit:request.fit.trim(),capacity:request.capacity.trim(),reason:request.reason.trim(),state:'REQUESTED',basis:canonical(sourceSnapshot),sourceSnapshot};
 r.mentorAssignments=[...history,a];
 const event={time:s.now,actor:'Authorized mentor assigner',action:'Team mentor acceptance requested v'+version,project:r.id};r.history.unshift(event);data.audit.unshift(event);
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {payload,fingerprint:canonical({workspace:w,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},sourceSnapshot}),workspaceId:w.id,revisionBefore:w.revision,subject:s.subject,actor:person,institutionId:s.identity.principal.tenantId,now:s.now,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,assignmentId,assignmentVersion:version,state:'REQUESTED',workspaceRevision:w.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamMentorRequest({db,loadTrusted,request}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const keys=['proposalId','firstReviewId','submissionVersion','expectedAssignmentVersion','mentor','fit','capacity','reason','expectedWorkspaceRevision',...(request&&Object.hasOwn(request,'selectionToken')?['selectionToken']:[])];
 check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&['proposalId','firstReviewId','mentor'].every(k=>id(request[k]))&&pos(request.submissionVersion)&&Number.isSafeInteger(request.expectedAssignmentVersion)&&request.expectedAssignmentVersion>=0&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&(request.selectionToken===undefined||typeof request.selectionToken==='string'&&/^[a-f0-9]{64}$/.test(request.selectionToken))&&['fit','capacity','reason'].every(k=>text(request[k])),'INVALID_MENTOR_REQUEST');
 const command=structuredClone(request),assignmentId=crypto.randomUUID(),first=await stage(command,await loadTrusted(),assignmentId),next=await stage(command,await loadTrusted(),assignmentId);check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1;
 const record=formatAuditRecordMetadata({correlationId:commitId,workspaceId:next.workspaceId,actorId:next.actor,action:'requestIntakeTeamMentor',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'INTAKE_MENTOR_ASSIGNMENT',id:assignmentId,versionBefore:null,versionAfter:next.response.assignmentVersion,stateBefore:null,stateAfter:'REQUESTED'},reason:{status:'REFERENCED',reference:{recordType:'INTAKE_MENTOR_ASSIGNMENT',recordId:assignmentId,recordVersion:next.response.assignmentVersion,field:'reason'}}});
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,commitId,next.now,next.workspaceId,next.revisionBefore),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,next.workspaceId,revision,next.subject,next.actor,'requestIntakeTeamMentor',record,next.now,next.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
