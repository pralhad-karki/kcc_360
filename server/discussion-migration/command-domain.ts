import {DiscussionConflictError,DiscussionNotFoundError,DiscussionValidationError,canonicalJson,jsonObject,requireId,restoreDiscussion} from './domain';
import type {Json,JsonObject,DiscussionSnapshot} from './domain';

// Language-neutral inputs. Actor, permissions and project scope are supplied by
// trusted application ports, never by a command payload.
export type DiscussionCommand =
 | {kind:'POST';text:string}
 | {kind:'REPLY';text:string;threadRef:string;expectedVersion:number;expectedCount:number}
 | {kind:'SET_STATE';reason:string;threadRef:string;state:'OPEN'|'RESOLVED';expectedVersion:number;expectedCount:number};

export function validateDiscussionCommand(value:unknown):DiscussionCommand {
 const c=jsonObject(value);
 const keys={POST:'kind,text',REPLY:'expectedCount,expectedVersion,kind,text,threadRef',SET_STATE:'expectedCount,expectedVersion,kind,reason,state,threadRef'};
 if(typeof c.kind!=='string'||!Object.hasOwn(keys,c.kind)||Object.keys(c).sort().join(',')!==keys[c.kind as keyof typeof keys])throw new DiscussionValidationError('Exact discussion command fields required.');
 const text=c.kind==='SET_STATE'?c.reason:c.text,max=c.kind==='SET_STATE'?1000:4000;
 if(typeof text!=='string'||!text.trim()||text.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text))throw new DiscussionValidationError('Valid discussion text required.');
 if(c.kind!=='POST'){
  requireId(c.threadRef);
  if(!Number.isSafeInteger(c.expectedVersion)||Number(c.expectedVersion)<0||!Number.isSafeInteger(c.expectedCount)||Number(c.expectedCount)<0)throw new DiscussionValidationError('Current thread version and message count required.');
  if(c.kind==='SET_STATE'&&!['OPEN','RESOLVED'].includes(String(c.state)))throw new DiscussionValidationError('Valid discussion state required.');
 }
 return c as unknown as DiscussionCommand;
}

export function discussionProject(workspace:JsonObject,projectId:string):JsonObject {
 requireId(projectId);
 const projects=Array.isArray(workspace.projects)?workspace.projects.filter(p=>p!==null&&typeof p==='object'&&!Array.isArray(p)&&p.id===projectId):[];
 if(projects.length!==1)throw new DiscussionNotFoundError('Unique discussion project required.');
 return jsonObject(projects[0]);
}

// Internal materialization only. Never apply a historical copy over a newer
// canonical source; the application must first verify digests and revision fences.
export function materializeDiscussion(workspace:JsonObject,snapshot:DiscussionSnapshot):JsonObject {
 const result=jsonObject(workspace),project=discussionProject(result,snapshot.projectId),restored=restoreDiscussion(project,snapshot);
 if(canonicalJson(project)!==canonicalJson(restored))throw new DiscussionConflictError('Staged discussion differs from the canonical source.');
 result.projects=(result.projects as Json[]).map(p=>p!==null&&typeof p==='object'&&!Array.isArray(p)&&p.id===snapshot.projectId?restored:p);
 return result;
}

export function changedFields(before:JsonObject,after:JsonObject):string[] {
 return [...new Set([...Object.keys(before),...Object.keys(after)])].sort().filter(k=>Object.hasOwn(before,k)!==Object.hasOwn(after,k)||(Object.hasOwn(before,k)&&canonicalJson(before[k])!==canonicalJson(after[k])));
}
