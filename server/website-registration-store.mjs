// Local mock confirmation/save only. No route, scheduler, institutional providers
// or live transport is installed. This ledger is private workspace state, not a
// replacement shared website contract and never an attendance/portfolio record.
import {misDigest} from './mis-manual-import.mjs';
import {createWebsiteRegistrationPreview,websiteRegistrationConfiguration,assertWebsiteRegistrationContext} from './website-registration-preview.mjs';
const clone=structuredClone;
const check=(ok,code,status=409)=>{if(!ok)throw Object.assign(Error(code),{code,status})};
const id=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=150&&!/[\u0000-\u001f\u007f]/.test(x);
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const scoped=(r,c)=>r.eventId===c.eventId&&r.institutionId===c.institutionId&&r.issuer===c.issuer&&r.websiteEventId===c.websiteEventId;
const recordKey=r=>JSON.stringify([r.institutionId,r.issuer,r.eventId,r.registrationId]);
function ledger(data){
 const l=data??{records:[],operations:[]};
 check(exact(l,['records','operations'])&&Array.isArray(l.records)&&Array.isArray(l.operations),'REGISTRATION_LEDGER_INVALID');
 check(l.records.every(r=>[r.institutionId,r.issuer,r.eventId,r.websiteEventId,r.registrationId,r.participantReference].every(id)&&['registered','cancelled'].includes(r.state))&&new Set(l.records.map(recordKey)).size===l.records.length,'REGISTRATION_LEDGER_INVALID');
 check(l.operations.every(o=>id(o.operationId)&&id(o.subject)&&id(o.actor))&&new Set(l.operations.map(o=>o.operationId)).size===l.operations.length,'REGISTRATION_LEDGER_INVALID');
 return l;
}
export function createWebsiteRegistrationStore({configuration=websiteRegistrationConfiguration,db,workspaceId='KCC-OWNER-DEMO',loadContext,transport,clock=()=>new Date().toISOString()}={}){
 check(['disabled','mock'].includes(configuration.mode),'LIVE_MODE_UNSUPPORTED',503);
 const mode=configuration.mode,reader=loadContext,peer=transport,ledgerId='KCC-WEBSITE-REGISTRATIONS:'+workspaceId;
 const disabled=()=>({available:false,mode:'disabled'});
 async function load(subject,eventId,permission){
  check(workspaceId==='KCC-OWNER-DEMO'&&typeof reader==='function'&&db,'MOCK_REGISTRATION_STORE_REQUIRED',503);
  check(id(subject),'SESSION_REQUIRED',401);check(id(eventId),'INVALID_REGISTRATION_REQUEST',400);
  const row=await db.prepare('SELECT revision,payload FROM kcc_workspaces WHERE id=?').bind(workspaceId).first();check(row,'WORKSPACE_UNAVAILABLE',503);
  const data=JSON.parse(row.payload),ledgerRow=await db.prepare('SELECT revision,payload FROM kcc_workspaces WHERE id=?').bind(ledgerId).first(),l=ledger(ledgerRow?JSON.parse(ledgerRow.payload):null),c=clone(await reader({subject,eventId,permission,workspace:{id:workspaceId,revision:row.revision,data:clone(data)}}));
  check(c?.authorized===true&&c.subject===subject&&c.eventId===eventId&&id(c.actor),'REGISTRATION_ACCESS_DENIED',403);
  check(permission!=='registration.import'||c.canImport===true,'REGISTRATION_IMPORT_DENIED',403);
  check(Array.isArray(c.authorityFences)&&c.authorityFences.length>0&&c.authorityFences.length<=10&&c.authorityFences.every(f=>exact(f,['workspaceId','revision'])&&id(f.workspaceId)&&Number.isSafeInteger(f.revision)&&f.revision>=0),'REGISTRATION_AUTHORITY_FENCE_REQUIRED',503);
  // Reuse stable publication mappings; no new event, title match or client binding.
  const bound=(data.websiteV1Outbox??[]).filter(r=>r.eventId===eventId&&r.websiteEventId).map(r=>r.websiteEventId);
  check(data.projects?.some(p=>p.id===eventId)&&bound.length>0&&bound.every(x=>x===c.websiteEventId)&&!(data.websiteV1Outbox??[]).some(r=>r.eventId!==eventId&&r.websiteEventId===c.websiteEventId),'REGISTRATION_EVENT_BINDING_CONFLICT');
  for(const f of c.authorityFences){const current=await db.prepare('SELECT revision FROM kcc_workspaces WHERE id=?').bind(f.workspaceId).first();check(current?.revision===f.revision,'REGISTRATION_AUTHORITY_CHANGED')}
  c.revision=ledgerRow?.revision??0;c.sourceWorkspaceRevision=row.revision;c.registrations=clone(l.records.filter(r=>scoped(r,c)));
  assertWebsiteRegistrationContext(c,subject,eventId,clock());
  return {row,ledgerRow,data,l,context:c};
 }
 async function refresh(subject,eventId,permission){
  let last;
  const preview=createWebsiteRegistrationPreview({configuration:{mode:'mock'},clock,transport:peer,loadContext:async()=>{last=await load(subject,eventId,permission);return last.context}});
  const result=await preview.preview(subject,{eventId});return {result,last};
 }
 const receipt=(o,replayed)=>({available:true,mode:'mock',operationId:o.operationId,eventId:o.eventId,revision:o.revision,counts:clone(o.counts),exceptionCount:o.exceptions.length,replayed});
 return Object.freeze({
  async preview(subject,input){
   if(mode==='disabled')return disabled();check(exact(input,['eventId']),'INVALID_REGISTRATION_REQUEST',400);
   const {result,last}=await refresh(subject,input.eventId,'registration.read');return {...result,canCommit:last.context.canImport===true};
  },
  async commit(subject,input){
   if(mode==='disabled')return disabled();
   check(exact(input,['eventId','operationId','confirmation'])&&id(input.eventId)&&id(input.operationId),'INVALID_REGISTRATION_COMMIT',400);
   const f=input.confirmation;check(exact(f,['confirmed','binding','expectedRevision'])&&f.confirmed===true&&typeof f.binding==='string'&&/^[0-9a-f]{64}$/.test(f.binding)&&Number.isSafeInteger(f.expectedRevision)&&f.expectedRevision>=0,'REGISTRATION_CONFIRMATION_REQUIRED',400);
   const initial=await load(subject,input.eventId,'registration.import'),c=initial.context;
   const fingerprint=await misDigest({subject,actor:c.actor,institutionId:c.institutionId,issuer:c.issuer,websiteEventId:c.websiteEventId,input});
   const prior=initial.l.operations.find(o=>o.operationId===input.operationId);
   // Replays still require current scoped import authority. They never fetch the
   // peer, repeat writes or return a different operation's private receipt.
   if(prior){check(prior.fingerprint===fingerprint,'REGISTRATION_OPERATION_CONFLICT');return receipt(prior,true)}
   const {result:p,last}=await refresh(subject,input.eventId,'registration.import');
   check(p.binding===f.binding&&p.revision===f.expectedRevision,'REGISTRATION_PREVIEW_CHANGED');
   check(await misDigest(initial.context)===await misDigest(last.context),'REGISTRATION_CONTEXT_CHANGED');
   const fresh=await load(subject,input.eventId,'registration.import');
   check(await misDigest(fresh.context)===await misDigest(last.context),'REGISTRATION_CONTEXT_CHANGED');
   const l=clone(fresh.l),ctx=fresh.context,time=clock();
   check(Number.isFinite(Date.parse(time))&&new Date(time).toISOString()===time&&Date.parse(ctx.validUntil)>Date.parse(time),'REGISTRATION_AUTHORITY_EXPIRED',403);
   // Identity exceptions are retained as unverified website observations. They
   // cannot create student accounts or activity membership. Cancellation is sticky.
   const changes=[];
   for(const d of p.differences){
    const index=l.records.findIndex(r=>scoped(r,ctx)&&r.registrationId===d.registrationId),before=index<0?null:clone(l.records[index]);
    let after=before;
    if(!before)after={institutionId:ctx.institutionId,issuer:ctx.issuer,eventId:ctx.eventId,websiteEventId:ctx.websiteEventId,registrationId:d.registrationId,participantReference:d.participantReference,studentKey:d.reason?null:d.studentKey,studentActor:d.reason?null:d.studentActor,state:d.state,identityStatus:d.reason?'UNRESOLVED':'RESOLVED',sourceCreatedAt:d.createdAt,firstObservedAt:time};
    else if(d.state==='cancelled'&&before.participantReference===d.participantReference&&before.state!=='cancelled')after={...before,state:'cancelled'};
    // No automatic identity rebinding and no cancelled -> registered transition.
    if(JSON.stringify(before)!==JSON.stringify(after)){
     after={...after,lastChangedAt:time,operationId:input.operationId};
     if(index<0)l.records.push(after);else l.records[index]=after;
     changes.push({registrationId:d.registrationId,before,after:clone(after)});
    }
   }
   const counts={observations:p.differences.length,created:changes.filter(x=>x.before===null).length,cancelled:changes.filter(x=>x.before?.state==='registered'&&x.after.state==='cancelled').length,changed:changes.length,missingWithoutAction:p.missingWithoutAction};
   const operation={operationId:input.operationId,fingerprint,subject,actor:ctx.actor,institutionId:ctx.institutionId,eventId:ctx.eventId,issuer:ctx.issuer,websiteEventId:ctx.websiteEventId,previousRevision:f.expectedRevision,revision:f.expectedRevision+1,confirmedBinding:f.binding,snapshotId:p.snapshotId,observedAt:p.observedAt,time,counts,observations:p.differences.map(d=>({registrationId:d.registrationId,participantReference:d.participantReference,state:d.state,sourceCreatedAt:d.createdAt,action:d.action,reason:d.reason})),exceptions:p.differences.filter(d=>d.reason||d.action==='UNMATCHED_CANCELLATION').map(d=>({registrationId:d.registrationId,reason:d.reason||d.action})),changes};
   l.operations.push(operation);
   const payload=JSON.stringify(l);check(new TextEncoder().encode(payload).length<=2_000_000,'REGISTRATION_WORKSPACE_SIZE_LIMIT',413);
   const commitId=crypto.randomUUID(),fences=[{workspaceId,revision:fresh.row.revision},...ctx.authorityFences],fenceSql=fences.map(()=> ' AND EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND revision=?)').join(''),fenceArgs=fences.flatMap(x=>[x.workspaceId,x.revision]);
   // Never add private registration fields to the canonical application payload:
   // its existing persona projection carries extra root fields through.
   const write=fresh.ledgerRow
    ?db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?'+fenceSql).bind(payload,operation.revision,commitId,time,ledgerId,f.expectedRevision,...fenceArgs)
    :db.prepare('INSERT INTO kcc_workspaces (id,revision,payload,commit_id,updated_at) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=?)'+fenceSql).bind(ledgerId,operation.revision,payload,commitId,time,ledgerId,...fenceArgs);
   const saved=await db.batch([
    write,
    db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(commitId,ledgerId,operation.revision,subject,ctx.actor,'website.registration.import',JSON.stringify({eventId:ctx.eventId,operationId:input.operationId,counts}),time,ledgerId,commitId)
   ]);
   check(saved[0].meta.changes===1,'REGISTRATION_SAVE_CONFLICT');return receipt(operation,false);
  }
 });
}
export const websiteRegistrationStore=createWebsiteRegistrationStore();
