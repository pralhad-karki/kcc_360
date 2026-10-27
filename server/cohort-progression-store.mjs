import {createMockCohortLedger,transitionMockCohortBatch} from './cohort-progression-batch.mjs';

// Separate server-private record in the existing schema. Never load it through
// the generic workspace engine/view or accept this namespace from a request.
export const MOCK_COHORT_WORKSPACE='KCC-MOCK-COHORT-LEDGER-V1';
const kind='KCC360_MOCK_COHORT_LEDGER_V1';
const failure=reason=>({ok:false,reason});
export function createMockCohortStore({db}){
 async function load(input){
  const row=await db.prepare('SELECT revision,payload,commit_id FROM kcc_workspaces WHERE id=?').bind(MOCK_COHORT_WORKSPACE).first();
  if(!row){const initial=createMockCohortLedger(input);if(!initial.ok)throw Error('Fictional ledger initialization unavailable');return {exists:false,ledger:initial.ledger}}
  const data=JSON.parse(row.payload),l=data?.ledger;
  if(data?.kind!==kind||l?.mode!=='MOCK'||l.fictional!==true||!Number.isSafeInteger(row.revision)||row.revision<1||l.revision!==row.revision||!Array.isArray(l.history)||l.history.length!==row.revision||!Array.isArray(l.batches)||!l.placements||typeof l.placements!=='object'||Array.isArray(l.placements))throw Error('Fictional ledger is invalid');
  return {exists:true,ledger:l};
 }
 /**
  * @param {{session:any,revision:number,action:string,batchId:string,bindingHash?:string,reason?:string,input?:any,now:string}} command
  * @returns {Promise<{ok:true,ledger:any,batch:any,officialWriteBack:false}|{ok:false,reason:string}>}
  */
 async function save({session,revision,action,batchId,bindingHash,reason,input,now}){
  try{
   const current=await load(input);
   const transition=await transitionMockCohortBatch({ledger:current.ledger,actor:session.actor,revision,action,batchId,bindingHash,reason,input,now});
   if(!transition.ok)return transition;
   const next=transition.ledger,payload=JSON.stringify({kind,ledger:next});
   if(payload.length>2_000_000)return failure('LEDGER_SIZE_LIMIT');
   const id=crypto.randomUUID(),scope=MOCK_COHORT_WORKSPACE;
   const guard='EXISTS (SELECT 1 FROM kcc_demo_sessions WHERE subject=? AND actor=? AND updated_at=?)';
   const write=current.exists
    ?db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=? AND '+guard).bind(payload,next.revision,id,now,scope,revision,session.subject,session.actor,session.updatedAt)
    :db.prepare('INSERT INTO kcc_workspaces (id,revision,payload,commit_id,updated_at) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=?) AND '+guard).bind(scope,next.revision,payload,id,now,scope,session.subject,session.actor,session.updatedAt);
   const b=transition.batch;
   const record=JSON.stringify({kind,batchId:b.id,action,bindingHash:b.bindingHash,source:b.preview.source,counts:b.preview.counts,revisionBefore:revision,revisionAfter:next.revision,officialWriteBack:false,...(action==='WITHDRAW'?{withdrawal:b.withdrawal}:{})});
   const audit=db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=? AND revision=?)').bind(id,scope,next.revision,session.subject,session.actor,'cohort.mock.'+action.toLowerCase(),record,now,scope,id,next.revision);
   // D1 batch is transactional: an audit error rolls back the candidate ledger.
   const result=await db.batch([write,audit]);
   if(result[0].meta.changes!==1)return failure('SAVE_CONFLICT');
   return {ok:true,ledger:next,batch:b,officialWriteBack:false};
  }catch{return failure('STORAGE_UNAVAILABLE')}
 }
 return Object.freeze({load,save});
}
