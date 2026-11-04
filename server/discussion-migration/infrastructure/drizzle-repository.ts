// SQLite/D1 infrastructure only. Application/domain layers import ports, never
// this adapter. PostgreSQL can implement the same repository contract separately.
import {and,eq,exists,notExists,sql} from 'drizzle-orm';
import {alias} from 'drizzle-orm/sqlite-core';
import {drizzle} from 'drizzle-orm/d1';
import {workspaces,serverAudit} from '../../../db/schema';
import {DiscussionConflictError,DiscussionNotFoundError,DiscussionStorageError,validateSnapshot,jsonObject} from '../domain';
import type {DiscussionMigrationRepository,DiscussionWorkspaceReader,StagedDiscussion} from '../ports';
type Envelope={current:StagedDiscussion;history:StagedDiscussion[]};
export class DrizzleDiscussionMigrationRepository implements DiscussionMigrationRepository,DiscussionWorkspaceReader {
 private readonly orm;
 constructor(client:D1Database,private readonly sourceId='KCC-OWNER-DEMO'){this.orm=drizzle(client)}
 private key(projectId:string){return 'KCC-DISCUSSION-STAGING:'+JSON.stringify([this.sourceId,projectId])}
 private decode(payload:string):Envelope {
  const e=JSON.parse(payload) as Envelope;
  if(!e?.current||e.current.format!==1||!Array.isArray(e.history)||!Number.isSafeInteger(e.current.revision))throw new DiscussionStorageError('Invalid staged storage.');
  for(const [index,d] of [...e.history,e.current].entries()){if(d.format!==1||d.revision!==index+1||d.snapshot.projectId!==e.current.snapshot.projectId)throw new DiscussionStorageError('Invalid staged version chain.');validateSnapshot(d.snapshot);}
  return e;
 }
 async readWorkspace(){
  try{const row=await this.orm.select().from(workspaces).where(eq(workspaces.id,this.sourceId)).get();if(!row)throw new DiscussionNotFoundError('Legacy source unavailable.');
   return {workspace:jsonObject(JSON.parse(row.payload)),fence:{recordId:this.sourceId,revision:row.revision}};
  }catch(e){if(e instanceof DiscussionNotFoundError)throw e;throw new DiscussionStorageError('Cannot read legacy workspace.')}
 }
 async readLegacy(projectId:string){
  try{const row=await this.orm.select().from(workspaces).where(eq(workspaces.id,this.sourceId)).get();if(!row)throw new DiscussionNotFoundError('Legacy source unavailable.');
   const data=JSON.parse(row.payload),projects=Array.isArray(data.projects)?data.projects.filter((p:{id?:unknown})=>p?.id===projectId):[];
   if(projects.length!==1)throw new DiscussionNotFoundError('Unique legacy project required.');
   return {project:jsonObject(projects[0]),fence:{recordId:this.sourceId,revision:row.revision}};
  }catch(e){if(e instanceof DiscussionNotFoundError)throw e;throw new DiscussionStorageError('Cannot read legacy discussion.')}
 }
 async readStaged(projectId:string){
  try{const row=await this.orm.select().from(workspaces).where(eq(workspaces.id,this.key(projectId))).get();if(!row)return null;const e=this.decode(row.payload);if(e.current.revision!==row.revision||e.current.snapshot.projectId!==projectId)throw new DiscussionStorageError('Stored identity mismatch.');return e.current}
  catch{throw new DiscussionStorageError('Cannot read staged discussion.')}
 }
 async saveStage(input:Parameters<DiscussionMigrationRepository['saveStage']>[0]){
  try{
   if(!input.fences.length||!input.fences.some(f=>f.recordId===this.sourceId))throw new DiscussionConflictError('Source fence required.');
   const key=this.key(input.projectId),row=await this.orm.select().from(workspaces).where(eq(workspaces.id,key)).get();
   if((row?.revision??0)!==input.expectedRevision)throw new DiscussionConflictError('Staged version changed.');
   const old=row?this.decode(row.payload):null,document=input.document;
   if(document.snapshot.projectId!==input.projectId||document.revision!==input.expectedRevision+1)throw new DiscussionConflictError('Staged identity mismatch.');
   const payload=JSON.stringify({current:document,history:old?[...old.history,old.current]:[]});
   if(new TextEncoder().encode(payload).byteLength>1_990_000)throw new DiscussionStorageError('Staged history reached its byte budget.');
   const commitId=crypto.randomUUID(),fenceTable=alias(workspaces,'discussion_fence'),head=alias(workspaces,'discussion_head');
   const fences=input.fences.map(f=>exists(this.orm.select({one:sql<number>`1`}).from(fenceTable).where(and(eq(fenceTable.id,f.recordId),eq(fenceTable.revision,f.revision)))));
   const write=row
    ?this.orm.update(workspaces).set({payload,revision:document.revision,commitId,updatedAt:document.occurredAt}).where(and(eq(workspaces.id,key),eq(workspaces.revision,input.expectedRevision),...fences))
    :this.orm.insert(workspaces).select(this.orm.select({id:sql<string>`${key}`.as('id'),revision:sql<number>`${document.revision}`.as('revision'),payload:sql<string>`${payload}`.as('payload'),commitId:sql<string>`${commitId}`.as('commit_id'),updatedAt:sql<string>`${document.occurredAt}`.as('updated_at')}).from(workspaces).where(and(eq(workspaces.id,this.sourceId),...fences,notExists(this.orm.select({one:sql<number>`1`}).from(head).where(eq(head.id,key))))));
   const audit=this.orm.insert(serverAudit).select(this.orm.select({id:sql<string>`${commitId}`.as('id'),workspace:sql<string>`${key}`.as('workspace'),revision:sql<number>`${document.revision}`.as('revision'),subject:sql<string>`${document.subject}`.as('subject'),actor:sql<string>`${document.actor}`.as('actor'),command:sql<string>`'discussion.migration.stage'`.as('command'),record:sql<string>`${JSON.stringify({projectId:input.projectId,operationId:document.operationId,sourceDigest:document.sourceDigest,discussionDigest:document.discussionDigest})}`.as('record'),time:sql<string>`${document.occurredAt}`.as('time')}).from(workspaces).where(and(eq(workspaces.id,key),eq(workspaces.commitId,commitId))));
   const results=await this.orm.batch([write,audit]);if(results[0].meta.changes!==1)throw new DiscussionConflictError('Source, authority or staged revision changed.');
  }catch(e){if(e instanceof DiscussionConflictError||e instanceof DiscussionStorageError)throw e;throw new DiscussionStorageError('Staged save failed; no driver details exposed.')}
 }
}
