import assert from 'node:assert/strict';import fs from 'node:fs';
import {prepareClubActionAssignment as prepare,clubActionAssignmentsConfiguration as defaults} from './server/club-action-assignment-adapter.mjs';
import {createClubActionClosurePilot as create,transitionClubActionClosurePilot as transition,readClubActionClosurePilot as read} from './server/club-action-closure-pilot.mjs';
const now='2026-10-18T16:00:00Z',validFrom='2026-10-01T00:00:00Z',validUntil='2027-01-01T00:00:00Z';
const authority={tenantId:'T',version:1,validFrom,validUntil,issuers:[{provider:'TEST',issuer:'ISSUER'}],people:['OWNER','REVIEWER','REQUESTER','APPROVER','OTHER'].map(personId=>({personId,status:'ACTIVE'})),identityLinks:['OWNER','REVIEWER','OTHER'].map(personId=>({id:'LINK-'+personId,version:1,provider:'TEST',issuer:'ISSUER',subject:personId,tenantId:'T',personId,status:'ACTIVE',validFrom,validUntil})),actorLinks:[['o','OWNER'],['alias','OWNER'],['r','REVIEWER']].map(([actorId,personId],i)=>({id:'A'+i,version:1,tenantId:'T',actorId,personId,status:'VERIFIED'})),roleAssignments:[]};
const session={provider:'TEST',issuer:'ISSUER',subject:'OWNER',tenantId:'T',authorizationVersion:1,expiresAt:'2026-10-18T17:00:00Z'};
const evaluation={id:'E',version:2,annualVersion:1,clubId:'C',cycle:'2026-27',state:'VERIFIED',criteria:[{key:'PLAN',title:'Delivery',action:{title:'Review delivery',owner:'o',due:'2026-12-01',state:'OPEN'}}]};
const scope={tenantId:'T',workspaceId:'W',clubId:'C',cycle:'2026-27',evaluationId:'E',evaluationVersion:2,annualVersion:1,criterionKey:'PLAN',closureId:'CLOSE'};
const input={session,authority,now,workspace:{id:'W',revision:3,data:{clubEvaluations:[evaluation]}},resource:{...scope,workspaceRevision:3}};
const configuration={tenantId:'T',workspaceId:'W',version:1,authorities:[{id:'AUTH',version:1,scope,approverPersonIds:['APPROVER'],validFrom,validUntil}],assignments:[{id:'ASSIGN',version:1,scope,authorityId:'AUTH',authorityVersion:1,ownerActorId:'o',reviewerActorId:'r',status:'APPROVED',requestedByPersonId:'REQUESTER',approvedByPersonId:'APPROVER',approvedAt:validFrom,approvalReference:'FICTIONAL-APPROVAL',validFrom,validUntil}]};

