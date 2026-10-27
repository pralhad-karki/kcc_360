import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {createEngine} from './server/engine.mjs';
import {validateCommandForms} from './server/form-fields.mjs';
import {assertTaskMappingRecorderRefactor} from './scripts/assert-task-mapping-recorder-refactor.mjs';
// The reviewed intake edits are allowed; an unrelated app mutation must still fail.
assertTaskMappingRecorderRefactor();
assert.throws(()=>assertTaskMappingRecorderRefactor(fs.readFileSync('prototype/app.js','utf8').replace('let intakeFocus=null;','let intakeFocus=42;')));
let data=createEngine(null,'s1').snapshot();const projects=JSON.stringify(data.projects),clubs=JSON.stringify(data.clubs);
const form=x=>({form:x}),input={title:'Student mentor preference',type:'Project',programme:'BCA',purpose:'Independent learning',outputs:'Project report',start:'2026-11-01',due:'2026-12-01',primaryUnit:'ACADEMIC',alignmentReason:'Academic project',reason:'Student proposal'};
function run(actor,command,args){validateCommandForms(command,args);const result=createEngine(data,actor).run(command,args);data=result.data;return result}
for(const bad of [{suggestedMentor:'x'.repeat(201)},{suggestedMentor:'Mentor',mentorSuggestionReason:'x'.repeat(1001)},{mentorSuggestionReason:'Reason without a name'}]){run('s1','saveActivityIntake',[form({...input,...bad}),'',0]);assert.equal(data.activityIntakes.length,0)}
const preference={suggestedMentor:'  Dr. Suggested <Mentor>  ',mentorSuggestionReason:'  PRIVATE fit and interest  '};
run('s1','saveActivityIntake',[form({...input,...preference}),'',0]);const id=data.activityIntakes.at(-1).id,record=()=>data.activityIntakes.find(r=>r.id===id);
assert.deepEqual(record().content.mentorSuggestion,{name:'Dr. Suggested <Mentor>',reason:'PRIVATE fit and interest'});assert.equal(record().mentorAssignments,undefined);assert.equal(record().routing,undefined);assert.equal(record().projectId,undefined);assert.equal(JSON.stringify(data.projects),projects);assert.equal(JSON.stringify(data.clubs),clubs);
assert.equal(createEngine(data,'m2').view().activityIntakes.some(r=>r.id===id),false);assert.equal(createEngine(data,'s2').view().activityIntakes.some(r=>r.id===id),false);
const first=structuredClone(record().draftHistory[0]);run('s2','saveActivityIntake',[form({...input,suggestedMentor:'Peer takeover'}),id,1]);assert.equal(record().revision,1);run('s1','saveActivityIntake',[form({...input,suggestedMentor:'Stale'}),id,0]);assert.equal(record().revision,1);
// An optional preference can be cleared; the earlier declared version remains intact.
run('s1','saveActivityIntake',[form(input),id,1]);assert.equal(record().revision,2);assert.equal(Object.hasOwn(record().content,'mentorSuggestion'),false);assert.deepEqual(record().draftHistory[0],first);assert.deepEqual(record().draftHistory[1].priorContent.mentorSuggestion,first.content.mentorSuggestion);
run('s1','saveActivityIntake',[form({...input,...preference}),id,2]);run('s1','submitActivityIntake',[id,3]);const submitted=structuredClone(record().submissions[0]);
run('s1','saveActivityIntake',[form({...input,suggestedMentor:'Alter submitted'}),id,3]);assert.deepEqual(record().submissions[0],submitted);assert.equal(record().revision,3);
run('c1','reviewActivityIntake',[form({decision:'ROUTING_CONFIRMED',primaryUnit:'ACADEMIC',reason:'Confirmed routing'}),id,1]);
const offer={mentor:'m1',fit:'Relevant independent expertise',capacity:'Available',reason:'Reviewed student preference; assigning suitable mentor'};
run('s1','assignIntakeMentor',[form(offer),id,0]);assert.equal(record().mentorAssignments,undefined);run('c1','assignIntakeMentor',[form(offer),id,0]);const assignment=record().mentorAssignments[0];assert.equal(assignment.state,'REQUESTED');assert.equal(assignment.mentor,'m1');assert.deepEqual(record().submissions[0],submitted);assert.equal(createEngine(data,'m2').view().activityIntakes.some(r=>r.id===id),false);
run('m1','respondIntakeMentor',[form({decision:'ACCEPTED',noConflict:'yes',reason:'Able to supervise independently'}),id,assignment.id,1]);assert.equal(record().mentorAssignments[0].state,'ACCEPTED');assert.equal(JSON.stringify(data.projects),projects);assert.equal(record().projectId,undefined);
// Legacy forms remain valid and do not gain a synthetic empty preference object.
run('s2','saveActivityIntake',[form({...input,title:'No suggested mentor'}),'',0]);assert.equal(Object.hasOwn(data.activityIntakes.at(-1).content,'mentorSuggestion'),false);
assert.throws(()=>validateCommandForms('saveActivityIntake',[form({...input,assignedMentor:'m1'})]),/Unapproved/);
const nodes={},ctx={console,localStorage:{getItem:()=>null,setItem(){}},document:{querySelector:k=>nodes[k]||(nodes[k]={style:{},showModal(){},close(){}})},setTimeout(){},URL,Blob};vm.createContext(ctx);
for(const n of ['governance','participation','assessment','appeals','outcomes','membership','budget-revisions','cash-settlement','portfolio-sharing','delivery','mentor-transfers','notifications','reports','app'])vm.runInContext(fs.readFileSync('prototype/'+n+'.js','utf8'),ctx);
ctx.fixture=structuredClone(data);ctx.fixture.activityIntakes.find(r=>r.id===id).mentorAssignments.at(-1).state='WITHDRAWN';ctx.intakeId=id;vm.runInContext(`db=fixture;uid='c1';const summary=intakeContentSummary(intakeRecord(intakeId).content);if(!summary.includes('not an assignment')||!summary.includes('&lt;Mentor&gt;')||summary.includes('Dr. Suggested <Mentor>'))throw Error('Unsafe or misleading summary');intakeMentorForm(intakeId);if(!document.querySelector('#modal').innerHTML.includes('Student mentor suggestion'))throw Error('Assignment form omits preference');uid='s2';activityIntakeForm(db.activityIntakes.at(-1).id);if(!document.querySelector('#modal').innerHTML.includes('name="suggestedMentor"')||!document.querySelector('#modal').innerHTML.includes('name="mentorSuggestionReason"'))throw Error('Missing optional student fields');`,ctx);
console.log('PASS optional student mentor suggestion: bounded name/reason, legacy and clear behavior, immutable revisions/submissions, own/stale/privacy denial, no assignment/notification/access grant, independent coordinator selection and mentor acceptance, escaped student/staff forms and unchanged execution. Browser acceptance not run.');
