import assert from 'node:assert/strict';
import {mock} from 'node:test';
import {
 candidateHeadFixture, DiscussionCandidateHeadService, domain, headDomain,
 digest, clock, subject,
} from './fixtures/candidate-head.mjs';

const {DiscussionConflictError, DiscussionStorageError, DiscussionAccessError}=domain;
const post={kind:'POST',text:'Fictional private discussion'};
let passed=0;

async function test(kind,name,run){
 const fixture=await candidateHeadFixture(kind);
 try {
  await run(fixture);
  passed++;
  console.log('PASS '+kind+' '+name);
 } finally {
  await fixture.close();
 }
}

async function preparation(fixture,operationId,command=post){
 const state=await fixture.service.inspect(subject,'P101');
 return {
  projectId:'P101',operationId,command,
  expectedHeadRevision:state.headRevision,expectedWorkspaceRevision:state.workspaceRevision,
 };
}

async function transition(fixture,candidate,operationId,kind='ADVANCE'){
 const request=await fixture.request(candidate,{operationId,kind});
 return fixture.service.transition(subject,request);
}

async function materialize(fixture){
 const row=await fixture.repository.read((await fixture.keys()).coordinator);
 const coordinator=await headDomain.decodeCoordinator(row,digest);
 return headDomain.materializeCandidateStack(
  fixture.f.source(),coordinator.sourceFence,coordinator.stack,
  async key=>headDomain.readCandidate(await fixture.repository.read(key),key,digest),digest,
 );
}

