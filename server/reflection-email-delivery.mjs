import {planReflectionAppreciation} from './reflection-email.mjs';
import {canonicalDeliveryJSON} from './website-delivery-protocol.mjs';
// Internal state transitions only. Persist the returned data with CAS/audit BEFORE sending.
// No transport, scheduler, webhook or provider secret is installed in production.
export const reflectionEmailDeliveryConfiguration=Object.freeze({enabled:false});
const clone=v=>structuredClone(v),id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v),bytes=v=>new TextEncoder().encode(v),hex=v=>[...new Uint8Array(v)].map(n=>n.toString(16).padStart(2,'0')).join('');
const digest=async v=>hex(await crypto.subtle.digest('SHA-256',bytes(canonicalDeliveryJSON(v))));
const core=d=>Object.fromEntries(['id','idempotencyKey','kind','templateVersion','workspaceId','institutionId','projectId','studentPersonId','reflectionVersion','submittedAt','evaluation','sender','recipient','source','subject','text'].map(k=>[k,d[k]]));
function configured(c){if(!c||c.enabled!==true||![c.workspaceId,c.institutionId,c.senderId,c.transportId].every(id)||c.idempotencyGuaranteed!==true||typeof c.receiptSecret!=='string'||c.receiptSecret.length<32)throw Error('Email delivery is disabled or unconfigured');return c}
function record(data,key,c){const rows=(data.reflectionEmailOutbox||[]).filter(d=>d.id===key);if(rows.length!==1)throw Error('Email intent unavailable');const d=rows[0];if(d.kind!=='REFLECTION_APPRECIATION'||d.workspaceId!==c.workspaceId||d.institutionId!==c.institutionId)throw Error('Email intent scope mismatch');return d}
const request=(d,c)=>({transportId:c.transportId,senderId:c.senderId,from:d.sender?.email,idempotencyKey:d.idempotencyKey,to:d.recipient.email,subject:d.subject,text:d.text});
async function current(data,d,registry,now){try{const links=registry?.actorLinks?.filter(l=>l.personId===d.studentPersonId&&l.status==='VERIFIED');if(links?.length!==1)return false;const actor=links[0].actor,p=data.projects.find(p=>p.id===d.projectId),r=p?.reflections?.[actor];if(r?.version!==d.reflectionVersion||r.time!==d.submittedAt)return false;const evaluation=p?.evaluations?.[actor];if(!d.evaluation||!d.sender||evaluation?.final!==true||evaluation.by!==d.evaluation.by||evaluation.version!==d.evaluation.version||evaluation.time!==d.evaluation.time||evaluation.reflectionVersion!==d.reflectionVersion)return false;const prior={...p,evaluations:{...p.evaluations,[actor]:undefined}},plan=await planReflectionAppreciation({configuration:{enabled:true},workspaceId:d.workspaceId,institutionId:d.institutionId,projectId:d.projectId,actor:evaluation.by,studentActor:actor,before:{projects:[prior]},after:data,registry,now:new Date(now).toISOString()});const expected=plan.intents.find(v=>v.id===d.id);return !!expected&&canonicalDeliveryJSON(core(expected))===canonicalDeliveryJSON(core(d))}catch{return false}}
function target(d,c,payloadDigest){if(d.sender?.senderId!==c.senderId)throw Error('Evaluating department sender mismatch');if(d.target&&(d.target.transportId!==c.transportId||d.target.senderId!==c.senderId||d.target.payloadDigest!==payloadDigest))throw Error('Email target or payload changed; reconciliation required')}
export {configured as validateReflectionEmailDeliveryConfiguration};
export function createReflectionEmailDeliveryProtocol(){
 async function begin(data,key,registry,config=reflectionEmailDeliveryConfiguration,now=Date.now()){
  if(config?.enabled!==true)return {data:clone(data),readyToSend:false,reason:'DISABLED'};const c=configured(config),d=record(data,key,c),out=clone(data),next=record(out,key,c);
  if(['ACCEPTED','DELIVERED','BOUNCED','INVALIDATED','FAILED'].includes(d.state))return {data:out,readyToSend:false,reason:d.state};
  if(d.state==='UNCERTAIN')return {data:out,readyToSend:false,reason:'RECONCILIATION_REQUIRED'};
  if(d.state==='IN_FLIGHT'){const attempt=d.attempts?.at(-1);if(!attempt)throw Error('Missing email attempt');if(Date.parse(attempt.leaseUntil)>now)return {data:out,readyToSend:false,reason:'ATTEMPT_ACTIVE'};next.state='UNCERTAIN';next.events??=[];next.events.push({type:'UNCERTAIN',attemptId:attempt.id,time:new Date(now).toISOString()});return {data:out,readyToSend:false,reason:'RECONCILIATION_REQUIRED'}}
  if(!['PENDING','RETRY_WAIT'].includes(d.state))throw Error('Invalid email state');
  if(d.state==='RETRY_WAIT'&&(!Number.isFinite(Date.parse(d.retryAt))||Date.parse(d.retryAt)>now))return {data:out,readyToSend:false,reason:'RETRY_NOT_DUE'};
  if((d.attempts||[]).length>=3){next.state='FAILED';return {data:out,readyToSend:false,reason:'ATTEMPT_LIMIT'}}
  if(!await current(data,d,registry,now)){next.state='INVALIDATED';next.events??=[];next.events.push({type:'INVALIDATED',reason:'REGISTERED_CONTACT_OR_SUBMISSION_CHANGED',time:new Date(now).toISOString()});return {data:out,readyToSend:false,reason:'SOURCE_CHANGED'}}
  if(d.sender.senderId!==c.senderId)return {data:out,readyToSend:false,reason:'DEPARTMENT_SENDER_MISMATCH'};
  const message=request(d,c),payloadDigest=await digest(message);target(d,c,payloadDigest);const attempt={id:crypto.randomUUID(),startedAt:new Date(now).toISOString(),leaseUntil:new Date(now+30000).toISOString(),payloadDigest,idempotencyKey:d.idempotencyKey};next.target??={transportId:c.transportId,senderId:c.senderId,payloadDigest};next.attempts??=[];next.attempts.push(attempt);next.events??=[];next.events.push({type:'STARTED',attemptId:attempt.id,time:attempt.startedAt});next.state='IN_FLIGHT';delete next.retryAt;
  return {data:out,readyToSend:true,attemptId:attempt.id,request:{...message,messageId:d.id,attemptId:attempt.id,payloadDigest}};
 }
 function uncertain(data,key,attemptId,config=reflectionEmailDeliveryConfiguration,now=Date.now()){
  const c=configured(config),out=clone(data),d=record(out,key,c);if(!d.attempts?.some(a=>a.id===attemptId))throw Error('Unknown email attempt');if(d.attempts.at(-1).id!==attemptId||['ACCEPTED','DELIVERED','BOUNCED','RETRY_WAIT','FAILED'].includes(d.state)||d.events?.some(e=>e.type==='UNCERTAIN'&&e.attemptId===attemptId))return out;d.state='UNCERTAIN';d.events??=[];d.events.push({type:'UNCERTAIN',attemptId,time:new Date(now).toISOString()});return out;
 }
 async function revalidate(data,key,registry,config=reflectionEmailDeliveryConfiguration,now=Date.now()){
  const c=configured(config),d=record(data,key,c);if(!await current(data,d,registry,now))return false;target(d,c,await digest(request(d,c)));return true;
 }
 // Only the worker that just persisted this attempt may call this BEFORE its transport call.
 function cancelBeforeSend(data,key,attemptId,reason,config=reflectionEmailDeliveryConfiguration,now=Date.now()){
  const c=configured(config),out=clone(data),d=record(out,key,c);if(!['SOURCE_CHANGED','CONTACT_SOURCE_UNAVAILABLE','LEASE_EXPIRED'].includes(reason))throw Error('Invalid pre-send cancellation reason');
  if(d.state!=='IN_FLIGHT'||d.attempts?.at(-1)?.id!==attemptId)return out;
  d.events??=[];d.events.push({type:'CANCELLED_BEFORE_SEND',attemptId,reason,time:new Date(now).toISOString()});
  d.state=reason==='SOURCE_CHANGED'?'INVALIDATED':d.attempts.length>=3?'FAILED':'RETRY_WAIT';if(d.state==='RETRY_WAIT')d.retryAt=new Date(now+30000).toISOString();return out;
 }
 async function acknowledge(data,receipt,signature,config=reflectionEmailDeliveryConfiguration,now=Date.now()){
  const c=configured(config),fields=['receiptId','workspaceId','transportId','senderId','messageId','attemptId','idempotencyKey','payloadDigest','event','providerMessageId','time'];
  if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)||Object.keys(receipt).length!==fields.length||Object.keys(receipt).some(k=>!fields.includes(k))||fields.some(k=>typeof receipt[k]!=='string')||!id(receipt.receiptId)||!['ACCEPTED','DELIVERED','BOUNCED','REJECTED_NO_SEND'].includes(receipt.event)||typeof signature!=='string'||!/^[a-f0-9]{64}$/.test(signature))throw Error('Invalid email receipt');
  const signingKey=await crypto.subtle.importKey('raw',bytes(c.receiptSecret),{name:'HMAC',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('HMAC',signingKey,Uint8Array.from(signature.match(/../g),v=>parseInt(v,16)),bytes(canonicalDeliveryJSON(receipt))))throw Error('Email receipt authentication failed');
  const d=record(data,receipt.messageId,c),attempt=d.attempts?.find(a=>a.id===receipt.attemptId),expectedDigest=await digest(request(d,c));target(d,c,expectedDigest);
  if(!attempt||receipt.workspaceId!==c.workspaceId||receipt.transportId!==c.transportId||receipt.senderId!==c.senderId||receipt.idempotencyKey!==d.idempotencyKey||receipt.payloadDigest!==attempt.payloadDigest||receipt.payloadDigest!==expectedDigest||!Number.isFinite(Date.parse(receipt.time))||new Date(receipt.time).toISOString()!==receipt.time||Date.parse(receipt.time)<Date.parse(attempt.startedAt)||Date.parse(receipt.time)>now+60000||receipt.event==='REJECTED_NO_SEND'&&receipt.providerMessageId!==''||receipt.event!=='REJECTED_NO_SEND'&&!id(receipt.providerMessageId))throw Error('Email receipt scope/digest/time mismatch');
  const existing=d.receipts?.find(r=>r.receiptId===receipt.receiptId);if(existing){if(canonicalDeliveryJSON(existing)!==canonicalDeliveryJSON(receipt))throw Error('Conflicting email receipt');return clone(data)}
  if((data.reflectionEmailOutbox||[]).some(v=>v.id!==d.id&&v.receipts?.some(r=>r.receiptId===receipt.receiptId)))throw Error('Email receipt identifier reused');
  if(receipt.providerMessageId&&d.receipts?.some(r=>r.providerMessageId&&r.providerMessageId!==receipt.providerMessageId))throw Error('Provider message identity changed');
  if(receipt.providerMessageId&&(data.reflectionEmailOutbox||[]).some(v=>v.id!==d.id&&v.target?.transportId===c.transportId&&v.receipts?.some(r=>r.providerMessageId===receipt.providerMessageId)))throw Error('Provider message identity reused');
  const out=clone(data),next=record(out,d.id,c);next.receipts??=[];next.receipts.push(clone(receipt));next.events??=[];next.events.push({type:'RECEIPT',receiptId:receipt.receiptId,attemptId:receipt.attemptId,event:receipt.event,time:new Date(now).toISOString()});
  const terminal=next.receipts.filter(r=>['DELIVERED','BOUNCED'].includes(r.event)).sort((a,b)=>Date.parse(a.time)-Date.parse(b.time)||a.event.localeCompare(b.event));
  if(terminal.length){const last=terminal.at(-1);next.state=terminal.some(r=>r.time===last.time&&r.event!==last.event)?'UNCERTAIN':last.event;}else if(next.receipts.some(r=>r.event==='ACCEPTED'))next.state='ACCEPTED';else if(next.attempts.at(-1).id===receipt.attemptId){next.state=next.attempts.length>=3?'FAILED':'RETRY_WAIT';if(next.state==='RETRY_WAIT')next.retryAt=new Date(now+30000*2**(next.attempts.length-1)).toISOString()}
  return out;
 }
 return Object.freeze({begin,uncertain,acknowledge,revalidate,cancelBeforeSend});
}
