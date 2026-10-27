import {canonicalDeliveryJSON as canonical} from './website-delivery-protocol.mjs';
const commands=new Set(['reflection.email.begin','reflection.email.transition','reflection.email.cancel','reflection.email.uncertain','reflection.email.receipt']);
const mutable=['state','target','attempts','events','receipts','retryAt'];
const immutable=d=>Object.fromEntries(Object.entries(d).filter(([k])=>!mutable.includes(k)));
// Same existing workspace revision/commit/audit transaction. No schema or public API.
export function createReflectionEmailStore({db,workspaceId,clock=()=>Date.now()}){
 if(!db?.prepare||!db?.batch||typeof workspaceId!=='string'||!workspaceId)throw Error('Email workspace storage is unavailable');
 async function load(){const row=await db.prepare('SELECT revision,payload FROM kcc_workspaces WHERE id=?').bind(workspaceId).first();if(!row||!Number.isSafeInteger(row.revision))throw Error('Email workspace unavailable');return {revision:row.revision,data:JSON.parse(row.payload)}}
 async function commit({expectedRevision,data,command,messageId}){
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision<0||!commands.has(command))throw Error('Invalid email persistence request');const current=await load();if(current.revision!==expectedRevision)return false;
  const oldJobs=current.data.reflectionEmailOutbox||[],jobs=data.reflectionEmailOutbox||[],old=oldJobs.filter(d=>d.id===messageId),next=jobs.filter(d=>d.id===messageId);
  if(old.length!==1||next.length!==1||old[0].kind!=='REFLECTION_APPRECIATION'||old[0].workspaceId!==workspaceId||canonical(immutable(old[0]))!==canonical(immutable(next[0]))||old[0].target&&canonical(old[0].target)!==canonical(next[0].target)||canonical(oldJobs.filter(d=>d.id!==messageId))!==canonical(jobs.filter(d=>d.id!==messageId)))throw Error('Email intent or unrelated queue changed');
  const withoutQueue=d=>Object.fromEntries(Object.entries(d).filter(([k])=>k!=='reflectionEmailOutbox'));if(canonical(withoutQueue(current.data))!==canonical(withoutQueue(data)))throw Error('Email worker cannot edit non-email records');
  const output=structuredClone(data),id=crypto.randomUUID(),time=new Date(clock()).toISOString(),revision=expectedRevision+1;output.audit??=[];output.audit.unshift({time,actor:'Internal email worker',action:command,project:'Private email delivery'});const payload=JSON.stringify(output);if(payload.length>2_000_000)throw Error('Email workspace size limit');
  const result=await db.batch([db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=?').bind(payload,revision,id,time,workspaceId,expectedRevision),db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=?)').bind(id,workspaceId,revision,'INTERNAL_EMAIL_DELIVERY','EMAIL_WORKER',command,JSON.stringify({messageId}),time,workspaceId,id)]);return result[0].meta.changes===1;
 }
 return Object.freeze({load,commit});
}
