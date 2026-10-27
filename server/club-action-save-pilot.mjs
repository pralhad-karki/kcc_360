// Isolated D1-compatible save pilot. Not imported by any live route/service.
// db and loadTrusted are server-only dependencies. Loader must authenticate and
// freshly load session, authority, configuration, resource, workspace and evidence.
import {prepareClubActionAssignment} from './club-action-assignment-adapter.mjs';
import {createClubActionClosurePilot,transitionClubActionClosurePilot} from './club-action-closure-pilot.mjs';
const fieldsByAction={CREATE:[],SUBMIT:['explanation','evidence'],RETURN:['reason'],VERIFY:['reason']};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&[Object.prototype,null].includes(Object.getPrototypeOf(x));
const exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const stable=x=>JSON.stringify(x===null||typeof x!=='object'?x:Array.isArray(x)?x.map(v=>JSON.parse(stable(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(stable(x[k]))])));
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(value))))).map(v=>v.toString(16).padStart(2,'0')).join('');
function validateRequest(r){
 check(exact(r,['id','closureId','action','expectedWorkspaceRevision','expectedClosureRevision','fields'])&&typeof r.id==='string'&&/^[A-Za-z0-9_-]{8,100}$/.test(r.id)&&typeof r.closureId==='string'&&r.closureId.length>0&&r.closureId.length<=200&&Object.hasOwn(fieldsByAction,r.action)&&Number.isSafeInteger(r.expectedWorkspaceRevision)&&r.expectedWorkspaceRevision>=0&&Number.isSafeInteger(r.expectedClosureRevision)&&r.expectedClosureRevision>=0&&object(r.fields)&&Object.keys(r.fields).every(k=>fieldsByAction[r.action].includes(k)),'INVALID_CLOSURE_REQUEST');
 // Actual command validators enforce required values. Evidence metadata is loaded
 // from the trusted registry, never accepted as a verification assertion here.
 for(const key of ['evidence'])if(Object.hasOwn(r.fields,key))check(Array.isArray(r.fields[key])&&r.fields[key].every(ref=>exact(ref,['id','version'])),'UNTRUSTED_EVIDENCE_FIELDS');
}
async function stage(request,loaded){
 validateRequest(request);check(object(loaded),'TRUSTED_LOADER_REQUIRED');
 const {evidenceRegistry,configuration,...trusted}=loaded;
 check(Array.isArray(evidenceRegistry),'TRUSTED_EVIDENCE_REQUIRED');
 const context=prepareClubActionAssignment(trusted,configuration);check(context.ok,context.reason||'CLOSURE_ACCESS_DENIED');
 check(request.closureId===context.assignment.binding.scope.closureId,'CLOSURE_SCOPE_MISMATCH');
 const rows=trusted.workspace.data.clubActionClosures??[];check(Array.isArray(rows),'INVALID_CLOSURE_STORAGE');
 const fingerprint=await digest({request,personId:context.actorPersonId,assignment:context.assignment});
 const prior=[];for(const review of rows){check(review&&typeof review.id==='string'&&(!Object.hasOwn(review,'operations')||Array.isArray(review.operations)),'INVALID_OPERATION_STORAGE');for(const op of review.operations||[])if(op.id===request.id)prior.push({review,op})}
 check(prior.length<=1,'AMBIGUOUS_REQUEST_RECEIPT');
 if(prior.length){const {review,op}=prior[0];check(typeof op.fingerprint==='string'&&/^[a-f0-9]{64}$/.test(op.fingerprint)&&Number.isSafeInteger(op.closureRevision)&&op.closureRevision>0&&Number.isSafeInteger(op.committedWorkspaceRevision)&&op.committedWorkspaceRevision>0&&op.committedWorkspaceRevision<=trusted.workspace.revision&&['OPEN','SUBMITTED','RETURNED','VERIFIED'].includes(op.state),'INVALID_REQUEST_RECEIPT');check(review.id===request.closureId&&op.fingerprint===fingerprint&&op.byPersonId===context.actorPersonId,'REQUEST_ID_CONFLICT');return {replay:true,response:{ok:true,replayed:true,closureId:review.id,closureRevision:op.closureRevision,state:op.state,committedWorkspaceRevision:op.committedWorkspaceRevision,currentWorkspaceRevision:trusted.workspace.revision},context,fingerprint}}
 check(request.expectedWorkspaceRevision===trusted.workspace.revision,'WORKSPACE_REVISION_CONFLICT');
 const matches=rows.filter(r=>r.id===request.closureId);check(matches.length<=1,'AMBIGUOUS_CLOSURE_RECORD');let review=matches[0];
 const scope=context.assignment.binding.scope,evaluation=trusted.workspace.data.clubEvaluations.find(e=>e.id===scope.evaluationId),actorPersonId=context.actorPersonId,assignment=context.assignment;
 if(request.action==='CREATE'){
  check(!review&&request.expectedClosureRevision===0,'CLOSURE_ALREADY_EXISTS');
  review=createClubActionClosurePilot({id:request.closureId,evaluation,criterionKey:scope.criterionKey,assignment,actorPersonId,now:trusted.now});
 }else{
  check(review&&request.expectedClosureRevision===review.revision,'CLOSURE_REVISION_CONFLICT');
  review=transitionClubActionClosurePilot(review,{action:request.action,fields:request.fields,expectedRevision:request.expectedClosureRevision,now:trusted.now,evaluation,assignment,actorPersonId,evidenceRegistry});
 }
 const data=structuredClone(trusted.workspace.data),committedWorkspaceRevision=trusted.workspace.revision+1;
 review.operations??=[];review.operations.push({id:request.id,fingerprint,byPersonId:actorPersonId,assignmentId:assignment.id,assignmentVersion:assignment.version,committedWorkspaceRevision,closureRevision:review.revision,state:review.state});
 data.clubActionClosures??=[];const index=data.clubActionClosures.findIndex(r=>r.id===request.closureId);if(index<0)data.clubActionClosures.push(review);else data.clubActionClosures[index]=review;
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 const audit={kind:'CLUB_ACTION_CLOSURE_PILOT',requestId:request.id,closureId:review.id,closureRevision:review.revision,evaluationId:scope.evaluationId,evaluationVersion:scope.evaluationVersion,annualVersion:scope.annualVersion,criterionKey:scope.criterionKey,clubId:scope.clubId,cycle:scope.cycle,personId:actorPersonId,assignmentId:assignment.id,assignmentVersion:assignment.version,configurationVersion:assignment.binding.configurationVersion,authorityId:assignment.binding.authorityId,authorityVersion:assignment.binding.authorityVersion,approvalReference:context.provenance.approvalReference,reasonRecorded:!!request.fields.reason};
 return {replay:false,context,fingerprint,payload,audit,subject:trusted.session.subject,now:trusted.now,expectedWorkspaceRevision:trusted.workspace.revision,workspaceId:trusted.workspace.id,response:{ok:true,replayed:false,closureId:review.id,closureRevision:review.revision,state:review.state,committedWorkspaceRevision,currentWorkspaceRevision:committedWorkspaceRevision}};
}
export async function saveClubActionClosureIsolated({db,loadTrusted,request}){
 check(db&&typeof db.prepare==='function'&&typeof db.batch==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 // Clone before awaiting: a caller must not change a queued command underneath a save.
 const command=structuredClone(request),first=await stage(command,await loadTrusted());if(first.replay)return first.response;
 // Rebuild immediately before staging the transaction. Production loaders/CAS must
 // also coordinate policy version changes; this is not a distributed auth lock.
 const prepared=await stage(command,await loadTrusted());if(prepared.replay)return prepared.response;
 check(first.fingerprint===prepared.fingerprint,'AUTHORIZATION_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=prepared.response.committedWorkspaceRevision;
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(prepared.payload,revision,commitId,prepared.now,prepared.workspaceId,prepared.expectedWorkspaceRevision),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,prepared.workspaceId,revision,prepared.subject,prepared.context.actorPersonId,'CLUB_ACTION_CLOSURE.'+command.action,JSON.stringify(prepared.audit),prepared.now,prepared.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return prepared.response;
}
