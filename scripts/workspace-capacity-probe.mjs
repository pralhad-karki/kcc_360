// Diagnostic only. Does not certify 10,000-user capacity or access a hosted DB.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {workspaceCapacityFixture,bytes} from '../fixtures/workspace-capacity.mjs';
const args=process.argv.slice(2),option=name=>args[args.indexOf(name)+1];
if(args.length!==5||!args.includes('--local-fictional')||!args.includes('--report')||!args.includes('--baseline')||!/^[a-f0-9]{40}$/.test(option('--baseline')))throw Error('Usage: node scripts/workspace-capacity-probe.mjs --local-fictional --baseline <commit-sha> --report <new-report.json>');
const destination=path.resolve(option('--report'));if(fs.existsSync(destination))throw Error('Existing evidence will not be overwritten');
const baseline=option('--baseline'),oldSource=execFileSync('git',['show',baseline+':server/service.ts'],{encoding:'utf8'});
const report={kind:'KCC360_LOCAL_CAPACITY_DIAGNOSTIC',planningTarget:{registeredUsers:10000,years:3,peakConcurrentInstitutionalUsers:'NOT_AGREED'},baselineCommit:baseline,candidateBaseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),environment:{node:process.version,platform:process.platform,cpuModel:os.cpus()[0]?.model},scope:'Actual compiled workspace route/service/engine; disposable file-backed SQLite; fictional owner identity; no HTTP network, browser, D1, MIS, SSO or production workload',sessionRowsPerFixture:10000,variants:[],acceptance:'HOLD — diagnostics only; 10,000-user capacity not established'};
const measure=async fn=>{const start=performance.now(),response=await fn(),body=await response.json();return {status:response.status,ms:Number((performance.now()-start).toFixed(3)),responseBytes:bytes(body)}};
for(const [name,source] of [['baseline',oldSource],['candidate',null]]){
 const variant={name,scenarios:[]};
 for(const projectCount of [8,100,500]){
  const f=await workspaceCapacityFixture({projectCount,serviceSource:source});
  try{
   variant.serviceSourceSHA256=f.sourceHash;
   const scenario={projectCount,initialPayloadBytes:bytes(f.row().payload),reads:[],sequentialWrites:[],writeBursts:[]};
   f.resetMetrics();for(let i=0;i<3;i++)scenario.reads.push(await measure(()=>f.get('fictional-session-'+(9999-i))));scenario.readMetrics=f.metrics();
   assert(scenario.reads.every(r=>r.status===200));
   f.resetMetrics();for(let i=0;i<3;i++)scenario.sequentialWrites.push(await measure(()=>f.post('fictional-session-'+i,f.message(i,f.row().revision,'Fictional capacity sequential '+i))));scenario.sequentialMetrics=f.metrics();assert(scenario.sequentialWrites.every(r=>r.status===200));
   for(const parallelRequests of [2,8]){
    f.resetMetrics();const revision=f.row().revision,audit=f.auditCount(),start=performance.now();
    const requests=await Promise.all(Array.from({length:parallelRequests},(_,i)=>measure(()=>f.post('fictional-session-'+i,f.message(i,revision,'Fictional synchronized project '+i)))));
    const succeeded=requests.filter(r=>r.status===200).length,conflicts=requests.filter(r=>r.status===409).length;
    assert.equal(succeeded,1);assert.equal(conflicts,parallelRequests-1);assert.equal(f.row().revision,revision+1);assert.equal(f.auditCount(),audit+1);
    scenario.writeBursts.push({parallelRequests,distinctProjects:parallelRequests,loadedRevision:revision,succeeded,conflicts,durationMs:Number((performance.now()-start).toFixed(3)),requestSamples:requests,metrics:f.metrics(),interpretation:'Different projects still compete on one workspace revision. Conflicts preserve data but are a scaling blocker, not user-capacity acceptance.'});
   }
   scenario.finalPayloadBytes=bytes(f.row().payload);variant.scenarios.push(scenario);
  }finally{await f.close()}
 }
 const f=await workspaceCapacityFixture({serviceSource:source});
 try{
  const d=JSON.parse(f.row().payload);d.capacityFixturePadding='';d.capacityFixturePadding='क'.repeat(Math.floor((1_998_000-bytes(d))/3));f.seedPayload(d);
  const before=f.row(),result=await measure(()=>f.post('fictional-session-0',f.message(0,0,'क'.repeat(1000))));
  variant.unicodeBoundary={beforeBytes:bytes(before.payload),beforeCharacters:before.payload.length,resultStatus:result.status,afterBytes:bytes(f.row().payload),workspaceUnchanged:JSON.stringify(f.row())===JSON.stringify(before),auditRows:f.auditCount()};
  assert.equal(result.status,name==='baseline'?200:413);if(name==='candidate'){assert(variant.unicodeBoundary.workspaceUnchanged);assert.equal(f.auditCount(),0)}
 }finally{await f.close()}
 report.variants.push(variant);
}
report.finishedAt=new Date().toISOString();report.findings=['Existing session reads need zero insert attempts in the candidate','UTF-8 size enforcement protects Nepali text near the real byte limit','Unrelated project writes still share one revision; normalized hot-write storage remains required','Three timing samples per sequential case are diagnostic, not a production percentile or SLA','10,000 fictional session rows are not 10,000 institutional accounts or concurrent users','Identity/security, private-file storage, backup/restore, monitoring and hosted load acceptance remain open'];
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({report:destination,variants:report.variants.map(v=>({name:v.name,sourceSHA256:v.serviceSourceSHA256,reads:v.scenarios.map(s=>({projects:s.projectCount,queries:s.readMetrics.queries,sessionInsertAttempts:s.readMetrics.sessionInsertAttempts})),unicode:v.unicodeBoundary,bursts:v.scenarios.map(s=>({projects:s.projectCount,results:s.writeBursts.map(b=>({requests:b.parallelRequests,success:b.succeeded,conflicts:b.conflicts}))}))})),acceptance:report.acceptance},null,2));
