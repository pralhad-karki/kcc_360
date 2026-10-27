import {resolvePermission} from './permission-policy.mjs';
import {samePlanValue as same} from './plan-amendment.mjs';
export const annualTargetConfiguration=Object.freeze({enabled:false});
const check=(v,m)=>{if(!v)throw Error(m)};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const exact=(x,keys)=>object(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const unique=(rows)=>Array.isArray(rows)&&rows.length>0&&rows.every(r=>id(r.id))&&new Set(rows.map(r=>r.id)).size===rows.length;
export function emptyAnnualTargetLedger(institutionId){check(id(institutionId),'INVALID_INSTITUTION');return {schema:'KCC360_ANNUAL_TARGETS_V1',institutionId,targets:[],operations:[]}}
export function authorizeAnnualTargetIssue(context,departmentId,targetId){
 check(stamp(context?.now),'INVALID_TARGET_TIME');const permission=resolvePermission({principal:context.principal,grants:context.grants,now:context.now,request:{permission:'PLAN.TARGET_ISSUE',scope:{tenantId:context.principal?.tenantId,departmentId,recordId:targetId},classification:'INTERNAL',relationships:['INSTITUTION_REVIEWER']}});
 check(permission.allowed,permission.reason);const grants=permission.grants.filter(g=>g.roleId==='PRINCIPAL');check(grants.length===1,'UNIQUE_PRINCIPAL_TARGET_GRANT_REQUIRED');return grants[0];
}
export function validateAnnualTargetRequest(r){check(exact(r,['targetId','expectedVersion','departmentId','cycleId','kpiId','kpiVersion','eventScale','value','reason'])&&['targetId','departmentId','cycleId','kpiId'].every(k=>id(r[k]))&&Number.isSafeInteger(r.expectedVersion)&&r.expectedVersion>=0&&positive(r.kpiVersion)&&typeof r.reason==='string'&&r.reason.trim()&&r.reason.length<=4000&&typeof r.value==='string'&&/^(0|[1-9]\d{0,11})(?:\.\d{1,6})?$/.test(r.value),'INVALID_ANNUAL_TARGET_REQUEST')}
export function validateAnnualTargetCatalog(catalog,institutionId){
 check(catalog?.schema==='KCC360_STRATEGIC_CATALOG_V1'&&catalog.status==='APPROVED'&&catalog.institutionId===institutionId&&positive(catalog.version)&&id(catalog.approvalReference)&&unique(catalog.pillars)&&unique(catalog.goals)&&unique(catalog.kpis)&&unique(catalog.departments)&&unique(catalog.cycles),'APPROVED_STRATEGIC_CATALOG_REQUIRED');
 check(catalog.goals.every(g=>catalog.pillars.some(p=>p.id===g.pillarId))&&catalog.kpis.every(k=>positive(k.version)&&catalog.goals.some(g=>g.id===k.goalId)),'INVALID_STRATEGIC_HIERARCHY');
}
export function issueAnnualTarget({ledger,request:r,context,catalog,configuration=annualTargetConfiguration}){
 validateAnnualTargetRequest(r);check(configuration.enabled===true,'ANNUAL_TARGET_ISSUANCE_NOT_ENABLED');
 check(ledger?.schema==='KCC360_ANNUAL_TARGETS_V1'&&ledger.institutionId===context.principal?.tenantId&&Array.isArray(ledger.targets)&&Array.isArray(ledger.operations),'INVALID_TARGET_LEDGER');
 validateAnnualTargetCatalog(catalog,ledger.institutionId);
 const kpi=catalog.kpis.find(k=>k.id===r.kpiId&&k.version===r.kpiVersion&&k.active===true),cycle=catalog.cycles.find(c=>c.id===r.cycleId),department=catalog.departments.find(d=>d.id===r.departmentId&&d.active===true);
 check(kpi&&department&&cycle&&day(cycle.start)&&day(cycle.end)&&cycle.start<=cycle.end,'CURRENT_TARGET_REFERENCES_REQUIRED');
 check(['COUNT','NUMBER','PERCENT','NPR'].includes(kpi.unit),'UNSUPPORTED_TARGET_UNIT');
 check(kpi.eventScale===true?kpi.unit==='COUNT'&&['MAJOR','MINOR','ALL'].includes(r.eventScale):r.eventScale==='NOT_APPLICABLE','INVALID_EVENT_SCALE');
 check((kpi.unit!=='COUNT'||!r.value.includes('.'))&&(kpi.unit!=='NPR'||(r.value.split('.')[1]?.length||0)<=2)&&(kpi.unit!=='PERCENT'||Number(r.value)<=100),'INVALID_TARGET_VALUE');
 const grant=authorizeAnnualTargetIssue(context,r.departmentId,r.targetId),rows=ledger.targets.filter(t=>t.id===r.targetId);check(rows.length<=1,'AMBIGUOUS_ANNUAL_TARGET');const old=rows[0];
 const key={departmentId:r.departmentId,cycleId:r.cycleId,kpiId:r.kpiId,eventScale:r.eventScale};
 check(!ledger.targets.some(t=>t.id!==r.targetId&&same(t.key,key)),'DUPLICATE_ANNUAL_TARGET');
 if(old){check(same(old.key,key)&&Array.isArray(old.versions)&&old.versions.length>0&&old.versions.every((v,i)=>v.version===i+1)&&old.versions.at(-1).version===r.expectedVersion,'TARGET_VERSION_OR_SCOPE_CONFLICT');check(context.now>=old.versions.at(-1).issuedAt,'BACKDATED_TARGET_ISSUANCE');check(!(ledger.allocations||[]).some(a=>a.targetId===r.targetId)&&!old.versions.some(v=>(v.allocations||[]).length||v.planBindings?.length),'TARGET_RECONCILIATION_REQUIRED')}
 else check(r.expectedVersion===0,'TARGET_VERSION_OR_SCOPE_CONFLICT');
 const goal=catalog.goals.find(g=>g.id===kpi.goalId),version=r.expectedVersion+1;
 const issued={version,state:'ISSUED',value:r.value,unit:kpi.unit,kpiVersion:kpi.version,catalogVersion:catalog.version,catalogApprovalReference:catalog.approvalReference,pillarId:goal.pillarId,goalId:goal.id,cycleStart:cycle.start,cycleEnd:cycle.end,issuedAt:context.now,issuedByPersonId:context.principal.personId,grant:structuredClone(grant),reason:r.reason.trim(),supersedesVersion:old?r.expectedVersion:null,executionAuthorized:false};
 check(Number.isSafeInteger(version),'TARGET_VERSION_LIMIT');const result=structuredClone(ledger),target=result.targets.find(t=>t.id===r.targetId);if(target)target.versions.push(issued);else result.targets.push({id:r.targetId,key,versions:[issued]});return {ledger:result,issued};
}
