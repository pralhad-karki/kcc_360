import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mock} from 'node:test';
import {fixture} from './fixtures/discussion-migration.mjs';
import {readClient,restoreFictionalSQLite} from './fixtures/private-recovery-sqlite.mjs';
import {
 candidateHeadFixture,DiscussionCandidateHeadService,domain,headDomain,
 digest,clock,compile,subject,sourceId,
} from './fixtures/candidate-head.mjs';

const {PrivateRecoveryService}=await import(compile('server/recovery/application.ts'));
const {DrizzleRecoveryReader}=await import(compile('server/recovery/drizzle-reader.ts'));
const {DrizzleCandidateHeadRepository}=await import(compile('server/discussion-migration/infrastructure/head-repository.ts'));
const {LegacyDiscussionCommandAdapter}=await import(compile('server/discussion-migration/infrastructure/legacy-command-adapter.ts'));
const reviewer='fictional-recovery-operator';
const projectId='P101';
const fileSchema=fs.readFileSync('drizzle/0001_neat_tattoo.sql','utf8').replaceAll('--> statement-breakpoint','');
const commands=[
 {kind:'POST',text:'Fictional recovery rehearsal discussion'},
 {kind:'REPLY',text:'Fictional recovery rehearsal reply',threadRef:'P101:message:2',expectedVersion:0,expectedCount:2},
 {kind:'SET_STATE',reason:'Fictional resolution',threadRef:'P101:message:2',state:'RESOLVED',expectedVersion:0,expectedCount:3},
];
let passed=0;

function recovery(store){
 return new PrivateRecoveryService(
  new DrizzleRecoveryReader(readClient(store.sqlite)),
  {async read(){throw Error('This discussion fixture has no file objects');}},
  {async assertPrivateRecovery(actor){assert.equal(actor,reviewer);}},
 );
}

function request(state,operationId,fields){
 return {
  projectId,operationId,expectedHeadRevision:state.headRevision,
  expectedWorkspaceRevision:state.workspaceRevision,...fields,
 };
}

async function check(name,run){
 await run();
 passed++;
 console.log('PASS '+name);
}

