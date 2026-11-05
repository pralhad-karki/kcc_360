import assert from 'node:assert/strict';

// Read-only D1 batch adapter for disposable SQLite rehearsal stores.
export function readClient(sqlite){
 return {
  prepare(sql){
   assert.match(sql,/^select /i);
   return {
    bind(...values){
     return {read:()=>({success:true,results:sqlite.prepare(sql).all(...values)})};
    },
   };
  },
  async batch(statements){
   sqlite.exec('BEGIN');
   try {
    const result=statements.map(statement=>statement.read());
    sqlite.exec('COMMIT');
    return result;
   }catch(error){
    sqlite.exec('ROLLBACK');
    throw error;
   }
  },
 };
}

// Verify the independent anchor before writing to an empty rehearsal store.
export async function restoreFictionalSQLite(sqlite,recovery,subject,bundle,anchor,{fail=false}={}){
 const {snapshot}=await recovery.verifyPrivate(subject,bundle,anchor);
 sqlite.exec('BEGIN IMMEDIATE');
 try {
  for(const table of ['kcc_workspaces','kcc_server_audit','kcc_stored_files']){
   assert.equal(sqlite.prepare('SELECT count(*) n FROM '+table).get().n,0,'Never overwrite an existing store');
  }
  const workspace=sqlite.prepare('INSERT INTO kcc_workspaces VALUES(?,?,?,?,?)');
  const audit=sqlite.prepare('INSERT INTO kcc_server_audit VALUES(?,?,?,?,?,?,?,?)');
  const file=sqlite.prepare('INSERT INTO kcc_stored_files VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  for(const row of snapshot.workspaces)workspace.run(row.id,row.revision,row.payload,row.commitId,row.updatedAt);
  for(const row of snapshot.audit)audit.run(row.id,row.workspace,row.revision,row.subject,row.actor,row.command,row.record,row.time);
  for(const row of snapshot.files)file.run(row.id,row.workspace,row.kind,row.target,row.evidenceIndex,row.objectKey,row.name,row.mime,row.size,row.sha256,row.uploadedBy,row.subject,row.createdAt,row.status);
  if(fail)throw Error('fictional restore failure');
  sqlite.exec('COMMIT');
 }catch(error){
  sqlite.exec('ROLLBACK');
  throw error;
 }
}
