import {DiscussionAccessError,DiscussionConflictError,DiscussionStorageError,DiscussionValidationError,canonicalJson,jsonObject,requireId} from './domain';
import {validateDiscussionCommand} from './command-domain';
import {constrainDiscussionEffects,applyDiscussionEffects} from './effect-domain';
import {DiscussionCommandRehearsalService} from './command-application';
import type {DiscussionEffects} from './effect-domain';
import type {DiscussionMigrationRepository,DiscussionWorkspaceReader,MigrationAuthorityPort,MigrationAuthority,DigestPort,RevisionFence} from './ports';
import type {DiscussionTransitionPort} from './command-ports';
export interface AtomicDiscussionReceipt {
 schema:'KCC360_DISCUSSION_ATOMIC_REHEARSAL_V1';operationId:string;subject:string;actor:string;projectId:string;requestDigest:string;sourceFence:RevisionFence;authorityFence:RevisionFence;stagedRevision:number;occurredAt:string;beforeDigest:string;afterDigest:string;effects:DiscussionEffects;digest:string;
}
export interface AtomicDiscussionRepository {
 find(key:string):Promise<AtomicDiscussionReceipt|null>;
 assertFence(fence:RevisionFence):Promise<void>;
 append(key:string,receipt:AtomicDiscussionReceipt):Promise<boolean>;
}
const validFence=(f:RevisionFence)=>{requireId(f?.recordId);if(!Number.isSafeInteger(f.revision)||f.revision<0)throw new DiscussionAccessError('Current rehearsal authority required.');};
export async function validateAtomicReceipt(value:unknown,digest:DigestPort):Promise<AtomicDiscussionReceipt>{
 try{
  const r=jsonObject(value) as unknown as AtomicDiscussionReceipt;
  if(Object.keys(r).sort().join(',')!=='actor,afterDigest,authorityFence,beforeDigest,digest,effects,occurredAt,operationId,projectId,requestDigest,schema,sourceFence,stagedRevision,subject'||r.schema!=='KCC360_DISCUSSION_ATOMIC_REHEARSAL_V1')throw Error();
  for(const v of [r.operationId,r.subject,r.actor,r.projectId])requireId(v);validFence(r.sourceFence);validFence(r.authorityFence);
  if(!Number.isSafeInteger(r.stagedRevision)||r.stagedRevision<1||!Number.isFinite(Date.parse(r.occurredAt))||new Date(r.occurredAt).toISOString()!==r.occurredAt||![r.requestDigest,r.beforeDigest,r.afterDigest,r.digest].every(v=>/^[a-f0-9]{64}$/.test(v)))throw Error();
  if(r.effects?.schema!=='KCC360_DISCUSSION_EFFECTS_V1'||r.effects.projectId!==r.projectId||!Array.isArray(r.effects.project)||!Array.isArray(r.effects.workspace))throw Error();
  for(const [list,allowed] of [[r.effects.project,['messages','discussionEvents','history']],[r.effects.workspace,['audit','notificationInbox']]] as const){
   if(new Set(list.map(f=>f.field)).size!==list.length)throw Error();
   for(const f of list)if(!(allowed as readonly string[]).includes(f.field)||Object.keys(f).sort().join(',')!=='after,afterPresent,before,beforePresent,field'||typeof f.beforePresent!=='boolean'||typeof f.afterPresent!=='boolean')throw Error();
  }
  const {digest:stored,...body}=r;if(await digest.sha256(canonicalJson(body))!==stored)throw Error();return r;
 }catch{throw new DiscussionStorageError('Private rehearsal receipt failed integrity validation.');}
}

