// Read-only projection. Never return outbox records, identifiers, addresses or provider material.
export function reflectionEmailDeliverySummary(data,workspaceId,now=Date.now()){
 const counts=Object.fromEntries(['PENDING','RETRY_WAIT','IN_FLIGHT','UNCERTAIN','ACCEPTED','DELIVERED','BOUNCED','FAILED','INVALIDATED','UNKNOWN'].map(k=>[k,0]));
 let expiredAttempts=0,dueRetries=0;
 for(const job of Array.isArray(data?.reflectionEmailOutbox)?data.reflectionEmailOutbox:[]){
  if(!job||job.workspaceId!==workspaceId)continue;
  const state=Object.hasOwn(counts,job.state)?job.state:'UNKNOWN';counts[state]++;
  if(state==='IN_FLIGHT'&&!(Date.parse(job.attempts?.at(-1)?.leaseUntil)>now))expiredAttempts++;
  if(state==='RETRY_WAIT'&&Number.isFinite(Date.parse(job.retryAt))&&Date.parse(job.retryAt)<=now)dueRetries++;
 }
 return {counts,total:Object.values(counts).reduce((a,b)=>a+b,0),expiredAttempts,dueRetries,reconciliationRequired:counts.UNCERTAIN+expiredAttempts};
}
// This checklist describes the installed composition, not inferred institutional approval.
export function reflectionEmailActivationReadiness(queue,runner){
 return {ready:false,queueEnabled:queue.enabled===true,runnerEnabled:runner.enabled===true,checks:[
  {code:'CONTACTS',status:'NOT_CONFIGURED',detail:'Approved registered student contacts and verified guardian relationships are not connected.'},
  {code:'TRANSPORT',status:'NOT_CONFIGURED',detail:'An approved mail provider, sender and authenticated delivery reconciliation are not connected.'},
  {code:'WORKER',status:'NOT_CONFIGURED',detail:'A scheduled worker and operational recovery process are not connected.'},
  {code:'ACCEPTANCE',status:'NOT_COMPLETED',detail:'Institutional identity, access grants and live delivery acceptance remain pending.'}
 ]};
}