mock.timers.enable({apis:['Date'],now:Date.parse(clock())});
try {
 for(const kind of ['memory','sqlite']){
  await test(kind,'disabled preparation does not call providers',async()=>{
   const disabled=new DiscussionCandidateHeadService({}, {}, {}, {},()=>{throw Error()});
   assert.deepEqual(await disabled.prepare('any',{}),{available:false});
  });

  await test(kind,'post reply and resolve use successive private views and reverse exactly',async fixture=>{
   const source=fixture.f.sourceRow();
   const staged=await fixture.f.repository.readStaged('P101');
   let expected=fixture.f.source();
   const states=[expected];
   const candidates=[];
   for(const [index,command] of [
    post,
    {kind:'REPLY',text:'Fictional reply',threadRef:'P101:message:2',expectedVersion:0,expectedCount:2},
    {kind:'SET_STATE',reason:'Fictional resolution',threadRef:'P101:message:2',state:'RESOLVED',expectedVersion:0,expectedCount:3},
   ].entries()){
    const request=await preparation(fixture,'prepare-'+index,command);
    const result=await fixture.service.prepare(subject,request);
    const row=await fixture.repository.read(result.candidateKey);
    const receipt=await headDomain.readCandidate(row,result.candidateKey,digest);
    assert.notEqual(result.beforeDigest,result.afterDigest);
    assert.equal(result.candidateDigest,receipt.candidateDigest);
    const audit=fixture.preparedAudits().find(entry=>entry.workspace===row.id);
    assert.equal(audit.id,row.commitId);
    assert.equal(JSON.parse(audit.record).candidateDigest,receipt.candidateDigest);
    assert(!JSON.stringify(audit).includes(command.text??command.reason));
    assert(!JSON.stringify(result).includes(command.text??command.reason));
    assert.equal((await fixture.service.inspect(subject,'P101')).workspaceRevision,index);
    expected=await fixture.legacy.run(expected,'s1','P101',command);
    states.push(expected);
    const candidate={key:result.candidateKey,receipt};
    candidates.push(candidate);
    await transition(fixture,candidate,'advance-'+index);
    assert.deepEqual(await materialize(fixture),expected);
   }
   assert.equal(expected.projects[0].messages.at(-1).parentRef,'P101:message:2');
   assert.equal(expected.projects[0].discussionEvents.at(-1).state,'RESOLVED');
   for(let index=candidates.length-1;index>=0;index--){
    await transition(fixture,candidates[index],'reverse-'+index,'REVERSE');
    assert.deepEqual(await materialize(fixture),states[index]);
   }
   assert.equal((await fixture.service.inspect(subject,'P101')).workspaceRevision,6);
   assert.deepEqual(fixture.f.sourceRow(),source);
   assert.deepEqual(await fixture.f.repository.readStaged('P101'),staged);
   assert.equal(fixture.audits().length,6);
   assert.equal(fixture.preparedAudits().length,3);
  });

  await test(kind,'same virtual digest after a different project no-op still invalidates preparation',async fixture=>{
   const prepared=await fixture.service.prepare(subject,await preparation(fixture,'stale'));
   const other=await fixture.candidate('P102','NOOP');
   assert.equal(other.receipt.beforeDigest,other.receipt.afterDigest);
   await transition(fixture,other,'advance-other');
   const receipt=await headDomain.readCandidate(await fixture.repository.read(prepared.candidateKey),prepared.candidateKey,digest);
   await assert.rejects(transition(fixture,{key:prepared.candidateKey,receipt},'stale-advance'),DiscussionConflictError);
   assert.equal(fixture.audits().length,1);
  });

  await test(kind,'concurrent identical requests persist one candidate and replay it',async fixture=>{
   const request=await preparation(fixture,'concurrent');
   const results=await Promise.all([fixture.service.prepare(subject,request),fixture.service.prepare(subject,request)]);
   assert.equal(results.filter(result=>result.replayed).length,1);
   assert.equal(results[0].candidateDigest,results[1].candidateDigest);
   assert.equal(fixture.preparedAudits().length,1);
   await assert.rejects(fixture.service.prepare(subject,{...request,command:{...post,text:'Changed request'}}),DiscussionConflictError);
  });

  await test(kind,'lost acknowledgement replays the historical receipt after advancement',async fixture=>{
   const request=await preparation(fixture,'lost-ack');
   const persist=fixture.repository.prepareCandidate.bind(fixture.repository);
   fixture.repository.prepareCandidate=async input=>{
    await persist(input);
    throw new DiscussionStorageError('Fictional lost acknowledgement');
   };
   await assert.rejects(fixture.service.prepare(subject,request),DiscussionStorageError);
   const recovered=await fixture.service.prepare(subject,request);
   const receipt=await headDomain.readCandidate(await fixture.repository.read(recovered.candidateKey),recovered.candidateKey,digest);
   await transition(fixture,{key:recovered.candidateKey,receipt},'advance-recovered');
   assert.deepEqual(await fixture.service.prepare(subject,request),recovered);
   assert.equal(fixture.preparedAudits().length,1);
   fixture.f.revoke();
   await assert.rejects(fixture.service.prepare(subject,request),DiscussionAccessError);
  });

  await test(kind,'authority change during persistence rejects the candidate',async fixture=>{
   const request=await preparation(fixture,'revoked');
   fixture.race(()=>fixture.f.revoke());
   await assert.rejects(fixture.service.prepare(subject,request),DiscussionConflictError);
   assert.equal(fixture.preparedAudits().length,0);
  });

  await test(kind,'changing the staged row commit during evaluation prevents persistence',async fixture=>{
   if(kind==='memory'){
    // Memory staging has no independent commit UUID. Advance its actual revision.
    const newer=await fixture.f.request('P101','newer-stage');
    fixture.race(()=>fixture.f.service.stage(subject,newer));
   }else{
    const stagedId='KCC-DISCUSSION-STAGING:'+JSON.stringify(['KCC-OWNER-DEMO','P101']);
    fixture.race(()=>fixture.mutate(stagedId,row=>{row.commitId='fictional-replaced-commit'}));
   }
   await assert.rejects(fixture.service.prepare(subject,await preparation(fixture,'staged-race')),DiscussionConflictError);
   assert.equal(fixture.preparedAudits().length,0);
  });

  await test(kind,'tampering with the revision binding invalidates the receipt',async fixture=>{
   const prepared=await fixture.service.prepare(subject,await preparation(fixture,'tampered'));
   fixture.mutate(prepared.candidateKey,row=>{
    const envelope=JSON.parse(row.payload);
    envelope.basis.workspaceRevision++;
    row.payload=JSON.stringify(envelope);
   });
   const state=await fixture.service.inspect(subject,'P101');
   await assert.rejects(fixture.service.transition(subject,{
    projectId:'P101',operationId:'advance-tampered',kind:'ADVANCE',
    candidateKey:prepared.candidateKey,expectedHeadRevision:state.headRevision,expectedWorkspaceRevision:state.workspaceRevision,
   }),DiscussionStorageError);
   assert.equal(fixture.audits().length,0);
  });

  await test(kind,'audit insert failure rolls back the candidate',async fixture=>{
   const request=await preparation(fixture,'audit-fault');
   const before=await fixture.snapshot();
   fixture.failPreparationAudit();
   await assert.rejects(fixture.service.prepare(subject,request),DiscussionStorageError);
   assert.deepEqual(await fixture.snapshot(),before);
  });
 }
}finally{
 mock.timers.reset();
}
console.log(JSON.stringify({passed,mode:'fictional private preparation and reversal'}));
