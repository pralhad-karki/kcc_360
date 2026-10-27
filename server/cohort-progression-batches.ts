import {env} from 'cloudflare:workers';
import {readSession,ServiceError} from './service';
import {createMISAdapter} from './mis-adapter.mjs';
import {createMockCohortSnapshot,mockCohortConfiguration} from '../fixtures/mis/cohort-mock.mjs';
import {createMockCohortStore} from './cohort-progression-store.mjs';
import {compareMockCohortBatch} from './cohort-progression-batch.mjs';

const adapter=createMISAdapter({configuration:{mode:'MOCK'},snapshot:createMockCohortSnapshot()});
const readers=['c1','d1','a1'];
function database(){if(!env.DB)throw new ServiceError(503,'Fictional batch storage is unavailable.');return env.DB}
type Session={subject:string,actor:string,updatedAt:string};
async function sessionProof(subject:string):Promise<Session>{
 const actor=await readSession(subject);
 if(!readers.includes(actor))throw new ServiceError(403,'Fictional batch review requires an academic review demo persona.');
 const row=await database().prepare('SELECT actor,updated_at FROM kcc_demo_sessions WHERE subject=?').bind(subject).first<{actor:string,updated_at:string}>();
 if(!row||row.actor!==actor)throw new ServiceError(409,'The demo account changed. Refresh before retrying.');
 return {subject,actor,updatedAt:row.updated_at};
}
async function unchanged(s:Session){
 const row=await database().prepare('SELECT actor,updated_at FROM kcc_demo_sessions WHERE subject=?').bind(s.subject).first<{actor:string,updated_at:string}>();
 if(!row||row.actor!==s.actor||row.updated_at!==s.updatedAt)throw new ServiceError(409,'The demo account changed. Refresh before retrying.');
}
function requestBody(request:unknown,session:Session):Record<string,any>{
 if(!request||typeof request!=='object'||Array.isArray(request))throw new ServiceError(400,'Invalid fictional batch request.');
 const b=request as Record<string,any>;
 if(!['PROPOSE','APPROVE','REJECT','APPLY','WITHDRAW'].includes(b.action))throw new ServiceError(400,'Unknown fictional batch action.');
 const fields=b.action==='WITHDRAW'?['action','actor','revision','batchId','bindingHash','reason']:['action','actor','revision','snapshotId','snapshotVersion',b.action==='PROPOSE'?'cohortId':'batchId',...(b.action==='APPLY'?[]:['reason'])];
 if(Object.keys(b).length!==fields.length||!fields.every(k=>Object.hasOwn(b,k))||!Number.isSafeInteger(b.revision)||b.revision<0||(b.action==='WITHDRAW'?typeof b.bindingHash!=='string'||!/^[a-f0-9]{64}$/.test(b.bindingHash):typeof b.snapshotId!=='string'||!Number.isSafeInteger(b.snapshotVersion))||typeof b[b.action==='PROPOSE'?'cohortId':'batchId']!=='string'||b.action!=='APPLY'&&(typeof b.reason!=='string'||!b.reason.trim()||b.reason.trim().length>1000))throw new ServiceError(400,'Only current fictional batch references and approved fields may be submitted.');
 if(b.actor!==session.actor)throw new ServiceError(409,'The demo account changed. Refresh before retrying.');
 if((['PROPOSE','APPLY','WITHDRAW'].includes(b.action)?session.actor!=='c1':session.actor!=='d1'))throw new ServiceError(403,'This demo persona cannot perform that fictional batch action.');
 return b;
}
// Owner identity is checked by the route. Roles here are demo workflow roles,
// not institutional authentication or two independently authenticated humans.
export async function mockCohortBatches(subject:string,request?:unknown){
 const session=await sessionProof(subject),body=request===undefined?undefined:requestBody(request,session);
 const store=createMockCohortStore({db:database()});
 if(body?.action==='WITHDRAW'){
  const result=await store.save({session,revision:body.revision,action:'WITHDRAW',batchId:body.batchId,bindingHash:body.bindingHash,reason:body.reason,now:new Date().toISOString()});
  if(!result.ok)throw new ServiceError(result.reason==='STORAGE_UNAVAILABLE'?503:409,'Fictional withdrawal status needs review. Refresh saved batches before retrying.');
  return {actor:session.actor,mode:'MOCK',fictional:true,officialWriteBack:false,source:null,sourceStatus:'NOT_REQUIRED',revision:result.ledger.revision,batch:result.batch};
 }
 let roster;
 try{roster=await adapter.loadStudents()}catch{roster=null}
 const config=mockCohortConfiguration(),now=new Date().toISOString();
 await unchanged(session);
 const source=roster?.ok&&'source' in roster?roster.source:null;
 if(body&&!source)throw new ServiceError(503,'The fictional cohort source is unavailable.');
 if(body&&(body.snapshotId!==source!.snapshotId||body.snapshotVersion!==source!.version))throw new ServiceError(409,'The fictional source changed. Load a fresh batch review.');
 const initialInput=source?{roster,structure:config.structure,cohort:config.cohorts[0],now}:undefined;
 let loaded;
 try{loaded=await store.load(initialInput)}catch{throw new ServiceError(503,'Fictional batch storage is unavailable. No reset was performed.')}
 await unchanged(session);
 const common={actor:session.actor,mode:'MOCK',fictional:true,officialWriteBack:false,source,sourceStatus:source?'AVAILABLE':'UNAVAILABLE'};
 // No raw placements, audit subjects or session proofs are returned. Existing
 // workspace/student views cannot select this separate server-private ledger.
 if(!body){
  // Bound comparison memory to one ledger copy at a time in the Worker.
  const comparisons=[];
  for(const b of loaded.ledger.batches)comparisons.push(await compareMockCohortBatch({ledger:loaded.ledger,batchId:b?.id,input:source?{roster,structure:config.structure,cohort:config.cohorts.find(c=>c.id===b?.preview?.cohort?.id),now}:undefined,now}));
  if((await store.load(initialInput)).ledger.revision!==loaded.ledger.revision)throw new ServiceError(409,'Fictional batches changed during comparison. Refresh saved batches.');
  await unchanged(session);
  return {...common,revision:loaded.ledger.revision,cohorts:config.cohorts.map(c=>({id:c.id,label:c.label})),batches:loaded.ledger.batches,comparisons};
 }
 if(body.revision!==loaded.ledger.revision)throw new ServiceError(409,'Fictional batches changed. Refresh; no automatic retry was performed.');
 const cohortId=body.action==='PROPOSE'?body.cohortId:loaded.ledger.batches.find((b:any)=>b.id===body.batchId)?.preview.cohort.id;
 const cohort=config.cohorts.find(c=>c.id===cohortId);if(!cohort)throw new ServiceError(400,'Unknown fictional batch or cohort.');
 const batchId=body.action==='PROPOSE'?'MOCK_BATCH_'+crypto.randomUUID().replaceAll('-','_').toUpperCase():body.batchId;
 const result=await store.save({session,revision:body.revision,action:body.action,batchId,reason:body.reason,input:{roster,structure:config.structure,cohort,now},now});
 if(!result.ok){
  const unavailable=['STORAGE_UNAVAILABLE','LEDGER_SIZE_LIMIT'].includes(result.reason);
  throw new ServiceError(unavailable?503:409,unavailable?'Fictional batch save unavailable. Refresh to inspect the saved state before retrying.':'Fictional batch source, placement, session or review state changed. Refresh before retrying.');
 }
 return {...common,revision:result.ledger.revision,batch:result.batch};
}
