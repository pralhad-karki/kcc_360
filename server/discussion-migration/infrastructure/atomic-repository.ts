import {and,eq,exists,notExists,sql} from 'drizzle-orm';
import {alias} from 'drizzle-orm/sqlite-core';
import {drizzle} from 'drizzle-orm/d1';
import {workspaces,serverAudit} from '../../../db/schema';
import {DiscussionStorageError,DiscussionConflictError} from '../domain';
import type {AtomicDiscussionRepository,AtomicDiscussionReceipt} from '../atomic-application';
import type {RevisionFence} from '../ports';
// New candidate+receipt is one immutable private row; audit is in the same D1
// transaction. Canonical source and existing staged head are never updated.
export class DrizzleAtomicDiscussionRepository implements AtomicDiscussionRepository {
 private readonly orm;
 constructor(private readonly db:D1Database){this.orm=drizzle(db);}
 async find(key:string):Promise<AtomicDiscussionReceipt|null>{
  try{const q=this.orm.select({payload:workspaces.payload,revision:workspaces.revision,updatedAt:sql<string>`${workspaces.updatedAt}`.as('updatedAt')}).from(workspaces).where(eq(workspaces.id,key)).toSQL(),row=await this.db.prepare(q.sql).bind(...q.params).first<{payload:string;revision:number;updatedAt:string}>();if(!row)return null;const r=JSON.parse(row.payload);if(row.revision!==1||row.updatedAt!==r.occurredAt)throw Error();return r;}
  catch{throw new DiscussionStorageError('Private rehearsal receipt is unavailable.');}
 }
 async assertFence(f:RevisionFence){try{const q=this.orm.select({id:workspaces.id}).from(workspaces).where(and(eq(workspaces.id,f.recordId),eq(workspaces.revision,f.revision))).toSQL();if(!await this.db.prepare(q.sql).bind(...q.params).first())throw new DiscussionConflictError('Rehearsal authority changed.');}catch(e){if(e instanceof DiscussionConflictError)throw e;throw new DiscussionStorageError('Rehearsal authority is unavailable.');}}
 async append(key:string,r:AtomicDiscussionReceipt){
  try{
   const payload=JSON.stringify(r);if(new TextEncoder().encode(payload).length>1_990_000)throw new DiscussionStorageError('Private rehearsal reached its byte budget.');
   const commitId=crypto.randomUUID(),f=alias(workspaces,'atomic_fence'),prior=alias(workspaces,'atomic_prior');
   const stagedId='KCC-DISCUSSION-STAGING:'+JSON.stringify([r.sourceFence.recordId,r.projectId]);
   const fences=[r.sourceFence,r.authorityFence,{recordId:stagedId,revision:r.stagedRevision}].map(v=>exists(this.orm.select({one:sql<number>`1`}).from(f).where(and(eq(f.id,v.recordId),eq(f.revision,v.revision)))));
   const write=this.orm.insert(workspaces).select(this.orm.select({id:sql<string>`${key}`.as('id'),revision:sql<number>`1`.as('revision'),payload:sql<string>`${payload}`.as('payload'),commitId:sql<string>`${commitId}`.as('commit_id'),updatedAt:sql<string>`${r.occurredAt}`.as('updated_at')}).from(workspaces).where(and(eq(workspaces.id,r.sourceFence.recordId),...fences,notExists(this.orm.select({one:sql<number>`1`}).from(prior).where(eq(prior.id,key)))))).toSQL();
   const record=JSON.stringify({schema:'KCC360_DISCUSSION_REHEARSAL_AUDIT_V1',operationId:r.operationId,projectId:r.projectId,receiptDigest:r.digest,beforeDigest:r.beforeDigest,afterDigest:r.afterDigest,sourcePreserved:true});
   const audit=this.orm.insert(serverAudit).select(this.orm.select({id:sql<string>`${commitId}`.as('id'),workspace:sql<string>`${key}`.as('workspace'),revision:sql<number>`1`.as('revision'),subject:sql<string>`${r.subject}`.as('subject'),actor:sql<string>`${r.actor}`.as('actor'),command:sql<string>`'discussion.command.rehearsal'`.as('command'),record:sql<string>`${record}`.as('record'),time:sql<string>`${r.occurredAt}`.as('time')}).from(workspaces).where(and(eq(workspaces.id,key),eq(workspaces.commitId,commitId)))).toSQL();
   const result=await this.db.batch([this.db.prepare(write.sql).bind(...write.params),this.db.prepare(audit.sql).bind(...audit.params)]);
   if(result[0].meta.changes===1&&result[1].meta.changes!==1)throw new DiscussionStorageError('Private rehearsal audit was not confirmed.');return result[0].meta.changes===1;
  }catch(e){if(e instanceof DiscussionStorageError)throw e;throw new DiscussionStorageError('Private rehearsal transaction failed.');}
 }
}
