// Read-only source audit and disposable fictional SQLite probes. No hosted
// bindings, existing database, real identity, transport or migration execution.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
import {workspaceCapacityFixture} from '../fixtures/workspace-capacity.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
if(process.cwd()!==root.replace(/\/$/,''))throw Error('Run from the repository root.');
const args=process.argv.slice(2);
if(args.length!==3||args[0]!=='--fictional-local-audit'||args[1]!=='--report')throw Error('Usage: node scripts/audit-architecture.mjs --fictional-local-audit --report new-evidence.json');
const reportPath=path.resolve(args[2]);if(fs.existsSync(reportPath))throw Error('Existing audit evidence will not be overwritten.');
const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(directory,e.name)):[path.join(directory,e.name)]);
const files=walk('server').filter(p=>/\.(ts|mjs)$/.test(p));
const patterns={prepareCalls:/\.prepare\s*\(/,batchCalls:/\.batch\s*\(/,drizzleImports:/from ['"]drizzle-orm/,sqliteInsertOrIgnore:/INSERT\s+OR\s+IGNORE/i,namedSqliteJsonDateFunctions:/\b(?:json_extract|json_set|json_each|json_group_array|julianday|strftime|last_insert_rowid)\s*\(/i};
const sourceInventory=Object.fromEntries(Object.entries(patterns).map(([name,pattern])=>[name,files.filter(p=>pattern.test(fs.readFileSync(p,'utf8')))]));
const report={kind:'KCC360_TECHNICAL_AUDIT_V1',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),scope:'Local source, existing fictional checks and disposable SQLite only; no hosted penetration test or PostgreSQL acceptance',sourceInventory,engineBytes:fs.statSync('server/engine.mjs').size,probes:{},checks:[]};

// Observe the commit-time session predicate using a deterministic barrier
// simulation. This concerns owner-demo persona changes, not an unauthenticated
// attacker or a demonstrated cross-organization breach.
const f=await workspaceCapacityFixture({sessionCount:2});
try{
 await f.service.selectActor('fictional-session-0','a1');
 report.probes.ownerDemoPersonaSelection={selectedActor:await f.service.readSession('fictional-session-0'),institutionalImpersonationAccepted:false};
 await f.service.selectActor('fictional-session-0','s1');
 f.hookNextRun((sql,query)=>{
  assert(query.startsWith('UPDATE kcc_workspaces SET payload'));
  sql.prepare('UPDATE kcc_demo_sessions SET actor=? WHERE subject=?').run('a1','fictional-session-0');
 });
 const response=await f.post('fictional-session-0',f.message(0,0,'Fictional audit barrier message'));
 const actor=await f.service.readSession('fictional-session-0'),audit=f.sqlite.prepare('SELECT actor FROM kcc_server_audit ORDER BY revision DESC LIMIT 1').get();
 report.probes.commitSessionRace={responseStatus:response.status,currentSessionActor:actor,committedAuditActor:audit?.actor??null,workspaceRevision:f.row().revision,findingConfirmed:response.status===200&&actor==='a1'&&audit?.actor==='s1',method:'Session changed at the write barrier inside a disposable serialized SQLite batch; not a multi-host concurrency measurement'};
 assert([200,409].includes(response.status),'Unexpected probe status; inspect the audit evidence.');
}finally{await f.close()}
const sample=JSON.stringify({fictional:'क'.repeat(700_000)});
report.probes.unicodeBudget={utf16CodeUnits:sample.length,utf8Bytes:Buffer.byteLength(sample,'utf8'),legacyCharacterGuardAccepts:sample.length<=2_000_000,byteGuardAccepts:Buffer.byteLength(sample,'utf8')<=2_000_000,scope:'Arithmetic reproduction of the remaining files/shares guards, not a hosted upload attempt'};

const checks=['check-permission-policy.mjs','check-identity-grant-adapter.mjs','check-project-resource-policy.mjs','check-intake-trusted-loader.mjs','check-files.mjs','check-sharing.mjs','check-project-discussion.mjs','check-workspace-reliability.mjs','check-discussion-migration.mjs','check-discussion-command-rehearsal.mjs'];
for(const file of checks){
 const start=Date.now(),r=spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:2*1024*1024,env:{...process.env,NODE_NO_WARNINGS:'1'}}),passed=r.status===0&&!r.error;
 const item={file,passed,exitCode:r.status,durationMs:Date.now()-start,output:(r.stdout+r.stderr).replace(/data:text\/javascript;base64,[A-Za-z0-9+/=]+/g,'<compiled-test-module>')};
 if(r.error)item.error=r.error.message;report.checks.push(item);console.log((passed?'PASS ':'FAIL ')+file);
}
report.finishedAt=new Date().toISOString();report.passed=report.checks.filter(r=>r.passed).length;report.failed=report.checks.length-report.passed;
report.interpretation='Passing isolated security components does not establish that live routes use them. Confirmed-risk probes are findings, not acceptance passes.';
fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({checksPassed:report.passed,checksFailed:report.failed,commitSessionRaceConfirmed:report.probes.commitSessionRace.findingConfirmed,hostedTest:false}));
process.exitCode=report.failed?1:0;
