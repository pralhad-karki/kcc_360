// Disposable local service/route fixture. Never imports hosted bindings or opens
// an existing database. Session population is not institutional user provisioning.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash,randomUUID} from 'node:crypto';
import ts from 'typescript';
import {createEngine} from '../server/engine.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
export const bytes=value=>Buffer.byteLength(typeof value==='string'?value:JSON.stringify(value),'utf8');
export async function workspaceCapacityFixture({projectCount=8,sessionCount=10_000,serviceSource=null,reflectionResponses=false}={}){
 if(!Number.isInteger(projectCount)||projectCount<8||projectCount>1000||!Number.isInteger(sessionCount)||sessionCount<2||sessionCount>10_000)throw Error('Bounded fictional fixture sizes required');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'kcc-capacity-')),sqlite=new DatabaseSync(path.join(directory,'fictional.sqlite'));
 for(const migration of ['0000_motionless_nova.sql','0001_neat_tattoo.sql'])sqlite.exec(fs.readFileSync(root+'drizzle/'+migration,'utf8').replaceAll('--> statement-breakpoint',''));sqlite.exec('PRAGMA journal_mode=WAL');
 const context=new AsyncLocalStorage(),key='__kccCapacity'+randomUUID().replaceAll('-','');
 let metrics,beforeRun=null,tail=Promise.resolve();
 const resetMetrics=()=>metrics={queries:0,sessionInsertAttempts:0,sessionRowsInserted:0,workspaceBytesRead:0,workspaceBytesWritten:0,workspaceUpdates:0,auditRowsInserted:0};resetMetrics();
 const DB={prepare(query){let values=[];const runNow=()=>{metrics.queries++;if(beforeRun){const hook=beforeRun;beforeRun=null;hook(sqlite,query)}const result=sqlite.prepare(query).run(...values),changes=Number(result.changes);if(query.startsWith('INSERT OR IGNORE INTO kcc_demo_sessions')){metrics.sessionInsertAttempts++;metrics.sessionRowsInserted+=changes}if(query.startsWith('UPDATE kcc_workspaces SET payload')&&changes){metrics.workspaceUpdates+=changes;metrics.workspaceBytesWritten+=bytes(values[0])}if(query.startsWith('INSERT INTO kcc_server_audit'))metrics.auditRowsInserted+=changes;return {meta:{changes}}};return {bind(...v){values=v;return this},async first(){metrics.queries++;const row=sqlite.prepare(query).get(...values)||null;if(row?.payload)metrics.workspaceBytesRead+=bytes(row.payload);return row},async all(){metrics.queries++;return {results:sqlite.prepare(query).all(...values)}},async run(){return runNow()},runNow}},async batch(statements){const task=tail.then(()=>{sqlite.exec('BEGIN IMMEDIATE');try{const result=statements.map(s=>s.runNow());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}});tail=task.catch(()=>{});return task}};
 const source=serviceSource??fs.readFileSync(root+'server/service.ts','utf8');
 const objects=new Map(),bucketStats={puts:0,deletes:0},BUCKET={async put(name,value){bucketStats.puts++;objects.set(name,new Uint8Array(value))},async delete(name){bucketStats.deletes++;objects.delete(name)},async get(name){return objects.has(name)?{body:objects.get(name)}:null}};
 globalThis[key]={env:{DB,BUCKET,KCC_DEMO_OWNER_EMAIL:'fictional-owner@example.test'},context};
 const cache=new Map();
 function moduleURL(filename){
  filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename);
  let code;
  if(filename===path.join(root,'app/chatgpt-auth.ts'))code=`export async function getChatGPTUser(){return globalThis[${JSON.stringify(key)}].context.getStore()?.identity||null}`;
  else code=(filename===path.join(root,'server/service.ts')?source:fs.readFileSync(filename,'utf8')).replace(/import\s*\{\s*env\s*\}\s*from\s*['"]cloudflare:workers['"];?/g,`const env=globalThis[${JSON.stringify(key)}].env;`);
  if(reflectionResponses&&filename===path.join(root,'server/shares.ts'))code=code.replace('reflectionResponseConfiguration=Object.freeze({enabled:false})','reflectionResponseConfiguration=Object.freeze({enabled:true})');
  code=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  code=code.replace(/(from\s*|import\s*)(['"])([^'"]+)\2/g,(full,prefix,quote,spec)=>{if(spec.startsWith('.')){let target=path.resolve(path.dirname(filename),spec);if(!path.extname(target))target+='.ts';return prefix+JSON.stringify(target.endsWith('.ts')?moduleURL(target):pathToFileURL(target).href)}return /^(?:node:|file:|data:)/.test(spec)?full:prefix+JSON.stringify(import.meta.resolve(spec))});
  const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(filename,url);return url;
 }
 const service=await import(moduleURL(root+'server/service.ts')),route=await import(moduleURL(root+'app/api/workspace/route.ts'));
 const data=createEngine(null,'s1').snapshot(),template=structuredClone(data.projects[0]);
 data.projects=Array.from({length:projectCount},(_,i)=>({...structuredClone(template),id:'CAPACITY-'+i,title:'Fictional capacity project '+i,state:'IN_PROGRESS',owner:'s1',mentor:'m1',members:['s1','s2'],tasks:[],evidence:[],messages:[],history:[],reflections:{},evaluations:{},certs:{},published:{}}));
 sqlite.prepare('INSERT INTO kcc_workspaces VALUES(?,0,?,?,?)').run('KCC-OWNER-DEMO',JSON.stringify(data),'fictional-fixture',new Date().toISOString());
 sqlite.exec('BEGIN');const insert=sqlite.prepare('INSERT INTO kcc_demo_sessions VALUES(?,?,?)');for(let i=0;i<sessionCount;i++)insert.run('fictional-session-'+i,'s1','2026-11-03T00:00:00.000Z');sqlite.exec('COMMIT');resetMetrics();
 const as=(subject,fn)=>context.run({identity:{userId:subject,email:'fictional-owner@example.test'}},fn);
 return {service,sqlite,db:DB,as,files:()=>import(moduleURL(root+'server/files.ts')),shares:()=>import(moduleURL(root+'server/shares.ts')),shareRoutes:()=>import(moduleURL(root+'app/api/portfolio-shares/route.ts')),publicShareRoute:()=>import(moduleURL(root+'app/share/[token]/route.ts')),bucketCount:()=>objects.size,bucketStats:()=>structuredClone(bucketStats),sourceHash:createHash('sha256').update(source).digest('hex'),resetMetrics,metrics:()=>structuredClone(metrics),hookNextRun:fn=>beforeRun=fn,
  row:()=>sqlite.prepare('SELECT * FROM kcc_workspaces WHERE id=?').get('KCC-OWNER-DEMO'),
  auditCount:()=>sqlite.prepare('SELECT COUNT(*) n FROM kcc_server_audit').get().n,
  seedPayload:payload=>sqlite.prepare('UPDATE kcc_workspaces SET payload=? WHERE id=?').run(JSON.stringify(payload),'KCC-OWNER-DEMO'),
  get:subject=>as(subject,()=>route.GET()),
  post:(subject,body)=>as(subject,()=>route.POST(new Request('https://capacity.example.test/api/workspace',{method:'POST',headers:{origin:'https://capacity.example.test','content-type':'application/json'},body:JSON.stringify(body)}))),
  message:(projectIndex,revision,text)=>({command:'sendMessage',actor:'s1',revision,args:[{form:{text}}],context:{selected:'CAPACITY-'+projectIndex,page:'Projects'}}),
  async close(){await tail;sqlite.close();delete globalThis[key];fs.rmSync(directory,{recursive:true,force:true})}
 };
}
