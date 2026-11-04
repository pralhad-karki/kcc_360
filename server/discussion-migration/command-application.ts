import {DiscussionAccessError,DiscussionConflictError,DiscussionNotFoundError,DiscussionValidationError,canonicalJson,extractDiscussion,jsonObject,requireId} from './domain';
import {changedFields,discussionProject,materializeDiscussion,validateDiscussionCommand} from './command-domain';
import type {DiscussionMigrationRepository,DiscussionWorkspaceReader,MigrationAuthorityPort,MigrationAuthority,DigestPort} from './ports';
import type {DiscussionTransitionPort} from './command-ports';

// Read-only rehearsal. No writer port, commit token, active route or cutover flag.
export class DiscussionCommandRehearsalService {
 constructor(
  private readonly source:DiscussionWorkspaceReader,
  private readonly copies:Pick<DiscussionMigrationRepository,'readStaged'>,
  private readonly authority:MigrationAuthorityPort,
  private readonly transition:DiscussionTransitionPort,
  private readonly digest:DigestPort,
  private readonly enabled=false,
 ){}
 private async actor(subject:string,projectId:string):Promise<MigrationAuthority>{
  requireId(subject);requireId(projectId);
  const a=await this.authority.authorize(subject,projectId);
  if(!a?.fence)throw new DiscussionAccessError('Migration permission and authority fence required.');
  requireId(a.actor);requireId(a.fence.recordId);
  if(!Number.isSafeInteger(a.fence.revision)||a.fence.revision<0)throw new DiscussionAccessError('Current authority fence required.');
  return a;
 }
 async preview(subject:string,input:unknown){
  if(!this.enabled)return {available:false as const};
  const request=jsonObject(input);
  if(Object.keys(request).sort().join(',')!=='command,projectId')throw new DiscussionValidationError('Exact rehearsal fields required.');
  requireId(request.projectId);const projectId=request.projectId,command=validateDiscussionCommand(request.command);
  const a=await this.actor(subject,projectId),source=await this.source.readWorkspace(),project=discussionProject(source.workspace,projectId),copy=await this.copies.readStaged(projectId);
  if(!copy)throw new DiscussionNotFoundError('Stage the current discussion before rehearsal.');
  if(copy.format!==1||!Number.isSafeInteger(copy.revision)||copy.revision<1||canonicalJson(copy.sourceFence)!==canonicalJson(source.fence)||await this.digest.sha256(canonicalJson(project))!==copy.sourceDigest||await this.digest.sha256(canonicalJson(copy.snapshot))!==copy.discussionDigest)throw new DiscussionConflictError('Staged copy is stale or failed integrity validation.');
  if(copy.snapshot.projectId!==projectId)throw new DiscussionConflictError('Staged project identity changed.');
  const materialized=materializeDiscussion(source.workspace,copy.snapshot),before=jsonObject(materialized);
  const after=jsonObject(await this.transition.run(materialized,a.actor,projectId,command));
  const afterProject=discussionProject(after,projectId),again=await this.actor(subject,projectId),current=await this.source.readWorkspace(),currentCopy=await this.copies.readStaged(projectId);
  // Rehearsal summaries are also revision-bound. Do not report an obsolete
  // success when source, copy or access changes while the command is evaluated.
  if(canonicalJson(a)!==canonicalJson(again)||canonicalJson(source)!==canonicalJson(current)||canonicalJson(copy)!==canonicalJson(currentCopy))throw new DiscussionConflictError('Source, staged copy or authority changed during rehearsal.');
  const workspaceFields=changedFields(before,after),projectFields=changedFields(project,afterProject),discussionAfterDigest=await this.digest.sha256(canonicalJson(extractDiscussion(afterProject)));
  return {available:true as const,mode:'READ_ONLY_REHEARSAL' as const,projectId,command:command.kind,sourceFence:source.fence,stagedRevision:copy.revision,
   discussionChanged:copy.discussionDigest!==discussionAfterDigest,workspaceChanged:workspaceFields.length>0,workspaceFields,projectFields,
   beforeDigest:await this.digest.sha256(canonicalJson(before)),afterDigest:await this.digest.sha256(canonicalJson(after)),
   discussionBeforeDigest:copy.discussionDigest,discussionAfterDigest,
   messageCountBefore:copy.snapshot.messages.length,messageCountAfter:(afterProject.messages as unknown[]).length};
 }
}
