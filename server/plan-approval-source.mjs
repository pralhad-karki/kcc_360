import {samePlanValue} from './plan-amendment.mjs';
// Trusted server mapping only. No registry, identity map or scope may come from
// browser fields. This projector reads existing records; it creates no authority.
export const planApprovalSourcesConfiguration=Object.freeze({enabled:false});
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(x);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
export function projectExistingPlanApprovalSource({workspace,reference,configuration=planApprovalSourcesConfiguration,personMap,now}){
 check(configuration.enabled===true&&configuration.status==='APPROVED'&&positive(configuration.version)&&id(configuration.approvalReference)&&stamp(now)&&stamp(configuration.validFrom)&&stamp(configuration.validUntil)&&configuration.validFrom<=now&&now<configuration.validUntil&&Array.isArray(configuration.sources),'APPROVAL_SOURCE_CONFIGURATION_REQUIRED');
 check(id(workspace?.id)&&object(workspace.data)&&object(reference)&&Object.keys(reference).length===2&&id(reference.planId)&&positive(reference.planVersion),'INVALID_PLAN_SOURCE_REFERENCE');
 const overlays=(workspace.data.planAmendments??[]).filter(a=>a.planId===reference.planId&&a.planVersion===reference.planVersion);
 if(overlays.length){
  check(overlays.length===1,'UNIQUE_AMENDMENT_SOURCE_REQUIRED');const a=overlays[0],plan=a.proposedPlan,rootVersion=plan?.content?.source?.record?.version??1;
  check(rootVersion<reference.planVersion,'INVALID_AMENDMENT_ROOT_VERSION');
  const root=projectExistingPlanApprovalSource({workspace,reference:{planId:reference.planId,planVersion:rootVersion},configuration,personMap,now});
  check(configuration.sources.some(m=>m.workspaceId===workspace.id&&m.planId===root.id&&m.planVersion===rootVersion&&m.allowAmendments===true),'AMENDMENTS_NOT_ENABLED_FOR_SOURCE');
  check(plan.id===root.id&&plan.version===reference.planVersion&&plan.kind===root.kind&&plan.institutionId===root.institutionId&&plan.unitId===root.unitId&&plan.ownerActorId===root.ownerActorId&&plan.ownerPersonId===root.ownerPersonId&&plan.originatingRole===root.originatingRole&&samePlanValue(plan.content.source.record,root.content.source.record)&&plan.content.source.amendmentId===a.id,'AMENDMENT_SCOPE_OR_BASE_CHANGED');
  const base=(workspace.data.planApprovalRecords??[]).filter(r=>r.planId===root.id&&r.planVersion===a.baselineVersion&&r.state===a.baselineReviewState&&['APPROVED','REVISION_REQUIRED','REJECTED','WITHDRAWN'].includes(r.state)&&r.revision===a.baselineReviewRevision&&r.sourceBinding===a.baselineBinding);
  check(base.length===1,'EXACT_APPROVED_AMENDMENT_BASE_REQUIRED');return structuredClone(plan);
 }
 const maps=configuration.sources.filter(m=>m.workspaceId===workspace.id&&m.planId===reference.planId&&m.planVersion===reference.planVersion);
 check(maps.length===1,'UNIQUE_PLAN_SOURCE_MAPPING_REQUIRED');const map=maps[0];
 check(['ACADEMIC','CLUB','DEPARTMENTAL'].includes(map.kind)&&id(map.institutionId)&&id(map.unitId)&&typeof map.originatingRole==='string'&&map.originatingRole.trim(),'INVALID_PLAN_SOURCE_MAPPING');
 let plans;
 if(map.kind==='ACADEMIC')plans=workspace.data.plans;
 else if(map.kind==='DEPARTMENTAL'){check(map.unitCode==='STUDENT_AFFAIRS'&&map.allowAmendments!==true,'DEPARTMENTAL_APPROVAL_MAPPING_REQUIRED');plans=workspace.data.unitPlans}
 else{const clubs=workspace.data.clubs?.filter(c=>c.id===map.clubId)||[];check(clubs.length===1,'UNIQUE_SOURCE_CLUB_REQUIRED');plans=clubs[0].plans}
 check(Array.isArray(plans),'PLAN_SOURCE_NOT_AVAILABLE');
 const matches=plans.filter(p=>p.id===map.planId&&(p.version??1)===map.planVersion);
 check(matches.length===1,'UNIQUE_EXISTING_PLAN_REQUIRED');const raw=matches[0];
 if(map.kind==='DEPARTMENTAL'){
  check(raw.kind==='DEPARTMENTAL'&&raw.unitCode===map.unitCode&&raw.state==='SUBMITTED'&&typeof raw.cycle==='string'&&raw.cycle.trim()&&typeof raw.objectives==='string'&&raw.objectives.trim(),'DEPARTMENTAL_SOURCE_SCOPE_INVALID');
  const areas=['CLUB_EVENTS','PLACEMENT_CAREER','INTERNSHIPS','LEADERSHIP_SKILLS','COMMUNITY_PARTNERSHIPS','PARTICIPATION_RECOGNITION'],day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
  check(Array.isArray(raw.items)&&raw.items.length>0&&new Set(raw.items.map(i=>i.id)).size===raw.items.length&&raw.items.every(i=>id(i.id)&&areas.includes(i.serviceArea)&&['title','responsible','mentorEvaluator','deliverable','kpi','target','budgetReference','evidence'].every(k=>typeof i[k]==='string'&&i[k].trim())&&day(i.start)&&day(i.end)&&i.start<=i.end),'DEPARTMENTAL_SOURCE_ITEMS_INVALID');
 }
 check(object(personMap),'PLAN_OWNER_MAPPING_REQUIRED');
 // Club legacy annual records may inherit their owner from the existing club,
 // never from a display-name/email match or a caller-selected owner.
 let owner=raw.owner;
 if(map.kind==='CLUB')owner=owner??workspace.data.clubs.find(c=>c.id===map.clubId).owner;
 check(id(owner)&&Object.hasOwn(personMap,owner)&&id(personMap[owner]),'PLAN_OWNER_MAPPING_REQUIRED');
 check(typeof raw.title==='string'&&raw.title.trim()||map.kind==='CLUB'&&typeof raw.objective==='string'&&raw.objective.trim(),'PLAN_SOURCE_TITLE_REQUIRED');
 check(Array.isArray(raw.items)&&raw.items.length>0,'PLAN_SOURCE_ITEMS_REQUIRED');
 let minorBudget=0;for(const item of raw.items){
  check(object(item)&&['string','number'].includes(typeof item.budget)&&/^\d+(?:\.\d{1,2})?$/.test(String(item.budget)),'INVALID_SOURCE_BUDGET');
  const [whole,fraction='']=String(item.budget).split('.'),amount=Number(whole)*100+Number((fraction+'00').slice(0,2));
  check(Number.isSafeInteger(amount),'INVALID_SOURCE_BUDGET');if(item.status!=='CANCELLED')minorBudget+=amount;
  check(Number.isSafeInteger(minorBudget),'INVALID_SOURCE_BUDGET');
 }
 const budget=minorBudget/100;
 return {id:raw.id,version:map.planVersion,institutionId:map.institutionId,unitId:map.unitId,kind:map.kind,ownerActorId:owner,ownerPersonId:personMap[owner],originatingRole:map.originatingRole,content:{title:raw.title||raw.objective,budget,source:{workspaceId:workspace.id,kind:map.kind,clubId:map.kind==='CLUB'?map.clubId:null,record:structuredClone(raw)}}};
}
