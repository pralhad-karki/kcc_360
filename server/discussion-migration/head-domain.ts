import {canonicalJson,jsonObject,requireId,DiscussionStorageError,DiscussionConflictError,DiscussionValidationError} from './domain';
import {applyDiscussionEffects} from './effect-domain';
import {validateAtomicReceipt} from './atomic-application';
import type {JsonObject} from './domain';
import type {DiscussionEffects} from './effect-domain';
import type {DigestPort,RevisionFence} from './ports';
import type {AtomicDiscussionReceipt} from './atomic-application';
export interface PrivateHeadRow {id:string;revision:number;payload:string;commitId:string;updatedAt:string}
export type Observation={id:string;revision:number;commitId:string}|{id:string;absent:true};
export interface StackEntry {projectId:string;candidateKey:string;candidateDigest:string;operationKey:string;priorCandidateKey:string|null;priorCandidateDigest:string|null}
export interface CandidateHead {schema:'KCC360_DISCUSSION_HEAD_V1';sourceId:string;projectId:string;revision:number;candidateKey:string|null;candidateDigest:string|null;lastOperationKey:string;occurredAt:string;digest:string}
export interface CandidateCoordinator {schema:'KCC360_DISCUSSION_COORDINATOR_V1';revision:number;sourceFence:RevisionFence;sourceDigest:string;virtualDigest:string;stack:StackEntry[];lastOperationKey:string;occurredAt:string;digest:string}
export interface HeadOperation {schema:'KCC360_DISCUSSION_HEAD_OPERATION_V1';sourceId:string;projectId:string;operationId:string;kind:'ADVANCE'|'REVERSE';subject:string;actor:string;requestDigest:string;candidateKey:string;candidateDigest:string;headRevision:number;workspaceRevision:number;beforeDigest:string;afterDigest:string;previousOperationKey:string|null;occurredAt:string;digest:string}
export const MAX_CANDIDATE_DEPTH=8;
export const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function ensure(ok:unknown):asserts ok {if(!ok)throw new DiscussionStorageError('Private candidate-head integrity failed.');}
export function conflict(ok:unknown):asserts ok {if(!ok)throw new DiscussionConflictError('Candidate source, head or shared effects changed.');}
export function utc(v:unknown){return typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;}
export function fence(f:RevisionFence){requireId(f?.recordId);ensure(Number.isSafeInteger(f.revision)&&f.revision>=0&&Object.keys(f).sort().join(',')==='recordId,revision');}
export async function headKeys(d:DigestPort,sourceId:string,projectId:string,operationId?:string){requireId(sourceId);requireId(projectId);if(operationId!==undefined)requireId(operationId);return {head:'KCC-DISCUSSION-HEAD:'+await d.sha256(canonicalJson([sourceId,projectId])),coordinator:'KCC-DISCUSSION-COORDINATOR:'+await d.sha256(canonicalJson([sourceId])),operation:operationId===undefined?'':'KCC-DISCUSSION-HEAD-OP:'+await d.sha256(canonicalJson([sourceId,operationId]))};}
export function candidateKey(v:unknown):asserts v is string {if(typeof v!=='string'||!/^KCC-DISCUSSION-REHEARSAL:[a-f0-9]{64}$/.test(v))throw new DiscussionValidationError('Stored candidate reference required.');}
export async function seal<T extends object>(body:T,d:DigestPort):Promise<T&{digest:string}>{return {...body,digest:await d.sha256(canonicalJson(body))};}
export async function decodePrivate<T>(row:PrivateHeadRow|null,schema:string,keys:string,d:DigestPort):Promise<T|null>{
 if(!row)return null;
 try{const value=jsonObject(JSON.parse(row.payload));ensure(value.schema===schema&&Object.keys(value).sort().join(',')===keys.split(',').sort().join(',')&&utc(value.occurredAt)&&row.updatedAt===value.occurredAt&&Number.isSafeInteger(row.revision)&&row.revision>=1&&typeof row.commitId==='string'&&row.commitId.length>0);const {digest,...body}=value;ensure(hash(digest)&&await d.sha256(canonicalJson(body))===digest);return value as unknown as T;}catch{throw new DiscussionStorageError('Private candidate-head receipt is unavailable or corrupt.');}
}
export async function decodeHead(row:PrivateHeadRow|null,sourceId:string,projectId:string,d:DigestPort){
 const h=await decodePrivate<CandidateHead>(row,'KCC360_DISCUSSION_HEAD_V1','schema,sourceId,projectId,revision,candidateKey,candidateDigest,lastOperationKey,occurredAt,digest',d);if(h){ensure(h.sourceId===sourceId&&h.projectId===projectId&&h.revision===row!.revision);if(h.candidateKey!==null)candidateKey(h.candidateKey);ensure((h.candidateKey===null&&h.candidateDigest===null)||(h.candidateKey!==null&&hash(h.candidateDigest)));ensure(/^KCC-DISCUSSION-HEAD-OP:[a-f0-9]{64}$/.test(h.lastOperationKey));}return h;
}
export async function decodeCoordinator(row:PrivateHeadRow|null,d:DigestPort){
 const c=await decodePrivate<CandidateCoordinator>(row,'KCC360_DISCUSSION_COORDINATOR_V1','schema,revision,sourceFence,sourceDigest,virtualDigest,stack,lastOperationKey,occurredAt,digest',d);if(c){ensure(c.revision===row!.revision&&hash(c.sourceDigest)&&hash(c.virtualDigest)&&Array.isArray(c.stack)&&c.stack.length<=MAX_CANDIDATE_DEPTH);fence(c.sourceFence);ensure(/^KCC-DISCUSSION-HEAD-OP:[a-f0-9]{64}$/.test(c.lastOperationKey));for(const e of c.stack){requireId(e.projectId);candidateKey(e.candidateKey);ensure(Object.keys(e).sort().join(',')==='candidateDigest,candidateKey,operationKey,priorCandidateDigest,priorCandidateKey,projectId'&&hash(e.candidateDigest)&&/^KCC-DISCUSSION-HEAD-OP:[a-f0-9]{64}$/.test(e.operationKey));if(e.priorCandidateKey!==null)candidateKey(e.priorCandidateKey);ensure(e.priorCandidateKey===null?e.priorCandidateDigest===null:hash(e.priorCandidateDigest));}}return c;
}
export async function decodeOperation(row:PrivateHeadRow|null,d:DigestPort){
 const r=await decodePrivate<HeadOperation>(row,'KCC360_DISCUSSION_HEAD_OPERATION_V1','schema,sourceId,projectId,operationId,kind,subject,actor,requestDigest,candidateKey,candidateDigest,headRevision,workspaceRevision,beforeDigest,afterDigest,previousOperationKey,occurredAt,digest',d);if(r){ensure(row!.revision===1);for(const v of [r.sourceId,r.projectId,r.operationId,r.subject,r.actor])requireId(v);candidateKey(r.candidateKey);ensure(['ADVANCE','REVERSE'].includes(r.kind)&&[r.requestDigest,r.candidateDigest,r.beforeDigest,r.afterDigest].every(hash)&&[r.headRevision,r.workspaceRevision].every(v=>Number.isSafeInteger(v)&&v>=1)&&(r.previousOperationKey===null||/^KCC-DISCUSSION-HEAD-OP:[a-f0-9]{64}$/.test(r.previousOperationKey)));}return r;
}
export async function readCandidate(row:PrivateHeadRow|null,key:string,d:DigestPort){
 try{ensure(row&&row.id===key&&row.revision===1);const r=await validateAtomicReceipt(JSON.parse(row.payload),d);ensure(row.updatedAt===r.occurredAt&&key==='KCC-DISCUSSION-REHEARSAL:'+await d.sha256(canonicalJson([r.sourceFence.recordId,r.operationId])));return r;}catch{throw new DiscussionStorageError('Stored discussion candidate failed integrity validation.');}
}
export function reverseEffects(e:DiscussionEffects):DiscussionEffects {const invert=(list:DiscussionEffects['project'])=>list.map(f=>({field:f.field,beforePresent:f.afterPresent,before:f.after,afterPresent:f.beforePresent,after:f.before}));return {schema:e.schema,projectId:e.projectId,project:invert(e.project),workspace:invert(e.workspace)};}
// Internal only: reconstruct exact prospective workspace, retaining all other
// source fields. Full before/after hashes coordinate shared audit and reminders.
export async function materializeCandidateStack(source:JsonObject,sourceFence:RevisionFence,stack:StackEntry[],load:(key:string)=>Promise<AtomicDiscussionReceipt>,d:DigestPort){
 ensure(stack.length<=MAX_CANDIDATE_DEPTH);let current=jsonObject(source);const perProject=new Map<string,StackEntry>();
 for(const e of stack){const r=await load(e.candidateKey),prior=perProject.get(e.projectId);ensure(r.projectId===e.projectId&&r.digest===e.candidateDigest&&canonicalJson(r.sourceFence)===canonicalJson(sourceFence)&&(prior?.candidateKey??null)===e.priorCandidateKey&&(prior?.candidateDigest??null)===e.priorCandidateDigest);conflict(await d.sha256(canonicalJson(current))===r.beforeDigest);current=applyDiscussionEffects(current,r.effects);ensure(await d.sha256(canonicalJson(current))===r.afterDigest);perProject.set(e.projectId,e);}
 return current;
}
