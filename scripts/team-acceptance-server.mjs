// Local fictional acceptance adapter. Never imported by application routes/builds.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
if(process.argv[2]!=='--local-fictional'&&process.argv[2]!=='--self-test')throw Error('Explicit --local-fictional or --self-test is required.');
const {taskProgressFixture:f}=await import('../check-intake-team-task-save.mjs');
// Optional reviewed baseline reuses the existing asserted lifecycle; never real data.
const reviewedFixture=process.argv.includes('--reviewed-fixture');
if(reviewedFixture)await import('../check-intake-team-task-review-save.mjs');
const {createEngine}=await import('../server/engine.mjs');
const {isIntakeTeamCommand}=await import('../server/intake-team-command-bridge.mjs');
const accounts={s1:0,s2:1,s7:6};let queue=Promise.resolve();
function view(actor){const r=f.row(),e=createEngine(JSON.parse(r.payload),actor);return {actor,actors:[...e.actors().filter(a=>Object.hasOwn(accounts,a.id)),{id:'s7',name:'Fictional acceptance mentor',role:'Mentor fixture'}],revision:r.revision,updatedAt:r.updated_at,data:e.view()}}
const server=http.createServer((req,res)=>{queue=queue.then(async()=>{
 const host=req.headers.host||'',hostname=host.split(':')[0];
 const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
 if(!['127.0.0.1','localhost','terminal.local'].includes(hostname))return send({error:'Local acceptance host required'},403);
 const url=new URL(req.url,'http://'+host),cookie=/\bkcc_acceptance_actor=(s1|s2|s7)\b/.exec(req.headers.cookie||''),actor=cookie?.[1]||'s1';
 try{
  if(req.method==='POST'){
   if(req.headers.origin!=='http://'+host||req.headers['content-type']!=='application/json')return send({error:'Same-origin JSON required'},403);
   let text='';for await(const chunk of req){text+=chunk;if(text.length>64000)return send({error:'Request too large'},413)}
   const b=JSON.parse(text);
   if(url.pathname==='/api/session'){if(!Object.hasOwn(accounts,b.actor))return send({error:'Fictional account only'},403);res.setHeader('Set-Cookie',`kcc_acceptance_actor=${b.actor}; Path=/; HttpOnly; SameSite=Strict`);return send(view(b.actor))}
   if(url.pathname!=='/api/workspace')return send({error:'Route unavailable in acceptance'},404);
   if(b.actor!==actor||b.revision!==f.row().revision)return send({error:'Account or workspace changed; refresh.'},409);
   if(!isIntakeTeamCommand(b.command)||!Array.isArray(b.args)||b.args.length!==1)return send({error:'Only existing controlled team commands are available'},400);
   f.setActor(accounts[actor]);return send(await f.call(b.command,b.args[0]));
  }
  if(req.method!=='GET')return send({error:'Method not allowed'},405);
  if(url.pathname==='/'){res.writeHead(302,{Location:'/workspace/','Cache-Control':'no-store'});return res.end()}
  if(url.pathname==='/api/workspace')return send(view(actor));
  if(url.pathname==='/acceptance-info')return send({fictional:true,persistent:false,clock:'Existing frozen fixture clock',projectId:f.project().id,accounts:Object.keys(accounts),fixture:reviewedFixture?'Existing reviewed-task fixture':'Existing assignment fixture',scope:reviewedFixture?'Starts after asserted initial submissions/reviews; those phases are prerequisites, not browser results':'Started activity with two assigned tasks; intake/start acceptance not covered'});
  const name=url.pathname==='/'||url.pathname==='/workspace/'?'index.html':url.pathname.replace(/^\/workspace\//,'');
  if(!/^[a-zA-Z0-9._-]+\.(html|js|css|json)$/.test(name))return send({error:'Not found'},404);
  let bytes=await fs.readFile(path.join(root,'public/workspace',name));
  if(name==='app.js')bytes=Buffer.from(bytes.toString().replace("const users=[","const users=[{id:'s7',name:'Fictional acceptance mentor',role:'Mentor fixture'},"));
  if(name==='sync-client.js')bytes=Buffer.from(bytes.toString().replace('\nbootShared();',`\nconst acceptancePriorRender=render;render=function(){acceptancePriorRender();document.querySelectorAll('#user option').forEach(option=>{if(!['s1','s2','s7'].includes(option.value))option.remove()})};\nbootShared();`));
  if(name==='index.html')bytes=Buffer.from(bytes.toString().replace('<body>','<body><div role="note" style="padding:12px;background:#ffe7aa;color:#111;position:relative;z-index:10000">LOCAL FICTIONAL ACCEPTANCE · In-memory records lost on stop · Frozen test clock · No MIS identity or live database</div>'));
  res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/javascript','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);
 }catch(e){send({error:e.status?'Existing workflow denied this operation':'Acceptance request unavailable'},e.status||400)}
 }).catch(()=>{if(!res.writableEnded){res.statusCode=500;res.end('Acceptance unavailable')}})});
