// Explicit local-only acceptance transport. Never imported by production routes.
// Real route/controller/service/engine code; file-backed SQLite implements D1's
// used prepare/bind/first/all/run/batch surface. Authentication is a labelled
// fictional owner session, NOT MIS/ChatGPT credential verification.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash,randomUUID} from 'node:crypto';
import ts from 'typescript';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
if(!args.includes('--local-fictional'))throw Error('Explicit --local-fictional required');
const filename=path.resolve(root,option('--db')||'');
if(!args.includes('--db')||!path.isAbsolute(filename)||!((root.startsWith('/workspace/scratch/')||root==='/site/')&&filename===path.join(root,'runtime/fictional-stage253.sqlite'))||!filename.endsWith('/fictional-stage253.sqlite'))throw Error('Dedicated scratch fictional-stage253.sqlite required');
fs.mkdirSync(path.dirname(filename),{recursive:true});
const existed=fs.existsSync(filename),sql=new DatabaseSync(filename);
if(existed){if(sql.prepare("SELECT value FROM acceptance_fixture_meta WHERE key='kind'").get()?.value!=='KCC360_STAGE253_FICTIONAL')throw Error('Existing database is not this fictional fixture');}
else{for(const file of fs.readdirSync(root+'drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(fs.readFileSync(root+'drizzle/'+file,'utf8').replaceAll('--> statement-breakpoint',''));sql.exec("CREATE TABLE acceptance_fixture_meta(key TEXT PRIMARY KEY,value TEXT); INSERT INTO acceptance_fixture_meta VALUES('kind','KCC360_STAGE253_FICTIONAL'); CREATE TABLE acceptance_logins(token TEXT PRIMARY KEY,subject TEXT NOT NULL);");}
sql.exec('PRAGMA journal_mode=WAL');
const DB={prepare(query){let values=[];return {bind(...input){values=input;return this},async first(){return sql.prepare(query).get(...values)||null},async all(){return {results:sql.prepare(query).all(...values)}},async run(){const r=sql.prepare(query).run(...values);return {success:true,meta:{changes:Number(r.changes)}}}}},async batch(statements){sql.exec('BEGIN IMMEDIATE');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result}catch(error){sql.exec('ROLLBACK');throw error}}};
const context=new AsyncLocalStorage();
const objectRoot=path.join(path.dirname(filename),'objects');fs.mkdirSync(objectRoot,{recursive:true});
const objectPath=key=>path.join(objectRoot,createHash('sha256').update(key).digest('hex'));
const BUCKET={async put(key,bytes){fs.writeFileSync(objectPath(key),bytes)},async get(key){const file=objectPath(key);return fs.existsSync(file)?{body:new Uint8Array(fs.readFileSync(file))}:null},async delete(key){fs.rmSync(objectPath(key),{force:true})}};
globalThis.__kccStage253={env:{DB,BUCKET,KCC_DEMO_OWNER_EMAIL:'fictional-owner@example.test'},context};
const modules=new Map();
function moduleURL(file){
 file=path.resolve(file);if(modules.has(file))return modules.get(file);
 if(file===path.join(root,'app/chatgpt-auth.ts')){const url='data:text/javascript;base64,'+Buffer.from('export async function getChatGPTUser(){return globalThis.__kccStage253.context.getStore()?.identity||null}').toString('base64');modules.set(file,url);return url;}
 let source=fs.readFileSync(file,'utf8').replace(/import\s*\{\s*env\s*\}\s*from\s*['"]cloudflare:workers['"];?/g,'const env=globalThis.__kccStage253.env;');
 source=source.replace(/(from\s*|import\s*)(['"])(\.[^'"]+)\2/g,(full,prefix,quote,spec)=>{let target=path.resolve(path.dirname(file),spec);if(!path.extname(target))target+='.ts';return prefix+JSON.stringify(target.endsWith('.ts')?moduleURL(target):pathToFileURL(target).href)});
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const url='data:text/javascript;base64,'+Buffer.from(output).toString('base64');modules.set(file,url);return url;
}
const service=await import(moduleURL(root+'server/service.ts'));
const handlers=new Map();
for(const route of ['workspace','session','academic-cohort-preview','academic-cohort-batches','portfolio-export','portfolio-shares','files'])handlers.set('/api/'+route,await import(moduleURL(root+'app/api/'+route+'/route.ts')));
const fileDownload=await import(moduleURL(root+'app/api/files/[id]/route.ts')),letterDownload=await import(moduleURL(root+'app/internship-letters/[id]/route.ts'));
await service.loadWorkspace();
const actors=(await service.workspaceResponse('stage253-observer')).actors;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const evidenceFile=path.join(path.dirname(filename),'http-evidence.jsonl');
function proof(){return {workspaces:sql.prepare('SELECT id,revision,commit_id,payload FROM kcc_workspaces ORDER BY id').all().map(r=>({id:r.id,revision:r.revision,commitId:r.commit_id,sha256:createHash('sha256').update(r.payload).digest('hex')})),auditCount:sql.prepare('SELECT count(*) AS n FROM kcc_server_audit').get().n};}
if(args.includes('--prepare-internship')){const {prepare}=await import('./full-stack-internship-fixture.mjs');await prepare({service,route:handlers.get('/api/workspace'),context,record:r=>fs.appendFileSync(path.join(path.dirname(filename),'controller-setup.jsonl'),JSON.stringify({time:new Date().toISOString(),...r})+'\n')});}
if(args.includes('--controller-checks')){const {check}=await import('./full-stack-controller-checks.mjs');await check({service,handlers,fileDownload,context,proof,record:r=>fs.appendFileSync(path.join(path.dirname(filename),'controller-checks.jsonl'),JSON.stringify({time:new Date().toISOString(),...r})+'\n')});}
let queue=Promise.resolve();
const server=http.createServer((incoming,outgoing)=>{queue=queue.then(async()=>{
 const host=incoming.headers.host||'',url=new URL(incoming.url,'http://'+host);
 const send=(body,status=200,type='text/html',extra={})=>{outgoing.writeHead(status,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});outgoing.end(body)};
 if(!['localhost','127.0.0.1','terminal.local'].includes(url.hostname))return send('Local fictional host required',403);
 const token=/\bkcc253=([a-f0-9-]+)\b/.exec(incoming.headers.cookie||'')?.[1],login=token?sql.prepare('SELECT subject FROM acceptance_logins WHERE token=?').get(token):null;
 const identity=login?{userId:login.subject,email:'fictional-owner@example.test',fullName:'Fictional acceptance owner'}:null;
 await context.run({identity},async()=>{
 try{
  if(url.pathname==='/acceptance/sign-in'&&incoming.method==='POST'){
   if(incoming.headers.origin!==url.origin)return send('Same-origin test sign-in required',403);
   let raw='';for await(const chunk of incoming)raw+=chunk;if(raw.length>1000)return send('Too large',413);
   const actor=new URLSearchParams(raw).get('actor');if(!actors.some(a=>a.id===actor))return send('Unknown fictional account',400);
   const subject='stage253-'+actor;await service.readSession(subject);await service.selectActor(subject,actor);
   const key=randomUUID();sql.prepare('INSERT INTO acceptance_logins VALUES (?,?)').run(key,subject);
   return send('',303,'text/html',{'Location':'/workspace/','Set-Cookie':`kcc253=${key}; HttpOnly; SameSite=Strict; Path=/`});
  }
  if(url.pathname==='/acceptance/logout'&&incoming.method==='POST'){
   if(incoming.headers.origin!==url.origin)return send('Same-origin required',403);
   if(token)sql.prepare('DELETE FROM acceptance_logins WHERE token=?').run(token);
   return send('',303,'text/html',{'Location':'/','Set-Cookie':'kcc253=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
  }
  const dynamicFile=/^\/api\/files\/([^/]+)$/.exec(url.pathname),dynamicLetter=/^\/internship-letters\/([^/]+)$/.exec(url.pathname);
  if(handlers.has(url.pathname)||dynamicFile||dynamicLetter){
   const route=dynamicFile?fileDownload:dynamicLetter?letterDownload:handlers.get(url.pathname),method=incoming.method,before=proof();const chunks=[];let length=0;for await(const chunk of incoming){chunks.push(chunk);length+=chunk.length;if(length>6*1024*1024)return send('{"error":"Request too large"}',413,'application/json');}
   const raw=Buffer.concat(chunks);
   const body=raw.length?(()=>{try{return JSON.parse(raw.toString('utf8'))}catch{return null}})():null;
   const request=new Request(url,{method,headers:incoming.headers,...(!['GET','HEAD'].includes(method)?{body:raw}:{})});
   const response=route[method]?await route[method](request,{params:Promise.resolve({id:decodeURIComponent((dynamicFile||dynamicLetter||[])[1]||'')})}):Response.json({error:'Method not allowed'},{status:405});
   const bytes=Buffer.from(await response.arrayBuffer()),after=proof();
   fs.appendFileSync(evidenceFile,JSON.stringify({time:new Date().toISOString(),method,path:url.pathname,subject:identity?.userId||null,command:body?.command||body?.action||null,actor:body?.actor||null,status:response.status,before,after})+'\n');
   outgoing.writeHead(response.status,Object.fromEntries(response.headers));return outgoing.end(bytes);
  }
  if(url.pathname==='/'||url.pathname==='/signin-with-chatgpt')return send(`<!doctype html><title>KCC360 fictional acceptance sign-in</title><h1>KCC360 Stage 253 acceptance</h1><p>Fictional local test authentication only. This does not test MIS or ChatGPT credentials. Real routes/services and a dedicated persistent SQLite database are used.</p><form method="post" action="/acceptance/sign-in"><label>Fictional account<select name="actor">${actors.map(a=>`<option value="${esc(a.id)}">${esc(a.id+' — '+a.name+' — '+a.role)}</option>`).join('')}</select></label><button>Enter fictional workspace</button></form>`);
  if(!identity)return send('',303,'text/html',{'Location':'/'});
  const name=url.pathname==='/workspace/'?'index.html':url.pathname.replace(/^\/workspace\//,'');
  if(!/^[a-zA-Z0-9._-]+\.(html|js|css|json)$/.test(name))return send('Unsupported local acceptance route',404);
  const target=path.join(root,'public/workspace',name);if(!fs.existsSync(target))return send('Not found',404);
  let bytes=fs.readFileSync(target);if(name==='index.html')bytes=Buffer.from(bytes.toString().replace('<body>','<body><form method="post" action="/acceptance/logout" style="position:fixed;bottom:0;right:0;z-index:9999;background:#fff;padding:4px;border:2px solid #222"><small>FICTIONAL TEST SESSION · SQLite</small> <button>Test logout</button></form>'));
  return send(bytes,200,name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/html');
 }catch(error){console.error(error?.stack||error);send(JSON.stringify({error:'Local acceptance infrastructure failed'}),500,'application/json');}
 });
 }).catch(error=>{console.error(error);if(!outgoing.headersSent)outgoing.writeHead(500);outgoing.end();});});
const port=args.includes('--port')?Number(option('--port')):5173;
server.listen(port,args.includes('--host')?'0.0.0.0':'127.0.0.1',()=>console.log('Stage253 fictional persistent acceptance transport ready'));
process.on('SIGTERM',()=>server.close(()=>{sql.close();process.exit(0)}));
