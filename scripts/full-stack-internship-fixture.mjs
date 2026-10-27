// Controller-driven preconditions for the remaining Stage253 internship browser checks.
// Invoked explicitly only by the local acceptance transport on a fresh revision-0 DB.
import assert from 'node:assert/strict';
export async function prepare({service,route,context,record}){
 const subject='stage253-s1',identity={userId:subject,email:'fictional-owner@example.test',fullName:'Fictional acceptance owner'};
 return context.run({identity},async()=>{
  const initial=await service.loadWorkspace();assert.equal(initial.revision,0,'Fixture setup requires a fresh DB; existing workflow records are never overwritten');
  const f=form=>({form});let current;
  const command=async(actor,name,args)=>{
   await service.selectActor(subject,actor);const before=await service.loadWorkspace();
   const response=await route.POST(new Request('http://localhost/api/workspace',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:JSON.stringify({actor,revision:before.revision,command:name,args,context:{page:'Activity Intake'}})}));
   const body=await response.json();assert.equal(response.status,200,body.error);current=await service.loadWorkspace();assert.equal(current.revision,before.revision+1,body.message||name);record({phase:'controller-fixture-setup',actor,command:name,status:response.status,revisionBefore:before.revision,revisionAfter:current.revision});
  };
  await command('s1','saveActivityIntake',[f({title:'Fictional Stage253B internship',type:'Internship',programme:'BCA',semester:'3',purpose:'Fictional supervised learning',outputs:'Fictional individual report and reflection',start:'2026-11-01',due:'2026-11-30',primaryUnit:'ACADEMIC',alignmentReason:'Fictional academic placement',reason:'Fictional browser acceptance preconditions'}),'',0]);
  let intake=()=>current.data.activityIntakes.at(-1),id=intake().id;
  await command('s1','submitActivityIntake',[id,1]);
  await command('c1','reviewActivityIntake',[f({decision:'ROUTING_CONFIRMED',primaryUnit:'ACADEMIC',reason:'Fictional routing confirmed'}),id,1]);
  await command('c1','assignIntakeMentor',[f({mentor:'m1',fit:'Fictional relevant supervision',capacity:'Fictional available capacity',reason:'Fictional assignment'}),id,0]);
  const ma=intake().mentorAssignments.at(-1);
  await command('m1','respondIntakeMentor',[f({decision:'ACCEPTED',noConflict:'yes',reason:'Fictional supervision accepted'}),id,ma.id,1]);
  await command('s1','submitInternshipPlacement',[f({studentNumber:'MOCK-STAGE253B',organization:'Fictional Acceptance Host',address:'Fictional test address',recipient:'Fictional workplace supervisor',role:'Fictional student intern',mode:'CURRICULAR',start:'2026-11-01',end:'2026-11-30',hours:'40',objectives:'Fictional supervised learning and individual evidence',reason:'Fictional placement proposal'}),id,0]);
  const pl=intake().internshipPlacements.at(-1);
  await command('m1','reviewInternshipPlacement',[f({reason:'Fictional mentor review'}),id,pl.id,1,'MENTOR_REVIEWED']);
  await command('d1','reviewInternshipPlacement',[f({reason:'Fictional department approval'}),id,pl.id,1,'APPROVED']);
  await command('d1','issueInternshipLetter',[id,pl.id,1]);
  await service.selectActor(subject,'s1');return {intakeId:id,letterId:intake().internshipLetters.at(-1).id};
 });
}
