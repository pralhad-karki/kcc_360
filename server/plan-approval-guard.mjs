// Generic commands cannot edit AP-001-controlled sources, clone their family,
// or manufacture execution from a review-only approval. Historical work remains.
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
function source(data,p){
 const container=p.kind==='ACADEMIC'?data.plans:p.kind==='DEPARTMENTAL'?data.unitPlans:data.clubs?.find(c=>c.id===p.content.source.clubId)?.plans;
 const found=container?.filter(r=>r.id===p.content.source.record.id&&(r.version??1)===(p.content.source.record.version??1))||[];
 check(found.length===1,'CONTROLLED_PLAN_SOURCE_UNAVAILABLE');return {record:found[0],container};
}
function linked(project,p){return p.kind==='DEPARTMENTAL'?(project.sourceUnitPlan===p.id||(p.content.source.record.items??[]).some(i=>i.id===project.sourceItem)):p.kind==='ACADEMIC'?(project.sourcePlan===p.id||project.specialActivity?.planId===p.id||(p.content.source.record.items??[]).some(i=>i.id===project.sourceItem)):(project.sourceClub===p.content.source.clubId&&(project.clubPlanId===p.id||project.specialActivity?.planId===p.id))}
export function assertProtectedPlanChanges(before,after){
 const records=before?.planApprovalRecords??[];
 check(same(before?.planAmendments??[],after.planAmendments??[]),'CONTROLLED_AMENDMENT_RECORD_WRITE_DENIED');
 check(same(records,after.planApprovalRecords??[]),'CONTROLLED_APPROVAL_RECORD_WRITE_DENIED');
 for(const review of records){
  let p;try{p=JSON.parse(review.sourceBinding)}catch{throw Error('CONTROLLED_PLAN_BINDING_INVALID')}
  check(['ACADEMIC','CLUB','DEPARTMENTAL'].includes(p?.kind)&&p.content?.source?.record,'CONTROLLED_PLAN_BINDING_INVALID');
  const a=source(before,p),b=source(after,p);
  check(same(a.record,p.content.source.record)&&same(a.record,b.record),'CONTROLLED_PLAN_REQUIRES_VERSIONED_REVIEW');
  const family=a.container.filter(r=>r.id===p.id||a.record.family&&r.family===a.record.family);
  for(const sibling of family)if(sibling.id!==p.id&&['DRAFT','SUBMITTED','COORDINATOR_REVIEW','DEPARTMENT_REVIEW','MENTOR_REVIEW','ADMIN_REVIEW'].includes(sibling.state))check(same(sibling,b.container.find(r=>r.id===sibling.id)),'CONTROLLED_PLAN_FAMILY_REVIEW_REQUIRED');
  const targets=family.map(r=>({...p,id:r.id,content:{source:{...p.content.source,record:r}}}));
  const previousIds=new Set(a.container.map(r=>r.id));
  check(!b.container.some(r=>!previousIds.has(r.id)&&(r.previousVersion===p.id||r.id===p.id||a.record.family&&r.family===a.record.family)),'CONTROLLED_PLAN_SUCCESSOR_ROUTE_REQUIRED');
  for(const project of after.projects??[]){const old=(before.projects??[]).find(r=>r.id===project.id);if(targets.some(target=>linked(project,target))&&(!old||!targets.some(target=>linked(old,target))))throw Error('CONTROLLED_PLAN_EXECUTION_NOT_AUTHORIZED')}
 }
}
export function markProtectedPlanViews(view,records=[]){
 for(const r of records){let p;try{p=JSON.parse(r.sourceBinding)}catch{continue}const plans=p.kind==='ACADEMIC'?view.plans:p.kind==='DEPARTMENTAL'?view.unitPlans:view.clubs?.find(c=>c.id===p.content?.source?.clubId)?.plans;for(const row of plans??[])if(row.id===r.planId&&(row.version??1)===r.planVersion)row.approvalControl={managed:true,executionAuthorized:false,...(p.kind==='DEPARTMENTAL'?{reviewState:r.state,reviewRevision:r.revision}:{})}}
 return view;
}
