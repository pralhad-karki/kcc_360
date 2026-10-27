import assert from 'node:assert/strict';
import {createEngine} from './server/engine.mjs';
const fresh=()=>createEngine(null,'s1').snapshot(), form=x=>({form:x});
const run=(d,u,cmd,args=[],pid)=>createEngine(d,u).run(cmd,args,pid?{selected:pid}:{}).data;
const fields={title:'Independent proposal',programme:'BCA',type:'Course project',description:'Learning project',due:'2026-12-01'};
for(const u of ['f1','fv1','a1','d1','sa1','dc1','da1','np1','na1']){let d=fresh(),n=d.projects.length;d=run(d,u,'createProject',[form(fields)]);assert.equal(d.projects.length,n,u);}
for(const u of ['s1','s2','m1','m2','c1']){let d=fresh(),n=d.projects.length;d=run(d,u,'createProject',[form(fields)]);assert.equal(d.projects.length,n+1,u);let p=d.projects.at(-1);assert.notEqual(p.mentor,u);assert.ok(['s1','s2'].includes(p.owner));}
let d=run(fresh(),'m1','createProject',[form(fields)]),p=d.projects.at(-1),id=p.id;
d=run(d,'m1','advance',['PENDING_APPROVAL'],id);p=d.projects.at(-1);assert.equal(p.proposalVersions.length,1);const v1=JSON.stringify(p.proposalVersions[0]);
d=run(d,'m1','advance',['APPROVED'],id);assert.equal(d.projects.at(-1).state,'PENDING_APPROVAL');
d=run(d,'m2','doReturn',[form({reason:''})],id);assert.equal(d.projects.at(-1).state,'PENDING_APPROVAL');
d=run(d,'m2','doReturn',[form({reason:'Clarify scope'})],id);assert.equal(d.projects.at(-1).proposalReviews[0].version,1);
d=run(d,'m1','editProposalDraft',[form({...fields,title:'Revised scope',reason:'Reviewer feedback'})],id);assert.equal(d.projects.at(-1).title,'Revised scope');assert.equal(JSON.stringify(d.projects.at(-1).proposalVersions[0]),v1);
d=run(d,'m1','advance',['PENDING_APPROVAL'],id);assert.equal(d.projects.at(-1).proposalVersions.length,2);
let stale=structuredClone(d);stale.projects.at(-1).title='Tampered';stale=run(stale,'m2','advance',['APPROVED'],id);assert.equal(stale.projects.at(-1).state,'PENDING_APPROVAL');
d=run(d,'m2','advance',['APPROVED'],id);assert.equal(d.projects.at(-1).state,'APPROVED');assert.equal(d.projects.at(-1).proposalReviews.at(-1).decision,'APPROVED');
d=run(d,'s1','editProposalDraft',[form({...fields,reason:'Forbidden'})],id);assert.equal(d.projects.at(-1).title,'Revised scope');
let legacy=fresh();legacy.projects[0].state='PENDING_APPROVAL';legacy.projects[0].createdBy='m1';let lid=legacy.projects[0].id;legacy=run(legacy,'m1','advance',['APPROVED'],lid);assert.equal(legacy.projects[0].state,'PENDING_APPROVAL');delete legacy.projects[0].createdBy;legacy=run(legacy,'m1','doReturn',[form({reason:'Legacy correction'})],lid);assert.equal(legacy.projects[0].proposalVersions[0].submittedAt,null);
d=fresh();let c=d.clubs[0],cid=c.id;c.state='ACTIVE';c.plans=[{id:'NEXT',year:'2027–28',state:'APPROVED',items:[]}];c.reviews=[{cycle:'2026–27',version:1,state:'RENEWED'}];
let wrong=run(d,'s1','saveAnnualReport',[form({cycle:'2026–27',summary:'Duplicate'}),cid]);assert.equal(wrong.clubs[0].reviews.length,1);
d=run(d,'s1','saveAnnualReport',[form({cycle:'2027–28',summary:'Next annual report'}),cid]);assert.equal(d.clubs[0].reviews.length,2);assert.equal(d.clubs[0].reviews[1].cycleVersion,1);
d=run(d,'s1','saveAnnualReport',[form({cycle:'2027–28',summary:'Duplicate draft'}),cid]);assert.equal(d.clubs[0].reviews.length,2);d.clubs[0].reviews[1].state='CORRECTION_REQUIRED';d=run(d,'s1','saveAnnualReport',[form({cycle:'2027–28',summary:'Correction'}),cid]);assert.equal(d.clubs[0].reviews.length,3);assert.equal(d.clubs[0].reviews[2].cycleVersion,2);
function cancelled(){let d=fresh(),c=d.clubs[0],p=d.projects[0];p.sourceClub=c.id;p.activityControl={state:'CANCELLED',requestId:'CANCEL'};d.activityChanges=[{id:'CANCEL',projectId:p.id,kind:'CANCEL',state:'APPROVED',finance:{by:'f1'}}];c.budgets=[{id:'ZERO',project:p.id,proposer:'s1',state:'DRAFT',lines:[],expenses:[],cashLedger:{opening:{state:'VERIFIED',advances:0,reimbursements:0,refunds:0},transactions:[]}}];return d;}
function close(d,u='f1'){return run(d,u,'closeCancelledDraftBudget',[form({reason:'Verified no obligations'}),d.clubs[0].id,'ZERO']);}
for(const mutate of [d=>d.clubs[0].budgets[0].approved=0,d=>d.clubs[0].budgets[0].approved=100,d=>d.clubs[0].budgets[0].expenses.push({amount:1}),d=>d.clubs[0].budgets[0].cashLedger.opening.state='UNKNOWN',d=>d.clubs[0].budgets[0].cashLedger.opening.advances=100,d=>d.activityChanges[0].state='REQUESTED',d=>d.clubs[0].budgets[0].proposer='f1']){let d=cancelled();mutate(d);assert.equal(close(d).clubs[0].budgets[0].state,'DRAFT');}
for(const u of ['s1','m1','sa1','fv1'])assert.equal(close(cancelled(),u).clubs[0].budgets[0].state,'DRAFT');
d=close(cancelled());assert.equal(d.clubs[0].budgets[0].state,'CANCELLED_NO_OBLIGATION');let closure=JSON.stringify(d.clubs[0].budgets[0].zeroObligationClosure);d=close(d);assert.equal(JSON.stringify(d.clubs[0].budgets[0].zeroObligationClosure),closure);assert.equal(d.clubs[0].budgets[0].approved,undefined);
console.log('PASS: G01–G05 eligibility, independent decisions, immutable proposal versions, stale approval, annual cycles/corrections, zero-obligation finance guards and replay.');
