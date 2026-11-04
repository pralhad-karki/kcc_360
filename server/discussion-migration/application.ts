import {canonicalJson,extractDiscussion,restoreDiscussion,requireId,DiscussionAccessError,DiscussionConflictError,DiscussionValidationError} from './domain';
import type {DiscussionMigrationRepository,MigrationAuthorityPort,DigestPort,MigrationAuthority} from './ports';
export class DiscussionMigrationService {
 constructor(private readonly repository:DiscussionMigrationRepository,private readonly authority:MigrationAuthorityPort,private readonly digest:DigestPort,private readonly clock:()=>string,private readonly enabled=false){}
 private async actor(subject:string,projectId:string):Promise<MigrationAuthority>{requireId(subject);requireId(projectId);const a=await this.authority.authorize(subject,projectId);if(!a?.fence)throw new DiscussionAccessError('Migration permission and current authority fence required.');requireId(a.actor);requireId(a.fence.recordId);if(!Number.isSafeInteger(a.fence.revision)||a.fence.revision<0)throw new DiscussionAccessError('Current authority fence required.');return a}
 async inspect(subject:string,projectId:string){
  if(!this.enabled)return {available:false as const};const a=await this.actor(subject,projectId),source=await this.repository.readLegacy(projectId),snapshot=extractDiscussion(source.project);
  const sourceDigest=await this.digest.sha256(canonicalJson(source.project)),discussionDigest=await this.digest.sha256(canonicalJson(snapshot));
  if(canonicalJson(restoreDiscussion(source.project,snapshot))!==canonicalJson(source.project))throw new DiscussionValidationError('Lossless reconstruction failed.');
  const staged=await this.repository.readStaged(projectId),again=await this.actor(subject,projectId);if(staged&&await this.digest.sha256(canonicalJson(staged.snapshot))!==staged.discussionDigest)throw new DiscussionConflictError('Staged content integrity failed.');if(canonicalJson(a)!==canonicalJson(again))throw new DiscussionConflictError('Authority changed during inspection.');
  return {available:true as const,projectId,sourceDigest,discussionDigest,sourceFence:source.fence,authority:a,expectedRevision:staged?.revision??0,messageCount:snapshot.messages.length,eventCount:snapshot.events.length};
 }
 async stage(subject:string,input:{projectId:string;operationId:string;expectedRevision:number;sourceDigest:string;discussionDigest:string;sourceFence:{recordId:string;revision:number}}){
  if(!this.enabled)return {available:false as const};if(!input||Object.keys(input).sort().join(',')!=='discussionDigest,expectedRevision,operationId,projectId,sourceDigest,sourceFence')throw new DiscussionValidationError('Exact staging fields required.');requireId(input.projectId);requireId(input.operationId);
  if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision<0||typeof input.sourceDigest!=='string'||typeof input.discussionDigest!=='string'||!/^[a-f0-9]{64}$/.test(input.sourceDigest)||!/^[a-f0-9]{64}$/.test(input.discussionDigest))throw new DiscussionValidationError('Exact inspection binding required.');
  const a=await this.actor(subject,input.projectId),old=await this.repository.readStaged(input.projectId);
  if(old&&await this.digest.sha256(canonicalJson(old.snapshot))!==old.discussionDigest)throw new DiscussionConflictError('Staged content integrity failed.');
  if(old?.operationId===input.operationId){if(old.subject!==subject||old.actor!==a.actor||old.sourceDigest!==input.sourceDigest||old.discussionDigest!==input.discussionDigest||old.revision!==input.expectedRevision+1||canonicalJson(old.sourceFence)!==canonicalJson(input.sourceFence))throw new DiscussionConflictError('Operation identity conflict.');return {available:true as const,revision:old.revision,replayed:true}}
  if((old?.revision??0)!==input.expectedRevision)throw new DiscussionConflictError('Staged version changed.');
  const source=await this.repository.readLegacy(input.projectId),snapshot=extractDiscussion(source.project);
  if(canonicalJson(source.fence)!==canonicalJson(input.sourceFence)||await this.digest.sha256(canonicalJson(source.project))!==input.sourceDigest||await this.digest.sha256(canonicalJson(snapshot))!==input.discussionDigest)throw new DiscussionConflictError('Legacy source changed.');
  const current=await this.actor(subject,input.projectId);if(canonicalJson(a)!==canonicalJson(current))throw new DiscussionConflictError('Authority changed.');
  const time=this.clock();if(!Number.isFinite(Date.parse(time))||new Date(time).toISOString()!==time)throw new DiscussionValidationError('Explicit UTC clock required.');
  await this.repository.saveStage({projectId:input.projectId,expectedRevision:input.expectedRevision,document:{format:1,revision:input.expectedRevision+1,operationId:input.operationId,subject,actor:a.actor,occurredAt:time,sourceDigest:input.sourceDigest,discussionDigest:input.discussionDigest,sourceFence:source.fence,snapshot},fences:[source.fence,a.fence]});
  return {available:true as const,revision:input.expectedRevision+1,replayed:false};
 }
}
