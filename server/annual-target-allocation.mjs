import {resolvePermission} from './permission-policy.mjs';
import {samePlanValue as same} from './plan-amendment.mjs';
import {annualTargetConfiguration,validateAnnualTargetCatalog} from './annual-targets.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const amount=x=>typeof x==='string'&&/^(0|[1-9]\d{0,11})(?:\.\d{1,6})?$/.test(x);
const micro=x=>{check(amount(x),'INVALID_ALLOCATION_VALUE');const [n,f='']=x.split('.');return BigInt(n)*1000000n+BigInt(f.padEnd(6,'0'))};
const decimal=n=>{const f=String(n%1000000n).padStart(6,'0').replace(/0+$/,'');return String(n/1000000n)+(f?'.'+f:'')};
export function validateTargetAllocationRequest(r){check(exact(r,['allocationId','expectedVersion','targetId','targetVersion','recipientKind','recipientId','value','reason'])&&['allocationId','targetId','recipientId'].every(k=>id(r[k]))&&Number.isSafeInteger(r.expectedVersion)&&r.expectedVersion>=0&&positive(r.targetVersion)&&['DEPARTMENT','CLUB'].includes(r.recipientKind)&&amount(r.value)&&typeof r.reason==='string'&&r.reason.trim()&&r.reason.length<=4000,'INVALID_TARGET_ALLOCATION_REQUEST')}
export function authorizeTargetAllocation(context,departmentId,targetId,recipientKind,recipientId){
 check(stamp(context?.now),'INVALID_ALLOCATION_TIME');const scope={tenantId:context.principal?.tenantId,departmentId,recordId:targetId,...(recipientKind==='CLUB'?{clubId:recipientId}:{})};
 const permission=resolvePermission({principal:context.principal,grants:context.grants,now:context.now,request:{permission:'PLAN.TARGET_ALLOCATE',scope,classification:'INTERNAL',relationships:['INSTITUTION_REVIEWER']}});check(permission.allowed,permission.reason);return permission.grants;
}
function parent(ledger,targetId,targetVersion){
 check(ledger?.schema==='KCC360_ANNUAL_TARGETS_V1'&&Array.isArray(ledger.targets),'INVALID_TARGET_LEDGER');const rows=ledger.targets.filter(t=>t.id===targetId);check(rows.length===1,'UNIQUE_ISSUED_TARGET_REQUIRED');const target=rows[0],issued=target.versions?.at(-1);check(issued?.version===targetVersion&&issued.state==='ISSUED','CURRENT_ISSUED_TARGET_VERSION_REQUIRED');return {target,issued};
}
export function allocateAnnualTarget({ledger,request:r,context,catalog,configuration=annualTargetConfiguration}){
 validateTargetAllocationRequest(r);check(configuration.enabled===true,'TARGET_ALLOCATION_NOT_ENABLED');check(ledger.institutionId===context.principal?.tenantId,'ALLOCATION_INSTITUTION_MISMATCH');validateAnnualTargetCatalog(catalog,ledger.institutionId);
 const {target,issued}=parent(ledger,r.targetId,r.targetVersion),key=target.key,kpi=catalog.kpis.find(k=>k.id===key.kpiId&&k.version===issued.kpiVersion&&k.active===true),cycle=catalog.cycles.find(c=>c.id===key.cycleId),goal=kpi&&catalog.goals.find(g=>g.id===kpi.goalId);
 check(stamp(issued.issuedAt)&&context.now>=issued.issuedAt,'ALLOCATION_PRECEDES_TARGET_ISSUANCE');
 check(catalog.departments.some(d=>d.id===key.departmentId&&d.active===true)&&kpi&&goal&&goal.id===issued.goalId&&goal.pillarId===issued.pillarId&&kpi.unit===issued.unit&&cycle?.start===issued.cycleStart&&cycle?.end===issued.cycleEnd,'ALLOCATION_SOURCE_RECONCILIATION_REQUIRED');
 check(kpi.aggregation==='SUM'&&['COUNT','NUMBER','NPR'].includes(issued.unit),'ADDITIVE_TARGET_RULE_REQUIRED');
 check((issued.unit!=='COUNT'||!r.value.includes('.'))&&(issued.unit!=='NPR'||(r.value.split('.')[1]?.length||0)<=2),'INVALID_ALLOCATION_VALUE');
 if(r.recipientKind==='DEPARTMENT')check(r.recipientId===key.departmentId,'DEPARTMENT_ALLOCATION_SCOPE_MISMATCH');
 else{check(Array.isArray(catalog.clubs),'APPROVED_CLUB_DIRECTORY_REQUIRED');const clubs=catalog.clubs.filter(c=>c.id===r.recipientId);check(clubs.length===1&&clubs[0].active===true&&clubs[0].departmentId===key.departmentId,'CLUB_ALLOCATION_SCOPE_MISMATCH')}
 const grants=authorizeTargetAllocation(context,key.departmentId,r.targetId,r.recipientKind,r.recipientId),rows=ledger.allocations||[];check(Array.isArray(rows)&&rows.every(a=>id(a.id)&&a.targetId===a.binding?.targetId&&Array.isArray(a.versions)&&a.versions.length>0)&&new Set(rows.map(a=>a.id)).size===rows.length,'INVALID_ALLOCATION_STORAGE');
 const old=rows.find(a=>a.id===r.allocationId),binding={targetId:r.targetId,targetVersion:r.targetVersion,recipientKind:r.recipientKind,recipientId:r.recipientId};
 check(!rows.some(a=>a.id!==r.allocationId&&same(a.binding,binding)),'DUPLICATE_RECIPIENT_ALLOCATION');
 if(old){check(same(old.binding,binding)&&old.targetId===r.targetId&&old.versions.every((v,i)=>v.version===i+1)&&old.versions.at(-1).version===r.expectedVersion,'ALLOCATION_VERSION_OR_SCOPE_CONFLICT');check(context.now>=old.versions.at(-1).allocatedAt,'BACKDATED_TARGET_ALLOCATION');check(!(ledger.planBindings||[]).some(b=>b.allocationId===old.id)&&!old.versions.some(v=>v.planBindings?.length),'BOUND_ALLOCATION_REQUIRES_CHANGE_REQUEST')}
 else check(r.expectedVersion===0,'ALLOCATION_VERSION_OR_SCOPE_CONFLICT');
 const source={key:structuredClone(key),issued:structuredClone(issued)};if(old)check(same(old.versions.at(-1).source,source),'ALLOCATION_SOURCE_RECONCILIATION_REQUIRED');let total=micro(r.value);
 for(const a of rows){if(a.targetId!==r.targetId||a.id===r.allocationId)continue;const latest=a.versions.at(-1);check(a.binding?.targetId===r.targetId&&a.binding.targetVersion===r.targetVersion&&same(latest.source,source),'ALLOCATION_SOURCE_RECONCILIATION_REQUIRED');total+=micro(latest.value)}
 check(total<=micro(issued.value),'ANNUAL_TARGET_OVERALLOCATED');
 const version=r.expectedVersion+1;check(Number.isSafeInteger(version),'ALLOCATION_VERSION_LIMIT');const allocated={version,state:'ALLOCATED',value:r.value,source,allocatedAt:context.now,allocatedByPersonId:context.principal.personId,grants:structuredClone(grants),catalogVersion:catalog.version,reason:r.reason.trim(),supersedesVersion:old?r.expectedVersion:null,executionAuthorized:false};
 const result=structuredClone(ledger);result.allocations??=[];if(old)result.allocations.find(a=>a.id===old.id).versions.push(allocated);else result.allocations.push({id:r.allocationId,targetId:r.targetId,binding,versions:[allocated]});
 return {ledger:result,allocated,summary:{targetId:r.targetId,targetVersion:r.targetVersion,unit:issued.unit,eventScale:key.eventScale,issued:issued.value,allocated:decimal(total),remaining:decimal(micro(issued.value)-total),basis:'Planned shares only; no approved-plan adoption or verified achievement is inferred.'}};
}
