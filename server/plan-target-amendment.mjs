// Date-only successor scope: reuse canonical contributions, never allocate twice.
const check=(ok,m)=>{if(!ok)throw Error(m)};
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
const strip=x=>{const r=structuredClone(x);for(const k of ['version','state','history','approvedBy','approvedAt','approvedSnapshot'])delete r[k];r.items=r.items.map(i=>{const v={...i};delete v.end;delete v.reportDue;return v});return JSON.stringify(sorted(r))};
export function validateTargetProofDateAmendment(plan){
 const source=plan.content.source,root=source.record,next=source.proposedRecord;
 check(next&&next.version===plan.version&&plan.version>(root.version??1)&&strip(root)===strip(next),'TARGET_PROOF_DATE_ONLY_AMENDMENT_REQUIRED');
 for(const item of next.items){const old=root.items.find(i=>i.id===item.id);if(item.end===old.end&&item.reportDue===old.reportDue)continue;check(day(item.end)&&day(item.reportDue)&&item.end>=old.end&&item.reportDue>=item.end&&item.reportDue>=(old.reportDue??old.end),'INVALID_TARGET_PROOF_DATE_EXTENSION')}
 for(const p of plan.content.targetProofs.items){const item=next.items.find(i=>i.id===p.binding.reference.itemId),target=p.target.issuedVersion;check(item&&item.start>=target.cycleStart&&item.end<=target.cycleEnd,'TARGET_PROOF_DATE_OUTSIDE_CYCLE')}
}
