// Read-only diagnostics. No enable, send or retry action is exposed here.
const reflectionEmailAuditPage=audit;
audit=function(){return reflectionEmailAuditPage()+(uid==='a1'?`<div class="panel" style="margin-top:20px"><h2>Reflection appreciation email</h2><p>Inspect recorded delivery counts and activation readiness. Recipient details remain private.</p>${btn('Check email delivery','openReflectionEmailMonitoring()')}</div>`:'')};
let reflectionEmailMonitorGeneration=0;
async function openReflectionEmailMonitoring(){
 if(uid!=='a1')return;
 const actor=uid,generation=++reflectionEmailMonitorGeneration;
 modal('<h2>Email delivery monitoring</h2><p role="status">Loading delivery summary…</p>');
 const dialog=$('#modal');
 const current=()=>generation===reflectionEmailMonitorGeneration&&uid===actor&&dialog.open&&dialog.querySelector('[data-email-monitor]');
 dialog.querySelector('h2').setAttribute('data-email-monitor','');
 try{
  const response=await fetch('/api/reflection-email-monitor',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)throw Error('unavailable');
  const result=await response.json();if(!current())return;
  const d=result.delivery,r=result.readiness;
  dialog.innerHTML=`<h2 id="modal-title" data-email-monitor>Email delivery monitoring</h2><p>${esc(result.scope)}</p><div class="notice">${r.ready?'Readiness checks passed.':'Activation is blocked.'} Queue ${r.queueEnabled?'enabled':'disabled'} · Delivery worker ${r.runnerEnabled?'enabled':'disabled'}.</div><p>Recorded email jobs: ${esc(d.total)}. Accepted means provider acceptance; only Delivered confirms delivery. Zero jobs does not establish delivery success.</p>${tableHTML(['Recorded state','Jobs'],Object.entries(d.counts).map(([state,count])=>[esc(label(state)),esc(count)]))}<p>Reconciliation required: ${esc(d.reconciliationRequired)} (including ${esc(d.expiredAttempts)} expired attempts). Retries due: ${esc(d.dueRetries)}. These counts do not trigger sending.</p><h3>Activation checks</h3><ul>${r.checks.map(c=>`<li>${esc(c.detail)} (${esc(label(c.status))})</li>`).join('')}</ul><p class="meta">Checked ${esc(eventTime(result.checkedAt))} · Workspace revision ${esc(result.revision)}. Contact-preparation failures without a queued job are not included in delivery counts.</p><div class="buttons">${btn('Refresh','openReflectionEmailMonitoring()')}${btn('Close','closeModal()')}</div>`;
 }catch{if(current())dialog.innerHTML='<h2 id="modal-title" data-email-monitor>Email delivery monitoring</h2><p role="status">Delivery summary unavailable. Close and refresh the workspace before retrying.</p><button onclick="closeModal()">Close</button>'}
}
