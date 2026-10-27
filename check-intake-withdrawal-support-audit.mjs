import fs from 'node:fs';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import ts from 'typescript';import {pathToFileURL} from 'node:url';import {readAuditRecordMetadata} from './server/audit-record-format.mjs';
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_motionless_nova.sql','utf8').replaceAll('--> statement-breakpoint',''));let beforeBatch=()=>{};
const DB={prepare(query){let values=[];return {bind(...v){values=v;return this},async first(){return sql.prepare(query).get(...values)||null},async run(){return {meta:{changes:Number(sql.prepare(query).run(...values).changes)}}}}},async batch(statements){beforeBatch();beforeBatch=()=>{};sql.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}};
globalThis.__auditEnv={DB,KCC_DEMO_OWNER_EMAIL:'owner@example.test'};globalThis.__auditIdentity={userId:'owner-subject',email:'owner@example.test'};
const url=file=>JSON.stringify(pathToFileURL(process.cwd()+'/server/'+file).href);let source=fs.readFileSync('server/service.ts','utf8').replace("import { env } from 'cloudflare:workers';",'const env=globalThis.__auditEnv;').replace("import { getChatGPTUser } from '../app/chatgpt-auth';",'const getChatGPTUser=async()=>globalThis.__auditIdentity;');for(const file of ['engine.mjs','form-fields.mjs','audit-command-map.mjs'])source=source.replace("'./"+file+"'",url(file));const svc=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));

import {mapIntakeReviewAuditMetadata} from './server/intake-review-audit-map.mjs';
await svc.workspaceResponse('owner-subject');
const load=()=>sql.prepare('SELECT * FROM kcc_workspaces').get(),data=()=>JSON.parse(load().payload),audits=()=>sql.prepare('SELECT * FROM kcc_server_audit ORDER BY revision').all(),snapshot=()=>JSON.stringify({workspace:load(),audit:audits()}),record=()=>data().activityIntakes.at(-1);
const form=x=>({form:x}),cases=[];
async function actor(id){await svc.selectActor('owner-subject',id)}
function body(id,command,args,revision=load().revision){return {actor:id,command,args,revision,context:{page:'Activity Intake'},auditMetadata:{record:'FORGED-RECORD',actor:'a1',reason:'PRIVATE FORGED REASON'}}}
async function execute(id,command,args){await actor(id);return svc.execute('owner-subject',body(id,command,args))}
async function mapped(id,command,args,expected){
 await actor(id);const prior=data(),priorCount=audits().length,priorRevision=load().revision;let before=snapshot();
 sql.exec("CREATE TRIGGER fail_review_audit BEFORE INSERT ON kcc_server_audit BEGIN SELECT RAISE(ABORT,'audit unavailable'); END");await assert.rejects(svc.execute('owner-subject',body(id,command,args)),/audit unavailable/);assert.equal(snapshot(),before);sql.exec('DROP TRIGGER fail_review_audit');
 const result=await svc.execute('owner-subject',body(id,command,args));const row=audits().at(-1),decoded=readAuditRecordMetadata(row.record,row);assert.equal(decoded.kind,'STRUCTURED');const m=decoded.metadata;assert.equal(m.action,command);assert.equal(m.actorId,id);assert.equal(m.correlationId,load().commit_id);assert.equal(m.workspaceRevisionAfter,load().revision);assert.equal(audits().length,priorCount+1);for(const [k,v] of Object.entries(expected))assert.equal(m.record[k],v);assert.deepEqual(m.reason.reference,{recordType:m.record.type,recordId:m.record.id,recordVersion:m.record.versionAfter,field:command.startsWith('withdraw')?'withdrawalReason':'reason'});assert(!row.record.includes('PRIVATE'));assert(!row.record.includes('FORGED'));assert(!JSON.stringify(result).includes('KCC360_AUDIT_METADATA'));
 cases.push({command,actor:id,before:prior,after:data(),commit:{id:row.id,workspaceId:row.workspace,revisionBefore:priorRevision,revisionAfter:row.revision,time:row.time}});
 before=snapshot();await svc.execute('owner-subject',body(id,command,args));assert.equal(snapshot(),before);await assert.rejects(svc.execute('owner-subject',body(id,command,args,priorRevision)),e=>e.status===409);assert.equal(snapshot(),before);return m;
}