import {DatabaseSync} from 'node:sqlite';
import {createEngine} from './server/engine.mjs';
import {saveClubActionClosureIsolated as save} from './server/club-action-save-pilot.mjs';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_motionless_nova.sql','utf8').replaceAll('--> statement-breakpoint',''));
let race=false;const db={prepare(sql){let args=[];return {bind(...values){args=values;return this},runSync(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}},async batch(statements){if(race){race=false;const row=loadRow();row.data.winner='PRESERVED';sqlite.prepare('UPDATE kcc_workspaces SET revision=revision+1,payload=? WHERE id=?').run(JSON.stringify(row.data),'W')}sqlite.exec('BEGIN');try{const result=statements.map(s=>s.runSync());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const data=createEngine(null,'s1').snapshot();data.clubEvaluations=[evaluation];sqlite.prepare('INSERT INTO kcc_workspaces (id,revision,payload,commit_id,updated_at) VALUES (?,?,?,?,?)').run('W',0,JSON.stringify(data),'initial',now);
const evidenceRegistry=[{id:'PROOF',version:1,binding:'PRIVATE binding',verified:true,current:true,clubId:'C',cycle:'2026-27'}];
const loadRow=()=>{const r=sqlite.prepare('SELECT * FROM kcc_workspaces WHERE id=?').get('W');return {id:r.id,revision:r.revision,data:JSON.parse(r.payload)}};
let loads=0,beforeLoad=()=>{};async function loadTrusted(){loads++;beforeLoad(loads);const workspace=loadRow();return structuredClone({...input,workspace,resource:{...scope,workspaceRevision:workspace.revision},configuration,evidenceRegistry})}
const stored=()=>loadRow().data.clubActionClosures?.[0],audits=()=>Number(sqlite.prepare('SELECT COUNT(*) AS n FROM kcc_server_audit').get().n),snapshot=()=>JSON.stringify({row:loadRow(),audit:sqlite.prepare('SELECT * FROM kcc_server_audit ORDER BY revision').all()});
function request(id,action,fields={}){return {id,closureId:'CLOSE',action,fields,expectedWorkspaceRevision:loadRow().revision,expectedClosureRevision:stored()?.revision||0}}
const exec=r=>save({db,loadTrusted,request:r}),deny=async(r,pattern)=>{const before=snapshot();await assert.rejects(exec(r),pattern);assert.equal(snapshot(),before)};
const first=request('CREATE-0001','CREATE');assert.equal((await exec(first)).state,'OPEN');assert.equal((await exec(first)).replayed,true);assert.equal(audits(),1);
await deny({...first,action:'SUBMIT'},/REQUEST_ID_CONFLICT/);await deny(request('CREATE-0002','CREATE'),/ALREADY_EXISTS/);await deny(request('FORGE-00001','SUBMIT',{actorPersonId:'OWNER'}),/INVALID_CLOSURE_REQUEST/);
const fields={explanation:'PRIVATE completion explanation',evidence:[{id:'PROOF',version:1}]};
await deny(request('FORGE-PROOF','SUBMIT',{...fields,evidence:[{id:'PROOF',version:1,verified:true}]}),/UNTRUSTED_EVIDENCE_FIELDS/);
sqlite.exec("CREATE TRIGGER fail_closure_audit BEFORE INSERT ON kcc_server_audit BEGIN SELECT RAISE(ABORT,'audit failed'); END;");const submit=request('SUBMIT-0001','SUBMIT',fields);await deny(submit,/audit failed/);assert.equal(stored().state,'OPEN');sqlite.exec('DROP TRIGGER fail_closure_audit');
const competing=request('SUBMIT-0002','SUBMIT',fields);const outcomes=await Promise.allSettled([exec(submit),exec(competing)]);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.equal(outcomes.filter(r=>r.status==='rejected').length,1);assert.equal(audits(),2);assert.equal(stored().submissions.length,1);
const winner=outcomes[0].status==='fulfilled'?submit:competing;assert.equal((await exec(winner)).replayed,true);await deny({...winner,fields:{...fields,explanation:'Changed duplicate'}},/REQUEST_ID_CONFLICT/);
input.session.subject='REVIEWER';loads=0;beforeLoad=n=>{if(n===2)configuration.assignments[0].revokedAt=now};await deny(request('REVOKE-0001','VERIFY',{reason:'PRIVATE decision'}),/ASSIGNMENT_INACTIVE/);beforeLoad=()=>{};delete configuration.assignments[0].revokedAt;
const beforeRace=audits();race=true;await assert.rejects(exec(request('RACE-00001','VERIFY',{reason:'PRIVATE decision'})),/WORKSPACE_REVISION_CONFLICT/);assert.equal(loadRow().data.winner,'PRESERVED');assert.equal(audits(),beforeRace);assert.equal(stored().state,'SUBMITTED');
evidenceRegistry[0].binding='PRIVATE changed binding';await deny(request('STALE-PROOF','VERIFY',{reason:'PRIVATE decision'}),/EVIDENCE_CHANGED/);evidenceRegistry[0].binding='PRIVATE binding';
const verified=await exec(request('VERIFY-0001','VERIFY',{reason:'PRIVATE decision'}));assert.equal(verified.state,'VERIFIED');assert.ok(!JSON.stringify(verified).includes('PRIVATE'));assert.ok(!JSON.stringify(verified).includes('OWNER'));

const trusted=await loadTrusted();const {configuration:config,evidenceRegistry:registry,...identityInput}=trusted;const prepared=prepare(identityInput,config);assert.equal(prepared.ok,true);const projected=read(stored(),{...prepared,now,evaluation,evidenceRegistry:registry});assert.equal(projected.state,'VERIFIED');assert.equal(projected.latestSubmission.evidenceCurrent,true);assert.ok(!JSON.stringify(projected).includes('PRIVATE binding'));
const audit=sqlite.prepare('SELECT * FROM kcc_server_audit ORDER BY revision DESC LIMIT 1').get();const detail=JSON.parse(audit.record);assert.equal(detail.evaluationId,'E');assert.equal(detail.assignmentId,'ASSIGN');assert.equal(detail.personId,'REVIEWER');assert.ok(!audit.record.includes('PRIVATE'));assert.equal(audits(),stored().operations.length);
// Every generic role view excludes raw closure records; internal persistence retains them.
for(const actor of ['s1','s2','m1','m2','c1','d1','sa1','a1','f1','fv1','r1','np1','na1','dc1','da1']){const engine=createEngine(loadRow().data,actor);assert.equal(engine.view().clubActionClosures,undefined);assert.deepEqual(engine.snapshot().clubActionClosures,loadRow().data.clubActionClosures)}
const afterGeneric=createEngine(loadRow().data,'s1').run('refreshNotifications',[]);assert.equal(afterGeneric.view.clubActionClosures,undefined);assert.deepEqual(afterGeneric.data.clubActionClosures,loadRow().data.clubActionClosures);
configuration.assignments[0].revokedAt=now;await deny(winner,/ASSIGNMENT_INACTIVE/);delete configuration.assignments[0].revokedAt;
await deny({...request('STALE-00001','VERIFY',{reason:'Test'}),expectedWorkspaceRevision:0},/WORKSPACE_REVISION_CONFLICT/);
assert.deepEqual(loadRow().data.clubEvaluations,[evaluation]);
for(const file of ['server/service.ts','app/api/workspace/route.ts','scripts/prepare-workspace.mjs'])assert.doesNotMatch(fs.readFileSync(file,'utf8'),/(?:from|import)[^\n]*club-action-save-pilot/);
console.log('PASS: isolated SQLite closure save/audit rollback, idempotent retry/conflict, concurrent revision winner, fresh revocation checks, evidence freshness, protected read, minimal receipts/audit and all-role generic projection denial with raw persistence preserved. No live route or records.');
sqlite.close();
