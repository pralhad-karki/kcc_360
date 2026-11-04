import {and,eq,exists,notExists,sql} from 'drizzle-orm';
import {alias} from 'drizzle-orm/sqlite-core';
import {drizzle} from 'drizzle-orm/d1';
import {workspaces,serverAudit} from '../../../db/schema';
import {DiscussionConflictError,DiscussionStorageError} from '../domain';
import type {PrivateHeadRow,Observation} from '../head-domain';
import type {CandidateHeadRepository,HeadCommit} from '../head-application';
import type {RevisionFence} from '../ports';
// All new SQL is built by the existing ORM. The first guarded write captures
// every observed row; subsequent writes require this attempt's commit UUID.
export class DrizzleCandidateHeadRepository implements CandidateHeadRepository {
 private readonly orm;
 constructor(private readonly db:D1Database){this.orm=drizzle(db);}
 async read(id:string):Promise<PrivateHeadRow|null>{try{const q=this.orm.select({id:workspaces.id,revision:workspaces.revision,payload:workspaces.payload,commitId:sql<string>`${workspaces.commitId}`.as('commitId'),updatedAt:sql<string>`${workspaces.updatedAt}`.as('updatedAt')}).from(workspaces).where(eq(workspaces.id,id)).toSQL();return await this.db.prepare(q.sql).bind(...q.params).first<PrivateHeadRow>();}catch{throw new DiscussionStorageError('Private candidate-head storage is unavailable.');}}
 private guards(source:RevisionFence,authority:RevisionFence,observed:Observation[]){
  if(observed.length>24||new Set(observed.map(o=>o.id)).size!==observed.length)throw new DiscussionStorageError('Candidate-head witness budget exceeded.');
  const f=alias(workspaces,'candidate_head_fence');
  return [...[source,authority].map(v=>exists(this.orm.select({one:sql<number>`1`}).from(f).where(and(eq(f.id,v.recordId),eq(f.revision,v.revision))))),...observed.map(v=>'absent'in v?notExists(this.orm.select({one:sql<number>`1`}).from(f).where(eq(f.id,v.id))):exists(this.orm.select({one:sql<number>`1`}).from(f).where(and(eq(f.id,v.id),eq(f.revision,v.revision),eq(f.commitId,v.commitId)))))];
 }
 async assertCurrent(source:RevisionFence,authority:RevisionFence,observed:Observation[]){try{const q=this.orm.select({id:workspaces.id}).from(workspaces).where(and(eq(workspaces.id,source.recordId),...this.guards(source,authority,observed))).toSQL();if(!await this.db.prepare(q.sql).bind(...q.params).first())throw new DiscussionConflictError('Candidate-head witnesses changed.');}catch(e){if(e instanceof DiscussionConflictError||e instanceof DiscussionStorageError)throw e;throw new DiscussionStorageError('Candidate-head witnesses are unavailable.');}}
 async commit(input:HeadCommit){
  try{
   const {source,authority,observed,coordinator,head,operation,audit}=input;
   if(!/^KCC-DISCUSSION-COORDINATOR:[a-f0-9]{64}$/.test(coordinator.id)||!/^KCC-DISCUSSION-HEAD:[a-f0-9]{64}$/.test(head.id)||!/^KCC-DISCUSSION-HEAD-OP:[a-f0-9]{64}$/.test(operation.id)||[coordinator,head,operation].some(r=>new TextEncoder().encode(r.payload).length>1_990_000))throw new DiscussionStorageError('Invalid or oversized candidate-head transaction.');
   const prior=(id:string)=>observed.find(o=>o.id===id),c=prior(coordinator.id),h=prior(head.id),o=prior(operation.id);
   if(!c||!h||!o||!('absent'in o)||operation.revision!==1||coordinator.revision!==('absent'in c?1:c.revision+1)||head.revision!==('absent'in h?1:h.revision+1))throw new DiscussionStorageError('Exact candidate-head witnesses required.');
   const commitId=crypto.randomUUID(),commitTable=alias(workspaces,'candidate_commit'),proof=()=>exists(this.orm.select({one:sql<number>`1`}).from(commitTable).where(and(eq(commitTable.id,coordinator.id),eq(commitTable.commitId,commitId))));
   const insert=(row:PrivateHeadRow,fromId:string,condition:ReturnType<typeof and>)=>this.orm.insert(workspaces).select(this.orm.select({id:sql<string>`${row.id}`.as('id'),revision:sql<number>`${row.revision}`.as('revision'),payload:sql<string>`${row.payload}`.as('payload'),commitId:sql<string>`${commitId}`.as('commit_id'),updatedAt:sql<string>`${row.updatedAt}`.as('updated_at')}).from(workspaces).where(and(eq(workspaces.id,fromId),condition)));
   const coordinatorWrite='absent'in c?insert(coordinator,source.recordId,and(...this.guards(source,authority,observed))):this.orm.update(workspaces).set({revision:coordinator.revision,payload:coordinator.payload,commitId,updatedAt:coordinator.updatedAt}).where(and(eq(workspaces.id,coordinator.id),...this.guards(source,authority,observed)));
   const headWrite='absent'in h?insert(head,coordinator.id,proof()):this.orm.update(workspaces).set({revision:head.revision,payload:head.payload,commitId,updatedAt:head.updatedAt}).where(and(eq(workspaces.id,head.id),eq(workspaces.revision,h.revision),proof()));
   const operationWrite=insert(operation,coordinator.id,proof());
   const auditWrite=this.orm.insert(serverAudit).select(this.orm.select({id:sql<string>`${commitId}`.as('id'),workspace:sql<string>`${operation.id}`.as('workspace'),revision:sql<number>`1`.as('revision'),subject:sql<string>`${audit.subject}`.as('subject'),actor:sql<string>`${audit.actor}`.as('actor'),command:sql<string>`'discussion.candidate.head'`.as('command'),record:sql<string>`${audit.record}`.as('record'),time:sql<string>`${audit.time}`.as('time')}).from(workspaces).where(and(eq(workspaces.id,operation.id),eq(workspaces.commitId,commitId))));
   const queries=[coordinatorWrite,headWrite,operationWrite,auditWrite].map(q=>q.toSQL()),results=await this.db.batch(queries.map(q=>this.db.prepare(q.sql).bind(...q.params)));
   if(results[0].meta.changes===1&&results.some(r=>r.meta.changes!==1))throw new DiscussionStorageError('Candidate-head atomic writes were not confirmed.');return results[0].meta.changes===1;
  }catch(e){if(e instanceof DiscussionStorageError)throw e;throw new DiscussionStorageError('Candidate-head transaction failed.');}
 }
}
