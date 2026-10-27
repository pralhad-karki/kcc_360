import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';
import {pathToFileURL} from 'node:url';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_motionless_nova.sql','utf8').replaceAll('--> statement-breakpoint',''));
let race=false;
const DB={prepare(sql){let values=[];return {bind(...v){values=v;return this},async run(){let r=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}}},async first(){return sqlite.prepare(sql).get(...values)||null}}},async batch(statements){sqlite.exec('BEGIN');try{if(race){sqlite.prepare('UPDATE kcc_workspaces SET revision=revision+1').run();race=false}let result=[];for(const s of statements)result.push(await s.run());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
globalThis.__testEnv={DB,KCC_DEMO_OWNER_EMAIL:'owner@example.test'};globalThis.__testIdentity={userId:'site-subject-1',email:'owner@example.test'};
let source=fs.readFileSync('server/service.ts','utf8').replace("'./audit-command-map.mjs'",JSON.stringify(pathToFileURL(process.cwd()+'/server/audit-command-map.mjs').href)).replace("import { env } from 'cloudflare:workers';","const env=globalThis.__testEnv;").replace("import { getChatGPTUser } from '../app/chatgpt-auth';","const getChatGPTUser=async()=>globalThis.__testIdentity;").replace("'./engine.mjs'",JSON.stringify(pathToFileURL(process.cwd()+'/server/engine.mjs').href));
source=source.replace("'./form-fields.mjs'",JSON.stringify(pathToFileURL(process.cwd()+'/server/form-fields.mjs').href));
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const svc=await import('data:text/javascript;base64,'+Buffer.from(output).toString('base64'));
assert.equal((await svc.identity()).userId,'site-subject-1');globalThis.__testIdentity=null;await assert.rejects(svc.identity(),e=>e.status===401);globalThis.__testIdentity={userId:'other',email:'other@example.test'};await assert.rejects(svc.identity(),e=>e.status===403);globalThis.__testIdentity={userId:'site-subject-1',email:'owner@example.test'};
assert.throws(()=>svc.sameOrigin(new Request('https://demo.test/api/workspace',{method:'POST',headers:{origin:'https://evil.test','content-type':'application/json'}})),e=>e.status===403);
let first=await svc.workspaceResponse('site-subject-1');assert.equal(first.revision,0);assert.equal(first.data.projects.length,8);
// Fixture only: confidential monitoring storage must never enter generic API views.
const monitoringFixture=[{id:'MON-PRIVATE',versions:[{content:{achievementNotes:'PRIVATE MONITORING NARRATIVE'}}],decisions:[{reason:'PRIVATE MONITORING FEEDBACK'}],operations:[{id:'PRIVATE REQUEST RECEIPT',fingerprint:'PRIVATE OPERATION HASH'}]}];
let fixtureRow=JSON.parse(sqlite.prepare('SELECT payload FROM kcc_workspaces').get().payload);fixtureRow.monitoringReviews=monitoringFixture;fixtureRow.clubActionClosures=[{id:'PRIVATE CLOSURE',submissions:[{explanation:'PRIVATE CLOSURE NARRATIVE'}],operations:[{fingerprint:'PRIVATE CLOSURE RECEIPT'}]}];sqlite.prepare('UPDATE kcc_workspaces SET payload=?').run(JSON.stringify(fixtureRow));
for(const role of first.actors){await svc.selectActor('site-subject-1',role.id);const response=await svc.workspaceResponse('site-subject-1');assert.equal(Object.hasOwn(response.data,'monitoringReviews'),false);assert.equal(Object.hasOwn(response.data,'clubActionClosures'),false);assert.ok(!JSON.stringify(response).includes('PRIVATE CLOSURE'));assert.ok(!JSON.stringify(response).includes('PRIVATE MONITORING'));assert.ok(!JSON.stringify(response).includes('PRIVATE REQUEST RECEIPT'))}
await svc.selectActor('site-subject-1','s1');

let submitted=await svc.execute('site-subject-1',{command:'advance',args:['PENDING_APPROVAL'],actor:'s1',revision:0,context:{selected:'P101',page:'Projects'}});assert.equal(submitted.data.projects[0].state,'PENDING_APPROVAL');assert.equal(submitted.revision,1);assert.equal(Object.hasOwn(submitted.data,'monitoringReviews'),false);assert.equal(Object.hasOwn(submitted.data,'clubActionClosures'),false);assert.deepEqual(JSON.parse(sqlite.prepare('SELECT payload FROM kcc_workspaces').get().payload).clubActionClosures,fixtureRow.clubActionClosures);assert.deepEqual(JSON.parse(sqlite.prepare('SELECT payload FROM kcc_workspaces').get().payload).monitoringReviews,monitoringFixture);
let readAgain=await svc.workspaceResponse('site-subject-1');assert.equal(readAgain.data.projects[0].state,'PENDING_APPROVAL');
await assert.rejects(svc.execute('site-subject-1',{command:'advance',args:['APPROVED'],actor:'s1',revision:0,context:{selected:'P101'}}),e=>e.status===409);
await svc.selectActor('site-subject-1','m1');await assert.rejects(svc.execute('site-subject-1',{command:'advance',args:['APPROVED'],actor:'s1',revision:1,context:{selected:'P101'}}),e=>e.status===409);
let approved=await svc.execute('site-subject-1',{command:'advance',args:['APPROVED'],actor:'m1',revision:1,context:{selected:'P101'}});assert.equal(approved.data.projects[0].state,'APPROVED');
await assert.rejects(svc.execute('site-subject-1',{command:'save',args:[],actor:'m1',revision:2}),e=>e.status===400);
await svc.selectActor('site-subject-1','dc1');assert.equal((await svc.workspaceResponse('site-subject-1')).data.projects.length,0);
await assert.rejects(svc.execute('site-subject-1',{command:'advance',args:['STARTED'],actor:'dc1',revision:2,context:{selected:'P101'}}),e=>e.status===400);
await svc.selectActor('site-subject-1','s1');race=true;await assert.rejects(svc.execute('site-subject-1',{command:'advance',args:['STARTED'],actor:'s1',revision:2,context:{selected:'P101'}}),e=>e.status===409);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM kcc_server_audit').get().n,2);
const data=JSON.parse(sqlite.prepare('SELECT payload FROM kcc_workspaces').get().payload);assert.equal(data.projects[0].state,'APPROVED');assert.deepEqual(data.monitoringReviews,monitoringFixture);assert.deepEqual(data.clubActionClosures,fixtureRow.clubActionClosures);
console.log('PASS: authenticated owner restriction, same-origin writes, durable reads, server role guards, actor-switch conflict, command allowlist, optimistic concurrency and atomic audit integrity.');
// Private CV declarations use the existing persistent command/CAS path.
await svc.selectActor('site-subject-1','s1');
const cvBefore=await svc.workspaceResponse('site-subject-1');
const cvForm={summary:'Private declared summary',education:'External school',training:'Outside course',skills:'Language',experience:'Volunteering'};
const cvSaved=await svc.execute('site-subject-1',{command:'saveCVDeclarations',args:[{form:cvForm}],actor:'s1',revision:cvBefore.revision,context:{page:'My Portfolio'}});
assert.equal(cvSaved.data.cvDeclarations.s1.content.education,'External school');
assert.equal((await svc.workspaceResponse('site-subject-1')).data.cvDeclarations.s1.content.skills,'Language');
await assert.rejects(svc.execute('site-subject-1',{command:'saveCVDeclarations',args:[{form:cvForm}],actor:'s1',revision:cvBefore.revision}),e=>e.status===409);
for(const actor of ['s2','m1','a1']){await svc.selectActor('site-subject-1',actor);const hidden=await svc.workspaceResponse('site-subject-1');assert.deepEqual(hidden.data.cvDeclarations,{});assert.ok(!JSON.stringify(hidden.data).includes('Private declared summary'))}
assert.equal(JSON.parse(sqlite.prepare('SELECT payload FROM kcc_workspaces').get().payload).cvDeclarations.s1.content.summary,'Private declared summary');
console.log('PASS: CV declarations persist through existing service, stale writes conflict, peer/staff reads omit declarations while storage retains them.');

// Threaded project discussion persists through the same guarded command/CAS path.
await svc.selectActor('site-subject-1','s1');let discussionBefore=await svc.workspaceResponse('site-subject-1');const discussionAuditCount=sqlite.prepare('SELECT COUNT(*) AS n FROM kcc_server_audit').get().n;
let discussionSaved=await svc.execute('site-subject-1',{command:'sendMessage',actor:'s1',revision:discussionBefore.revision,args:[{form:{text:'Persistent shared discussion'}}],context:{selected:'P101',page:'Projects'}});let discussionProject=discussionSaved.data.projects.find(p=>p.id==='P101'),threadReference=discussionProject.messages.at(-1).id,rootCount=discussionProject.messages.length;
await svc.selectActor('site-subject-1','s2');discussionSaved=await svc.execute('site-subject-1',{command:'replyDiscussion',actor:'s2',revision:discussionSaved.revision,args:[{form:{text:'Persistent reply'}},threadReference,0,rootCount],context:{selected:'P101',page:'Projects'}});await svc.selectActor('site-subject-1','s1');discussionSaved=await svc.execute('site-subject-1',{command:'setDiscussionState',actor:'s1',revision:discussionSaved.revision,args:[{form:{reason:'Clarification addressed'}},threadReference,'RESOLVED',0,rootCount+1],context:{selected:'P101',page:'Projects'}});discussionProject=discussionSaved.data.projects.find(p=>p.id==='P101');assert.equal(discussionProject.discussionEvents.at(-1).state,'RESOLVED');assert.equal(discussionProject.messages.at(-1).parentRef,threadReference);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM kcc_server_audit').get().n,discussionAuditCount+3);let retained=JSON.parse(sqlite.prepare('SELECT payload FROM kcc_workspaces').get().payload).projects.find(p=>p.id==='P101');assert.equal(retained.discussionEvents.at(-1).reason,'Clarification addressed');assert.equal(retained.messages.at(-1).text,'Persistent reply');await assert.rejects(svc.execute('site-subject-1',{command:'replyDiscussion',actor:'s1',revision:discussionBefore.revision,args:[{form:{text:'Stale replay'}},threadReference,0,rootCount],context:{selected:'P101'}}),e=>e.status===409);
console.log('PASS: shared discussion root/reply/resolution persistence, existing atomic audit entries and stale request rejection.');

sqlite.close();
