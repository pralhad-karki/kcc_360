import {createReflectionEmailDeliveryProtocol,reflectionEmailDeliveryConfiguration,validateReflectionEmailDeliveryConfiguration} from './reflection-email-delivery.mjs';
import {canonicalDeliveryJSON as canonical} from './website-delivery-protocol.mjs';
// Internal worker seam only. Default composition has no store/providers and performs no I/O.
export function createReflectionEmailRunner({configuration=reflectionEmailDeliveryConfiguration,store,providers,clock=()=>Date.now()}={}){
 if(configuration?.enabled!==true)return Object.freeze({enabled:false,async run(){return {status:'DISABLED',transportInvoked:false}},async receive(){return {status:'DISABLED',persisted:false}}});
 const c=Object.freeze({...validateReflectionEmailDeliveryConfiguration(configuration)});
 if(typeof store?.load!=='function'||typeof store?.commit!=='function'||['loadRegisteredContacts','send','lookup'].some(k=>typeof providers?.[k]!=='function'))throw Error('Email storage, registered contacts and idempotent transport/reconciliation providers are required');
 const loadContacts=providers.loadRegisteredContacts,send=providers.send,lookup=providers.lookup,protocol=createReflectionEmailDeliveryProtocol();
 const job=(data,key)=>{const rows=(data.reflectionEmailOutbox||[]).filter(d=>d.id===key);if(rows.length!==1||rows[0].workspaceId!==c.workspaceId||rows[0].institutionId!==c.institutionId)throw Error('Email intent unavailable');return rows[0]};
 const contactContext=d=>({workspaceId:c.workspaceId,institutionId:c.institutionId,projectId:d.projectId,studentPersonId:d.studentPersonId,messageId:d.id});
 async function persist(row,data,command,key){if(canonical(row.data)===canonical(data))return true;return store.commit({expectedRevision:row.revision,data,command,messageId:key})}
 async function receive(receipt,signature){
  try{for(let i=0;i<3;i++){const row=await store.load();const data=await protocol.acknowledge(row.data,receipt,signature,c,clock());if(await persist(row,data,'reflection.email.receipt',receipt.messageId))return {status:job(data,receipt.messageId).state,persisted:true}}return {status:'RECONCILIATION_REQUIRED',persisted:false}}catch{return {status:'RECEIPT_NOT_RECORDED',persisted:false}}
 }
 async function markUnknown(key,attemptId){try{for(let i=0;i<3;i++){const row=await store.load(),data=protocol.uncertain(row.data,key,attemptId,c,clock());if(await persist(row,data,'reflection.email.uncertain',key))return {status:job(data,key).state}}}catch{}return {status:'RECONCILIATION_REQUIRED'}}
 function replyMatches(envelope,request){return envelope?.receipt&&envelope.receipt.messageId===request.messageId&&envelope.receipt.attemptId===request.attemptId&&envelope.receipt.idempotencyKey===request.idempotencyKey&&envelope.receipt.payloadDigest===request.payloadDigest&&typeof envelope.signature==='string'}
 async function reconcile(key){try{const row=await store.load(),d=job(row.data,key),a=d.attempts?.at(-1);if(!a)return {status:d.state,transportInvoked:false};const request={transportId:c.transportId,senderId:c.senderId,messageId:key,attemptId:a.id,idempotencyKey:d.idempotencyKey,payloadDigest:a.payloadDigest},result=await lookup(request);if(!replyMatches(result,request))return {status:d.state==='ACCEPTED'?'AWAITING_DELIVERY':'RECONCILIATION_REQUIRED',transportInvoked:false};const saved=await receive(result.receipt,result.signature);return {...saved,transportInvoked:false}}catch{return {status:'RECONCILIATION_REQUIRED',transportInvoked:false}}}
 async function cancel(key,attemptId,reason){try{for(let i=0;i<3;i++){const row=await store.load(),data=protocol.cancelBeforeSend(row.data,key,attemptId,reason,c,clock());if(await persist(row,data,'reflection.email.cancel',key))return {status:job(data,key).state,transportInvoked:false}}}catch{}return {status:'RECONCILIATION_REQUIRED',transportInvoked:false}}
 async function run(key){
  let row,d,begin;
  try{
   row=await store.load();d=job(row.data,key);
   if(['DELIVERED','BOUNCED','INVALIDATED','FAILED'].includes(d.state))return {status:d.state,transportInvoked:false};
   if(['UNCERTAIN','ACCEPTED'].includes(d.state))return reconcile(key);
   let registry;
   if(['PENDING','RETRY_WAIT'].includes(d.state)){
    try{const first=structuredClone(await loadContacts(contactContext(d)));registry=structuredClone(await loadContacts(contactContext(d)));if(canonical(first)!==canonical(registry))return {status:'CONTACT_SOURCE_CHANGED',transportInvoked:false}}catch{return {status:'CONTACT_SOURCE_UNAVAILABLE',transportInvoked:false}}
   }
   begin=await protocol.begin(row.data,key,registry,c,clock());
   if(!await persist(row,begin.data,begin.readyToSend?'reflection.email.begin':'reflection.email.transition',key))return {status:'CONFLICT',transportInvoked:false};
   if(!begin.readyToSend){if(job(begin.data,key).state==='UNCERTAIN')return reconcile(key);return {status:begin.reason,transportInvoked:false}}
  }catch{return {status:'PREPARATION_NOT_RECORDED',transportInvoked:false}}
  // Only this successful claim owner may cancel locally before invoking its transport.
  try{
   const latest=await store.load(),current=job(latest.data,key),a=current.attempts?.at(-1);
   if(current.state!=='IN_FLIGHT'||a?.id!==begin.attemptId)return {status:current.state,transportInvoked:false};
   if(Date.parse(a.leaseUntil)<=clock())return cancel(key,begin.attemptId,'LEASE_EXPIRED');
   let registry;try{registry=structuredClone(await loadContacts(contactContext(current)))}catch{return cancel(key,begin.attemptId,'CONTACT_SOURCE_UNAVAILABLE')}
   const refreshed=await store.load(),fresh=job(refreshed.data,key),owned=fresh.attempts?.at(-1);
   if(fresh.state!=='IN_FLIGHT'||owned?.id!==begin.attemptId)return {status:fresh.state,transportInvoked:false};
   if(!await protocol.revalidate(refreshed.data,key,registry,c,clock()))return cancel(key,begin.attemptId,'SOURCE_CHANGED');
   if(Date.parse(owned.leaseUntil)<=clock())return cancel(key,begin.attemptId,'LEASE_EXPIRED');
  }catch{return cancel(key,begin.attemptId,'CONTACT_SOURCE_UNAVAILABLE')}
  let result;
  try{result=await send(structuredClone(begin.request))}catch{const saved=await markUnknown(key,begin.attemptId);return {...saved,transportInvoked:true}}
  if(!replyMatches(result,begin.request)){const saved=await markUnknown(key,begin.attemptId);return {...saved,transportInvoked:true}}
  const saved=await receive(result.receipt,result.signature);if(!saved.persisted){await markUnknown(key,begin.attemptId);return {status:'RECONCILIATION_REQUIRED',transportInvoked:true,persisted:false}}
  return {...saved,transportInvoked:true};
 }
 return Object.freeze({enabled:true,run,receive});
}
export const reflectionEmailRunner=createReflectionEmailRunner();
