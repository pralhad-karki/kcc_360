// Isolated D1-compatible save seam. No live route or engine command imports it.
// loadTrusted authenticates and reloads proposal, workspace, roster and authority server-side.
import {normalizeExistingIntakePilot} from './intake-normalization-pilot.mjs';
import {resolveIntakeSourceContext} from './intake-source-adapter.mjs';
import {createTeamInvitationsPilot,respondTeamInvitationPilot,reviseTeamInvitationsPilot} from './team-invitations-pilot.mjs';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const check=(v,m)=>{if(!v)throw Error(m)};
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))))).map(v=>v.toString(16).padStart(2,'0')).join('');
async function stage(request,input){
 check(exact(request,['proposalId','action','expectedWorkspaceRevision','expectedTeamRevision','fields'])&&id(request.proposalId)&&['CREATE','REVISE','RESPOND'].includes(request.action)&&Number.isSafeInteger(request.expectedWorkspaceRevision)&&request.expectedWorkspaceRevision>=0&&Number.isSafeInteger(request.expectedTeamRevision)&&request.expectedTeamRevision>=0,'INVALID_TEAM_SAVE_REQUEST');
 check(exact(request.fields,request.action==='RESPOND'?['studentId','decision']:['memberIds']),'UNAPPROVED_TEAM_SAVE_FIELDS');
 if(request.action==='RESPOND')check(id(request.fields.studentId)&&['ACCEPTED','DECLINED','WITHDRAWN','CANCELLED'].includes(request.fields.decision),'INVALID_TEAM_RESPONSE');
 const loaded=structuredClone(input),w=loaded.workspace;check(w&&id(w.id)&&Number.isSafeInteger(w.revision)&&object(w.data)&&Array.isArray(w.data.activityIntakes)&&id(loaded.subject),'TRUSTED_WORKSPACE_REQUIRED');
 check(w.revision===request.expectedWorkspaceRevision,'WORKSPACE_REVISION_CONFLICT');
 const matches=w.data.activityIntakes.filter(r=>r.id===request.proposalId);check(matches.length===1,'UNIQUE_INTAKE_REQUIRED');const intake=matches[0],team=intake.teamInvitationsPilot??null;
 // Normalization belongs to the future trusted loader. The pilot descriptor must
 // be stored on the same intake snapshot; request fields cannot supply it.
 check(intake.teamPilotSource&&canonical(loaded.proposal)===canonical(intake.teamPilotSource)&&loaded.proposal.id===request.proposalId&&loaded.proposal.version===intake.revision,'TRUSTED_PROPOSAL_BINDING_REQUIRED');
 const purpose=request.action==='RESPOND'&&request.fields.decision!=='CANCELLED'?'INVITATION_RESPONSE':'TEAM_MANAGEMENT';
 const context=resolveIntakeSourceContext({...loaded,team,purpose});check(context.ok,context.reason);
 check((team?.revision||0)===request.expectedTeamRevision,'TEAM_REVISION_CONFLICT');const ctx=context.serverContext;
 let next;
 if(request.action==='CREATE'){check(!team&&request.expectedTeamRevision===0,'TEAM_ALREADY_EXISTS');next=createTeamInvitationsPilot({...ctx,memberIds:request.fields.memberIds})}
 else if(request.action==='REVISE'){check(team,'TEAM_REQUIRED');next=reviseTeamInvitationsPilot(team,{...ctx,memberIds:request.fields.memberIds,expectedRevision:request.expectedTeamRevision})}
 else{check(team,'TEAM_REQUIRED');next=respondTeamInvitationPilot(team,{...ctx,...request.fields,expectedRevision:request.expectedTeamRevision})}
 const {now:contextTime,...boundContext}=ctx;
 const fingerprint=await digest({sources:context.sources,context:boundContext,normalization:loaded.normalizationMapping??null,subject:loaded.subject,workspaceId:w.id,workspaceRevision:w.revision});
 const data=structuredClone(w.data),target=data.activityIntakes.find(r=>r.id===request.proposalId);target.teamInvitationsPilot=next;
 const payload=JSON.stringify(data);check(payload.length<=2_000_000,'WORKSPACE_SIZE_LIMIT');
 const latest=next.rounds.at(-1),own=purpose==='INVITATION_RESPONSE'?latest.invitations.find(i=>i.source.personId===ctx.actorPersonId):null;
 const response={ok:true,proposalId:request.proposalId,teamRevision:next.revision,teamVersion:latest.version,workspaceRevision:w.revision+1,...(own?{ownInvitation:{studentId:own.source.studentId,state:own.state,version:own.version}}:{counts:Object.fromEntries(['PENDING','ACCEPTED','DECLINED','WITHDRAWN','CANCELLED'].map(state=>[state,latest.invitations.filter(i=>i.state===state).length]))})};
 const audit={format:'TEAM_INVITATION_SAVE_PILOT',proposalId:request.proposalId,action:request.action,teamRevisionBefore:team?.revision||0,teamRevisionAfter:next.revision,teamVersion:latest.version,actorPersonId:ctx.actorPersonId,...(own?{studentId:own.source.studentId,decision:own.state}:request.action==='RESPOND'?{studentId:request.fields.studentId,decision:request.fields.decision}:{}),sources:context.sources,normalization:loaded.normalizationMapping??null};
 return {fingerprint,payload,response,audit,workspaceId:w.id,expectedRevision:w.revision,subject:loaded.subject,actor:ctx.actorPersonId,now:ctx.now};
}
export async function saveTeamInvitationIsolated({db,loadTrusted,request}){
 check(db&&typeof db.prepare==='function'&&typeof db.batch==='function'&&typeof loadTrusted==='function','TRUSTED_SAVE_DEPENDENCIES_REQUIRED');
 const command=structuredClone(request),first=await stage(command,await loadTrusted()),prepared=await stage(command,await loadTrusted());check(first.fingerprint===prepared.fingerprint,'SOURCE_OR_AUTHORITY_CHANGED_BEFORE_SAVE');
 const commitId=crypto.randomUUID(),revision=prepared.response.workspaceRevision;
 const results=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(prepared.payload,revision,commitId,prepared.now,prepared.workspaceId,prepared.expectedRevision),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,prepared.workspaceId,revision,prepared.subject,prepared.actor,'TEAM_INVITATION_PILOT.'+command.action,JSON.stringify(prepared.audit),prepared.now,prepared.workspaceId,commitId)
 ]);
 check(results[0]?.meta?.changes===1,'WORKSPACE_REVISION_CONFLICT');check(results[1]?.meta?.changes===1,'AUDIT_NOT_COMMITTED');return prepared.response;
}

