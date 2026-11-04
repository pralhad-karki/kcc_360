import {getTableColumns,sql} from 'drizzle-orm';
import {drizzle} from 'drizzle-orm/d1';
import {workspaces,serverAudit,storedFiles} from '../../db/schema';
import {MAX_RECOVERY_ROWS,RecoveryError,check} from './domain';
import type {RecoverySnapshot} from './domain';
import type {RecoveryReader} from './application';

// Bounded, all-namespace read in one D1 transactional batch. No sessions,
// mutation SQL, binding composition or production export endpoint is provided.
export class DrizzleRecoveryReader implements RecoveryReader {
 constructor(private readonly db:D1Database){}
 async readSnapshot():Promise<RecoverySnapshot>{
  try{
   const orm=drizzle(this.db),queries=[workspaces,serverAudit,storedFiles].map(table=>{
    const fields=Object.fromEntries(Object.entries(getTableColumns(table)).map(([key,column])=>[key,sql`${column}`.as(key)]));
    return orm.select(fields).from(table).orderBy(table.id).limit(MAX_RECOVERY_ROWS+1).toSQL();
   });
   const result=await this.db.batch(queries.map(q=>this.db.prepare(q.sql).bind(...q.params)));
   check(result.length===3&&result.every(r=>r.success&&Array.isArray(r.results)&&r.results.length<=MAX_RECOVERY_ROWS));
   return structuredClone({workspaces:result[0].results,audit:result[1].results,files:result[2].results}) as unknown as RecoverySnapshot;
  }catch{throw new RecoveryError();}
 }
}
