// Repeatable isolated developer regression checkpoint. Each check owns a fresh Node process.
import {spawnSync,execFileSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const checks=[
 ['website-v1-operator','check-website-v1-operator.mjs'],
 ['website-v1-mock','check-website-v1-mock.mjs'],
 ['plan-target-proof','check-plan-target-proof.mjs'],
 ['annual-target-plan-binding','check-annual-target-plan-binding.mjs'],
 ['annual-target-allocation','check-annual-target-allocation.mjs'],
 ['annual-targets','check-annual-targets.mjs'],
 ['approved-club-calendar','check-approved-club-calendar.mjs'],
 ['student-affairs-internship-summary','check-student-affairs-internship-summary.mjs'],
 ['student-affairs-planning','check-student-affairs-planning.mjs'],
 ['student-affairs-planning-save','check-student-affairs-planning-save.mjs'],
 ['student-affairs-planning-client','check-student-affairs-planning-client.mjs'],
 ['club-plan-governance','check-club-plan-governance.mjs'],
 ['club-plan-governance-save','check-club-plan-governance-save.mjs'],
 ['club-plan-governance-client','check-club-plan-governance-client.mjs'],
 ['club-evaluation','check-club-evaluation.mjs'],
 ['student-affairs-reports','check-reports.cjs'],
 ['monitoring-privacy','check-monitoring-projection.mjs'],
 ['mis-academic-import','check-mis-academic-import.mjs'],
 ['mis-upload-route','check-mis-upload-route.mjs'],
 ['mis-upload-staging','check-mis-upload-staging.mjs'],
 ['mis-manual-students','check-mis-manual-import.mjs'],
 ['department-task-csv','check-department-task-csv.mjs'],
 ['department-task-csv-save','check-department-task-csv-save.mjs'],
 ['department-task-csv-client','check-department-task-csv-client.mjs'],
 ['club-recruitment-plan','check-club-recruitment-plan.mjs'],
 ['club-volunteer-applications','check-club-volunteer-applications.mjs'],
 ['club-volunteer-selection','check-club-volunteer-selection.mjs'],
 ['club-volunteer-handoff','check-club-volunteer-handoff.mjs'],
 ['club-volunteer-domain-tasks','check-club-volunteer-domain-tasks.mjs'],
 ['club-volunteer-achievement-chain','check-club-volunteer-achievement-chain.mjs'],
 ['plan-approval-policy','check-plan-approval-policy.mjs'],
 ['plan-approval-source','check-plan-approval-source.mjs'],
 ['plan-approval-persistence','check-plan-approval-save.mjs'],
 ['plan-amendment-integration','check-plan-amendment.mjs'],
 ['plan-approval-client','check-plan-approval-client.mjs'],
 ['plan-approval-route','check-plan-approval-route.mjs'],
 ['trusted-loader','check-intake-trusted-loader.mjs'],['command-route','check-team-command-route.mjs'],
 ['assignment-save','check-intake-team-task-save.mjs'],['assignment-client','check-intake-team-task-client.mjs'],
 ['progress-save','check-intake-team-task-progress-save.mjs'],['progress-client','check-intake-team-task-progress-client.mjs'],
 ['submission-save','check-intake-team-task-submission-save.mjs'],['evidence-client','check-intake-team-task-evidence-client.mjs'],
 ['evidence-verification-save','check-intake-team-evidence-verification-save.mjs'],['evidence-verification-client','check-intake-team-evidence-verification-client.mjs'],
 ['review-save','check-intake-team-task-review-save.mjs'],['review-client','check-intake-team-task-review-client.mjs'],
 ['revision-save','check-intake-team-task-revision-save.mjs'],['revision-client','check-intake-team-task-revision-client.mjs'],
 ['rereview-save','check-intake-team-task-rereview-save.mjs'],['rereview-client','check-intake-team-task-rereview-client.mjs'],
 ['multiple-cycles','check-intake-team-task-cycles.mjs'],['history','check-intake-team-task-history.mjs'],
 ['dialog-naming','check-dialog-accessibility.mjs'],['mis-mock-isolation','check-mis-adapter.mjs'],
 ['server-regression','check-server.mjs'],['academic-progression-regression','check-academic-progression.mjs'],
 ['cohort-preview','check-cohort-progression-preview.mjs'],['cohort-route','check-cohort-progression-route.mjs'],['cohort-client','check-cohort-progression-client.mjs'],
 ['cohort-batch-core','check-cohort-progression-batch.mjs'],
 ['cohort-batch-storage-route','check-cohort-progression-batches-route.mjs'],
 ['cohort-batch-client','check-cohort-progression-batches-client.mjs'],
 ['cohort-batch-withdrawal','check-cohort-progression-withdrawal.mjs'],
 ['cohort-batch-comparison','check-cohort-progression-comparison.mjs'],
 ['layout-fixture','scripts/task-layout-acceptance-server.mjs','--self-test'],
 ['workflow-fixture','scripts/team-acceptance-server.mjs','--self-test']
];
const args=process.argv.slice(2);if(args.length!==0&&(args.length!==2||args[0]!=='--report'||!args[1]))throw Error('Usage: node scripts/check-task-workflow.mjs [--report new-report.json]');
const reportPath=args.length?path.resolve(root,args[1]):null;
if(reportPath&&fs.existsSync(reportPath))throw Error('Existing regression evidence will not be overwritten; choose a new report path.');
const report={kind:'KCC360_TASK_WORKFLOW_REGRESSION_V1',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),scope:'Isolated developer checks with fictional fixtures; no browser or institutional acceptance execution',results:[]};
for(const [id,...command] of checks){
 const start=Date.now(),r=spawnSync(process.execPath,command,{cwd:root,encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024,env:{...process.env,NODE_NO_WARNINGS:'1'}}),passed=r.status===0&&!r.error;
 const result={id,command:[path.basename(process.execPath),...command],status:passed?'PASS':'FAIL',exitCode:r.status,signal:r.signal||null,durationMs:Date.now()-start};
 if(!passed)result.failure=(r.error?.message||'')+'\n'+(r.stdout||'')+'\n'+(r.stderr||'');
 report.results.push(result);console.log(`${result.status} ${id} (${result.durationMs} ms)`);
 if(!passed)console.error(result.failure.slice(-6000));
}
report.finishedAt=new Date().toISOString();report.passed=report.results.filter(r=>r.status==='PASS').length;report.failed=report.results.length-report.passed;
report.externalDependencies=['Official MIS schema, access and sandbox for real roster/contact/status synchronization','Official SSO specification, trust registration and institutional identity activation','Approved Google sender and real mail/reconciliation configuration'];
report.acceptanceNotExecuted=['Browser checks (prior recorded browser evidence remains separate)','Full application accessibility, screen reader and real touch-device acceptance','Official MIS/credit assertions and institutional acceptance'];
if(reportPath){fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log('Saved '+path.relative(root,reportPath));}
console.log(`${report.passed}/${report.results.length} checks passed; ${report.failed} failed.`);process.exitCode=report.failed?1:0;