// Preferred actual-intake entry point. Normalization is mandatory here; the older
// low-level function remains only for its existing isolated descriptor fixtures.
export async function saveNormalizedTeamInvitationIsolated({db,loadTrusted,request}){
 check(typeof loadTrusted==='function'&&id(request?.proposalId),'TRUSTED_NORMALIZED_LOADER_REQUIRED');
 const command=structuredClone(request);
 return saveTeamInvitationIsolated({db,request:command,loadTrusted:async()=>{
  const loaded=structuredClone(await loadTrusted());
  const rows=loaded.workspace?.data?.activityIntakes;
  check(Array.isArray(rows),'TRUSTED_WORKSPACE_REQUIRED');
  const matches=rows.filter(r=>r.id===command.proposalId);check(matches.length===1,'UNIQUE_INTAKE_REQUIRED');
  const intake=matches[0],normalized=normalizeExistingIntakePilot({configuration:loaded.normalizationConfiguration,intake,identity:loaded.identity,roster:loaded.roster,academicMasters:loaded.academicMasters,now:loaded.now});
  check(normalized.ok,normalized.reason);
  // Only detached server-derived metadata is added. The source record's actor,
  // content, revision, submitted versions and historical decisions stay intact.
  intake.teamPilotSource=normalized.proposal;
  return {...loaded,proposal:normalized.proposal,normalizationMapping:normalized.mapping};
 }});
}
