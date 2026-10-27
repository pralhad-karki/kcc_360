import {validateReviewedTeamSource} from './intake-first-review-read.mjs';
import {readConsistentTeamApprovalReadiness} from './intake-team-approval-readiness.mjs';
import {currentTeamFinalReview,finalReviewPrerequisiteDigest,finalReviewCanonical as canonical} from './intake-team-final-review.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v),pos=v=>Number.isSafeInteger(v)&&v>0;
const hash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))))).map(x=>x.toString(16).padStart(2,'0')).join('');
const fingerprint=s=>canonical({workspace:s.workspace,roster:s.roster,masters:s.academicMasters,authority:s.authority,activePersonIds:s.activePersonIds,identity:{principal:s.identity.principal,authorizationVersion:s.identity.authorizationVersion,personMap:s.identity.personMap,provenance:s.identity.provenance},actor:s.actorId,subject:s.subject,configuration:s.configuration,normalizationConfiguration:s.normalizationConfiguration});
function reference(v){return v&&['proposalId','firstReviewId','finalDecisionId'].every(k=>id(v[k]))&&pos(v.submissionVersion)&&pos(v.finalDecisionVersion)}
export function teamActivityAuthority(s,r,f,capability){
 const p=f.team.rounds.at(-1).proposal,a=r.mentorAssignments.at(-1);
 const active=x=>x.status==='APPROVED'&&id(x.approvalReference)&&x.institutionId===p.institutionId&&x.kind===p.kind&&!x.revokedAt&&x.availability==='AVAILABLE'&&id(x.id)&&pos(x.version)&&Date.parse(x.validFrom)<=Date.parse(s.now)&&Date.parse(s.now)<Date.parse(x.validUntil);
 const grants=s.authority.assignments.filter(x=>x.capability===capability&&active(x)&&(p.kind!=='SAME_BATCH_ACADEMIC'||['programmeId','batchId','semesterId','courseId'].every(k=>x[k]===p[k])));
 check(grants.length===1&&grants[0].personId===s.identity.principal.personId&&s.activePersonIds.includes(grants[0].personId)&&!f.team.rounds.at(-1).invitations.some(i=>i.source.personId===grants[0].personId)&&grants[0].personId!==s.identity.personMap[a.mentor],'EXPLICIT_SCOPED_ACTIVITY_AUTHORITY_REQUIRED');
 return grants[0];
}
export function teamActivityMapping(s,r,f){
 const p=f.team.rounds.at(-1).proposal,c=r.submissions.at(-1).content;
 const mappings=s.academicMasters.activityMappings;check(Array.isArray(mappings),'APPROVED_EXECUTION_MAPPING_REQUIRED');
 const maps=mappings.filter(m=>m.kind===p.kind&&m.sourceType===c.type&&m.sourceProgramme===c.programme);check(maps.length===1,'UNIQUE_EXECUTION_MAPPING_REQUIRED');const mapping=maps[0];
 check(id(mapping.id)&&pos(mapping.version)&&mapping.status==='APPROVED'&&id(mapping.approvalReference)&&mapping.institutionId===p.institutionId&&!mapping.revokedAt&&Date.parse(mapping.validFrom)<=Date.parse(s.now)&&Date.parse(s.now)<Date.parse(mapping.validUntil)&&mapping.targetProgramme===c.programme&&['BCA','BBA','BIT','Civil Engineering'].includes(mapping.targetProgramme)&&['Course project','SDG project','Workshop','Seminar','Field activity'].includes(mapping.targetType),'APPROVED_EXECUTION_MAPPING_REQUIRED');
 return mapping;
}
export async function teamHandoffDraftPlan(s,request){
 check(reference(request),'INVALID_TEAM_HANDOFF_REFERENCE');await validateReviewedTeamSource(s,request,{allowFinalized:true});
 const r=s.workspace.data.activityIntakes.find(r=>r.id===request.proposalId),f=r.teamFirstReviews.at(-1),d=currentTeamFinalReview(r,f),a=r.mentorAssignments?.at(-1),c=r.submissions.at(-1).content,p=f.team.rounds.at(-1).proposal;
 check(d?.decision==='APPROVED'&&d.id===request.finalDecisionId&&d.version===request.finalDecisionVersion&&d.sourceDigest===await finalReviewPrerequisiteDigest(r,f),'CURRENT_FINAL_APPROVAL_REQUIRED');
 const readiness=await readConsistentTeamApprovalReadiness({first:s,second:s,proposalId:r.id});check(readiness.status==='FINAL_APPROVED'&&!readiness.issues.length&&readiness.mentorStatus==='ACCEPTED','CURRENT_HANDOFF_PREREQUISITES_REQUIRED');
 const grants=[teamActivityAuthority(s,r,f,'ACTIVITY_HANDOFF')],mapping=teamActivityMapping(s,r,f);
 const alias=person=>{const keys=Object.keys(s.identity.personMap).filter(k=>s.identity.personMap[k]===person);check(s.activePersonIds.includes(person)&&keys.length===1&&id(keys[0]),'UNIQUE_ACTIVE_EXECUTION_ACCOUNT_REQUIRED');return keys[0]};
 const members=f.team.rounds.at(-1).invitations.map(i=>alias(i.source.personId));check(members.includes(r.student)&&alias(f.by)===r.student&&id(a.mentor)&&s.activePersonIds.includes(s.identity.personMap[a.mentor]),'UNCHANGED_TEAM_AND_MENTOR_REQUIRED');
 check(Array.isArray(s.workspace.data.projects)&&!r.projectId&&!r.teamHandoff&&!r.individualHandoff&&!s.workspace.data.projects.some(p=>p.teamIntakeProvenance?.intakeId===r.id||p.intakeProvenance?.intakeId===r.id),'TEAM_HANDOFF_ALREADY_RECORDED');
 check(typeof c.title==='string'&&c.title.trim().length>0&&c.title.length<=120&&typeof c.purpose==='string'&&c.purpose.trim().length>0&&c.purpose.length<=5000&&/^\d{4}-\d{2}-\d{2}$/.test(c.due)&&Number.isFinite(Date.parse(c.due))&&new Date(c.due).toISOString().slice(0,10)===c.due,'VALID_EXECUTION_DRAFT_CONTENT_REQUIRED');
 const sourceDigest=d.sourceDigest,authority={id:grants[0].id,version:grants[0].version},mappingRef={id:mapping.id,version:mapping.version};
 const draft={title:c.title,description:c.purpose,programme:mapping.targetProgramme,type:mapping.targetType,due:c.due,owner:r.student,mentor:a.mentor,members,planningMetadata:{semester:c.semester||null,course:c.course||null,start:c.start,output:c.outputs,sdgs:[...(c.sdgs||[])],sourceProgramme:c.programme,sourceType:c.type,sourceKind:p.kind}};
 const previewToken=await hash({workspaceId:s.workspace.id,workspaceRevision:s.workspace.revision,reference:request,final:d,sourceDigest,authority:grants[0],mapping,draft});
 return {r,f,d,draft,sourceDigest,authority,mapping:mappingRef,preview:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,finalDecisionId:d.id,finalDecisionVersion:d.version,previewToken,draft,canCreate:true,executionAuthorized:false}};
}
export async function readConsistentTeamHandoffDraft({first,second,request}){
 const a=await teamHandoffDraftPlan(first,request),b=await teamHandoffDraftPlan(second,request);check(fingerprint(first)===fingerprint(second)&&canonical(a.preview)===canonical(b.preview),'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');return b.preview;
}
async function stage(input,request,projectId){
 const s=structuredClone(input);check(s.workspace.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 const reference=Object.fromEntries(['proposalId','firstReviewId','submissionVersion','finalDecisionId','finalDecisionVersion'].map(k=>[k,request[k]])),plan=await teamHandoffDraftPlan(s,reference);check(request.previewToken===plan.preview.previewToken,'HANDOFF_PREVIEW_CHANGED_BEFORE_SAVE');
 const {r,f,d,draft,sourceDigest,authority,mapping}=plan,data=s.workspace.data;check(!data.projects.some(p=>p.id===projectId),'UNIQUE_ACTIVITY_ID_REQUIRED');
 const provenance={intakeId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,finalDecisionId:d.id,finalDecisionVersion:d.version,sourceDigest,authority,mapping,by:s.actorId,at:s.now};
 const project={id:projectId,...draft,state:'CREATED',createdBy:s.actorId,sdg:draft.planningMetadata.sdgs[0]||'',tasks:[],evidence:[],reflections:{},evaluations:{},certs:{},published:{},messages:[],history:[],teamIntakeProvenance:provenance};data.projects.push(project);r.projectId=projectId;r.teamHandoff={version:1,projectId,firstReviewId:f.id,submissionVersion:f.submissionVersion,finalDecisionId:d.id,finalDecisionVersion:d.version,sourceDigest,members:[...draft.members],programme:draft.programme,type:draft.type,by:s.actorId,at:s.now,reason:request.reason.trim()};
 const event={time:s.now,actor:'Authorized team activity handoff',action:'Approved team handed off to draft '+projectId,project:r.id};r.history.unshift(event);project.history.unshift({...event,project:projectId});data.audit.unshift(event);const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 return {payload,fingerprint:fingerprint(input),workspaceId:s.workspace.id,revisionBefore:s.workspace.revision,subject:s.subject,actor:s.identity.principal.personId,institutionId:s.identity.principal.tenantId,now:s.now,response:{proposalId:r.id,firstReviewId:f.id,submissionVersion:f.submissionVersion,projectId,state:'CREATED',workspaceRevision:s.workspace.revision+1,executionAuthorized:false}};
}
export async function saveIntakeTeamHandoffDraft({db,loadTrusted,request}){
 const keys=['proposalId','firstReviewId','submissionVersion','finalDecisionId','finalDecisionVersion','previewToken','reason','confirm','expectedWorkspaceRevision'];
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');check(request&&Object.keys(request).length===keys.length&&keys.every(k=>Object.hasOwn(request,k))&&reference(request)&&typeof request.previewToken==='string'&&/^[a-f0-9]{64}$/.test(request.previewToken)&&request.confirm===true&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&typeof request.reason==='string'&&request.reason.trim().length>0&&request.reason.trim().length<=2000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(request.reason),'INVALID_TEAM_HANDOFF_REQUEST');
 const command=structuredClone(request),projectId=crypto.randomUUID(),first=await stage(await loadTrusted(),command,projectId),next=await stage(await loadTrusted(),command,projectId);check(first.fingerprint===next.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=next.revisionBefore+1,record=formatAuditRecordMetadata({correlationId:commitId,workspaceId:next.workspaceId,actorId:next.actor,action:'handoffIntakeTeamDraft',occurredAt:next.now,institutionId:next.institutionId,workspaceRevisionBefore:next.revisionBefore,workspaceRevisionAfter:revision,mapping:'MAPPED',record:{type:'ACTIVITY',id:projectId,versionBefore:null,versionAfter:null,stateBefore:null,stateAfter:'CREATED'},reason:{status:'REFERENCED',reference:{recordType:'INTAKE_TEAM_HANDOFF',recordId:command.proposalId,recordVersion:1,field:'reason'}}});
 const results=await db.batch([db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(next.payload,revision,commitId,next.now,next.workspaceId,next.revisionBefore),db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,next.workspaceId,revision,next.subject,next.actor,'handoffIntakeTeamDraft',record,next.now,next.workspaceId,commitId)]);check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return next.response;
}