mock.timers.enable({apis:['Date'],now:Date.parse(clock())});
const origin=await candidateHeadFixture('sqlite');
const target=fixture('sqlite',{empty:true});
try {
 origin.f.sqlite.exec(fileSchema);
 target.sqlite.exec(fileSchema);
 const canonical=origin.f.sourceRow();
 const staged=await origin.f.repository.readStaged(projectId);
 const expected=[origin.f.source()];
 const preparations=[];
 const advances=[];
 const receipts=[];

 for(const [index,command] of commands.entries()){
  const state=await origin.service.inspect(subject,projectId);
  const input=request(state,'prepare-recovery-'+index,{command});
  const receipt=await origin.service.prepare(subject,input);
  const advance=request(state,'advance-recovery-'+index,{kind:'ADVANCE',candidateKey:receipt.candidateKey});
  preparations.push(input);
  receipts.push(receipt);
  expected.push(await origin.legacy.run(expected.at(-1),'s1',projectId,command));
  if(index<2)advances.push({input:advance,result:await origin.service.transition(subject,advance)});
 }
 const active=await origin.service.inspect(subject,projectId);
 assert.equal(active.stackDepth,2);
 assert.equal(active.virtualDigest,receipts[1].afterDigest);
 const exportPackage=await recovery(origin.f).exportPrivate(reviewer);
 const anchor=exportPackage.package.digest;
 const bundle=JSON.parse(JSON.stringify(exportPackage.package));

 await check('missing active receipt fails verification before restore writes',async()=>{
  const incomplete=structuredClone(bundle);
  incomplete.snapshot.workspaces=incomplete.snapshot.workspaces.filter(row=>row.id!==receipts[0].candidateKey);
  await assert.rejects(restoreFictionalSQLite(target.sqlite,recovery(target),reviewer,incomplete,anchor));
  assert.equal(target.sqlite.prepare('SELECT count(*) n FROM kcc_workspaces').get().n,0);
  assert.equal(target.auditCount(),0);
 });

 await check('fresh SQLite restore preserves the complete private snapshot and exact digest',async()=>{
  await restoreFictionalSQLite(target.sqlite,recovery(target),reviewer,bundle,anchor);
  assert.deepEqual(await recovery(target).exportPrivate(reviewer),exportPackage);
  assert.deepEqual(target.sourceRow(),canonical);
  assert.deepEqual(await target.repository.readStaged(projectId),staged);
  assert.equal(target.sqlite.prepare('PRAGMA journal_mode').get().journal_mode,'wal');
 });

 const repository=new DrizzleCandidateHeadRepository(target.client);
 const authority={async authorize(actor,project){return {...await target.authority.authorize(actor,project),actor:'s1'};}};
 const service=new DiscussionCandidateHeadService(
  target.workspaceReader,authority,repository,digest,clock,true,
  {transition:new LegacyDiscussionCommandAdapter(),copies:target.repository},
 );

 async function materialize(){
  const key=(await headDomain.headKeys(digest,sourceId,projectId)).coordinator;
  const coordinator=await headDomain.decodeCoordinator(await repository.read(key),digest);
  return headDomain.materializeCandidateStack(
   target.source(),coordinator.sourceFence,coordinator.stack,
   async candidateKey=>headDomain.readCandidate(await repository.read(candidateKey),candidateKey,digest),digest,
  );
 }

 await check('fresh service materializes the active stack and replays durable requests without writes',async()=>{
  assert.deepEqual(await service.inspect(subject,projectId),active);
  assert.deepEqual(await materialize(),expected[2]);
  for(const [index,input] of preparations.entries()){
   assert.deepEqual(await service.prepare(subject,input),{...receipts[index],replayed:true});
  }
  for(const {input,result} of advances){
   assert.deepEqual(await service.transition(subject,input),{...result,replayed:true,historical:true});
  }
  assert.deepEqual(await recovery(target).exportPrivate(reviewer),exportPackage);
 });

 await check('restored guard rejects an out-of-order reversal and preserves the snapshot',async()=>{
  const wrong=request(active,'reverse-out-of-order',{kind:'REVERSE',candidateKey:receipts[0].candidateKey});
  await assert.rejects(service.transition(subject,wrong),domain.DiscussionConflictError);
  assert.deepEqual(await recovery(target).exportPrivate(reviewer),exportPackage);
 });

 await check('pending receipt advances after restore and all three reversals recover the original view',async()=>{
  await service.transition(subject,request(active,'advance-restored-resolution',{
   kind:'ADVANCE',candidateKey:receipts[2].candidateKey,
  }));
  assert.deepEqual(await materialize(),expected[3]);
  for(let index=receipts.length-1;index>=0;index--){
   const state=await service.inspect(subject,projectId);
   await service.transition(subject,request(state,'reverse-restored-'+index,{
    kind:'REVERSE',candidateKey:receipts[index].candidateKey,
   }));
   assert.deepEqual(await materialize(),expected[index]);
  }
  const final=await service.inspect(subject,projectId);
  assert.equal(final.stackDepth,0);
  assert.equal(final.headRevision,6);
  assert.equal(final.workspaceRevision,6);
  assert.deepEqual(target.sourceRow(),canonical);
  assert.deepEqual(await target.repository.readStaged(projectId),staged);
  assert.equal(target.auditCount(),exportPackage.inventory.auditRows+4);
  const current=(await recovery(target).exportPrivate(reviewer)).package.snapshot;
  const currentRows=new Map(current.workspaces.map(row=>[row.id,row]));
  const currentAudit=new Map(current.audit.map(row=>[row.id,row]));
  const {head,coordinator}=await origin.keys(projectId);
  for(const row of bundle.snapshot.workspaces){
   if(row.id!==head&&row.id!==coordinator)assert.deepEqual(currentRows.get(row.id),row);
  }
  for(const row of bundle.snapshot.audit)assert.deepEqual(currentAudit.get(row.id),row);
  assert.deepEqual(await recovery(origin.f).exportPrivate(reviewer),exportPackage);
 });

 await check('current restored authority can deny historical replay',async()=>{
  target.revoke();
  await assert.rejects(service.prepare(subject,preparations[0]),domain.DiscussionAccessError);
  await assert.rejects(service.transition(subject,advances[0].input),domain.DiscussionAccessError);
 });
}finally{
 await target.close();
 await origin.close();
 mock.timers.reset();
}
console.log(JSON.stringify({passed,mode:'fictional SQLite restore and fresh service replay'}));
