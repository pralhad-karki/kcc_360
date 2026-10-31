// Internal read-only adapter, not a shared wire contract or active synchronization.
// Trusted context/identity crosswalk providers are deliberately not installed.
import {misDigest,misStudentKey} from './mis-manual-import.mjs';
export const websiteRegistrationConfiguration=Object.freeze({mode:'disabled'});
const fail=(ok,code,status=409)=>{if(!ok)throw Object.assign(Error(code),{code,status})};
const text=x=>typeof x==='string'&&x.length>0&&x.length<=150&&x.trim()===x&&!/[\u0000-\u001f\u007f]/.test(x);
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const zoned=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?(Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
function context(c,subject,eventId,now){
 fail(c?.authorized===true&&c.subject===subject&&c.eventId===eventId,'REGISTRATION_ACCESS_DENIED',403);
 fail(text(c.institutionId)&&text(c.issuer)&&text(c.websiteEventId)&&text(c.approvalReference)&&zoned(c.validUntil)&&Date.parse(c.validUntil)>Date.parse(now)&&Number.isSafeInteger(c.revision)&&c.revision>=0,'TRUSTED_REGISTRATION_CONTEXT_REQUIRED',503);
 fail(Array.isArray(c.students)&&Array.isArray(c.studentActors)&&Array.isArray(c.members)&&Array.isArray(c.crosswalk)&&Array.isArray(c.registrations),'TRUSTED_REGISTRATION_CONTEXT_REQUIRED',503);
 fail(new Set(c.students.map(s=>s.key)).size===c.students.length&&c.students.every(s=>s.institutionId===c.institutionId&&s.key===misStudentKey(s.sourceSystem,s.institutionId,s.studentId)),'STUDENT_IDENTITY_CONFLICT');
 fail(c.studentActors.every(text)&&new Set(c.studentActors).size===c.studentActors.length,'STUDENT_IDENTITY_CONFLICT');
 fail(c.registrations.every(r=>text(r.registrationId)&&r.websiteEventId===c.websiteEventId&&r.eventId===eventId&&r.issuer===c.issuer&&text(r.participantReference)&&['registered','cancelled'].includes(r.state))&&new Set(c.registrations.map(r=>r.registrationId)).size===c.registrations.length,'REGISTRATION_IDENTITY_CONFLICT');
}
export function createWebsiteRegistrationPreview({configuration=websiteRegistrationConfiguration,loadContext,transport,clock=()=>new Date().toISOString()}={}){
 fail(['disabled','mock'].includes(configuration.mode),'LIVE_MODE_UNSUPPORTED',503);
 // Capture dependencies; callers cannot enable a previously disabled adapter.
 const mode=configuration.mode,reader=loadContext,peer=transport;
 return Object.freeze({async preview(subject,input){
  if(mode==='disabled')return {available:false,mode:'disabled'};
  fail(text(subject),'SESSION_REQUIRED',401);fail(exact(input,['eventId'])&&text(input.eventId),'INVALID_REGISTRATION_PREVIEW',400);
  fail(peer?.mode==='mock'&&typeof peer.readRegistrations==='function'&&typeof reader==='function','MOCK_REGISTRATION_PROVIDERS_REQUIRED',503);
  const eventId=input.eventId,now=clock();fail(zoned(now),'TRUSTED_TIME_REQUIRED',503);
  const c=structuredClone(await reader({subject,eventId}));context(c,subject,eventId,now);const contextDigest=await misDigest(c);
  const items=[],seen=new Set();let after='',snapshot=null,complete=false;
  // All pages remain local and disposable until a complete checked refresh. A
  // timeout/409, legacy response, bad cursor or changed source exposes no partial preview.
  for(let page=0;page<200;page++){
   let response;try{response=await peer.readRegistrations(c.websiteEventId,{after,limit:50,consistency:'checked',snapshot_id:snapshot})}catch(e){fail(false,e.status===409?'REGISTRATION_REFRESH_CHANGED':e.status===401||e.status===403?'REGISTRATION_PEER_DENIED':'REGISTRATION_PEER_UNAVAILABLE',e.status===409?409:503)}
   const r=structuredClone(response);
   fail(exact(r,['contract_version','items','next_cursor','snapshot_id','snapshot_complete'])&&r.contract_version==='v1'&&Array.isArray(r.items)&&r.items.length<=50&&typeof r.snapshot_id==='string'&&/^[0-9a-f]{64}$/.test(r.snapshot_id)&&typeof r.snapshot_complete==='boolean','CHECKED_REFRESH_REQUIRED',502);
   snapshot??=r.snapshot_id;fail(snapshot===r.snapshot_id,'REGISTRATION_REFRESH_CHANGED');
   fail((r.next_cursor===null&&r.snapshot_complete===true)||(text(r.next_cursor)&&r.snapshot_complete===false&&r.items.length>0&&r.next_cursor===r.items.at(-1).registration_id),'REGISTRATION_CURSOR_INVALID',502);
   let previous=after;
   for(const row of r.items){
    fail(exact(row,['registration_id','website_event_id','participant_reference','state','created_at'])&&text(row.registration_id)&&row.website_event_id===c.websiteEventId&&text(row.participant_reference)&&['registered','cancelled'].includes(row.state)&&zoned(row.created_at)&&Date.parse(row.created_at)<=Date.parse(clock()),'INVALID_REGISTRATION_ROW',502);
    fail(!seen.has(row.registration_id)&&row.registration_id>previous,'REGISTRATION_CURSOR_INVALID',502);previous=row.registration_id;seen.add(row.registration_id);items.push(row);
   }
   if(r.next_cursor===null){complete=true;break}after=r.next_cursor;
  }
  fail(complete,'REGISTRATION_REFRESH_LIMIT',413);
  const refreshed=structuredClone(await reader({subject,eventId}));context(refreshed,subject,eventId,clock());fail(await misDigest(refreshed)===contextDigest,'REGISTRATION_CONTEXT_CHANGED');
  const multiplicity=new Map();for(const r of items)multiplicity.set(r.participant_reference,(multiplicity.get(r.participant_reference)||0)+1);
  const differences=items.map(r=>{
   const prior=c.registrations.find(x=>x.registrationId===r.registration_id),matches=c.crosswalk.filter(m=>m.issuer===c.issuer&&m.participantReference===r.participant_reference);
   let reason=null,student=null,mapping=null;
   if(multiplicity.get(r.participant_reference)>1)reason='DUPLICATE_PARTICIPANT_REFERENCE';
   else if(matches.length!==1)reason=matches.length?'AMBIGUOUS_IDENTITY':'UNMATCHED_IDENTITY';
   else{mapping=matches[0];student=c.students.find(s=>s.key===mapping.studentKey);if(mapping.institutionId!==c.institutionId||mapping.approved!==true||!text(mapping.evidenceReference)||!student||!c.studentActors.includes(mapping.studentActor))reason='UNVERIFIED_IDENTITY_MAPPING';
    else if(c.crosswalk.some(m=>m!==mapping&&m.issuer===c.issuer&&(m.studentKey===mapping.studentKey||m.studentActor===mapping.studentActor)))reason='AMBIGUOUS_STUDENT_MAPPING';
   }
   if(!reason&&prior&&(prior.participantReference!==r.participant_reference||!mapping||prior.studentKey!==mapping.studentKey||prior.studentActor!==mapping.studentActor))reason='REGISTRATION_IDENTITY_CONFLICT';
   if(!reason&&c.registrations.some(x=>x.registrationId!==r.registration_id&&(x.studentKey===mapping.studentKey||x.studentActor===mapping.studentActor)))reason='DUPLICATE_STUDENT_REGISTRATION';
   if(!reason&&prior?.state==='cancelled'&&r.state==='registered')reason='CANCELLATION_RECONCILIATION_REQUIRED';
   const action=reason?'IDENTITY_EXCEPTION':r.state==='cancelled'?(prior?(prior.state==='cancelled'?'UNCHANGED':'CANCEL_REGISTRATION_ONLY'):'UNMATCHED_CANCELLATION'):prior?'UNCHANGED':'STAGE_REGISTRATION_ONLY';
   return {registrationId:r.registration_id,participantReference:r.participant_reference,state:r.state,createdAt:r.created_at,studentKey:reason?null:mapping.studentKey,studentActor:reason?null:mapping.studentActor,alreadyParticipating:!reason&&c.members.includes(mapping.studentActor),action,reason};
  });
  // A digest is a future confirmation binding, not a durable commit or import ID.
  const binding=await misDigest({contextDigest,snapshot,items});
  return {available:true,mode:'mock',eventId,websiteEventId:c.websiteEventId,issuer:c.issuer,refreshMode:'FULL_REFRESH',snapshotId:snapshot,complete:true,observedAt:now,revision:c.revision,binding,canCommit:false,differences,missingWithoutAction:c.registrations.filter(r=>!seen.has(r.registrationId)).length,counts:{registrations:differences.filter(r=>r.action==='STAGE_REGISTRATION_ONLY').length,cancellations:differences.filter(r=>r.action==='CANCEL_REGISTRATION_ONLY').length,exceptions:differences.filter(r=>r.reason||r.action==='UNMATCHED_CANCELLATION').length,unchanged:differences.filter(r=>r.action==='UNCHANGED').length}};
 }});
}
export const websiteRegistrationPreview=createWebsiteRegistrationPreview();
