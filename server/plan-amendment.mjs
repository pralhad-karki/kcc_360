import {validateTargetProofDateAmendment} from './plan-target-amendment.mjs';
// Immutable proposed versions; no approved raw source, event or learning record is changed.
import {newPlanApproval,decidePlanApproval} from './plan-approval-policy.mjs';
const check=(ok,m)=>{if(!ok)throw Error(m)};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>plain(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
const text=(x,max=2000)=>typeof x==='string'&&x.trim().length>0&&x.length<=max&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x);
const canonical=x=>Array.isArray(x)?x.map(canonical):plain(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
export const samePlanValue=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export const planValueDigest=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(canonical(x)))))).map(v=>v.toString(16).padStart(2,'0')).join('');
export function latestApprovedPlan(data,planId,required=true){const rows=(data.planApprovalRecords??[]).filter(r=>r.planId===planId&&r.state==='APPROVED').sort((a,b)=>b.planVersion-a.planVersion);if(!rows.length&&!required)return null;check(rows.length&&rows[0].approvedSnapshot,'APPROVED_BASELINE_REQUIRED');check(!rows[1]||rows[0].planVersion!==rows[1].planVersion,'AMBIGUOUS_APPROVED_BASELINE');return rows[0]}
export function assertAmendmentBaselineCurrent(data,plan){
 const aid=plan.content.source.amendmentId;if(!aid)return;
 const rows=(data.planAmendments??[]).filter(r=>r.id===aid&&r.planId===plan.id&&r.planVersion===plan.version);check(rows.length===1,'AMENDMENT_SOURCE_REQUIRED');
 const a=rows[0],base=latestApprovedPlan(data,plan.id,false);
 if(a.baselineApproved===false){check(!base,'AMENDMENT_BASELINE_CHANGED_REBASE_REQUIRED');return}
 check(base&&base.planVersion===rows[0].baselineVersion&&base.sourceBinding===rows[0].baselineBinding&&base.revision===rows[0].baselineReviewRevision,'AMENDMENT_BASELINE_CHANGED_REBASE_REQUIRED');
}
export function authorizeAmendmentOwner(source){
 const draft=newPlanApproval({plan:source.plan,now:source.context.now});
 return decidePlanApproval(draft,{action:'SUBMIT',expectedRevision:1,expectedBinding:draft.sourceBinding,reason:'Amendment owner capability check'},source.context).decisions.at(-1).authority;
}
export function amendmentEnabled(source){return source.configuration.sources?.some(m=>m.workspaceId===source.workspace.id&&m.planId===source.plan.id&&m.planVersion===(source.plan.content.source.record.version??1)&&m.allowAmendments===true&&m.kind===source.plan.kind&&m.institutionId===source.plan.institutionId&&m.unitId===source.plan.unitId)===true}
const effective=p=>structuredClone(p.content.source.proposedRecord??p.content.source.record);
function amountMinor(value){check(['number','string'].includes(typeof value)&&/^\d+(?:\.\d{1,2})?$/.test(String(value)),'INVALID_AMENDMENT_BUDGET');const [whole,fraction='']=String(value).split('.'),amount=Number(whole)*100+Number((fraction+'00').slice(0,2));check(Number.isSafeInteger(amount),'INVALID_AMENDMENT_BUDGET');return amount}
function validateAddition(item,source){
 const fields=['title','type','start','end','reportDue','participants','venue','budget','lead','mentor','evidence','expectedOutput','risk','sdg'];check(exact(item,fields),'INVALID_ADDITION_FIELDS');
 check(['title','type','venue','lead','mentor','evidence','expectedOutput','risk','sdg'].every(k=>text(item[k]))&&date(item.start)&&date(item.end)&&date(item.reportDue)&&item.start<=item.end&&item.end<=item.reportDue&&Number.isSafeInteger(item.participants)&&item.participants>0,'INVALID_ADDITION_CONTENT');amountMinor(item.budget);
 for(const actor of [item.lead,item.mentor]){const person=source.context.personMap?.[actor];check(person&&source.context.reviewers.some(p=>p.personId===person&&p.active),'ACTIVE_PLANNED_ACTOR_REQUIRED')}
}
export function preparePlanAmendment(source,request){
 check(amendmentEnabled(source),'AMENDMENTS_NOT_ENABLED_FOR_SOURCE');authorizeAmendmentOwner(source);
 const rows=source.workspace.data.planApprovalRecords??[],matches=rows.filter(r=>r.planId===source.plan.id&&r.planVersion===source.plan.version);
 check(matches.length===1,'EXACT_PREVIOUS_REVIEW_REQUIRED');const previous=matches[0];
 check(['APPROVED','REVISION_REQUIRED','REJECTED','WITHDRAWN'].includes(previous.state),'PREVIOUS_REVIEW_NOT_TERMINAL');
 check(previous.revision===request.expectedReviewRevision&&previous.sourceBinding===newPlanApproval({plan:source.plan,now:source.context.now}).sourceBinding,'PREVIOUS_REVIEW_CHANGED');
 const family=rows.filter(r=>r.planId===source.plan.id);check(family.every(r=>r.planVersion<=previous.planVersion),'NEWER_PLAN_VERSION_EXISTS');
 const base=latestApprovedPlan(source.workspace.data,source.plan.id,false)??previous;
 check(base.planVersion<=previous.planVersion,'STALE_APPROVED_BASELINE');
 const version=previous.planVersion+1;check(Number.isSafeInteger(version),'PLAN_VERSION_LIMIT');
 const proposed=effective(source.plan),approved=effective(base.approvedSnapshot??JSON.parse(base.sourceBinding));
 check(Array.isArray(request.changes)&&request.changes.length>0&&request.changes.length<=8,'AMENDMENT_CHANGES_REQUIRED');
 const touched=new Set();let addition=0;
 for(const change of request.changes){
  if(change?.type==='EXTEND_ITEM_DATES'){
   check(exact(change,['type','itemId','newEnd','newReportDue'])&&!touched.has(change.itemId)&&date(change.newEnd)&&date(change.newReportDue),'INVALID_DATE_EXTENSION');touched.add(change.itemId);
   const item=proposed.items.find(i=>i.id===change.itemId),old=approved.items.find(i=>i.id===change.itemId);check(item&&old&&change.newEnd>=old.end&&change.newReportDue>=change.newEnd&&change.newReportDue>=(old.reportDue??old.end)&&(change.newEnd!==item.end||change.newReportDue!==item.reportDue),'EXTENSION_MUST_PRESERVE_APPROVED_DATES');
   item.end=change.newEnd;item.reportDue=change.newReportDue;
  }else if(change?.type==='ADD_ITEM'){
   check(exact(change,['type','item']),'INVALID_ADDITION');validateAddition(change.item,source);
   const x=change.item,id='AMI-'+request.operationId+'-'+(++addition);check(!proposed.items.some(i=>i.id===id),'ADDITION_ID_CONFLICT');
   proposed.items.push({id,title:x.title.trim(),type:x.type.trim(),start:x.start,end:x.end,reportDue:x.reportDue,participants:String(x.participants),venue:x.venue.trim(),budget:String(x.budget),lead:x.lead,mentor:x.mentor,evidence:x.evidence.trim(),outcomes:x.expectedOutput.trim(),output:x.expectedOutput.trim(),outputs:x.expectedOutput.trim(),risk:x.risk.trim(),risks:x.risk.trim(),sdg:x.sdg.trim(),status:'PLANNED',executionAuthorization:'PLANNING_ONLY'});
  }else throw Error('UNKNOWN_AMENDMENT_CHANGE');
 }
 check(proposed.items.length<=1000,'PLAN_ITEM_LIMIT');
 const changes=[];for(const item of proposed.items){const old=approved.items.find(i=>i.id===item.id);if(!old)changes.push({type:'ADD_ITEM',itemId:item.id,old:null,proposed:structuredClone(item)});else for(const field of ['end','reportDue'])if(item[field]!==old[field])changes.push({type:'DATE_CHANGE',itemId:item.id,field,old:old[field]??null,proposed:item[field]??null})}
 check(changes.length>0,'NO_AMENDMENT_CHANGE');
 proposed.version=version;proposed.state='DRAFT';delete proposed.approvedBy;delete proposed.approvedAt;delete proposed.approvedSnapshot;proposed.history=[];
 let minor=0;for(const item of proposed.items)if(item.status!=='CANCELLED'){minor+=amountMinor(item.budget);check(Number.isSafeInteger(minor),'INVALID_AMENDMENT_BUDGET')}
 const amendmentId='AM-'+request.operationId;
 const plan={...structuredClone(source.plan),version,content:{...structuredClone(source.plan.content),budget:minor/100,source:{...structuredClone(source.plan.content.source),amendmentId,baseVersion:base.planVersion,proposedRecord:proposed}}};
 if(plan.content.targetProofs)validateTargetProofDateAmendment(plan);
 const review=newPlanApproval({plan,previous,now:source.context.now});
 return {review,amendment:{id:amendmentId,planId:plan.id,planVersion:version,previousVersion:previous.planVersion,baselineVersion:base.planVersion,baselineApproved:base.state==='APPROVED',baselineReviewState:base.state,baselineReviewRevision:base.revision,baselineBinding:base.sourceBinding,proposedPlan:plan,changes,reason:request.reason.trim(),byPersonId:source.context.principal.personId,createdAt:source.context.now,executionAuthorized:false}};
}

export function canDraftPlanAmendment(source){try{if(!amendmentEnabled(source))return false;authorizeAmendmentOwner(source);const rows=source.workspace.data.planApprovalRecords??[],record=rows.find(r=>r.planId===source.plan.id&&r.planVersion===source.plan.version);return !!record&&['APPROVED','REVISION_REQUIRED','REJECTED','WITHDRAWN'].includes(record.state)&&rows.filter(r=>r.planId===source.plan.id).every(r=>r.planVersion<=record.planVersion)&&record.sourceBinding===newPlanApproval({plan:source.plan,now:source.context.now}).sourceBinding}catch{return false}}
