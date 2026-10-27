import {validateTargetProofDateAmendment} from './plan-target-amendment.mjs';
import {samePlanValue as same} from './plan-amendment.mjs';
import {validateAnnualTargetCatalog} from './annual-targets.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const positive=x=>Number.isSafeInteger(x)&&x>0;
const micro=x=>{check(typeof x==='string'&&/^(0|[1-9]\d{0,11})(?:\.\d{1,6})?$/.test(x),'INVALID_TARGET_PROOF_AMOUNT');const [n,f='']=x.split('.');return BigInt(n)*1000000n+BigInt(f.padEnd(6,'0'))};
// Preparation/review metadata may change before protected adoption. Every other
// field, including owner, dates, items and commitments, remains bound exactly.
const material=raw=>{const out=structuredClone(raw);for(const k of ['state','history','submission','submissionRecords','unitReviewRecords'])delete out[k];return out};
export function planNeedsTargetProofs(plan,configuration,workspaceId){return configuration.sources?.some(m=>m.workspaceId===workspaceId&&m.planId===plan.id&&m.planVersion===(plan.content.source.record.version??1)&&m.targetBindings==='REQUIRED')===true}
export function attachPlanTargetProofs({plan,workspace,targetWorkspace,catalogWorkspace}){
 if(plan.content.source.amendmentId){
  const root=structuredClone(plan);root.version=root.content.source.record.version??1;delete root.content.source.amendmentId;delete root.content.source.proposedRecord;delete root.content.source.baseVersion;delete root.content.targetProofs;
  const checked=attachPlanTargetProofs({plan:root,workspace,targetWorkspace,catalogWorkspace});
  check(same(plan.content.targetProofs,checked.content.targetProofs),'TARGET_PROOF_RECONCILIATION_REQUIRED');
  validateTargetProofDateAmendment(plan);return structuredClone(plan);
 }
 check(['CLUB','DEPARTMENTAL'].includes(plan.kind),'TARGET_PROOF_KIND_REQUIRED');
 check(targetWorkspace?.id==='KCC-ANNUAL-TARGETS:'+plan.institutionId&&catalogWorkspace?.id==='KCC-STRATEGIC-CATALOG:'+plan.institutionId&&targetWorkspace.id!==workspace.id&&catalogWorkspace.id!==workspace.id&&Number.isSafeInteger(targetWorkspace.revision)&&targetWorkspace.revision>=0&&Number.isSafeInteger(catalogWorkspace.revision)&&catalogWorkspace.revision>=0,'TARGET_PROOF_STORAGE_SCOPE_REQUIRED');
 const ledger=targetWorkspace.data,catalog=catalogWorkspace.data;check(ledger?.schema==='KCC360_ANNUAL_TARGETS_V1'&&ledger.institutionId===plan.institutionId&&Array.isArray(ledger.targets)&&Array.isArray(ledger.allocations)&&Array.isArray(ledger.planBindings),'TARGET_PROOF_LEDGER_REQUIRED');validateAnnualTargetCatalog(catalog,plan.institutionId);
 const raw=plan.content.source.record,clubId=plan.content.source.clubId;check(['DRAFT','SUBMITTED','UNIT_ENDORSED'].includes(raw.state)&&new Set(ledger.planBindings.map(b=>b.id)).size===ledger.planBindings.length,'INVALID_TARGET_PROOF_SOURCE');
 const selected=ledger.planBindings.filter(b=>b.reference?.workspaceId===workspace.id&&b.reference.planId===plan.id&&b.reference.planVersion===plan.version);check(selected.length>0&&selected.length<=1000,'PREPARED_TARGET_BINDINGS_REQUIRED');const proofs=[];
 for(const b of selected){const ref=b.reference;check(b.boundByPersonId===plan.ownerPersonId&&ref.kind===plan.kind&&ref.clubId===(clubId??null)&&ref.family===(raw.family??raw.id)&&same(material(b.sourceSnapshot),material(raw)),'STALE_TARGET_PLAN_BINDING');const items=raw.items.filter(i=>i.id===ref.itemId);check(items.length===1&&items[0].status!=='CANCELLED','TARGET_BOUND_ITEM_UNAVAILABLE');
 const parents=ledger.targets.filter(t=>t.id===b.targetId),allocs=ledger.allocations.filter(a=>a.id===b.allocationId);check(parents.length===1&&allocs.length===1,'UNIQUE_TARGET_PROOF_REFERENCES_REQUIRED');const t=parents[0],a=allocs[0],issued=t.versions.at(-1),allocated=a.versions.at(-1);
 check(positive(b.targetVersion)&&positive(b.allocationVersion)&&issued?.state==='ISSUED'&&issued.version===b.targetVersion&&allocated?.state==='ALLOCATED'&&allocated.version===b.allocationVersion&&a.targetId===t.id&&a.binding.targetVersion===issued.version&&same(allocated.source,{key:t.key,issued})&&t.key.departmentId===plan.unitId&&b.unit===issued.unit&&b.eventScale===t.key.eventScale,'TARGET_PROOF_RECONCILIATION_REQUIRED');
 check(plan.kind==='CLUB'?a.binding.recipientKind==='CLUB'&&a.binding.recipientId===clubId:a.binding.recipientKind==='DEPARTMENT'&&a.binding.recipientId===plan.unitId,'TARGET_PROOF_RECIPIENT_MISMATCH');
 const k=catalog.kpis.find(k=>k.id===t.key.kpiId&&k.version===issued.kpiVersion&&k.active===true),goal=k&&catalog.goals.find(g=>g.id===k.goalId),cycle=catalog.cycles.find(c=>c.id===t.key.cycleId);check(k?.aggregation==='SUM'&&k.unit===issued.unit&&goal?.id===issued.goalId&&goal.pillarId===issued.pillarId&&cycle?.start===issued.cycleStart&&cycle?.end===issued.cycleEnd,'TARGET_PROOF_CATALOG_CHANGED');
 if(plan.kind==='CLUB'){const clubs=(catalog.clubs||[]).filter(c=>c.id===clubId);check(clubs.length===1&&clubs[0].active===true&&clubs[0].departmentId===plan.unitId,'TARGET_PROOF_CLUB_SCOPE_CHANGED')}
 const own=ledger.planBindings.filter(x=>x.allocationId===a.id);check(own.every(x=>x.allocationVersion===allocated.version)&&own.reduce((n,x)=>n+micro(x.value),0n)<=micro(allocated.value),'TARGET_PROOF_ALLOCATION_EXCEEDED');
 const identity=x=>JSON.stringify([x.workspaceId,x.kind,x.clubId,x.family,x.itemId]);check(ledger.planBindings.filter(x=>x.targetId===t.id&&x.targetVersion===issued.version&&identity(x.reference)===identity(ref)).length===1,'DUPLICATE_TARGET_ITEM_PROOF');
 check(micro(b.value)>0n&&items[0].start>=issued.cycleStart&&items[0].end<=issued.cycleEnd,'INVALID_TARGET_ITEM_CONTRIBUTION');if(issued.unit==='COUNT'&&['MAJOR','MINOR','ALL'].includes(t.key.eventScale))check(b.value==='1','ONE_EVENT_ONE_COUNT_CONTRIBUTION');
 proofs.push({binding:structuredClone(b),allocation:{id:a.id,binding:structuredClone(a.binding),issuedVersion:structuredClone(allocated)},target:{id:t.id,key:structuredClone(t.key),issuedVersion:structuredClone(issued)}});
 }
 proofs.sort((a,b)=>a.binding.id.localeCompare(b.binding.id));check(new TextEncoder().encode(JSON.stringify(proofs)).byteLength<=1_000_000,'TARGET_PROOF_SIZE_LIMIT');const result=structuredClone(plan);result.content.targetProofs={schema:'KCC360_PLAN_TARGET_PROOFS_V1',items:proofs};return result;
}
export function planTargetProofSummary(plan){return (plan.content.targetProofs?.items||[]).map(p=>({bindingId:p.binding.id,itemId:p.binding.reference.itemId,targetId:p.target.id,targetVersion:p.target.issuedVersion.version,allocationId:p.allocation.id,allocationVersion:p.allocation.issuedVersion.version,kpiId:p.target.key.kpiId,kpiVersion:p.target.issuedVersion.kpiVersion,cycleId:p.target.key.cycleId,eventScale:p.binding.eventScale,value:p.binding.value,unit:p.binding.unit,executionAuthorized:false}))}