// Candidate-effect transaction only. No canonical writer, active command route,
// per-project cutover, dispatch or institutional authority provider is installed.
export class DiscussionAtomicRehearsalService {
 constructor(private readonly source:DiscussionWorkspaceReader,private readonly copies:Pick<DiscussionMigrationRepository,'readStaged'>,private readonly authority:MigrationAuthorityPort,private readonly transition:DiscussionTransitionPort,private readonly digest:DigestPort,private readonly repository:AtomicDiscussionRepository,private readonly clock:()=>string,private readonly enabled=false){}
 private async actor(subject:string,projectId:string){requireId(subject);requireId(projectId);const a=await this.authority.authorize(subject,projectId);requireId(a?.actor);validFence(a.fence);return a;}
 private summary(r:AtomicDiscussionReceipt,replayed:boolean){return {available:true as const,mode:'PRIVATE_ATOMIC_REHEARSAL' as const,replayed,operationId:r.operationId,projectId:r.projectId,sourceFence:r.sourceFence,stagedRevision:r.stagedRevision,beforeDigest:r.beforeDigest,afterDigest:r.afterDigest,receiptDigest:r.digest,discussionChanged:r.effects.project.some(f=>f.field!=='history'),workspaceChanged:r.beforeDigest!==r.afterDigest,sourcePreserved:true as const};}
 private async replay(key:string,requestDigest:string,sourceId:string,a:MigrationAuthority,subject:string,projectId:string){
  const value=await this.repository.find(key);if(!value)return null;const r=await validateAtomicReceipt(value,this.digest);
  if(key!=='KCC-DISCUSSION-REHEARSAL:'+await this.digest.sha256(canonicalJson([r.sourceFence.recordId,r.operationId]))||r.requestDigest!==requestDigest||r.sourceFence.recordId!==sourceId||r.subject!==subject||r.actor!==a.actor||r.projectId!==projectId)throw new DiscussionConflictError('Rehearsal operation identity changed.');
  const again=await this.actor(subject,projectId);if(canonicalJson(a)!==canonicalJson(again))throw new DiscussionConflictError('Rehearsal authority changed.');await this.repository.assertFence(a.fence);return this.summary(r,true);
 }
 async commit(subject:string,input:unknown){
  if(!this.enabled)return {available:false as const};
  const request=jsonObject(input);if(Object.keys(request).sort().join(',')!=='command,operationId,projectId')throw new DiscussionValidationError('Exact atomic rehearsal fields required.');
  requireId(request.projectId);requireId(request.operationId);const projectId=request.projectId,operationId=request.operationId,command=validateDiscussionCommand(request.command),a=await this.actor(subject,projectId),source=await this.source.readWorkspace();validFence(source.fence);
  const key='KCC-DISCUSSION-REHEARSAL:'+await this.digest.sha256(canonicalJson([source.fence.recordId,operationId])),requestDigest=await this.digest.sha256(canonicalJson([subject,a.actor,projectId,command]));
  const replay=await this.replay(key,requestDigest,source.fence.recordId,a,subject,projectId);if(replay)return replay;
  let captured:DiscussionEffects|undefined;
  const transition:DiscussionTransitionPort={run:async(workspace,actor,id,cmd)=>{
   if(actor!==a.actor)throw new DiscussionConflictError('Rehearsal actor changed.');
   const before=jsonObject(workspace),after=await this.transition.run(jsonObject(before),actor,id,cmd);
   captured=constrainDiscussionEffects(before,after,id,actor,cmd);
   if(canonicalJson(applyDiscussionEffects(before,captured))!==canonicalJson(after))throw new DiscussionValidationError('Lossless effect reconstruction failed.');return after;
  }};
  const preview=await new DiscussionCommandRehearsalService(this.source,this.copies,this.authority,transition,this.digest,true).preview(subject,{projectId,command});
  if(!preview.available||!captured||canonicalJson(preview.sourceFence)!==canonicalJson(source.fence))throw new DiscussionConflictError('Rehearsal source changed.');
  const again=await this.actor(subject,projectId);if(canonicalJson(a)!==canonicalJson(again))throw new DiscussionConflictError('Rehearsal authority changed.');
  const occurredAt=this.clock();if(!Number.isFinite(Date.parse(occurredAt))||new Date(occurredAt).toISOString()!==occurredAt)throw new DiscussionValidationError('Explicit UTC rehearsal clock required.');
  const body={schema:'KCC360_DISCUSSION_ATOMIC_REHEARSAL_V1' as const,operationId,subject,actor:a.actor,projectId,requestDigest,sourceFence:preview.sourceFence,authorityFence:a.fence,stagedRevision:preview.stagedRevision,occurredAt,beforeDigest:preview.beforeDigest,afterDigest:preview.afterDigest,effects:captured};
  const receipt={...body,digest:await this.digest.sha256(canonicalJson(body))};
  const inserted=await this.repository.append(key,receipt);
  if(!inserted){const concurrent=await this.replay(key,requestDigest,source.fence.recordId,a,subject,projectId);if(concurrent)return concurrent;throw new DiscussionConflictError('Rehearsal source, copy or authority changed.');}
  // Resolves acknowledged and concurrently observed receipts identically. A lost
  // driver acknowledgement is resolved by a later authorized retry, not rerun.
  return this.summary(receipt,false);
 }
}
