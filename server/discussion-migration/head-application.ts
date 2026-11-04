import {canonicalJson,jsonObject,requireId,DiscussionAccessError,DiscussionConflictError,DiscussionValidationError,DiscussionStorageError} from './domain';
import {discussionProject} from './command-domain';
import {applyDiscussionEffects} from './effect-domain';
import {headKeys,decodeHead,decodeCoordinator,decodeOperation,readCandidate,materializeCandidateStack,reverseEffects,candidateKey,seal,ensure,conflict,fence,utc,MAX_CANDIDATE_DEPTH} from './head-domain';
import type {PrivateHeadRow,Observation,CandidateHead,CandidateCoordinator,HeadOperation,StackEntry} from './head-domain';
import type {DiscussionWorkspaceReader,MigrationAuthorityPort,MigrationAuthority,DigestPort,RevisionFence} from './ports';
export interface HeadCommit {source:RevisionFence;authority:RevisionFence;observed:Observation[];coordinator:PrivateHeadRow;head:PrivateHeadRow;operation:PrivateHeadRow;audit:{subject:string;actor:string;time:string;record:string}}
export interface CandidateHeadRepository {
 read(id:string):Promise<PrivateHeadRow|null>;
 assertCurrent(source:RevisionFence,authority:RevisionFence,observed:Observation[]):Promise<void>;
 commit(input:HeadCommit):Promise<boolean>;
}
// Disabled private rehearsal. No canonical writer, policy bypass, dispatcher,
// production composition, database reset or new storage activation.
export class DiscussionCandidateHeadService {
 constructor(private readonly source:DiscussionWorkspaceReader,private readonly authority:MigrationAuthorityPort,private readonly repository:CandidateHeadRepository,private readonly digest:DigestPort,private readonly clock:()=>string,private readonly enabled=false){}
 private async actor(subject:string,projectId:string){requireId(subject);requireId(projectId);const a=await this.authority.authorize(subject,projectId);if(!a?.fence)throw new DiscussionAccessError('Current candidate-head authority required.');requireId(a.actor);fence(a.fence);return a;}
 private async recheck(subject:string,projectId:string,a:MigrationAuthority,source:RevisionFence,observed:Observation[]){const again=await this.actor(subject,projectId);conflict(canonicalJson(a)===canonicalJson(again));await this.repository.assertCurrent(source,a.fence,observed);}
 private summary(r:HeadOperation,replayed:boolean){return {available:true as const,mode:'PRIVATE_CANDIDATE_HEAD_REHEARSAL' as const,operationId:r.operationId,kind:r.kind,projectId:r.projectId,headRevision:r.headRevision,workspaceRevision:r.workspaceRevision,beforeDigest:r.beforeDigest,afterDigest:r.afterDigest,operationDigest:r.digest,replayed,historical:replayed,sourcePreserved:true as const};}
 private async view(source:Awaited<ReturnType<DiscussionWorkspaceReader['readWorkspace']>>,projectId:string,keys:Awaited<ReturnType<typeof headKeys>>,read:(id:string)=>Promise<PrivateHeadRow|null>){
  fence(source.fence);discussionProject(source.workspace,projectId);
  const coordinatorRow=await read(keys.coordinator),headRow=await read(keys.head),coordinator=await decodeCoordinator(coordinatorRow,this.digest),head=await decodeHead(headRow,source.fence.recordId,projectId,this.digest),baseDigest=await this.digest.sha256(canonicalJson(source.workspace));
  ensure(!head||coordinator);
  if(coordinator)conflict(canonicalJson(coordinator.sourceFence)===canonicalJson(source.fence)&&coordinator.sourceDigest===baseDigest);
  const loadOperation=async(key:string)=>{const r=await decodeOperation(await read(key),this.digest);ensure(r&&r.sourceId===source.fence.recordId&&key===(await headKeys(this.digest,r.sourceId,r.projectId,r.operationId)).operation);return r;};
  if(coordinator){const op=await loadOperation(coordinator.lastOperationKey);ensure(op.workspaceRevision===coordinator.revision&&op.afterDigest===coordinator.virtualDigest);for(const e of coordinator.stack){const op=await loadOperation(e.operationKey);ensure(op.kind==='ADVANCE'&&op.projectId===e.projectId&&op.candidateKey===e.candidateKey&&op.candidateDigest===e.candidateDigest&&op.workspaceRevision<=coordinator.revision);}}
  if(head){const op=await loadOperation(head.lastOperationKey);ensure(op.projectId===projectId&&op.headRevision===head.revision);}
  const stack=coordinator?.stack??[],latest=stack.filter(e=>e.projectId===projectId).at(-1);
  ensure((head?.candidateKey??null)===(latest?.candidateKey??null)&&(head?.candidateDigest??null)===(latest?.candidateDigest??null));
  const load=(key:string)=>read(key).then(row=>readCandidate(row,key,this.digest));
  const workspace=await materializeCandidateStack(source.workspace,source.fence,stack,load,this.digest),virtualDigest=await this.digest.sha256(canonicalJson(workspace));
  ensure(!coordinator||virtualDigest===coordinator.virtualDigest);
  return {coordinatorRow,headRow,coordinator,head,baseDigest,workspace,virtualDigest,stack,load};
 }
 private reader(){const rows=new Map<string,PrivateHeadRow|null>();return {read:async(id:string)=>{if(!rows.has(id))rows.set(id,await this.repository.read(id));return rows.get(id)!;},observed:()=>[...rows].map(([id,row]):Observation=>row?{id,revision:row.revision,commitId:row.commitId}:{id,absent:true})};}
 async inspect(subject:string,projectId:string){
  if(!this.enabled)return {available:false as const};const a=await this.actor(subject,projectId),source=await this.source.readWorkspace(),keys=await headKeys(this.digest,source.fence.recordId,projectId),reader=this.reader(),v=await this.view(source,projectId,keys,reader.read);
  await this.recheck(subject,projectId,a,source.fence,reader.observed());return {available:true as const,mode:'PRIVATE_CANDIDATE_HEAD_REHEARSAL' as const,projectId,sourceFence:source.fence,headRevision:v.headRow?.revision??0,workspaceRevision:v.coordinatorRow?.revision??0,baseDigest:v.baseDigest,virtualDigest:v.virtualDigest,stackDepth:v.stack.length,candidateKey:v.head?.candidateKey??null,sourcePreserved:true as const};
 }
 async transition(subject:string,input:unknown){
  if(!this.enabled)return {available:false as const};
  const request=jsonObject(input);if(Object.keys(request).sort().join(',')!=='candidateKey,expectedHeadRevision,expectedWorkspaceRevision,kind,operationId,projectId'||!['ADVANCE','REVERSE'].includes(String(request.kind))||![request.expectedHeadRevision,request.expectedWorkspaceRevision].every(v=>Number.isSafeInteger(v)&&Number(v)>=0))throw new DiscussionValidationError('Exact versioned candidate-head request required.');
  requireId(request.operationId);requireId(request.projectId);candidateKey(request.candidateKey);
  const {projectId,operationId}=request,kind=request.kind as 'ADVANCE'|'REVERSE',a=await this.actor(subject,projectId),source=await this.source.readWorkspace(),keys=await headKeys(this.digest,source.fence.recordId,projectId,operationId),requestDigest=await this.digest.sha256(canonicalJson([subject,a.actor,request])),reader=this.reader();
  const priorOperation=await decodeOperation(await reader.read(keys.operation),this.digest);
  if(priorOperation){conflict(priorOperation.requestDigest===requestDigest&&priorOperation.sourceId===source.fence.recordId&&priorOperation.projectId===projectId&&priorOperation.operationId===operationId&&priorOperation.subject===subject&&priorOperation.actor===a.actor);await this.recheck(subject,projectId,a,source.fence,reader.observed());return this.summary(priorOperation,true);}
  const v=await this.view(source,projectId,keys,reader.read);
  conflict((v.headRow?.revision??0)===request.expectedHeadRevision&&(v.coordinatorRow?.revision??0)===request.expectedWorkspaceRevision);
  const candidate=await v.load(request.candidateKey);conflict(candidate.subject===subject&&candidate.actor===a.actor&&candidate.projectId===projectId&&canonicalJson(candidate.sourceFence)===canonicalJson(source.fence));
  let workspace,stack:StackEntry[],nextCandidateKey:string|null,nextCandidateDigest:string|null;
  if(kind==='ADVANCE'){
   conflict(v.stack.length<MAX_CANDIDATE_DEPTH&&!v.stack.some(e=>e.candidateKey===request.candidateKey)&&candidate.beforeDigest===v.virtualDigest);
   const stagedId='KCC-DISCUSSION-STAGING:'+JSON.stringify([source.fence.recordId,projectId]),staged=await reader.read(stagedId);conflict(staged?.revision===candidate.stagedRevision);
   workspace=applyDiscussionEffects(v.workspace,candidate.effects);ensure(await this.digest.sha256(canonicalJson(workspace))===candidate.afterDigest);
   stack=[...v.stack,{projectId,candidateKey:request.candidateKey,candidateDigest:candidate.digest,operationKey:keys.operation,priorCandidateKey:v.head?.candidateKey??null,priorCandidateDigest:v.head?.candidateDigest??null}];nextCandidateKey=request.candidateKey;nextCandidateDigest=candidate.digest;
  }else{
   const top=v.stack.at(-1);conflict(top?.projectId===projectId&&top?.candidateKey===request.candidateKey&&top?.candidateDigest===candidate.digest&&v.head?.candidateKey===request.candidateKey&&v.virtualDigest===candidate.afterDigest);
   workspace=applyDiscussionEffects(v.workspace,reverseEffects(candidate.effects));ensure(await this.digest.sha256(canonicalJson(workspace))===candidate.beforeDigest);stack=v.stack.slice(0,-1);
   const rematerialized=await materializeCandidateStack(source.workspace,source.fence,stack,v.load,this.digest);ensure(canonicalJson(workspace)===canonicalJson(rematerialized));nextCandidateKey=top.priorCandidateKey;nextCandidateDigest=top.priorCandidateDigest;
  }
  const afterDigest=await this.digest.sha256(canonicalJson(workspace)),headRevision=(v.headRow?.revision??0)+1,workspaceRevision=(v.coordinatorRow?.revision??0)+1,occurredAt=this.clock();if(!utc(occurredAt))throw new DiscussionValidationError('Explicit UTC candidate-head clock required.');
  const coordinator=await seal({schema:'KCC360_DISCUSSION_COORDINATOR_V1' as const,revision:workspaceRevision,sourceFence:source.fence,sourceDigest:v.baseDigest,virtualDigest:afterDigest,stack,lastOperationKey:keys.operation,occurredAt},this.digest);
  const head=await seal({schema:'KCC360_DISCUSSION_HEAD_V1' as const,sourceId:source.fence.recordId,projectId,revision:headRevision,candidateKey:nextCandidateKey,candidateDigest:nextCandidateDigest,lastOperationKey:keys.operation,occurredAt},this.digest);
  const operation=await seal({schema:'KCC360_DISCUSSION_HEAD_OPERATION_V1' as const,sourceId:source.fence.recordId,projectId,operationId,kind,subject,actor:a.actor,requestDigest,candidateKey:request.candidateKey,candidateDigest:candidate.digest,headRevision,workspaceRevision,beforeDigest:v.virtualDigest,afterDigest,previousOperationKey:v.coordinator?.lastOperationKey??null,occurredAt},this.digest);
  await this.recheck(subject,projectId,a,source.fence,[]);
  const row=(id:string,revision:number,body:object):PrivateHeadRow=>({id,revision,payload:JSON.stringify(body),commitId:'',updatedAt:occurredAt});
  const committed=await this.repository.commit({source:source.fence,authority:a.fence,observed:reader.observed(),coordinator:row(keys.coordinator,workspaceRevision,coordinator),head:row(keys.head,headRevision,head),operation:row(keys.operation,1,operation),audit:{subject,actor:a.actor,time:occurredAt,record:JSON.stringify({schema:'KCC360_DISCUSSION_HEAD_AUDIT_V1',projectId,operationId,kind,headId:keys.head,coordinatorId:keys.coordinator,candidateKey:request.candidateKey,operationDigest:operation.digest,beforeDigest:v.virtualDigest,afterDigest,headRevision,workspaceRevision,sourcePreserved:true})}});
  if(!committed){const concurrent=await decodeOperation(await this.repository.read(keys.operation),this.digest);if(concurrent&&concurrent.requestDigest===requestDigest&&concurrent.sourceId===source.fence.recordId&&concurrent.projectId===projectId&&concurrent.operationId===operationId&&concurrent.subject===subject&&concurrent.actor===a.actor){const fresh=await this.source.readWorkspace();await this.recheck(subject,projectId,a,fresh.fence,[]);return this.summary(concurrent,true);}throw new DiscussionConflictError('Candidate-head transaction lost its revision or authority fence.');}
  return this.summary(operation,false);
 }
}
