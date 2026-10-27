import assert from 'node:assert/strict';
import {createMISAdapter} from './server/mis-adapter.mjs';
import {createMockCohortSnapshot,mockCohortConfiguration} from './fixtures/mis/cohort-mock.mjs';
import {createMockCohortLedger,transitionMockCohortBatch as transition} from './server/cohort-progression-batch.mjs';
const now='2026-10-23T10:00:00.000Z',config=mockCohortConfiguration(),roster=await createMISAdapter({configuration:{mode:'MOCK'},snapshot:createMockCohortSnapshot(),clock:()=>now}).loadStudents(),input={roster,structure:config.structure,cohort:config.cohorts[0],now};
const start=createMockCohortLedger(input).ledger;
const propose={ledger:start,actor:'c1',revision:0,action:'PROPOSE',batchId:'MOCK_WITHDRAW_TEST',reason:'Fictional proposal',input,now};
const prepared=await transition(propose),approved=await transition({...propose,ledger:prepared.ledger,actor:'d1',revision:1,action:'APPROVE',reason:'Fictional independent approval'});
assert(prepared.ok&&approved.ok);
const withdraw=l=>({ledger:l,actor:'c1',revision:l.revision,action:'WITHDRAW',batchId:prepared.batch.id,bindingHash:prepared.batch.bindingHash,reason:'Source changed; retire this fictional pending batch',now});
for(const source of [prepared,approved]){
 const before=JSON.stringify(source),r=await transition(withdraw(source.ledger));assert(r.ok);assert.equal(r.batch.state,'WITHDRAWN');assert.equal(r.batch.withdrawal.fromState,source.batch.state);assert.equal(r.batch.withdrawal.bindingHash,source.batch.bindingHash);assert.deepEqual(r.batch.preview,source.batch.preview);assert.deepEqual(r.batch.before,source.batch.before);assert.equal(r.batch.bindingHash,source.batch.bindingHash);assert.deepEqual(r.batch.decision,source.batch.decision);assert.deepEqual(r.ledger.placements,source.ledger.placements);assert.deepEqual(r.ledger.history.slice(0,-1),source.ledger.history);assert.equal(r.ledger.history.at(-1).reason,r.batch.withdrawal.reason);assert.equal(JSON.stringify(source),before);
 const changed=structuredClone(input);changed.roster.source.version++;changed.roster.students.find(s=>s.studentId==='MOCK_STUDENT_A').collegeStatus='LEFT_COLLEGE';
 const replacement=await transition({...propose,ledger:r.ledger,revision:r.ledger.revision,batchId:'MOCK_REPLACEMENT',input:changed});assert(replacement.ok);assert.equal(replacement.batch.preview.source.version,2);assert.equal(replacement.batch.preview.counts.excludedLeftCollege,2);assert.equal(replacement.batch.preview.counts.included,4);assert.deepEqual(replacement.ledger.batches[0],r.batch);assert.notEqual(replacement.batch.bindingHash,r.batch.bindingHash);assert.equal(replacement.ledger.batches.length,2);
 const replay=await transition({...withdraw(r.ledger)});assert.equal(replay.reason,'BATCH_STATE_CONFLICT');
 for(const action of ['APPROVE','APPLY']){const late=await transition({...propose,ledger:r.ledger,revision:r.ledger.revision,actor:action==='APPROVE'?'d1':'c1',action});assert.equal(late.reason,'BATCH_STATE_CONFLICT')}
}
async function denied(c,reason){const before=JSON.stringify(c),r=await transition(c);assert.equal(r.ok,false);assert.equal(r.reason,reason);assert.equal(r.ledger,undefined);assert.equal(JSON.stringify(c),before)}
for(const actor of ['d1','a1','s1','m1','unknown'])await denied({...withdraw(approved.ledger),actor},'ROLE_DENIED');
await denied({...withdraw(approved.ledger),revision:1},'STALE_LEDGER');await denied({...withdraw(approved.ledger),bindingHash:'0'.repeat(64)},'BATCH_BINDING_INVALID');await denied({...withdraw(approved.ledger),reason:' '},'REASON_REQUIRED');await denied({...withdraw(approved.ledger),reason:'x'.repeat(1001)},'REASON_REQUIRED');await denied({...withdraw(approved.ledger),now:'2026-10-23T09:59:59.000Z'},'EVENT_TIME_INVALID');
const forged=structuredClone(approved.ledger);forged.batches[0].reason='FORGED';await denied(withdraw(forged),'BATCH_BINDING_INVALID');
const corruptApproval=structuredClone(approved.ledger);corruptApproval.batches[0].decision.by='c1';await denied(withdraw(corruptApproval),'INDEPENDENT_APPROVAL_REQUIRED');
const applied=await transition({...propose,ledger:approved.ledger,revision:2,action:'APPLY'});assert(applied.ok);await denied(withdraw(applied.ledger),'BATCH_STATE_CONFLICT');
const rejected=await transition({...propose,ledger:prepared.ledger,revision:1,actor:'d1',action:'REJECT'});assert(rejected.ok);await denied(withdraw(rejected.ledger),'BATCH_STATE_CONFLICT');
// Invalid, expired or absent source and changed placements do not prevent a
// retirement that changes no placements; they still cannot enable progression.
for(const input of [undefined,null,{roster:null},{roster:{source:{mode:'OFFICIAL'}}}])assert((await transition({...withdraw(approved.ledger),input})).ok);
const conflict=structuredClone(approved.ledger);conflict.placements.MOCK_STUDENT_A.version++;const retired=await transition(withdraw(conflict));assert(retired.ok);assert.deepEqual(retired.ledger.placements,conflict.placements);assert.equal((await transition({...propose,ledger:retired.ledger,revision:retired.ledger.revision,batchId:'MOCK_REPLACEMENT'})).reason,'PLACEMENT_CONFLICT');
console.log('PASS mock withdrawal core: coordinator-only pending/approved retirement without a current source, required reason/content/revision/time bindings, retained original approval/source/placements/history, immutable terminal batches, no replay, fresh changed-source proposal and unchanged progression conflict rules.');
