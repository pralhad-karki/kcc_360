import assert from 'node:assert/strict';
import {createPlanReviewFixture} from './check-plan-approval-review.mjs';
import {projectApprovedClubCalendar as project} from './server/approved-club-calendar.mjs';
import {readPlanApprovalReview as read} from './server/plan-approval-review.mjs';
import {createEngine} from './server/engine.mjs';
const audience='STUDENT_AFFAIRS_OWNER_DEMO',workspaceId='KCC-OWNER-DEMO';
const f=createPlanReviewFixture('CLUB',workspaceId);
// Normalize ordinary existing source fields before approval, exactly as real creation does.
let w=f.row();f.sql.prepare('UPDATE kcc_workspaces SET payload=? WHERE id=?').run(JSON.stringify(createEngine(w.data,'s1').snapshot()),workspaceId);
f.configuration.sources[0].allowAmendments=true;
const calendar=()=>project({data:f.row().data,workspaceId,audience});
assert.equal(project({data:f.row().data,workspaceId}),null);
for(const [subject,action]of [['SUB0','CREATE'],['SUB0','SUBMIT'],['SUB1','UNIT_FORWARD'],['SUB2','FINANCE_FORWARD'],['SUB3','APPROVE']]){assert.equal(calendar().events.length,0);const p=await f.preview(subject);await f.post(f.request(p,action),subject)}
let data=f.row().data,original=structuredClone(data),c=calendar();assert.equal(c.events.length,1);assert.equal(c.approvedPlans,1);assert.equal(c.withheldPlans,0);assert.equal(c.events[0].title,'Fictional activity');assert.equal(c.events[0].end,'2026-11-02');assert.equal(c.events[0].executionAuthorized,false);assert.deepEqual(f.row().data,original);
for(const token of ['PRIVATE AUTHORIZED REASON','sourceBinding','authority','grants','personId','evidence','budget'])assert(!JSON.stringify(c).includes(token));
assert.deepEqual(createEngine(data,'sa1').view().studentAffairsApprovedCalendar,c);
for(const actor of ['s1','s2','m1','d1','c1','a1','f1'])assert.equal(createEngine(data,actor).view().studentAffairsApprovedCalendar,undefined);
const changed=structuredClone(data);changed.studentAffairsApprovedCalendar={events:[{title:'FORGED'}]};assert.equal(createEngine(changed,'sa1').view().studentAffairsApprovedCalendar.events[0].title,'Fictional activity');
const p=await f.preview(),body={...f.request(p,'DRAFT_AMENDMENT'),changes:[{type:'EXTEND_ITEM_DATES',itemId:f.raw.items[0].id,newEnd:'2026-12-01',newReportDue:'2026-12-03'}]};await f.post(body);assert.equal(calendar().events[0].end,'2026-11-02');
const ref={planId:f.raw.id,planVersion:2};let next=await read({runtime:f.runtime,subject:'SUB0',reference:ref});await f.post(f.request(next,'SUBMIT'));
f.configuration.assignments.push(...f.configuration.assignments.filter(a=>a.planVersion===1).map(a=>({...a,id:a.id+'-V2',planVersion:2})));f.configuration.version++;f.sql.prepare('UPDATE kcc_workspaces SET revision=revision+1 WHERE id=?').run('AUTH');
for(const [subject,action]of [['SUB1','UNIT_FORWARD'],['SUB2','FINANCE_FORWARD'],['SUB3','APPROVE']]){assert.equal(calendar().events[0].end,'2026-11-02');next=await read({runtime:f.runtime,subject,reference:ref});await f.post(f.request(next,action),subject)}
data=f.row().data;c=calendar();assert.equal(c.events.length,1);assert.equal(c.events[0].end,'2026-12-01');assert.equal(c.events[0].planVersion,2);assert.equal(createEngine(data,'sa1').view().studentAffairsApprovedCalendar.events[0].end,'2026-12-01');assert.deepEqual(data.clubs,original.clubs);assert.deepEqual(data.projects,original.projects);
for(const mutate of [d=>d.planApprovalRecords.push(structuredClone(d.planApprovalRecords.at(-1))),d=>d.planApprovalRecords.at(-1).decisions.pop(),d=>d.planApprovalRecords.at(-1).approvedSnapshot.content.source.proposedRecord.items[0].end='2026-12-25',d=>d.planAmendments=[],d=>d.clubs[0].plans[0].items[0].title='Changed outside review',d=>d.planApprovalRecords.at(-1).decisions.at(-1).authority.personId='OWNER']){const invalid=structuredClone(data);mutate(invalid);const result=project({data:invalid,workspaceId,audience});assert.equal(result.events.length,0);assert(result.withheldPlans>0)}
assert.equal(project({data,workspaceId:'OTHER',audience}).events.length,0);
const legacy=createEngine(null,'sa1').snapshot();legacy.clubs[0].plans=[{...structuredClone(original.clubs[0].plans[0]),state:'APPROVED'}];assert.equal(project({data:legacy,workspaceId,audience}).events.length,0);
f.close();
export const approvedCalendarUIFixture=structuredClone(data);
console.log('PASS protected club calendar: exact persisted full approval route; no drafts, endorsements or legacy labels; private DTO; role/workspace scope; read-only preservation; pending amendments retain prior dates; final successor replaces once; duplicate, changed-source, tampered and incomplete records withheld without stale fallback. Fictional trust configuration only.');
