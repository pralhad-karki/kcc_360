// Domain/serialization boundary: no framework, driver, ORM or HTTP imports.
export class DiscussionValidationError extends Error {readonly code='DISCUSSION_INVALID_DATA'}
export class DiscussionConflictError extends Error {readonly code='DISCUSSION_CONFLICT'}
export class DiscussionAccessError extends Error {readonly code='DISCUSSION_ACCESS_DENIED'}
export class DiscussionNotFoundError extends Error {readonly code='DISCUSSION_NOT_FOUND'}
export class DiscussionStorageError extends Error {readonly code='DISCUSSION_STORAGE_UNAVAILABLE'}
export type Json = null | boolean | number | string | Json[] | {[key:string]:Json};
export type JsonObject = {[key:string]:Json};
export interface DiscussionSnapshot {projectId:string;messages:JsonObject[];eventsPresent:boolean;events:JsonObject[]}
export function requireId(value:unknown):asserts value is string {if(typeof value!=='string'||!value.trim()||value.trim()!==value||value.length>150||/[\u0000-\u001f\u007f]/.test(value))throw new DiscussionValidationError('Invalid identifier.')}
export function copyJson(value:unknown,depth=0):Json {
 if(depth>40)throw new DiscussionValidationError('JSON nesting limit exceeded.');
 if(value===null||typeof value==='string'||typeof value==='boolean')return value;
 if(typeof value==='number'&&Number.isFinite(value))return value;
 if(Array.isArray(value))return value.map(v=>copyJson(v,depth+1));
 if(value&&typeof value==='object'&&[Object.prototype,null].includes(Object.getPrototypeOf(value)))return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,copyJson(v,depth+1)]));
 throw new DiscussionValidationError('Only lossless JSON values are supported.');
}
export function jsonObject(value:unknown):JsonObject {const v=copyJson(value);if(v===null||typeof v!=='object'||Array.isArray(v))throw new DiscussionValidationError('Object required.');return v}
export function canonicalJson(value:unknown):string {const sort=(v:Json):Json=>v===null||typeof v!=='object'?v:Array.isArray(v)?v.map(sort):Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]));return JSON.stringify(sort(copyJson(value)))}
export function extractDiscussion(project:unknown):DiscussionSnapshot {
 const p=jsonObject(project);requireId(p.id);
 if(!Array.isArray(p.messages)||!p.messages.every(m=>m!==null&&typeof m==='object'&&!Array.isArray(m)))throw new DiscussionValidationError('Message array required.');
 const present=Object.hasOwn(p,'discussionEvents'),events=present?p.discussionEvents:[];
 if(!Array.isArray(events)||!events.every(m=>m!==null&&typeof m==='object'&&!Array.isArray(m)))throw new DiscussionValidationError('Event array required.');
 // Preserve order, optional-field absence, unknown metadata and legacy messages
 // without IDs. Assigning new IDs would change existing legacy thread references.
 return {projectId:p.id,messages:p.messages as JsonObject[],eventsPresent:present,events:events as JsonObject[]};
}
export function restoreDiscussion(project:unknown,snapshot:DiscussionSnapshot):JsonObject {
 const p=jsonObject(project);snapshot=validateSnapshot(snapshot);if(p.id!==snapshot.projectId)throw new DiscussionConflictError('Project identity changed.');
 const checked=extractDiscussion({id:snapshot.projectId,messages:snapshot.messages,...(snapshot.eventsPresent?{discussionEvents:snapshot.events}:{})});
 p.messages=checked.messages;if(checked.eventsPresent)p.discussionEvents=checked.events;else delete p.discussionEvents;return p;
}
export function validateSnapshot(value:unknown):DiscussionSnapshot {
 const s=jsonObject(value);
 if(Object.keys(s).sort().join(',')!=='events,eventsPresent,messages,projectId'||typeof s.eventsPresent!=='boolean'||!Array.isArray(s.events)||(!s.eventsPresent&&s.events.length))throw new DiscussionValidationError('Invalid discussion snapshot.');
 const checked=extractDiscussion({id:s.projectId,messages:s.messages,...(s.eventsPresent?{discussionEvents:s.events}:{})});return checked;
}
