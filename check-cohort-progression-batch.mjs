import assert from 'node:assert/strict';
import {createMISAdapter} from './server/mis-adapter.mjs';
import {createMockCohortSnapshot,mockCohortConfiguration} from './fixtures/mis/cohort-mock.mjs';
import {createMockCohortLedger,transitionMockCohortBatch as transition} from './server/cohort-progression-batch.mjs';
const now='2026-10-23T08:00:00.000Z',config=mockCohortConfiguration();
const roster=await createMISAdapter({configuration:{mode:'MOCK'},snapshot:createMockCohortSnapshot(),clock:()=>now}).loadStudents();
const input={roster,structure:config.structure,cohort:config.cohorts[0],now};
const initial=createMockCohortLedger(input);assert(initial.ok);const ledger=initial.ledger;
const command={ledger,actor:'c1',revision:0,action:'PROPOSE',batchId:'MOCK_BATCH_PROPOSAL_1',reason:'Fictional semester progression rehearsal',input,now};
const saved=JSON.stringify(command);
let r=await transition(command);assert(r.ok);assert.equal(r.officialWriteBack,false);assert.equal(r.ledger.revision,1);assert.equal(r.batch.state,'PROPOSED');assert.match(r.batch.bindingHash,/^[a-f0-9]{64}$/);assert.deepEqual(r.ledger.placements,ledger.placements);assert.equal(JSON.stringify(command),saved);
const proposed=r.ledger,proposal=structuredClone(r.batch);
const review={...command,ledger:proposed,revision:1,actor:'d1',action:'APPROVE',reason:'Reviewed complete fictional cohort and exclusions'};
r=await transition(review);assert(r.ok);const approved=r.ledger;assert.equal(r.batch.state,'APPROVED');assert.deepEqual(r.batch.preview,proposal.preview);assert.deepEqual(r.batch.before,proposal.before);assert.equal(r.batch.bindingHash,proposal.bindingHash);assert.deepEqual(approved.placements,ledger.placements);
const apply={...command,ledger:approved,revision:2,action:'APPLY'};
r=await transition(apply);assert(r.ok);const applied=r.ledger;assert.equal(r.batch.state,'APPLIED');assert.equal(applied.revision,3);assert.equal(applied.history.length,3);assert.deepEqual(applied.history.slice(0,2),approved.history);
for(const suffix of ['A','C','D','E','F']){const id='MOCK_STUDENT_'+suffix;assert.equal(applied.placements[id].semesterId,'MOCK_SEMESTER_4');assert.equal(applied.placements[id].version,ledger.placements[id].version+1)}
for(const suffix of ['B','H']){const id='MOCK_STUDENT_'+suffix;assert.deepEqual(applied.placements[id],ledger.placements[id])}
assert.equal(r.batch.preview.counts.excludedLeftCollege,1);assert.deepEqual(r.batch.before,proposal.before);assert.deepEqual(applied.history[2].before,proposal.before);assert.deepEqual(applied.history[2].after,r.batch.after);
const original=JSON.stringify(applied);r.batch.after.MOCK_STUDENT_A.semesterId='FORGED';assert.equal(JSON.stringify(applied),original);
async function denied(c,reason){const before=JSON.stringify(c),r=await transition(c);assert.equal(r.ok,false,reason);assert.equal(r.reason,reason);assert.equal(r.changed,false);assert.equal(r.ledger,undefined);assert.equal(JSON.stringify(c),before)}
// Permissions must come from server session composition, never a request actor field.
for(const actor of ['s1','s2','m1','m2','a1','d1','r1','f1','unknown'])await denied({...command,actor},'ROLE_DENIED');
for(const actor of ['c1','a1','s1'])await denied({...review,actor},'ROLE_DENIED');
await denied({...command,revision:1},'STALE_LEDGER');await denied({...command,reason:' '},'REASON_REQUIRED');await denied({...command,action:'GRADUATE'},'INVALID_COMMAND');
await denied({...command,ledger:proposed,revision:1},'BATCH_ID_EXISTS');
await denied({...command,ledger:proposed,revision:1,batchId:'MOCK_SECOND_BATCH'},'COHORT_BATCH_PENDING');
await denied({...apply,ledger:proposed,revision:1},'BATCH_STATE_CONFLICT');
await denied({...review,ledger:approved,revision:2},'BATCH_STATE_CONFLICT');
await denied({...apply,ledger:applied,revision:3},'BATCH_STATE_CONFLICT');
await denied({...command,ledger:applied,revision:3,batchId:'MOCK_SECOND_BATCH'},'PLACEMENT_CONFLICT');
const rejected=await transition({...review,action:'REJECT',reason:'Needs correction'});assert(rejected.ok);assert.equal(rejected.batch.state,'REJECTED');assert.deepEqual(rejected.ledger.placements,ledger.placements);await denied({...apply,ledger:rejected.ledger,revision:2},'BATCH_STATE_CONFLICT');
// Stored source/structure/row decisions and reviewer approval must bind the exact proposal.
for(const mutate of [l=>l.batches[0].preview.rows[0].to.semesterId='MOCK_FORGED',l=>l.batches[0].before.MOCK_STUDENT_A.version++,l=>l.batches[0].reason='FORGED']){const l=structuredClone(approved);mutate(l);await denied({...apply,ledger:l},'BATCH_BINDING_INVALID')}
for(const mutate of [l=>l.batches[0].decision.by='c1',l=>l.batches[0].decision.bindingHash='FORGED',l=>delete l.batches[0].decision]){const l=structuredClone(approved);mutate(l);await denied({...apply,ledger:l},'INDEPENDENT_APPROVAL_REQUIRED')}
for(const mutate of [i=>i.roster.source.version++,i=>i.structure.version++,i=>i.roster.students[0].collegeStatus='LEFT_COLLEGE',i=>i.roster.students[0].version++]){const changed=structuredClone(input);mutate(changed);await denied({...apply,input:changed},'SOURCE_OR_PROPOSAL_CHANGED');await denied({...review,input:changed},'SOURCE_OR_PROPOSAL_CHANGED')}
const expired=structuredClone(input);expired.roster.source.validUntil=now;await denied({...apply,input:expired},'CURRENT_SOURCE_REQUIRED');
const ambiguous=structuredClone(input);ambiguous.roster.students[0].enrollments=[];await denied({...apply,input:ambiguous},'CURRENT_SOURCE_REQUIRED');
// A conflict even in the last row or excluded member prevents every placement update.
for(const suffix of ['A','F','B']){const l=structuredClone(approved);l.placements['MOCK_STUDENT_'+suffix].version++;await denied({...apply,ledger:l},'PLACEMENT_CONFLICT')}
await denied({...review,now:'2026-10-23T07:59:59.000Z'},'EVENT_TIME_INVALID');
await denied({...command,input:{...input,cohort:config.cohorts[1]}},'FINAL_SEMESTER_SEPARATE_REVIEW_REQUIRED');
// Adverse flags do not block inclusion or leak into proposal/history snapshots.
const flags=structuredClone(input);for(const s of flags.roster.students)Object.assign(s,{feesOverdue:true,failedSubjects:8,attendancePercent:0,standing:'HELD',active:false,privateNote:'PRIVATE_SENTINEL'});
const flagProposed=await transition({...command,input:flags});assert(flagProposed.ok);assert.deepEqual(flagProposed.batch.preview,proposal.preview);assert(!JSON.stringify(flagProposed).includes('PRIVATE_SENTINEL'));assert(!JSON.stringify(flagProposed).includes('@'));
assert.equal(JSON.stringify(command),saved);assert.deepEqual(proposed.batches[0],proposal);
assert.equal((await transition(null)).ok,false);assert.equal(createMockCohortLedger({...input,roster:null}).ok,false);
const retry=await transition({...command,ledger:rejected.ledger,revision:2,batchId:'MOCK_CORRECTED_BATCH'});assert(retry.ok);assert.deepEqual(retry.ledger.history.slice(0,2),rejected.ledger.history);assert.deepEqual(retry.ledger.batches[0],rejected.batch);
const pending=structuredClone(command),promise=transition(pending);pending.input.roster.students[0].collegeStatus='LEFT_COLLEGE';const detached=await promise;assert(detached.ok);assert.deepEqual(detached.batch.preview,proposal.preview);
console.log('PASS mock cohort batch core: bound proposal, independent review, explicit atomic mock apply, five included/only Left College excluded, unchanged final/other cohort, stale/replay/source/tamper/whole-batch conflict denial, immutable detached history and no input mutation. No persistence, route, UI or institutional acceptance is asserted.');
