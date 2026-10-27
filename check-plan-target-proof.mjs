import {projectApprovedClubCalendar} from './server/approved-club-calendar.mjs';
import {amendmentEnabled} from './server/plan-amendment.mjs';
import assert from 'node:assert/strict';
import {createPlanBindingSaveFixture} from './check-annual-target-plan-binding.mjs';
import {saveAnnualTargetPlanBinding} from './server/annual-target-save.mjs';
import {attachPlanTargetProofs,planTargetProofSummary} from './server/plan-target-proof.mjs';
import {projectExistingPlanApprovalSource} from './server/plan-approval-source.mjs';
import {createPlanReviewFixture} from './check-plan-approval-review.mjs';
import {createPlanApprovalRuntime} from './server/plan-approval-runtime.mjs';
import {readPlanApprovalReview as read,decidePlanApprovalReview as decide} from './server/plan-approval-review.mjs';
const now='2026-10-26T04:00:00.000Z';
const bindingFixture=await createPlanBindingSaveFixture();await saveAnnualTargetPlanBinding({...bindingFixture,clock:()=>now});const loaded=await bindingFixture.loadTrusted();bindingFixture.close();
loaded.sourceConfiguration.sources[0].originatingRole='STUDENT';
const source=projectExistingPlanApprovalSource({workspace:loaded.planWorkspace,reference:{planId:'PLAN1',planVersion:1},configuration:loaded.sourceConfiguration,personMap:loaded.personMap,now});
const input={plan:source,workspace:loaded.planWorkspace,targetWorkspace:loaded.workspace,catalogWorkspace:loaded.catalogWorkspace};const plan=attachPlanTargetProofs(input);assert.equal(plan.content.targetProofs.items.length,1);assert.equal(source.content.targetProofs,undefined);assert.equal(planTargetProofSummary(plan)[0].value,'1');assert(!JSON.stringify(planTargetProofSummary(plan)).includes('reason'));
for(const change of [i=>i.targetWorkspace.data.planBindings[0].sourceSnapshot.items[0].end='2026-12-10',i=>i.targetWorkspace.data.allocations[0].versions[0].value='0',i=>i.targetWorkspace.data.targets[0].versions[0].value='4',i=>i.targetWorkspace.data.planBindings.push(structuredClone(i.targetWorkspace.data.planBindings[0])),i=>i.catalogWorkspace.data.kpis[0].version=2,i=>i.plan.content.source.amendmentId='PENDING-REBASE']){const i=structuredClone(input);change(i);assert.throws(()=>attachPlanTargetProofs(i))}
// Existing plan review fixture supplies real policy/runtime/persistence and grants.
const f=createPlanReviewFixture('CLUB','PLAN-WORKSPACE');const data=f.row().data;data.clubs=structuredClone(loaded.planWorkspace.data.clubs);f.sql.prepare('UPDATE kcc_workspaces SET payload=? WHERE id=?').run(JSON.stringify(data),'PLAN-WORKSPACE');f.reference.planId='PLAN1';f.configuration.sources=[{...f.configuration.sources[0],planId:'PLAN1',clubId:'CLUB-1',unitId:'SA',targetBindings:'REQUIRED',allowAmendments:true}];f.configuration.assignments=f.configuration.assignments.map(a=>({...a,planId:'PLAN1',unitId:'SA'}));
const auth=JSON.parse(JSON.stringify(f.authority).replaceAll('"OWNER"','"P-DEPARTMENT"'));auth.actorLinks[0].actorId='owner1';for(const a of auth.roleAssignments)a.grant.scope={tenantId:'KCC',departmentId:'SA',recordId:'PLAN1'};
for(const w of [loaded.workspace,loaded.catalogWorkspace])f.sql.prepare('INSERT INTO kcc_workspaces VALUES(?,?,?,?,?)').run(w.id,w.revision,JSON.stringify(w.data),'source',now);
const row=id=>{const r=f.sql.prepare('SELECT * FROM kcc_workspaces WHERE id=?').get(id);return {id,revision:r.revision,data:JSON.parse(r.payload)}};
const providers={loadVerifiedSession:async({subject})=>({provider:'FICTIONAL',issuer:'fixture',subject,tenantId:'KCC',authorizationVersion:1,expiresAt:f.configuration.validUntil}),loadIdentityAuthority:async()=>auth,loadWorkspace:async()=>f.row(),loadApprovalConfiguration:async()=>f.configuration,loadAuthorizationFence:async()=>({id:'AUTH',revision:1,authorizationVersion:auth.version,configurationVersion:f.configuration.version}),loadAnnualTargetWorkspace:async()=>row(loaded.workspace.id),loadStrategicCatalogWorkspace:async()=>row(loaded.catalogWorkspace.id)};
const runtime=createPlanApprovalRuntime({configuration:{enabled:true},providers,clock:()=>now}),reference={planId:'PLAN1',planVersion:1};
async function preview(subject='SUB0'){return read({runtime,subject,reference})}async function post(p,action,subject,rt=runtime,changes){return decide({runtime:rt,db:{prepare(q){let args;return {bind(...v){args=v;return this},run(){return {meta:{changes:Number(f.sql.prepare(q).run(...args).changes)}}}}},async batch(statements){f.sql.exec('BEGIN');try{const r=statements.map(s=>s.run());f.sql.exec('COMMIT');return r}catch(e){f.sql.exec('ROLLBACK');throw e}}},subject,body:{...f.request(p,action),...(changes?{changes}:{})},clock:()=>now})}
for(const name of ['loadAnnualTargetWorkspace','loadStrategicCatalogWorkspace']){const stale=createPlanApprovalRuntime({configuration:{enabled:true},providers:{...providers,[name]:async()=>{const w=await providers[name]();return {...w,revision:w.revision+999}}},clock:()=>now});const proposal=await read({runtime:stale,subject:'SUB0',reference}),before=f.row().revision;await assert.rejects(post(proposal,'CREATE','SUB0',stale),e=>e.status===409||/REVISION/.test(e.message));assert.equal(f.row().revision,before);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM kcc_server_audit').get().n,0)}
let p=await preview();assert.equal(p.targetContributions.length,1);assert.equal(p.targetContributions[0].kpiId,'K1');assert(!JSON.stringify(p.targetContributions).includes('issuedByPersonId'));
for(const [subject,action]of [['SUB0','CREATE'],['SUB0','SUBMIT'],['SUB1','UNIT_FORWARD'],['SUB2','FINANCE_FORWARD'],['SUB3','APPROVE']]){p=await preview(subject);await post(p,action,subject)}
const approved=f.row().data.planApprovalRecords[0];assert.equal(approved.state,'APPROVED');assert.equal(approved.approvedSnapshot.content.targetProofs.items[0].binding.id,'BIND1');assert.equal(approved.executionAuthorized,false);assert.deepEqual(f.row().data.clubs,data.clubs);
assert.equal(amendmentEnabled(await runtime.loadTrusted({subject:'SUB0',reference})),true);
const changes=[{type:'EXTEND_ITEM_DATES',itemId:'ITEM1',newEnd:'2026-11-05',newReportDue:'2026-11-07'}];
for(const invalidChanges of [[{...changes[0],newEnd:'2028-01-01',newReportDue:'2028-01-02'}],[{type:'ADD_ITEM',item:{}}]]){const before=JSON.stringify(f.row());await assert.rejects(post(await preview(),'DRAFT_AMENDMENT','SUB0',runtime,invalidChanges));assert.equal(JSON.stringify(f.row()),before)}
for(const name of ['loadAnnualTargetWorkspace','loadStrategicCatalogWorkspace']){const stale=createPlanApprovalRuntime({configuration:{enabled:true},providers:{...providers,[name]:async()=>({...await providers[name](),revision:999})},clock:()=>now});const before=JSON.stringify(f.row());await assert.rejects(post(await read({runtime:stale,subject:'SUB0',reference}),'DRAFT_AMENDMENT','SUB0',stale,changes));assert.equal(JSON.stringify(f.row()),before)}
const calendar=()=>projectApprovedClubCalendar({data:f.row().data,workspaceId:'PLAN-WORKSPACE',audience:'STUDENT_AFFAIRS_OWNER_DEMO'});
assert.equal(calendar().events[0].end,'2026-11-02');
const ledgerBefore=JSON.stringify(row(loaded.workspace.id));
const amended=await post(await preview(),'DRAFT_AMENDMENT','SUB0',runtime,changes);assert.equal(amended.planVersion,2);
assert.deepEqual(f.row().data.planApprovalRecords[0],approved);assert.equal(f.row().data.planApprovalRecords.filter(r=>r.state==='APPROVED').at(-1).planVersion,1);
assert.equal(calendar().events[0].end,'2026-11-02');
reference.planVersion=2;
for(const person of ['SUB1','SUB2','SUB3'])await assert.rejects(preview(person));
f.configuration.assignments.push(...f.configuration.assignments.map(a=>({...a,id:a.id+'-V2',planVersion:2})));
for(const [subject,action]of [['SUB0','SUBMIT'],['SUB1','UNIT_FORWARD'],['SUB2','FINANCE_FORWARD'],['SUB3','APPROVE']]){assert.equal(calendar().events[0].end,'2026-11-02');p=await preview(subject);await post(p,action,subject)}
assert.equal(calendar().events[0].end,'2026-11-05');assert.equal(calendar().events.length,3);
const successor=f.row().data.planApprovalRecords[1];assert.equal(successor.state,'APPROVED');assert.equal(successor.approvedSnapshot.content.source.proposedRecord.items[0].end,'2026-11-05');assert.deepEqual(successor.approvedSnapshot.content.targetProofs,approved.approvedSnapshot.content.targetProofs);assert.equal(JSON.stringify(row(loaded.workspace.id)),ledgerBefore);assert.deepEqual(f.row().data.planApprovalRecords[0],approved);assert.deepEqual(f.row().data.clubs,data.clubs);

// Source revision changes during the actual transaction cannot silently save.
const fresh=createPlanApprovalRuntime({configuration:{enabled:true},providers:{...providers,loadAnnualTargetWorkspace:async()=>({...row(loaded.workspace.id),revision:999})},clock:()=>now});const trusted=await fresh.loadTrusted({subject:'SUB0',reference});assert.equal(trusted.sourceFences.length,2);
// Historical approval cannot be retrofitted with a changed proof.
const invalid=row(loaded.workspace.id);invalid.data.planBindings[0].value='2';f.sql.prepare('UPDATE kcc_workspaces SET payload=?,revision=revision+1 WHERE id=?').run(JSON.stringify(invalid.data),invalid.id);await assert.rejects(preview('SUB3'));assert.equal(f.row().data.planApprovalRecords[0].sourceBinding,approved.sourceBinding);
f.close();console.log('PASS target-proof adoption: exact prepared links, source/target/catalog validation, private reviewer summary, existing full AP001 runtime→SQLite route, immutable approved snapshot and no execution authority. Target-linked date successor follows full approval; pending calendar retains original dates; final calendar replaces dates once; ledger contributions unchanged; out-of-cycle and stale source-fence amendments denied. Full ECO journeys are not established.');
