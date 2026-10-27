// Isolated pure pilot; NOT imported by live routes or the workflow engine.
// All identities, assignments, plan versions and evidence registry entries must come
// from trusted server loaders. This helper does not authenticate or grant access.
const copy=structuredClone;
const check=(ok,reason)=>{if(!ok)throw new Error(reason)};
const id=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200;
const text=v=>typeof v==='string'&&!!v.trim()&&v.length<=4000;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const nepalDay=now=>new Date(Date.parse(now)+345*60000).toISOString().slice(0,10);
const timestamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
function assignment(a,now){
 check(timestamp(now)&&a&&id(a.id)&&Number.isSafeInteger(a.version)&&a.version>0&&[a.subjectPersonId,a.submitterPersonId,a.reviewerPersonId].every(id)&&Array.isArray(a.actionOwnerPersonIds)&&a.actionOwnerPersonIds.every(id),'INVALID_ASSIGNMENT');
 check(timestamp(a.validFrom)&&timestamp(a.validUntil)&&Date.parse(a.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(a.validUntil)&&!a.revokedAt,'ASSIGNMENT_INACTIVE');
 check(![a.subjectPersonId,a.submitterPersonId].includes(a.reviewerPersonId),'INDEPENDENT_REVIEWER_REQUIRED');
}
function source(plan,itemId){
 check(plan&&['APPROVED','IN_PROGRESS','COMPLETED'].includes(plan.state)&&id(plan.id)&&id(plan.owner)&&Number.isSafeInteger(plan.version)&&plan.version>0&&Array.isArray(plan.items),'APPROVED_PLAN_REQUIRED');
 const matches=plan.items.filter(i=>i.id===itemId);check(matches.length===1,'PLAN_ITEM_REQUIRED');
 return {planId:plan.id,family:plan.family||plan.id,planVersion:plan.version,ownerActorId:plan.owner,item:copy(matches[0])};
}
function evidence(refs,registry){
 check(Array.isArray(refs)&&Array.isArray(registry),'INVALID_EVIDENCE');const seen=new Set();
 return refs.map(ref=>{check(ref&&id(ref.id)&&Number.isSafeInteger(ref.version)&&ref.version>0&&!seen.has(ref.id),'INVALID_EVIDENCE_REFERENCE');seen.add(ref.id);
 const rows=registry.filter(e=>e.id===ref.id);check(rows.length===1&&rows[0].version===ref.version&&rows[0].verified===true,'CURRENT_VERIFIED_EVIDENCE_REQUIRED');return {id:ref.id,version:ref.version};});
}
function validateContent(c,r,registry){
 check(c&&Object.keys(c).every(k=>['periodFrom','periodTo','actualValue','achievementNotes','varianceReason','outputEvidence','outcomeEvidence'].includes(k)),'UNKNOWN_MONITORING_FIELD');
 check(c&&date(c.periodFrom)&&date(c.periodTo)&&c.periodFrom<=c.periodTo,'INVALID_REVIEW_PERIOD');
 check(c.actualValue===null||typeof c.actualValue==='number'&&Number.isFinite(c.actualValue),'INVALID_ACTUAL_VALUE');
 check(text(c.achievementNotes),'ACHIEVEMENT_EXPLANATION_REQUIRED');
 const target=String(r.source.item.target??'').trim();
 if(c.actualValue===null||target&&Number.isFinite(Number(target))&&c.actualValue!==Number(target))check(text(c.varianceReason),'VARIANCE_REASON_REQUIRED');
 evidence(c.outputEvidence,registry);evidence(c.outcomeEvidence,registry);
 if(c.actualValue!==null)check(c.outputEvidence.length>0,'ACHIEVEMENT_EVIDENCE_REQUIRED');
}
function boundReview(a,reviewId,sourceSnapshot){
 if(a.binding?.scope){const scope=a.binding.scope;check(scope.reviewId===reviewId&&scope.planId===sourceSnapshot.planId&&scope.planVersion===sourceSnapshot.planVersion&&scope.itemId===sourceSnapshot.item.id,'ASSIGNMENT_RECORD_SCOPE_MISMATCH')}
}
export function createMonitoringReviewPilot({id:reviewId,plan,itemId,assignment:a,actorPersonId,now}){
 assignment(a,now);check(id(reviewId)&&actorPersonId===a.submitterPersonId,'SUBMITTER_REQUIRED');boundReview(a,reviewId,source(plan,itemId));
 return {id:reviewId,pilot:true,unrated:true,revision:1,state:'DRAFT',source:source(plan,itemId),assignment:copy(a),versions:[],actions:[],history:[{event:'DRAFT_CREATED',by:actorPersonId,at:now,revision:1}]};
}
export function transitionMonitoringReviewPilot(record,input){
 const {action,actorPersonId,expectedRevision,now,plan,evidenceRegistry=[],fields={}}=input;
 check(record?.pilot===true&&record.unrated===true,'PILOT_RECORD_REQUIRED');assignment(input.assignment,now);
 check(canonical(record.assignment)===canonical(input.assignment),'ASSIGNMENT_CHANGED');boundReview(input.assignment,record.id,record.source);
 check(expectedRevision===record.revision,'STALE_REVIEW_REVISION');check(Date.parse(now)>=Date.parse(record.history.at(-1).at),'NON_MONOTONIC_TIME');
 const r=copy(record),a=r.assignment,reviewer=actorPersonId===a.reviewerPersonId,submitter=actorPersonId===a.submitterPersonId;
 check([a.subjectPersonId,a.submitterPersonId,a.reviewerPersonId,...a.actionOwnerPersonIds].includes(actorPersonId),'ACCESS_DENIED');
 const current=()=>check(canonical(source(plan,r.source.item.id))===canonical(r.source),'PLAN_SOURCE_CHANGED');
 const latest=()=>r.versions.at(-1);
 const requireReviewer=()=>check(reviewer&&!submitter&&actorPersonId!==a.subjectPersonId,'INDEPENDENT_REVIEWER_REQUIRED');
 if(action==='SAVE_DRAFT'){
  check(submitter&&['DRAFT','RETURNED'].includes(r.state),'DRAFT_EDIT_DENIED');current();validateContent(fields,r,evidenceRegistry);
  r.versions.push({version:r.versions.length+1,content:{periodFrom:fields.periodFrom,periodTo:fields.periodTo,actualValue:fields.actualValue,achievementNotes:fields.achievementNotes.trim(),varianceReason:fields.varianceReason?.trim()||'',outputEvidence:evidence(fields.outputEvidence,evidenceRegistry),outcomeEvidence:evidence(fields.outcomeEvidence,evidenceRegistry)},by:actorPersonId,at:now});r.state='DRAFT';
 }else if(action==='SUBMIT'){
  check(submitter&&r.state==='DRAFT'&&latest(),'SUBMISSION_DENIED');current();validateContent(latest().content,r,evidenceRegistry);r.submittedVersion=latest().version;r.state='SUBMITTED';
 }else if(action==='BEGIN_REVIEW'){
  requireReviewer();check(r.state==='SUBMITTED','REVIEW_STATE_REQUIRED');current();validateContent(latest().content,r,evidenceRegistry);r.state='UNDER_REVIEW';
 }else if(action==='RETURN'||action==='APPROVE'){
  requireReviewer();check(r.state==='UNDER_REVIEW'&&text(fields.reason),'REVIEW_REASON_REQUIRED');current();
  const decision={decision:action,version:r.submittedVersion,by:actorPersonId,at:now,reason:fields.reason.trim()};
  if(action==='APPROVE'){
   validateContent(latest().content,r,evidenceRegistry);
   check(['NOT_ESTABLISHED','OUTPUTS_VERIFIED','INCOMPLETE'].includes(fields.completionFinding),'COMPLETION_FINDING_REQUIRED');
   check(['NOT_ESTABLISHED','SUPPORTED','NOT_SUPPORTED'].includes(fields.effectivenessFinding),'EFFECTIVENESS_FINDING_REQUIRED');
   if(fields.completionFinding==='OUTPUTS_VERIFIED')check(latest().content.outputEvidence.length>0,'OUTPUT_EVIDENCE_REQUIRED');
   if(fields.effectivenessFinding!=='NOT_ESTABLISHED')check(latest().content.outcomeEvidence.length>0,'OUTCOME_EVIDENCE_REQUIRED');
   Object.assign(decision,{completionFinding:fields.completionFinding,effectivenessFinding:fields.effectivenessFinding});
  }
  r.decisions??=[];r.decisions.push(decision);r.state=action==='APPROVE'?'APPROVED':'RETURNED';
 }else if(action==='ADD_ACTION'){
  requireReviewer();current();check(r.state==='APPROVED'&&id(fields.id)&&!r.actions.some(x=>x.id===fields.id)&&text(fields.description)&&date(fields.due)&&fields.due>=nepalDay(now)&&a.actionOwnerPersonIds.includes(fields.ownerPersonId)&&fields.ownerPersonId!==a.reviewerPersonId&&text(fields.expectedEvidence),'INVALID_CORRECTIVE_ACTION');
  r.actions.push({id:fields.id,description:fields.description.trim(),due:fields.due,ownerPersonId:fields.ownerPersonId,expectedEvidence:fields.expectedEvidence.trim(),state:'OPEN',updates:[],closures:[],events:[]});
 }else if(['UPDATE_ACTION','CLOSE_ACTION','REOPEN_ACTION'].includes(action)){
  const work=r.actions.find(x=>x.id===fields.id);check(r.state==='APPROVED'&&work&&text(fields.reason),'ACTION_AND_REASON_REQUIRED');
  if(action==='UPDATE_ACTION'){
   check(actorPersonId===work.ownerPersonId&&['OPEN','IN_PROGRESS'].includes(work.state),'ACTION_OWNER_REQUIRED');
   work.updates.push({evidence:evidence(fields.evidence||[],evidenceRegistry),by:actorPersonId,at:now,reason:fields.reason.trim()});work.state='IN_PROGRESS';
  }else if(action==='CLOSE_ACTION'){
   requireReviewer();check(actorPersonId!==work.ownerPersonId&&work.state==='IN_PROGRESS','INDEPENDENT_ACTION_VERIFIER_REQUIRED');check(work.updates.length>(work.reopenedAfterUpdate??-1),'FRESH_FOLLOWUP_REQUIRED');current();validateContent(latest().content,r,evidenceRegistry);
   const refs=work.updates.at(-1)?.evidence;check(refs?.length>0,'CLOSURE_EVIDENCE_REQUIRED');evidence(refs,evidenceRegistry);
   work.closures.push({by:actorPersonId,at:now,reason:fields.reason.trim(),evidence:copy(refs)});work.state='VERIFIED_CLOSED';
  }else{requireReviewer();check(work.state==='VERIFIED_CLOSED','CLOSED_ACTION_REQUIRED');work.reopenedAfterUpdate=work.updates.length;work.state='IN_PROGRESS';}
  work.events.push({event:action,by:actorPersonId,at:now,reason:fields.reason.trim()});
 }else throw new Error('UNKNOWN_MONITORING_COMMAND');
 r.revision++;r.history.push({event:action,by:actorPersonId,at:now,revision:r.revision,version:r.submittedVersion||latest()?.version||null});return r;
}
export function monitoringReviewPilotSummary(record,{assignment:a,actorPersonId,now,plan,evidenceRegistry=[]}){
 assignment(a,now);check(canonical(a)===canonical(record.assignment),'ASSIGNMENT_CHANGED');boundReview(a,record.id,record.source);
 check([a.subjectPersonId,a.submitterPersonId,a.reviewerPersonId,...a.actionOwnerPersonIds].includes(actorPersonId),'ACCESS_DENIED');
 let reviewCurrent=false;try{reviewCurrent=record.state==='APPROVED'&&canonical(source(plan,record.source.item.id))===canonical(record.source);if(reviewCurrent)validateContent(record.versions.at(-1).content,record,evidenceRegistry)}catch{reviewCurrent=false}
 return {id:record.id,state:record.state,reviewCurrent,unrated:true,planId:record.source.planId,planVersion:record.source.planVersion,itemId:record.source.item.id,actualValue:record.versions.at(-1)?.content.actualValue??null,actions:record.actions.map(work=>{
  let verifiedCurrent=false;if(work.state==='VERIFIED_CLOSED'&&reviewCurrent){try{evidence(work.closures.at(-1).evidence,evidenceRegistry);verifiedCurrent=true}catch{}}
  return {id:work.id,state:work.state,verificationCurrent:verifiedCurrent,overdue:date(work.due)&&work.due<nepalDay(now)&&!verifiedCurrent};
 })};
}
