// Compiles the actual framework route and service. Only platform identity/env and
// the disabled operator binding are substituted; fixture transport is mock only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {pathToFileURL} from 'node:url';
import {createWebsiteV1Operator} from './server/website-v1-operator.mjs';
import {runtime,eventId,deliveryId,approve,rows,db,config,cleanup} from './fixtures/website-v1-operator-fixture.mjs';
import {createWebsiteV1Mock} from './server/website-v1-mock.mjs';
const abs=p=>JSON.stringify(pathToFileURL(process.cwd()+'/'+p).href);
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
globalThis.__websiteRouteEnv={DB:db,KCC_DEMO_OWNER_EMAIL:'owner@example.test'};
globalThis.__websiteRouteIdentity={userId:'fixture-reviewer',email:'owner@example.test'};
let service=fs.readFileSync('server/service.ts','utf8')
 .replace("import { env } from 'cloudflare:workers';",'const env=globalThis.__websiteRouteEnv;')
 .replace("import { getChatGPTUser } from '../app/chatgpt-auth';",'const getChatGPTUser=async()=>globalThis.__websiteRouteIdentity;');
for(const name of ['engine.mjs','form-fields.mjs','audit-command-map.mjs'])service=service.replace(JSON.stringify('./'+name).replaceAll('"',"'"),abs('server/'+name));
const serviceURL=compile(service),source=fs.readFileSync('app/api/website-publications/route.ts','utf8').replace("'../../../server/service'",JSON.stringify(serviceURL));
const disabled=await import(compile(source.replace("'../../../server/website-v1-operator.mjs'",abs('server/website-v1-operator.mjs'))));
const sessions=new Map([['fixture-reviewer','d1'],['fixture-student','s1']]);
globalThis.__websiteRouteOperator=createWebsiteV1Operator({mode:'mock',runtime,authenticate:s=>sessions.get(s)});
const route=await import(compile(source.replace("import {websiteV1Operator} from '../../../server/website-v1-operator.mjs';",'const websiteV1Operator={execute:(...args)=>globalThis.__websiteRouteOperator.execute(...args)};')));
const owner=id=>globalThis.__websiteRouteIdentity={userId:id,email:'owner@example.test'};
const snapshot=async()=>JSON.stringify(await db.prepare('SELECT * FROM kcc_workspaces').first());
const request=(body,headers={})=>new Request('https://kcc.test/api/website-publications',{method:'POST',headers:{origin:'https://kcc.test','content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const get=(r=route,id=eventId)=>r.GET(new Request('https://kcc.test/api/website-publications?eventId='+encodeURIComponent(id)));
const post=body=>route.POST(request(body));
const input=(action,extra={})=>({action,eventId,...extra});
let groups=0;
const test=async(name,fn)=>{await fn();groups++;console.log('PASS '+name)};
try{
 await test('compiled route keeps integration disabled and storage unchanged',async()=>{
  const before=await snapshot();for(const response of [await get(disabled),await disabled.POST(request(input('enqueue',{deliveryId,enabled:true})))]){assert.equal(response.status,200);assert.equal((await response.json()).available,false);assert.equal(response.headers.get('cache-control'),'no-store')}
  assert.equal(await snapshot(),before);
 });
 await test('actual identity, owner, origin, JSON and size guards preserve records',async()=>{
  const before=await snapshot();globalThis.__websiteRouteIdentity=null;assert.equal((await get()).status,401);assert.equal((await post(input('read'))).status,401);
  globalThis.__websiteRouteIdentity={userId:'other',email:'other@example.test'};assert.equal((await get()).status,403);owner('fixture-reviewer');
  assert.equal((await route.POST(request(input('read'),{origin:'https://other.test'}))).status,403);
  assert.equal((await route.POST(request(input('read'),{'content-type':'text/plain'}))).status,415);
  assert.equal((await post('{')).status,400);assert.equal((await post('x'.repeat(4001))).status,413);assert.equal(await snapshot(),before);
 });
 await test('role, department and browser authority spoofing return bounded errors',async()=>{
  const before=await snapshot();owner('fixture-student');assert.equal((await get()).status,403);owner('fixture-reviewer');assert.equal((await get(route,'other-department')).status,403);
  for(const b of [input('read',{actor:'d1'}),input('read',{enabled:true}),input('read',{consent:true}),input('publish'),input('read',{websiteStatus:'published'})])assert.equal((await post(b)).status,400);
  assert.equal((await post(input('deliver',{requestId:'unknown'}))).status,404);assert.equal(await snapshot(),before);
 });
 let requestId;
 await test('approved event prepare and duplicate submission use one durable request',async()=>{
  const a=await post(input('enqueue',{deliveryId}));assert.equal(a.status,200);requestId=(await a.json()).view.requests[0].requestId;
  const before=await snapshot(),b=await post(input('enqueue',{deliveryId}));assert.equal((await b.json()).view.requests[0].requestId,requestId);assert.equal(await snapshot(),before);assert.equal(rows().length,1);
 });
 await test('mock timeout and retry retain idempotency and require separate website approval',async()=>{
  globalThis.__websiteRouteOperator=createWebsiteV1Operator({mode:'mock',authenticate:s=>sessions.get(s),runtime:createWebsiteV1Mock({...config,transport:{mode:'mock',send:async()=>{throw Error('fictional timeout')}}})});
  let response=await post(input('deliver',{requestId}));assert.equal((await response.json()).view.requests[0].state,'RETRY');
  globalThis.__websiteRouteOperator=createWebsiteV1Operator({mode:'mock',runtime,authenticate:s=>sessions.get(s)});
  response=await post(input('deliver',{requestId}));let view=(await response.json()).view;assert.equal(view.requests[0].websiteStatus,'pending_website_review');assert.equal(view.requests[0].publicUrl,null);assert.equal(view.sourceApproval,'UNCHANGED');assert.equal(rows().length,1);
  approve();response=await post(input('refresh',{requestId}));view=(await response.json()).view;assert.equal(view.requests[0].websiteStatus,'published');assert(view.requests[0].publicUrl.startsWith('/events/'));
  const text=JSON.stringify(view);for(const field of ['eligibility','evidence_reference','members','evaluations','portfolio','payload'])assert(!text.includes('"'+field+'"'));
 });
 await test('session revocation and re-login preserve request history',async()=>{
  sessions.delete('fixture-reviewer');const before=await snapshot();assert.equal((await get()).status,401);assert.equal((await post(input('withdraw',{reason:'denied'}))).status,401);assert.equal(await snapshot(),before);
  sessions.set('fixture-reviewer','d1');assert.equal((await (await get()).json()).view.requests[0].requestId,requestId);
 });
 await test('withdrawal receipt and delayed older requests cannot restore publication',async()=>{
  assert.equal((await post(input('withdraw',{reason:''}))).status,400);
  let response=await post(input('withdraw',{reason:'Fictional route acceptance withdrawal'}));let view=(await response.json()).view;assert.equal(view.terminal,true);assert(view.requests.every(r=>r.publicUrl===null));
  const withdrawal=view.requests.find(r=>r.action==='withdraw');response=await post(input('deliver',{requestId:withdrawal.requestId}));view=(await response.json()).view;assert.equal(view.requests.find(r=>r.action==='withdraw').websiteStatus,'withdrawn');
  const before=await snapshot();for(const action of ['deliver','refresh'])assert.equal((await post(input(action,{requestId}))).status,409);
  assert.equal((await post(input('enqueue',{deliveryId}))).status,409);assert.equal(await snapshot(),before);assert.equal(rows().length,2);
 });
 await test('unexpected internal exceptions return generic error without sensitive details',async()=>{
  globalThis.__websiteRouteOperator={execute:async()=>{throw Error('private database credential fixture')}};const response=await get();assert.equal(response.status,500);assert(!(await response.text()).includes('credential'));
 });
 console.log(`PASS ${groups} compiled publication HTTP route groups. Platform identity is substituted; no hosted Worker/browser acceptance or live synchronization.`);
}finally{cleanup();delete globalThis.__websiteRouteEnv;delete globalThis.__websiteRouteIdentity;delete globalThis.__websiteRouteOperator}