const portFlag=process.argv.indexOf('--port'),port=portFlag<0?5173:Number(process.argv[portFlag+1]);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid local preview port');
await new Promise(r=>server.listen(process.argv[2]==='--self-test'?0:port,process.argv.includes('--host')?'0.0.0.0':'127.0.0.1',r));
if(process.argv[2]==='--self-test'){
 try{const origin=`http://127.0.0.1:${server.address().port}`,before=f.state(),request=(body,headers={})=>fetch(origin+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...headers},body:JSON.stringify(body)});
 assert.equal((await fetch(origin+'/workspace/')).status,200);assert((await (await fetch(origin+'/acceptance-info')).json()).fictional);
 const landing=await fetch(origin+'/',{redirect:'manual'});assert.equal(landing.status,302);assert.equal(landing.headers.get('location'),'/workspace/');
 const client=await (await fetch(origin+'/workspace/sync-client.js')).text();assert(client.includes('acceptancePriorRender'));assert(client.includes("['s1','s2','s7'].includes(option.value)"));
 const v=await (await fetch(origin+'/api/workspace')).json();assert.equal(v.actor,'s1');assert.deepEqual(v.actors.map(a=>a.id).sort(),['s1','s2','s7']);
 assert.equal((await request({actor:'s2',revision:v.revision})).status,409);
 assert.equal((await request({actor:'s1',revision:v.revision-1,command:'discoverIntakeTeamAccess',args:[{}]})).status,409);
 const session=await fetch(origin+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({actor:'s7'})});assert.equal(session.status,200);assert.equal((await session.json()).actor,'s7');
 const mentor=await (await fetch(origin+'/api/workspace',{headers:{Cookie:'kcc_acceptance_actor=s7'}})).json();assert.equal(mentor.actor,'s7');
 assert.equal((await request({actor:'s1',revision:v.revision,command:'toggleTask',args:[0]})).status,400);
 assert.equal((await request({}, {Origin:'https://example.test'})).status,403);
 const r=await request({actor:'s1',revision:v.revision,command:'discoverIntakeTeamAccess',args:[{}]});assert.equal(r.status,200);
 assert.equal(f.state(),before);assert.equal((await fetch(origin+'/api/files')).status,404);
 // Negative probes traverse this local HTTP adapter and the real trusted dispatcher.
 const as=(actor,command,fields)=>request({actor,revision:f.row().revision,command,args:[fields],context:{page:'Activity Intake'}},{Cookie:`kcc_acceptance_actor=${actor}`});
 const read=async(actor,command,fields)=>{const response=await as(actor,command,fields);assert.equal(response.status,200);return response.json()};
 const deny=async(actor,command,fields)=>{const frozen=f.state(),response=await as(actor,command,fields);assert.equal(response.status,403);assert.equal(f.state(),frozen)};
 const reference=f.reference(),own={...reference,taskId:f.project().tasks[0].id},peer={...reference,taskId:f.project().tasks[1].id};
 const assignment=(await read('s1','readIntakeTeamTaskAssignment',reference)).assignment;
 await deny('s2','readIntakeTeamTaskAssignment',reference);
 await deny('s2','assignIntakeTeamTask',{...f.fields(),...reference,expectedTaskRevision:assignment.expectedTaskRevision,previewToken:assignment.previewToken});
 await deny('s2','readIntakeTeamTaskProgress',peer);
 const progress=(await read('s2','readIntakeTeamTaskProgress',own)).progress;
 const unchanged={...own,expectedExecutionVersion:progress.expectedExecutionVersion,previewToken:progress.previewToken,stage:'TO_DO',blocked:false,blockerReason:'',reason:'Fictional no-op probe',confirm:true};
 await deny('s2','reportIntakeTeamTaskProgress',unchanged);
 await deny('s2','reportIntakeTeamTaskProgress',{...unchanged,stage:'DONE'});
 const submission=(await read('s2','readIntakeTeamTaskSubmission',own)).submission;
 const blocked=await as('s2','reportIntakeTeamTaskProgress',{...unchanged,stage:'IN_PROGRESS',blocked:true,blockerReason:'Fictional blocker',reason:'Prepare blocked-submit negative probe'});assert.equal(blocked.status,200);
 await deny('s2','readIntakeTeamTaskSubmission',own);
 await deny('s2','submitIntakeTeamTaskWork',{...own,expectedExecutionVersion:progress.expectedExecutionVersion+1,expectedSubmissionVersion:0,previewToken:submission.previewToken,contribution:'Fictional blocked work',evidence:{mode:'NEW',title:'Fictional source',description:'Fictional observations',url:''},reason:'Negative probe',confirm:true});
 const current=(await read('s2','readIntakeTeamTaskProgress',own)).progress;
 const cleared=await as('s2','reportIntakeTeamTaskProgress',{...own,expectedExecutionVersion:current.expectedExecutionVersion,previewToken:current.previewToken,stage:'IN_PROGRESS',blocked:false,blockerReason:'',reason:'Clear fictional probe blocker',confirm:true});assert.equal(cleared.status,200);
 assert.equal(f.project().tasks[0].submissions,undefined);assert.equal(f.project().tasks[0].done,false);assert.equal(f.project().tasks[0].executionHistory.length,2);
 // Source/actor/replay exceptions use only the fixture's existing trusted controls.
 const latest=(await read('s2','readIntakeTeamTaskProgress',own)).progress;
 const update={...own,expectedExecutionVersion:latest.expectedExecutionVersion,previewToken:latest.previewToken,stage:'TO_DO',blocked:false,blockerReason:'',reason:'Fictional stale-source and replay probe',confirm:true};
 const rejected=async(send,status)=>{const frozen=f.state(),response=await send();assert.equal(response.status,status);assert.equal(f.state(),frozen)};
 f.setRace(true);
 try{await rejected(()=>as('s2','reportIntakeTeamTaskProgress',update),403)}finally{f.setRace(false)}
 const mentorGrant=f.assignments.find(a=>a.capability==='PROJECT_MENTOR'),priorRevocation=mentorGrant.revokedAt;
 mentorGrant.revokedAt='2026-10-19T12:30:00.000Z';
 try{await deny('s2','readIntakeTeamTaskProgress',own);await deny('s2','reportIntakeTeamTaskProgress',update)}finally{if(priorRevocation===undefined)delete mentorGrant.revokedAt;else mentorGrant.revokedAt=priorRevocation}
 const revision=f.row().revision;
 const payload={actor:'s2',revision,command:'reportIntakeTeamTaskProgress',args:[update]};
 await rejected(()=>request(payload,{Cookie:'kcc_acceptance_actor=s1'}),409);
 const count=f.audits().length;
 assert.equal((await request(payload,{Cookie:'kcc_acceptance_actor=s2'})).status,200);
 assert.equal(f.row().revision,revision+1);assert.equal(f.audits().length,count+1);
 assert.equal(f.project().tasks[0].executionHistory.length,3);
 await rejected(()=>request(payload,{Cookie:'kcc_acceptance_actor=s2'}),409);
 await deny('s1','reportIntakeTeamTaskProgress',update);
 assert.equal(f.project().tasks[0].done,false);assert.equal(f.project().tasks[0].submissions,undefined);
 console.log('PASS exception HTTP probes: trusted source race, revoked mentor authority, changed session actor, stale workspace replay and peer save rejected with byte-identical workspace/audit; one authorized save creates exactly one revision/audit/history entry.');
 console.log('PASS negative HTTP probes: non-lead assignment read/save, peer progress read, no-op/invalid progress, blocked submission preview/save denied with unchanged workspace/audit; authorized blocker/clear preserved history without completion.');
 console.log('PASS isolated acceptance adapter: real UI assets and dispatcher discovery, three fictional accounts, same-origin/actor guards, generic-write/file denial, unchanged fixture on reads/denials; no live database binding.');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));f.sql.close()}
}else console.log('LOCAL FICTIONAL ACCEPTANCE ready on 127.0.0.1:5173. Stop destroys this in-memory workspace.');
