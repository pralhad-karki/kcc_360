// Server-only directory projection. Receives freshly loaded trusted snapshots, never client identity/roster.
import {normalizeExistingIntakePilot} from './intake-normalization-pilot.mjs';
import {resolveIntakeSourceContext} from './intake-source-adapter.mjs';
import {searchStudentDirectoryPilot} from './student-directory-pilot.mjs';
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
function context(input,proposalId){
 const matches=input.workspace?.data?.activityIntakes?.filter(r=>r.id===proposalId);if(matches?.length!==1)throw Error('DIRECTORY_UNAVAILABLE');
 const normalized=normalizeExistingIntakePilot({configuration:input.normalizationConfiguration,intake:matches[0],identity:input.identity,roster:input.roster,academicMasters:input.academicMasters,now:input.now});if(!normalized.ok)throw Error('DIRECTORY_UNAVAILABLE');
 const source=resolveIntakeSourceContext({...input,proposal:normalized.proposal,purpose:'DIRECTORY'});if(!source.ok)throw Error('DIRECTORY_UNAVAILABLE');
 const {now,...authorityContext}=source.serverContext;
 return {serverContext:source.serverContext,binding:{workspaceId:input.workspace.id,workspaceRevision:input.workspace.revision,actorId:input.actorId,subject:input.subject,authorizationVersion:input.identity.authorizationVersion,mapping:normalized.mapping,sources:source.sources,authorityContext}};
}
export function readNormalizedStudentDirectory({first,second,proposalId,query,filters,offset,limit}){
 const a=context(first,proposalId),b=context(second,proposalId);
 if(canonical(a.binding)!==canonical(b.binding))throw Error('SOURCE_CHANGED_BEFORE_SAVE');
 // Exact minimal projection only; no raw context, identity, grants, fees or results.
 return searchStudentDirectoryPilot({...b.serverContext,query,filters,offset,limit});
}
