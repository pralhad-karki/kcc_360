import assert from 'node:assert/strict';
import {workspaceCapacityFixture,bytes} from './fixtures/workspace-capacity.mjs';
let count=0;
async function test(name,fn){const f=await workspaceCapacityFixture();try{await fn(f);count++;console.log('PASS '+name)}finally{await f.close()}}
await test('10,000 existing fictional sessions use read-only indexed lookup',async f=>{
 const before=f.sqlite.prepare('SELECT * FROM kcc_demo_sessions WHERE subject=?').get('fictional-session-9999');
 assert.equal(await f.service.readSession('fictional-session-9999'),'s1');assert.equal(f.metrics().sessionInsertAttempts,0);
 assert.deepEqual(f.sqlite.prepare('SELECT * FROM kcc_demo_sessions WHERE subject=?').get('fictional-session-9999'),before);
 const response=await f.get('fictional-session-9999');assert.equal(response.status,200);assert.equal((await response.json()).actor,'s1');assert.equal(f.metrics().sessionInsertAttempts,0);assert.equal(f.auditCount(),0);
});
await test('simultaneous first-session creation preserves one row and concurrent actor selection',async f=>{
 const values=await Promise.all([f.service.readSession('fictional-new'),f.service.readSession('fictional-new')]);assert.deepEqual(values,['s1','s1']);assert.equal(f.sqlite.prepare('SELECT COUNT(*) n FROM kcc_demo_sessions WHERE subject=?').get('fictional-new').n,1);
 f.hookNextRun((sql,query)=>{assert(query.startsWith('INSERT OR IGNORE INTO kcc_demo_sessions'));sql.prepare('INSERT INTO kcc_demo_sessions VALUES(?,?,?)').run('fictional-racing','m1','2026-11-03T00:00:00.000Z')});assert.equal(await f.service.readSession('fictional-racing'),'m1');assert.equal(f.auditCount(),0);
});
await test('UTF-8 bytes above the workspace limit reject atomically through the actual route',async f=>{
 const d=JSON.parse(f.row().payload);d.capacityFixturePadding='';d.capacityFixturePadding='क'.repeat(Math.floor((1_998_000-bytes(d))/3));f.seedPayload(d);
 const before=f.row();assert(bytes(before.payload)<2_000_000);assert(before.payload.length<2_000_000);
 const response=await f.post('fictional-session-0',f.message(0,before.revision,'क'.repeat(1000)));assert.equal(response.status,413);assert.deepEqual(f.row(),before);assert.equal(f.auditCount(),0);assert.equal(f.metrics().workspaceUpdates,0);
});
await test('valid large Nepali payload still saves once with matching audit',async f=>{
 const d=JSON.parse(f.row().payload);d.capacityFixturePadding='';d.capacityFixturePadding='क'.repeat(Math.floor((1_900_000-bytes(d))/3));f.seedPayload(d);
 const response=await f.post('fictional-session-0',f.message(0,0,'क'.repeat(1000)));assert.equal(response.status,200);assert(bytes(f.row().payload)<2_000_000);assert.equal(f.auditCount(),1);assert.equal(f.row().revision,1);
});
await test('different-project simultaneous writes expose global contention without lost updates',async f=>{
 const results=await Promise.all([f.post('fictional-session-0',f.message(0,0,'Fictional concurrent A')),f.post('fictional-session-1',f.message(1,0,'Fictional concurrent B'))]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.equal(f.row().revision,1);assert.equal(f.auditCount(),1);const d=JSON.parse(f.row().payload);assert.equal(d.projects.reduce((n,p)=>n+p.messages.length,0),1);
 // This is diagnostic evidence of the existing shared revision bottleneck,
 // not acceptance of two independent edits conflicting at enterprise scale.
});
console.log(JSON.stringify({passed:count,sessionRowsPerFixture:10000,institutionalAccountsSimulated:false,hostedAcceptance:false}));
