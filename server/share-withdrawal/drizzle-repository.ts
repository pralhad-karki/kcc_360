import {and,eq,exists,notExists,sql} from 'drizzle-orm';
import {alias} from 'drizzle-orm/sqlite-core';
import {drizzle} from 'drizzle-orm/d1';
import {workspaces,demoSessions,serverAudit} from '../../db/schema';
import {WithdrawalStorageError,WithdrawalConflictError,validateRecord,WITHDRAWAL_COMMAND} from './domain';
import type {ShareBinding,WithdrawalRequest,WithdrawalRecord} from './domain';
import type {WithdrawalRepository} from './application';

// ORM query builders own SQL construction. This infrastructure adapter executes
// the compiled SQL through D1; application/domain code has no driver knowledge.
// A private, immutable workspace record is authoritative; ordinary audit-log
// retention must never reactivate a link. Marker and audit share one D1 batch.
// No source payload rewrite or schema migration.
export class DrizzleShareWithdrawalRepository implements WithdrawalRepository {
 private readonly orm;
 constructor(private readonly db:D1Database){this.orm=drizzle(db);}
 private fence(r:WithdrawalRequest){return and(eq(workspaces.id,r.workspaceId),eq(workspaces.revision,r.sourceRevision),exists(this.orm.select({one:sql<number>`1`}).from(demoSessions).where(and(eq(demoSessions.subject,r.subject),eq(demoSessions.actor,r.actor),eq(demoSessions.updatedAt,r.sessionGeneration)))));}
 async find(key:string,binding:ShareBinding):Promise<WithdrawalRecord|null>{
  try{const q=this.orm.select({revision:workspaces.revision,payload:workspaces.payload,commitId:sql<string>`${workspaces.commitId}`.as('commitId'),updatedAt:sql<string>`${workspaces.updatedAt}`.as('updatedAt')}).from(workspaces).where(eq(workspaces.id,key)).toSQL(),row=await this.db.prepare(q.sql).bind(...q.params).first<{revision:number,payload:string,commitId:string,updatedAt:string}>();if(!row)return null;const record=validateRecord(JSON.parse(row.payload),binding);if(row.revision!==1||row.updatedAt!==record.time||!row.commitId)throw new WithdrawalStorageError('Withdrawal ledger integrity failed.');return record;}
  catch{throw new WithdrawalStorageError('Withdrawal status is unavailable.');}
 }
 async assertFence(r:WithdrawalRequest){
  try{const q=this.orm.select({id:workspaces.id}).from(workspaces).where(this.fence(r)).toSQL();if(!await this.db.prepare(q.sql).bind(...q.params).first())throw new WithdrawalConflictError('Share or session changed. Refresh before retrying.');}
  catch(e){if(e instanceof WithdrawalConflictError)throw e;throw new WithdrawalStorageError('Withdrawal authorization is unavailable.');}
 }
 async append(key:string,record:WithdrawalRecord,r:WithdrawalRequest){
  try{const commitId=crypto.randomUUID(),prior=alias(workspaces,'withdrawal_prior');
   const selection=this.orm.select({id:sql<string>`${key}`.as('id'),revision:sql<number>`1`.as('revision'),payload:sql<string>`${JSON.stringify(record)}`.as('payload'),commitId:sql<string>`${commitId}`.as('commit_id'),updatedAt:sql<string>`${record.time}`.as('updated_at')}).from(workspaces).where(and(this.fence(r),notExists(this.orm.select({one:sql<number>`1`}).from(prior).where(eq(prior.id,key)))));
   const marker=this.orm.insert(workspaces).select(selection).toSQL();
   const audit=this.orm.insert(serverAudit).select(this.orm.select({id:sql<string>`${commitId}`.as('id'),workspace:sql<string>`${record.workspaceId}`.as('workspace'),revision:sql<number>`${record.sourceRevision}`.as('revision'),subject:sql<string>`${record.subject}`.as('subject'),actor:sql<string>`${record.actor}`.as('actor'),command:sql<string>`${WITHDRAWAL_COMMAND}`.as('command'),record:sql<string>`${JSON.stringify({schema:'KCC360_SHARE_WITHDRAWAL_AUDIT_V1',markerId:key,shareId:record.shareId,tokenHash:record.tokenHash,sourceRevision:record.sourceRevision})}`.as('record'),time:sql<string>`${record.time}`.as('time')}).from(workspaces).where(and(eq(workspaces.id,key),eq(workspaces.commitId,commitId)))).toSQL();
   const results=await this.db.batch([this.db.prepare(marker.sql).bind(...marker.params),this.db.prepare(audit.sql).bind(...audit.params)]);
   if(results[0].meta.changes===1&&results[1].meta.changes!==1)throw new WithdrawalStorageError('Withdrawal audit was not confirmed.');
   return results[0].meta.changes===1;
  }
  catch{throw new WithdrawalStorageError('Withdrawal could not be saved. Check the link status before retrying.');}
 }
}