const input={title:'PRIVATE SUPPORT PROPOSAL',type:'Project',programme:'BCA',purpose:'PRIVATE PURPOSE',outputs:'PRIVATE OUTPUT',start:'2026-11-01',due:'2026-12-15',primaryUnit:'ACADEMIC',support_RESEARCH:'yes',support_GLOBAL_COLLABORATION:'yes',alignmentReason:'PRIVATE ALIGNMENT',reason:'PRIVATE STUDENT REASON'};
async function intake(state='DRAFT'){
 await execute('s1','saveActivityIntake',[form(input),'',0]);const id=record().id;
 if(state!=='DRAFT')await execute('s1','submitActivityIntake',[id,1]);
 if(state==='RETURNED')await execute('c1','reviewActivityIntake',[form({decision:'RETURNED',reason:'PRIVATE RETURN'}),id,1]);
 return id;
}
for(const state of ['DRAFT','SUBMITTED','RETURNED']){
 const id=await intake(state),original=structuredClone(record()),args=[form({reason:'PRIVATE WITHDRAWAL REASON'}),id,1];
 await actor('s2');const unchanged=snapshot();await svc.execute('owner-subject',body('s2','withdrawActivityIntake',args));assert.equal(snapshot(),unchanged);
 await mapped('s1','withdrawActivityIntake',args,{type:'INTAKE',id,versionBefore:1,versionAfter:1,stateBefore:state,stateAfter:'WITHDRAWN'});assert.deepEqual(record().submissions,original.submissions);assert.deepEqual(record().decisions.slice(0,-1),original.decisions);
}
const id=await intake('SUBMITTED'),projectCount=data().projects.length;
await execute('c1','reviewActivityIntake',[form({decision:'ROUTING_CONFIRMED',primaryUnit:'ACADEMIC',support_RESEARCH:'yes',support_GLOBAL_COLLABORATION:'yes',reason:'PRIVATE ROUTING'}),id,1]);
await execute('c1','assignIntakeMentor',[form({mentor:'m1',fit:'PRIVATE FIT',capacity:'PRIVATE CAPACITY',reason:'PRIVATE ASSIGNMENT'}),id,0]);let a=record().mentorAssignments.at(-1);
await execute('m1','respondIntakeMentor',[form({decision:'ACCEPTED',noConflict:'yes',reason:'PRIVATE ACCEPTANCE'}),id,a.id,1]);
const request=(key,version)=>[form({responsibility:'PRIVATE RESPONSIBILITY',deliverable:'PRIVATE DELIVERABLE',due:'2026-11-15',reason:'PRIVATE REQUEST REASON'}),id,key,version],latest=key=>record().supportRequests.findLast(q=>q.target===key);
const response=(q,decision='ACCEPTED',authority='yes')=>[form({decision,authority,reason:'PRIVATE SUPPORT RESPONSE'}),id,q.id,q.version];
const research='UNIT:RESEARCH',global='UNIT:GLOBAL_COLLABORATION';
await mapped('c1','requestIntakeSupport',request(research,0),{type:'INTAKE_SUPPORT_REQUEST',versionBefore:null,versionAfter:1,stateBefore:null,stateAfter:'REQUESTED'});const r1=structuredClone(latest(research));
await mapped('c1','requestIntakeSupport',request(global,0),{type:'INTAKE_SUPPORT_REQUEST',versionBefore:null,versionAfter:1,stateBefore:null,stateAfter:'REQUESTED'});
for(const wrong of ['s1','s2','c1','g1','m1']){await actor(wrong);const unchanged=snapshot();await svc.execute('owner-subject',body(wrong,'respondIntakeSupport',response(r1)));assert.equal(snapshot(),unchanged)}
await mapped('r1','respondIntakeSupport',response(r1,'DECLINED',''),{type:'INTAKE_SUPPORT_REQUEST',id:r1.id,versionBefore:1,versionAfter:1,stateBefore:'REQUESTED',stateAfter:'DECLINED'});const declined=structuredClone(latest(research));
await mapped('c1','requestIntakeSupport',request(research,1),{type:'INTAKE_SUPPORT_REQUEST',versionBefore:null,versionAfter:2,stateBefore:null,stateAfter:'REQUESTED'});const r2=structuredClone(latest(research));
// The global request is not the last array element; per-target records retain independent versions.
await mapped('g1','respondIntakeSupport',response(latest(global)),{type:'INTAKE_SUPPORT_REQUEST',id:latest(global).id,versionBefore:1,versionAfter:1,stateBefore:'REQUESTED',stateAfter:'ACCEPTED'});
await actor('r1');let before=snapshot();await svc.execute('owner-subject',body('r1','respondIntakeSupport',response(r2,'ACCEPTED','')));assert.equal(snapshot(),before);
await mapped('r1','respondIntakeSupport',response(r2),{type:'INTAKE_SUPPORT_REQUEST',id:r2.id,versionBefore:2,versionAfter:2,stateBefore:'REQUESTED',stateAfter:'ACCEPTED'});const accepted=structuredClone(latest(research).response);
await mapped('c1','withdrawIntakeSupport',[form({reason:'PRIVATE SUPPORT WITHDRAWAL'}),id,r2.id,2],{type:'INTAKE_SUPPORT_REQUEST',id:r2.id,versionBefore:2,versionAfter:2,stateBefore:'ACCEPTED',stateAfter:'WITHDRAWN'});assert.deepEqual(latest(research).response,accepted);assert.deepEqual(record().supportRequests.find(q=>q.id===r1.id),declined);
await mapped('c1','requestIntakeSupport',request(research,2),{type:'INTAKE_SUPPORT_REQUEST',versionBefore:null,versionAfter:3,stateBefore:null,stateAfter:'REQUESTED'});const r3=structuredClone(latest(research));
await actor('c1');before=snapshot();await svc.execute('owner-subject',body('c1','withdrawIntakeSupport',[form({reason:'PRIVATE OLD REQUEST'}),id,r1.id,1]));assert.equal(snapshot(),before);
// Existing linked-work guard remains in force. This temporary fixture only adds a linkage marker.
const unlinked=load().payload,linkedData=data();linkedData.activityIntakes.at(-1).projectId='LINKED-FIXTURE';sql.prepare('UPDATE kcc_workspaces SET payload=?').run(JSON.stringify(linkedData));before=snapshot();
for(const [cmd,requestArgs] of [['withdrawIntakeSupport',[form({reason:'PRIVATE BLOCKED'}),id,r3.id,3]],['withdrawIntakeMentor',[form({reason:'PRIVATE BLOCKED'}),id,a.id,1]]]){await svc.execute('owner-subject',body('c1',cmd,requestArgs));assert.equal(snapshot(),before)}sql.prepare('UPDATE kcc_workspaces SET payload=?').run(unlinked);
// Withdrawal of a stale support request is permitted so fresh acceptance can be sought after mentor change.
const priorResponse=structuredClone(record().mentorAssignments.at(-1).response);
await mapped('c1','withdrawIntakeMentor',[form({reason:'PRIVATE MENTOR WITHDRAWAL'}),id,a.id,1],{type:'INTAKE_MENTOR_ASSIGNMENT',id:a.id,versionBefore:1,versionAfter:1,stateBefore:'ACCEPTED',stateAfter:'WITHDRAWN'});assert.deepEqual(record().mentorAssignments.at(-1).response,priorResponse);
await actor('r1');before=snapshot();await svc.execute('owner-subject',body('r1','respondIntakeSupport',response(r3)));assert.equal(snapshot(),before);
await mapped('c1','withdrawIntakeSupport',[form({reason:'PRIVATE STALE WITHDRAWAL'}),id,r3.id,3],{type:'INTAKE_SUPPORT_REQUEST',id:r3.id,versionBefore:3,versionAfter:3,stateBefore:'REQUESTED',stateAfter:'WITHDRAWN'});
assert.equal(data().projects.length,projectCount);
// Mapping failure does not accept forged actor or withdrawal-state metadata.
for(const c of cases){const after=structuredClone(c.after),r=after.activityIntakes.at(-1);if(c.command==='withdrawActivityIntake')r.decisions.at(-1).by='s2';else if(c.command==='withdrawIntakeMentor')r.mentorAssignments.at(-1).withdrawal.priorState='WRONG';else {const changed=r.supportRequests.find((q,i)=>JSON.stringify(q)!==JSON.stringify(c.before.activityIntakes.at(-1).supportRequests?.[i]));if(c.command==='requestIntakeSupport')changed.version+=1;else if(c.command==='respondIntakeSupport')changed.response.by='s2';else changed.withdrawal.priorState='WRONG'}assert.throws(()=>mapIntakeReviewAuditMetadata({...c,after}),/INVALID_INTAKE_REVIEW_AUDIT_TRANSITION/)}
sql.close();console.log('PASS: actual SQLite draft/submitted/returned student withdrawal, accepted mentor withdrawal, multi-target support request/decline/retry/accept/withdraw with per-target versions; private metadata, original decisions retained, rollback/retry, duplicate/stale/actor/declaration/source/linkage denial, non-last request mapping and no activity creation.');
