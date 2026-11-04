import assert from 'node:assert/strict';
import {mock} from 'node:test';
import {createEngine} from './server/engine.mjs';
import {fixture,domain,digest,clock,compile} from './fixtures/discussion-migration.mjs';
const {DiscussionCommandRehearsalService}=await import(compile('server/discussion-migration/command-application.ts'));
const {LegacyDiscussionCommandAdapter}=await import(compile('server/discussion-migration/infrastructure/legacy-command-adapter.ts'));
const {validateDiscussionCommand,materializeDiscussion}=await import(compile('server/discussion-migration/command-domain.ts'));
const {DiscussionConflictError,DiscussionAccessError,DiscussionNotFoundError,DiscussionValidationError,DiscussionStorageError,canonicalJson}=domain;
const ref='P101:legacy-message:0',post={kind:'POST',text:'Fictional private नेपाली message'},reply={kind:'REPLY',text:'Fictional private reply',threadRef:ref,expectedVersion:0,expectedCount:1},resolve={kind:'SET_STATE',reason:'Fictional private reason',threadRef:ref,state:'RESOLVED',expectedVersion:0,expectedCount:1};
const request=command=>({projectId:'P101',command});let count=0;
mock.timers.enable({apis:['Date'],now:Date.parse(clock())});
function harness(f,{actor='s1',transition,reader=f.workspaceReader,copies=f.repository,authority}={}){
 const legacy=new LegacyDiscussionCommandAdapter(),calls=[];
 const port=transition??{async run(workspace,who,id,command){const result=await legacy.run(workspace,who,id,command);calls.push({before:structuredClone(workspace),after:structuredClone(result),who,id,command});return result}};
 const grants=authority??{async authorize(subject,id){return {...await f.authority.authorize(subject,id),actor}}};
 return {calls,service:new DiscussionCommandRehearsalService(reader,copies,grants,port,digest,true),legacy};
}
async function stage(f){await f.service.stage('migration-reviewer',await f.request('P101','baseline'));}
function direct(workspace,actor,command){const name=command.kind==='POST'?'sendMessage':command.kind==='REPLY'?'replyDiscussion':'setDiscussionState',args=command.kind==='POST'?[{form:{text:command.text}}]:command.kind==='REPLY'?[{form:{text:command.text}},command.threadRef,command.expectedVersion,command.expectedCount]:[{form:{reason:command.reason}},command.threadRef,command.state,command.expectedVersion,command.expectedCount];return createEngine(workspace,actor).run(name,args,{selected:'P101',page:'Projects'}).data;}
async function test(kind,name,fn){const f=fixture(kind);try{await fn(f);count++;console.log('PASS '+kind+' '+name)}finally{await f.close()}}
try{
 for(const kind of ['memory','sqlite']){
  await test(kind,'disabled rehearsal calls no providers',async()=>{const s=new DiscussionCommandRehearsalService({}, {}, {}, {}, {});assert.deepEqual(await s.preview('any',{}),{available:false});});
  await test(kind,'fresh staged copy reconstructs only its original project',async f=>{await stage(f);const copy=await f.repository.readStaged('P101'),before=f.source();assert.deepEqual(materializeDiscussion(before,copy.snapshot),before);assert.deepEqual(f.source(),before);assert.throws(()=>materializeDiscussion(before,{...copy.snapshot,projectId:'P102'}),DiscussionConflictError);});
  await test(kind,'post/reply/resolve previews match the unchanged engine and never save',async f=>{
   await stage(f);const before=f.sourceRow(),copy=await f.repository.readStaged('P101'),audit=f.auditCount();
   for(const command of [post,reply,resolve]){const h=harness(f),result=await h.service.preview('migration-reviewer',request(command)),expected=direct(f.source(),'s1',command);
    assert.equal(result.discussionChanged,true);assert.equal(result.workspaceChanged,true);assert.equal(result.afterDigest,await digest.sha256(canonicalJson(expected)));assert.deepEqual(h.calls[0].after,expected);
    assert.equal(result.mode,'READ_ONLY_REHEARSAL');assert.equal(result.stagedRevision,1);assert.equal(result.command,command.kind);assert(result.projectFields.includes('history'));assert(result.workspaceFields.includes('audit'));
    assert(!JSON.stringify(result).includes('PRIVATE_GRADE'));assert(!JSON.stringify(result).includes('Fictional private'));assert(!('workspace' in result));assert(!('commitToken' in result));
   }
   assert.deepEqual(f.sourceRow(),before);assert.deepEqual(await f.repository.readStaged('P101'),copy);assert.equal(f.auditCount(),audit);
  });
  await test(kind,'repeated previews keep IDs, counts and history unchanged in storage',async f=>{await stage(f);const h=harness(f),before=f.sourceRow(),a=await h.service.preview('migration-reviewer',request(post)),b=await h.service.preview('migration-reviewer',request(post));assert.deepEqual(a,b);assert.deepEqual(h.calls[0].after,h.calls[1].after);assert.equal(f.auditCount(),1);assert.deepEqual(f.sourceRow(),before);});
  await test(kind,'stale thread/count, resolved replies and nonauthor resolution keep legacy no-op behavior',async f=>{
   await stage(f);for(const command of [{...reply,expectedCount:99},{...reply,expectedVersion:99},{...resolve,state:'OPEN'}]){const h=harness(f),result=await h.service.preview('migration-reviewer',request(command));assert.equal(result.discussionChanged,false);assert.equal(result.workspaceChanged,canonicalJson(f.source())!==canonicalJson(h.calls[0].after));assert.deepEqual(h.calls[0].after,direct(f.source(),'s1',command));}
   const unauthorized=harness(f,{actor:'s2'});assert.equal((await unauthorized.service.preview('migration-reviewer',request(resolve))).discussionChanged,false);
   const resolved=direct(f.source(),'s1',resolve);f.setSource(resolved);await f.service.stage('migration-reviewer',await f.request('P101','resolved'));const h=harness(f);assert.equal((await h.service.preview('migration-reviewer',request({...reply,expectedVersion:1}))).discussionChanged,false);
  });
  await test(kind,'author and current mentor reopen preserve versions, reason and side effects',async f=>{
   f.setSource(direct(f.source(),'s1',resolve));await stage(f);const command={...resolve,state:'OPEN',expectedVersion:1};
   for(const actor of ['s1','m1']){const h=harness(f,{actor}),r=await h.service.preview('migration-reviewer',request(command));assert.equal(r.discussionChanged,true);const after=h.calls[0].after;assert.deepEqual(after,direct(f.source(),actor,command));assert.equal(after.projects[0].discussionEvents.at(-1).version,2);assert.equal(after.projects[0].discussionEvents.at(-1).by,actor);assert.equal(after.projects[0].state,'IN_PROGRESS');assert.equal(after.projects[0].messages.length,1);}
  });
  await test(kind,'cancelled/postponed/withdrawn and former-mentor access stays denied',async f=>{
   for(const change of [d=>d.projects[0].activityControl={state:'CANCELLED'},d=>d.projects[0].activityControl={state:'POSTPONED'},d=>{delete d.projects[0].activityControl;d.projects[0].participantOutcomes={s1:{outcome:'WITHDRAWN'}}}]){const d=f.source();change(d);f.setSource(d);await f.service.stage('migration-reviewer',await f.request('P101','denied-'+f.sourceRow().revision));const h=harness(f);await assert.rejects(h.service.preview('migration-reviewer',request(reply)),DiscussionAccessError);}
   const d=f.source();delete d.projects[0].activityControl;delete d.projects[0].participantOutcomes;d.projects[0].mentor='m2';f.setSource(d);await f.service.stage('migration-reviewer',await f.request('P101','new-mentor'));await assert.rejects(harness(f,{actor:'m1'}).service.preview('migration-reviewer',request(resolve)),DiscussionAccessError);
  });
  await test(kind,'missing, stale and corrupted staged copies cannot materialize',async f=>{
   const h=harness(f);await assert.rejects(h.service.preview('migration-reviewer',request(post)),DiscussionNotFoundError);await stage(f);const d=f.source();d.projects[0].messages[0].text='Fictional correction';f.setSource(d);await assert.rejects(h.service.preview('migration-reviewer',request(post)),DiscussionConflictError);await f.service.stage('migration-reviewer',await f.request('P101','correction'));f.tamper('P101');await assert.rejects(h.service.preview('migration-reviewer',request(post)),DiscussionConflictError);
  });
  await test(kind,'unrelated newer source revision also rejects delayed copies',async f=>{await stage(f);const d=f.source();d.projects[1].title='Fictional other-project change';f.setSource(d);await assert.rejects(harness(f).service.preview('migration-reviewer',request(post)),DiscussionConflictError);});
  await test(kind,'source and access races reject obsolete preview results',async f=>{
   await stage(f);const legacy=new LegacyDiscussionCommandAdapter();let once=true;const h=harness(f,{transition:{async run(...args){const result=await legacy.run(...args);if(once){once=false;const d=f.source();d.projects[0].title='Fictional racing correction';f.setSource(d)}return result}}});await assert.rejects(h.service.preview('migration-reviewer',request(post)),DiscussionConflictError);
   await f.service.stage('migration-reviewer',await f.request('P101','race-current'));const revoked=harness(f,{transition:{async run(...args){const result=await legacy.run(...args);f.revoke();return result}}});await assert.rejects(revoked.service.preview('migration-reviewer',request(post)),DiscussionAccessError);
  });
  await test(kind,'staged revision race rejects the earlier proposal',async f=>{await stage(f);const legacy=new LegacyDiscussionCommandAdapter(),h=harness(f,{transition:{async run(...args){const result=await legacy.run(...args);await f.service.stage('migration-reviewer',await f.request('P101','new-copy'));return result}}});await assert.rejects(h.service.preview('migration-reviewer',request(post)),DiscussionConflictError);assert.equal(f.auditCount(),2);});
  await test(kind,'authority actor/fence change and wrong subject fail closed',async f=>{
   await stage(f);let n=0;const h=harness(f,{authority:{async authorize(...args){const a=await f.authority.authorize(...args);return {...a,actor:++n===1?'s1':'m1'}}}});await assert.rejects(h.service.preview('migration-reviewer',request(post)),DiscussionConflictError);await assert.rejects(harness(f).service.preview('student',request(post)),DiscussionAccessError);
   const unreadable=new DiscussionCommandRehearsalService({readWorkspace(){throw Error('must not read')}},{},{authorize(){throw new DiscussionAccessError('Denied')}},{},digest,true);await assert.rejects(unreadable.preview('student',request(post)),DiscussionAccessError);
  });
  await test(kind,'strict typed inputs exclude forged actors, metadata and non-JSON values',async f=>{
   await stage(f);const h=harness(f);
   for(const input of [{...request(post),actor:'m1'},request({...post,actor:'m1'}),request({...resolve,state:'APPROVED'}),request({...reply,expectedCount:-1}),request({...reply,expectedVersion:0.5}),request({...post,text:'x'.repeat(4001)}),request({...post,text:'\u0001'}),request({kind:'DELETE',text:'attempt'}),request({...post,text:new Date()})])await assert.rejects(h.service.preview('migration-reviewer',input),DiscussionValidationError);
   assert.equal(h.calls.length,0);assert.equal(f.auditCount(),1);assert.throws(()=>validateDiscussionCommand({kind:'POST',text:'  '}),DiscussionValidationError);
  });
  await test(kind,'cross-project references and unauthorized project scope cannot be retargeted',async f=>{await stage(f);const h=harness(f);assert.equal((await h.service.preview('migration-reviewer',request({...reply,threadRef:'P102:legacy-message:0'}))).discussionChanged,false);await assert.rejects(h.service.preview('migration-reviewer',{projectId:'P103',command:post}),DiscussionAccessError);assert.equal(f.auditCount(),1);});
  await test(kind,'read failures expose generic storage errors without changing source',async f=>{await stage(f);const before=f.sourceRow(),h=harness(f,{reader:{async readWorkspace(){throw new DiscussionStorageError('Source unavailable')}}});await assert.rejects(h.service.preview('migration-reviewer',request(post)),DiscussionStorageError);assert.deepEqual(f.sourceRow(),before);assert.equal(f.auditCount(),1);});
 }
 await test('sqlite','actual missing-table errors are sanitized at the repository boundary',async f=>{await stage(f);const grant=await f.authority.authorize('migration-reviewer','P101');f.dropSourceStorage();await assert.rejects(harness(f,{authority:{async authorize(){return {...grant,actor:'s1'}}}}).service.preview('migration-reviewer',request(post)),e=>e instanceof DiscussionStorageError&&!/sqlite|select|kcc_workspaces|no such table/i.test(e.message));});
}finally{mock.timers.reset()}
console.log(JSON.stringify({passed:count,contracts:['memory','drizzle-sqlite'],readOnly:true,productionCommandPathChanged:false,cutoverActivated:false,hostedAcceptance:false}));
