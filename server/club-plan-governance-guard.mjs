// Protect all legacy club plans, including sources not yet registered in AP-001.
// A demo unit endorsement is neither final plan approval nor execution authority.
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const approved=p=>['APPROVED','IN_PROGRESS','COMPLETED'].includes(p?.state);
const rows=d=>(d?.clubs??[]).flatMap(c=>(c.plans??[]).map(p=>({clubId:c.id,p,key:JSON.stringify([c.id,p.id,p.version??1])})));
const baseline=p=>Object.fromEntries(['id','family','version','year','objective','title','items','approvedSnapshot','approvedBy','approvedAt','previousVersion'].map(k=>[k,p[k]??null]));
const link=p=>JSON.stringify([p.sourceClub??null,p.clubPlanId??null,p.clubPlanItem??null]);
export function assertClubPlanGovernanceChanges(before,after,{command,actor}={}){
 const old=rows(before),next=rows(after);check(new Set(next.map(x=>x.key)).size===next.length,'DUPLICATE_CLUB_PLAN_VERSION');
 for(const row of old){const n=next.find(x=>x.key===row.key);if(approved(row.p))check(n&&approved(n.p)&&same(baseline(row.p),baseline(n.p)),'CLUB_APPROVED_BASELINE_REQUIRES_FORMAL_AMENDMENT');
  const history=row.p.unitReviewRecords??[];check(n&&same(history,(n.p.unitReviewRecords??[]).slice(0,history.length)),'CLUB_UNIT_REVIEW_HISTORY_IMMUTABLE');
 }
 for(const row of next){const previous=old.find(x=>x.key===row.key),history=previous?.p.unitReviewRecords??[],records=row.p.unitReviewRecords??[];
  check(!approved(row.p)||approved(previous?.p),'CLUB_FINAL_APPROVAL_REQUIRES_FINANCE_AND_PRINCIPAL');
  if(records.length>history.length){const added=records.slice(history.length);check(previous&&added.length===1&&actor==='sa1'&&['recordClubPlanUnitReview','returnClubPlan'].includes(command),'CLUB_UNIT_REVIEW_WRITE_DENIED');const r=added[0];check(actor!==(before.clubs??[]).find(c=>c.id===row.clubId)?.owner&&actor!==previous.p.owner,'CLUB_INDEPENDENT_UNIT_REVIEW_REQUIRED');check(r.by===actor&&r.clubId===row.clubId&&r.planId===row.p.id&&r.planVersion===(row.p.version??1)&&r.finalApproval===false&&r.executionAuthorized===false&&r.authority==='OWNER_DEMO_UNIT_REVIEW'&&typeof r.reason==='string'&&r.reason.trim()&&r.reason.length<=4000&&typeof r.at==='string'&&Number.isFinite(Date.parse(r.at))&&new Date(r.at).toISOString()===r.at&&((command==='recordClubPlanUnitReview'&&previous.p.state==='ADMIN_REVIEW'&&row.p.state==='UNIT_ENDORSED'&&r.action==='ENDORSED')||(command==='returnClubPlan'&&previous.p.state==='UNIT_ENDORSED'&&row.p.state==='DRAFT'&&r.action==='WITHDRAWN'&&r.reviewId===history.at(-1)?.id)),'CLUB_UNIT_REVIEW_AUTHORITY_INVALID')}
 }
 for(const p of after.projects??[]){const previous=(before.projects??[]).find(x=>x.id===p.id),club=p.sourceClub||/^Club event\b/.test(p.type??'');if(club&&(!previous||link(p)!==link(previous)))throw Error('CLUB_NEW_EXECUTION_REQUIRES_PROTECTED_AUTHORIZATION')}
}
