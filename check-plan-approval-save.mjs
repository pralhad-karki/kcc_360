import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createEngine} from './server/engine.mjs';
import {newPlanApproval} from './server/plan-approval-policy.mjs';
import {savePlanApproval as save} from './server/plan-approval-save.mjs';
const now='2026-10-25T15:00:00.000Z',until='2026-10-26T00:00:00.000Z';
let caseCount=0;
async function test(name,fn){await fn();caseCount++;console.log('PASS '+name)}
function fixture(kind='ACADEMIC'){
 const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_motionless_nova.sql','utf8').replaceAll('--> statement-breakpoint',''));
 const data=createEngine(null,'s1').snapshot();data.retainedHistoricalEvidence={attendance:['complete'],certificates:['verified']};
 const plan={id:'PLAN-1',version:1,institutionId:'KCC',unitId:'D1',kind,ownerActorId:'m1',ownerPersonId:'OWNER',content:{title:'Fictional '+kind,budget:0,dates:['2026-11-01','2026-11-02']}};
 const raw={id:plan.id,version:1,owner:'m1',title:plan.content.title,state:'DRAFT',items:[{id:'ITEM-PLAN-1',budget:'0'}]};
 if(kind==='ACADEMIC')data.plans.push(raw);else data.clubs.push({id:'C-PLAN-1',owner:'m1',plans:[raw]});
 plan.content.source={workspaceId:'W',kind,clubId:kind==='CLUB'?'C-PLAN-1':null,record:structuredClone(raw)};
 const people=['OWNER','UNIT','FINANCE','PRINCIPAL'].map(personId=>({personId,tenantId:'KCC',active:true}));
 const grants=people.map((p,i)=>({id:'G'+i,version:1,personId:p.personId,roleId:['AUTHOR','UNIT_REVIEWER','FINANCE_ADMINISTRATOR','PRINCIPAL'][i],status:'APPROVED',effect:'ALLOW',scope:{tenantId:'KCC',departmentId:'D1',recordId:plan.id},permissions:[['PLAN.SUBMIT','PLAN.UNIT_REVIEW','PLAN.FINANCE_REVIEW','PLAN.FINAL_APPROVE'][i]],clearance:'INTERNAL'}));
 const assignments=people.slice(1).map((p,i)=>({id:'A'+i,version:1,status:'ACTIVE',stage:['unit','finance','principal'][i],planId:plan.id,planVersion:1,institutionId:'KCC',unitId:'D1',personId:p.personId,grantId:'G'+(i+1),grantVersion:1}));
 sql.prepare('INSERT INTO kcc_workspaces VALUES (?,?,?,?,?)').run('W',0,JSON.stringify(data),'initial',now);
 sql.prepare('INSERT INTO kcc_workspaces VALUES (?,?,?,?,?)').run('AUTHORITY',1,'{}','fence',now);
 let actor=0,loads=0,hook=()=>{},beforeBatch=()=>{},enabled=true,clockNow=now;
 const row=()=>{const r=sql.prepare('SELECT * FROM kcc_workspaces WHERE id=?').get('W');return {id:r.id,revision:r.revision,data:JSON.parse(r.payload)}};
 const records=()=>row().data.planApprovalRecords??[];
 const current=()=>records().find(r=>r.planId===plan.id&&r.planVersion===plan.version);
 const db={prepare(query){let values=[];return {bind(...args){values=args;return this},run(){return {meta:{changes:Number(sql.prepare(query).run(...values).changes)}}}}},async batch(statements){beforeBatch();sql.exec('BEGIN');try{const results=statements.map(s=>s.run());sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}};
 const loadTrusted=async()=>{hook(++loads);return structuredClone({configuration:{enabled,version:1},workspace:row(),subject:'SUB-'+actor,plan,context:{plan,principal:people[actor],grants,assignments,reviewers:people,now},authorityFence:{workspaceId:'AUTHORITY',revision:1},validUntil:until})};
 const request=(action,extra={})=>({operationId:'OP-'+crypto.randomUUID(),planId:plan.id,planVersion:plan.version,action,expectedWorkspaceRevision:row().revision,expectedReviewRevision:action==='CREATE'?0:current()?.revision??0,expectedBinding:newPlanApproval({plan,now}).sourceBinding,reason:'PRIVATE REVIEW REASON',...extra});
 const call=r=>save({db,loadTrusted,request:r,clock:()=>clockNow});
 const snapshot=()=>JSON.stringify({workspace:row(),audits:sql.prepare('SELECT * FROM kcc_server_audit ORDER BY revision').all()});
 const deny=async(r,pattern)=>{const before=snapshot();await assert.rejects(call(r),pattern);assert.equal(snapshot(),before)};
 return {sql,plan,people,grants,assignments,row,records,current,request,call,snapshot,deny,setActor:n=>actor=n,setHook:fn=>{loads=0;hook=fn},setBeforeBatch:fn=>beforeBatch=fn,setEnabled:v=>enabled=v,setClock:v=>clockNow=v,close:()=>sql.close()};
}
for(const kind of ['ACADEMIC','CLUB'])await test(kind+' full route, atomic audit and duplicate receipt',async()=>{
 const f=fixture(kind),initial=f.row().data;
 const actions=['CREATE','SUBMIT','UNIT_FORWARD','FINANCE_FORWARD','APPROVE'];
 for(const [i,action]of actions.entries()){
  f.setActor(Math.max(0,i-1));const r=f.request(action),result=await f.call(r),revision=f.row().revision;
  assert.equal(result.executionAuthorized,false);assert.equal((await f.call(r)).replayed,true);assert.equal(f.row().revision,revision);
  await f.deny({...r,reason:'altered reason'},/OPERATION_ID_CONFLICT/);
 }
 assert.equal(f.current().state,'APPROVED');assert.equal(f.current().decisions.length,4);
 assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM kcc_server_audit').get().n,5);
 assert.equal(f.current().approvedSnapshot.content.budget,0);
 const after=f.row().data;delete after.planApprovalRecords;assert.deepEqual(after,initial);
 assert(!JSON.stringify(f.sql.prepare('SELECT record FROM kcc_server_audit').all()).includes('PRIVATE'));
 await f.deny(f.request('APPROVE'),/INVALID_TRANSITION/);
 f.close();
});
await test('audit failure rolls back review, receipt and workspace',async()=>{const f=fixture();f.sql.exec("CREATE TRIGGER fail_audit BEFORE INSERT ON kcc_server_audit BEGIN SELECT RAISE(ABORT,'audit unavailable'); END");await f.deny(f.request('CREATE'),/audit unavailable/);assert.equal(f.current(),undefined);f.close()});
await test('concurrent duplicate creates one receipt and audit',async()=>{const f=fixture(),r=f.request('CREATE');const outcomes=await Promise.allSettled([f.call(r),f.call(r)]);assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);assert.equal(f.current().operations.length,1);assert.equal(f.row().revision,1);assert.equal((await f.call(r)).replayed,true);f.close()});
await test('competing commands preserve the winning write only',async()=>{const f=fixture();await f.call(f.request('CREATE'));const a=f.request('SUBMIT'),b=f.request('SUBMIT'),outcomes=await Promise.allSettled([f.call(a),f.call(b)]);assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);assert.equal(f.current().decisions.length,1);assert.equal(f.current().operations.length,2);f.close()});
await test('unrelated concurrent update is never overwritten',async()=>{const f=fixture();let once=true;f.setBeforeBatch(()=>{if(once){once=false;const w=f.row();w.data.concurrentWinner=true;f.sql.prepare('UPDATE kcc_workspaces SET payload=?,revision=revision+1 WHERE id=?').run(JSON.stringify(w.data),'W')}});await assert.rejects(f.call(f.request('CREATE')),/REVISION_CONFLICT/);assert.equal(f.row().data.concurrentWinner,true);assert.equal(f.records().length,0);assert.equal(f.sql.prepare('SELECT COUNT(*) n FROM kcc_server_audit').get().n,0);f.close()});
await test('transaction authority fence blocks post-load revocation',async()=>{const f=fixture();f.setBeforeBatch(()=>f.sql.prepare('UPDATE kcc_workspaces SET revision=revision+1 WHERE id=?').run('AUTHORITY'));await f.deny(f.request('CREATE'),/REVISION_CONFLICT/);f.close()});
await test('authority changes between trusted reads are denied',async()=>{const f=fixture();f.setHook(n=>{if(n===2)f.grants[0].version++});await f.deny(f.request('CREATE'),/AUTHORITY_CHANGED/);f.close()});
await test('revoked submitter cannot replay an old receipt',async()=>{const f=fixture(),r=f.request('CREATE');await f.call(r);f.grants[0].status='REVOKED';await f.deny(r,/NO_APPLICABLE_GRANT/);f.close()});
await test('expired session, disabled configuration and client authority denied',async()=>{const f=fixture();f.setClock(until);await f.deny(f.request('CREATE'),/AUTHORITY_EXPIRED/);f.setClock(now);f.setEnabled(false);await f.deny(f.request('CREATE'),/SOURCE_NOT_ENABLED/);f.setEnabled(true);await f.deny({...f.request('CREATE'),principal:f.people[0]},/INVALID_PLAN_APPROVAL_REQUEST/);f.close()});
await test('wrong actor and stale workspace produce no decision',async()=>{const f=fixture();f.setActor(1);await f.deny(f.request('CREATE'),/PLAN_OWNER_REQUIRED/);f.setActor(0);await f.call(f.request('CREATE'));await f.deny(f.request('SUBMIT',{expectedWorkspaceRevision:0}),/WORKSPACE_REVISION_CONFLICT/);f.close()});
await test('return and versioned successor preserve original baseline',async()=>{const f=fixture();await f.call(f.request('CREATE'));await f.call(f.request('SUBMIT'));f.setActor(1);await f.call(f.request('RETURN'));const original=structuredClone(f.current());f.plan.version=2;f.plan.content.dates[1]='2026-11-04';for(const a of f.assignments)a.planVersion=2;f.setActor(0);await f.call(f.request('CREATE'));assert.deepEqual(f.records()[0],original);assert.equal(f.current().previous.state,'REVISION_REQUIRED');assert.equal(f.current().executionAuthorized,false);assert.equal(f.records().length,2);f.close()});
await test('stale exact plan binding and cross-person receipt access denied',async()=>{const f=fixture(),r=f.request('CREATE');f.plan.content.budget=1;await f.deny(r,/STALE_PLAN/);f.plan.content.budget=0;await f.call(r);f.setActor(1);await f.deny(r,/OPERATION_ID_CONFLICT/);f.close()});
await test('all generic role projections hide raw approvals and retain records',async()=>{const f=fixture();await f.call(f.request('CREATE'));const stored=f.row().data;for(const actor of createEngine(null,'s1').actors().map(a=>a.id)){const e=createEngine(stored,actor);assert.equal(e.view().planApprovalRecords,undefined);assert.deepEqual(e.snapshot().planApprovalRecords,stored.planApprovalRecords)}const after=createEngine(stored,'s1').run('refreshNotifications',[]);assert.equal(after.view.planApprovalRecords,undefined);assert.deepEqual(after.data.planApprovalRecords,stored.planApprovalRecords);f.close()});
console.log(`${caseCount} SQLite persistence cases passed. No live route, institutional activation, source projection or distributed external-authority lock asserted.`);
