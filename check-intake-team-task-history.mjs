import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const c=vm.createContext({esc,projectOverview:()=>'<main>Existing overview</main>'});
vm.runInContext(fs.readFileSync('prototype/intake-team-task-review-status.js','utf8'),c);
const task={id:'T1',title:'Task <img>',assignee:'s2',domains:['CONCEPT'],workState:'VERIFIED',assessmentCurrent:true,
 submissions:Array.from({length:9},(_,i)=>({version:i+1,contribution:`Private contribution ${i+1} <script>`,time:`2026-10-${String(i+1).padStart(2,'0')}`,evidenceIndex:0,evidenceSnapshot:JSON.stringify({title:'Frozen <img> evidence',verified:i===8}),teamSubmissionSource:i?{reason:`Revision ${i+1} <script>`}:{} })),
 taskReviews:Array.from({length:9},(_,i)=>({version:i+1,submissionVersion:i+1,decision:i===8?'VERIFIED':'RETURNED',by:'mentor <img>',time:'2026-10-22',feedback:`Feedback ${i+1} <script>`,scores:{CONCEPT:i===0?0:i===1?null:4},criterionSnapshot:{CONCEPT:'Frozen <script> criterion'}}))};
c.p={teamIntakeProvenance:{},tasks:[task],evidence:[{title:'Changed current title',verified:true}]};
const before=JSON.stringify(c.p),render=()=>vm.runInContext('projectOverview(p)',c),html=render();
assert(html.includes('Existing overview'));assert(html.includes('<details><summary>Submission and review history · 9 rounds'));
for(let n=1;n<=9;n++){assert(html.includes(`Submission v${n}</h5>`));assert(html.includes(`Review v${n} ·`));if(n>1)assert(html.indexOf(`Submission v${n-1}</h5>`)<html.indexOf(`Submission v${n}</h5>`))}
assert.equal(html.split('Current mentor-verified completion').length-1,1);
assert(html.includes('0 / 4'));assert(html.includes('Not assessed'));assert(html.includes('Evidence at submission: Unverified'));assert(html.includes('Evidence at submission: Verified'));
assert(html.includes('Frozen &lt;img&gt; evidence'));assert(!html.includes('Changed current title'));assert(!html.includes('<script>'));assert(!html.includes('<img>'));assert(html.includes('&lt;script&gt;'));
assert.equal(JSON.stringify(c.p),before);
// In-progress/stale assessments cannot claim current completion; reviews bind to submissionVersion.
c.p.tasks[0].assessmentCurrent=false;assert(!render().includes('Current mentor-verified completion'));
c.p.tasks[0].taskReviews.reverse();assert(render().includes('Review v1 · RETURNED'));
c.p.tasks[0].taskReviews.push({...c.p.tasks[0].taskReviews[0]});assert(render().includes('Review history unavailable'));
// Projected peer records contain neither submissions nor reviews. No fallback reads or writes.
c.p.tasks=[{id:'peer',title:'Peer',assignee:'s1',domains:[],workState:'SUBMITTED'}];assert(!render().includes('Individual task history'));
c.p.tasks=[{...task,submissions:[],taskReviews:[]}];assert(!render().includes('Individual task history'));
c.p={tasks:[task]};assert.equal(render(),'<main>Existing overview</main>');
c.p={teamIntakeProvenance:{},tasks:[{...task,submissions:[task.submissions[0]],taskReviews:[]}]};assert(render().includes('Awaiting mentor review'));
console.log('PASS task history: rounds 1–9, exact review-to-submission pairing, frozen evidence/criteria, zero/null, stale/current distinction, escaped private text, scoped omissions and no mutation.');
