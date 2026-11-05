// Isolated source/candidate/head rehearsal. No hosted bindings or existing DB.
import {randomUUID} from 'node:crypto';
import {fixture,domain,digest,clock,compile} from './discussion-migration.mjs';
const {DiscussionAtomicRehearsalService}=await import(compile('server/discussion-migration/atomic-application.ts'));
const {DrizzleAtomicDiscussionRepository}=await import(compile('server/discussion-migration/infrastructure/atomic-repository.ts'));
const {DiscussionCandidateHeadService}=await import(compile('server/discussion-migration/head-application.ts'));
const {DrizzleCandidateHeadRepository}=await import(compile('server/discussion-migration/infrastructure/head-repository.ts'));
const {LegacyDiscussionCommandAdapter}=await import(compile('server/discussion-migration/infrastructure/legacy-command-adapter.ts'));
const headDomain=await import(compile('server/discussion-migration/head-domain.ts'));
const {canonicalJson,DiscussionStorageError,DiscussionConflictError}=domain;
export const subject='migration-reviewer',sourceId='KCC-OWNER-DEMO';
export async function candidateHeadFixture(kind){
 const f=fixture(kind),legacy=new LegacyDiscussionCommandAdapter(),initial=f.source();initial.projects[1].members=['s1','s2'];initial.projects[1].owner='s1';initial.projects[1].mentor='m1';
 f.setSource(await legacy.run(initial,'s1','P101',{kind:'REPLY',text:'Fictional normalization probe',threadRef:'P101:legacy-message:0',expectedVersion:0,expectedCount:999}));
 for(const id of ['P101','P102'])await f.service.stage(subject,await f.request(id,'stage-'+id));
 const authority={async authorize(s,p){return {...await f.authority.authorize(s,p),actor:'s1'}}},rows=new Map(),audits=[];let beforeCommit=null,failure=null,tail=Promise.resolve(),candidateCounter=0;
 async function readMemory(id){if(rows.has(id))return structuredClone(rows.get(id));if(id.startsWith('KCC-DISCUSSION-STAGING:')){const [workspace,p]=JSON.parse(id.slice('KCC-DISCUSSION-STAGING:'.length));if(workspace!==sourceId)return null;const r=await f.repository.readStaged(p);return r?{id,revision:r.revision,payload:JSON.stringify(r),commitId:'fixture-stage-'+r.revision,updatedAt:clock()}:null;}return null;}
 const memory={read:readMemory,async assertCurrent(source,grant,observed){let a;try{a=await authority.authorize(subject,'P101')}catch{throw new DiscussionConflictError('Changed authority')};if(source.recordId!==sourceId||source.revision!==f.sourceRow().revision||canonicalJson(grant)!==canonicalJson(a.fence))throw new DiscussionConflictError('Changed source/authority');for(const o of observed){const r=await readMemory(o.id);if('absent'in o?r!==null:!r||r.revision!==o.revision||r.commitId!==o.commitId)throw new DiscussionConflictError('Changed private witness')}},async commit(i){const task=tail.then(async()=>{if(beforeCommit){const fn=beforeCommit;beforeCommit=null;await fn()}try{await memory.assertCurrent(i.source,i.authority,i.observed)}catch(e){if(e instanceof DiscussionConflictError)return false;throw e}if([i.coordinator,i.head,i.operation].some(r=>new TextEncoder().encode(r.payload).length>1_990_000)||i.observed.length>24)throw new DiscussionStorageError('Private candidate budget exceeded');const next=new Map(rows),commitId=randomUUID();for(const [index,r] of [i.coordinator,i.head,i.operation].entries()){if(failure===['coordinator','head','operation'][index])throw new DiscussionStorageError('Private candidate transaction failed');next.set(r.id,{...structuredClone(r),commitId})}if(failure==='audit')throw new DiscussionStorageError('Private candidate audit failed');rows.clear();for(const [k,v]of next)rows.set(k,v);audits.push({id:commitId,workspace:i.operation.id,record:i.audit.record});return true});tail=task.catch(()=>{});return task}};
 const preparedAudits=[];
 memory.prepareCandidate=async input=>{
  const task=tail.then(async()=>{
   if(beforeCommit){const fn=beforeCommit;beforeCommit=null;await fn()}
   try{await memory.assertCurrent(input.source,input.authority,input.observed)}
   catch(error){if(error instanceof DiscussionConflictError)return false;throw error}
   if(failure==='preparation-audit')throw new DiscussionStorageError('Private preparation audit failed');
   const commitId=randomUUID();
   rows.set(input.row.id,{...structuredClone(input.row),commitId});
   preparedAudits.push({id:commitId,workspace:input.row.id,record:input.audit.record});
   return true;
  });
  tail=task.catch(()=>{});
  return task;
 };
 const repository=kind==='sqlite'?new DrizzleCandidateHeadRepository(f.client):memory;
 const candidateRepository=kind==='sqlite'?new DrizzleAtomicDiscussionRepository(f.client):{async find(key){const r=await readMemory(key);return r?JSON.parse(r.payload):null},assertFence:async grant=>memory.assertCurrent({recordId:sourceId,revision:f.sourceRow().revision},grant,[]),async append(key,r){if(rows.has(key))return false;const copy=await f.repository.readStaged(r.projectId),a=await authority.authorize(subject,r.projectId);if(f.sourceRow().revision!==r.sourceFence.revision||copy.revision!==r.stagedRevision||canonicalJson(a.fence)!==canonicalJson(r.authorityFence))return false;rows.set(key,{id:key,revision:1,payload:JSON.stringify(r),commitId:randomUUID(),updatedAt:r.occurredAt});return true}};
 const candidateService=new DiscussionAtomicRehearsalService(f.workspaceReader,f.repository,authority,legacy,digest,candidateRepository,clock,true),service=new DiscussionCandidateHeadService(f.workspaceReader,authority,repository,digest,clock,true,{transition:legacy,copies:f.repository});
 const keys=(p='P101',op)=>headDomain.headKeys(digest,sourceId,p,op);
 async function candidate(p='P101',mode='POST',id='candidate-'+(++candidateCounter)){
  const command=mode==='POST'?{kind:'POST',text:'Fictional private message '+id}:{kind:'REPLY',text:'Fictional no-op',threadRef:p+':legacy-message:0',expectedVersion:0,expectedCount:999};
  await candidateService.commit(subject,{projectId:p,operationId:id,command});const key='KCC-DISCUSSION-REHEARSAL:'+await digest.sha256(canonicalJson([sourceId,id])),row=await repository.read(key);return {key,receipt:JSON.parse(row.payload),command};
 }
 const request=async(c,{projectId=c.receipt.projectId,kind='ADVANCE',operationId='head-'+randomUUID(),...overrides}={})=>{const view=await service.inspect(subject,projectId);return {projectId,kind,operationId,candidateKey:c.key,expectedHeadRevision:view.headRevision,expectedWorkspaceRevision:view.workspaceRevision,...overrides}};
 return {f,service,authority,repository,legacy,keys,candidate,request,kind,domain,headDomain,digest,clock,subject,
  async snapshot(){if(kind==='sqlite')return JSON.parse(JSON.stringify({workspaces:f.sqlite.prepare('SELECT * FROM kcc_workspaces ORDER BY id').all(),audit:f.sqlite.prepare('SELECT * FROM kcc_server_audit ORDER BY id').all()}));return {source:structuredClone(f.sourceRow()),rows:[...rows].sort(([a],[b])=>a.localeCompare(b)).map(([k,r])=>[k,structuredClone(r)]),audits:structuredClone(audits),preparedAudits:structuredClone(preparedAudits)}} ,
  preparedAudits:()=>kind==='sqlite'?f.sqlite.prepare("SELECT * FROM kcc_server_audit WHERE command='discussion.candidate.prepare'").all():structuredClone(preparedAudits),
  failPreparationAudit(){
   failure='preparation-audit';
   if(kind==='sqlite')f.sqlite.exec("CREATE TRIGGER head_fault BEFORE INSERT ON kcc_server_audit WHEN NEW.command='discussion.candidate.prepare' BEGIN SELECT RAISE(ABORT,'SQLITE PRIVATE FAULT'); END");
  },
  audits:()=>kind==='sqlite'?f.sqlite.prepare("SELECT * FROM kcc_server_audit WHERE command='discussion.candidate.head'").all():structuredClone(audits),
  privateRows:()=>kind==='sqlite'?f.sqlite.prepare("SELECT id,revision,payload,commit_id,updated_at FROM kcc_workspaces WHERE id LIKE 'KCC-DISCUSSION-HEAD:%' OR id LIKE 'KCC-DISCUSSION-COORDINATOR:%' OR id LIKE 'KCC-DISCUSSION-HEAD-OP:%' ORDER BY id").all():[...rows.values()].filter(r=>/^KCC-DISCUSSION-(HEAD:|COORDINATOR:|HEAD-OP:)/.test(r.id)),
  mutate(id,fn){if(kind==='sqlite'){const r=f.sqlite.prepare('SELECT id,revision,payload,commit_id AS commitId,updated_at AS updatedAt FROM kcc_workspaces WHERE id=?').get(id);fn(r);f.sqlite.prepare('UPDATE kcc_workspaces SET revision=?,payload=?,commit_id=?,updated_at=? WHERE id=?').run(r.revision,r.payload,r.commitId,r.updatedAt,id)}else fn(rows.get(id))},
  remove(id){if(kind==='sqlite')f.sqlite.prepare('DELETE FROM kcc_workspaces WHERE id=?').run(id);else rows.delete(id)},
  race(fn){if(kind==='sqlite')f.race(fn);else beforeCommit=fn},
  failAt(stage){failure=stage;if(kind==='sqlite'){const prefix=stage==='coordinator'?'KCC-DISCUSSION-COORDINATOR:':stage==='head'?'KCC-DISCUSSION-HEAD:':'KCC-DISCUSSION-HEAD-OP:';if(stage==='audit')f.sqlite.exec("CREATE TRIGGER head_fault BEFORE INSERT ON kcc_server_audit WHEN NEW.command='discussion.candidate.head' BEGIN SELECT RAISE(ABORT,'SQLITE PRIVATE FAULT'); END");else for(const operation of ['INSERT','UPDATE'])f.sqlite.exec(`CREATE TRIGGER head_fault_${operation} BEFORE ${operation} ON kcc_workspaces WHEN NEW.id LIKE '${prefix}%' BEGIN SELECT RAISE(ABORT,'SQLITE PRIVATE FAULT'); END`)}},
  clearFault(){failure=null;if(kind==='sqlite')for(const name of ['head_fault','head_fault_INSERT','head_fault_UPDATE'])f.sqlite.exec('DROP TRIGGER IF EXISTS '+name)},
  async close(){await tail;await f.close()}
 };
}
export {DiscussionCandidateHeadService,domain,headDomain,digest,clock,compile};
