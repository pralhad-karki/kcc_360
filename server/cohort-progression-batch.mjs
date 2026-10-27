import {prepareMockCohortProgression} from './cohort-progression-preview.mjs';

// Pure transitions over a SERVER-OWNED fictional ledger. Callers must obtain actor
// from authenticated session storage and commit the returned ledger with CAS.
// This module has no route, storage, browser fallback or official MIS write-back.
const clone=v=>structuredClone(v);
const stable=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(v=>JSON.parse(stable(v))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(stable(v[k]))])):v);
const equal=(a,b)=>stable(a)===stable(b);
const fail=reason=>({ok:false,reason,changed:false});
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const note=v=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=1000;
const key=v=>typeof v==='string'&&/^MOCK_[A-Z0-9_]{1,100}$/.test(v);
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(value))))].map(v=>v.toString(16).padStart(2,'0')).join('')}
const binding=b=>({id:b.id,preparedBy:b.preparedBy,preparedAt:b.preparedAt,reason:b.reason,preview:b.preview,before:b.before});
const placement=(s,e)=>({studentId:s.studentId,personId:s.personId,enrollmentId:e.id,programmeId:e.programmeId,batchId:e.batchId,semesterId:e.semesterId,version:e.version});
const validLedger=l=>l?.mode==='MOCK'&&l.fictional===true&&Number.isSafeInteger(l.revision)&&l.revision>=0&&l.placements&&typeof l.placements==='object'&&!Array.isArray(l.placements)&&Array.isArray(l.batches)&&Array.isArray(l.history);

// Read-only diagnostic over one captured source/ledger snapshot. It grants no
// permission; every mutation still validates current state independently.
export async function compareMockCohortBatch(command){
 const raw=command||{},valid=validLedger(raw.ledger);
 // Capture the selected record and placements, not all prior batches/history.
 const {old,placements,revision,batchId,input,now=new Date().toISOString()}=clone({old:valid?raw.ledger.batches.find(b=>b?.id===raw.batchId):null,placements:valid?raw.ledger.placements:null,revision:raw.ledger?.revision,batchId:raw.batchId,input:raw.input,now:raw.now});
 const ledger={revision,placements};
 const report=(status,reasons)=>({batchId,bindingHash:old?.bindingHash,ledgerRevision:ledger?.revision,checkedAt:now,status,reasons,readOnly:true,officialWriteBack:false});
 try{
  if(!valid||!key(batchId)||!stamp(now)||!old||old.preparedBy!=='c1'||await digest(binding(old))!==old.bindingHash)return report('BLOCKED',['SAVED_BATCH_INVALID']);
  if(['APPLIED','REJECTED','WITHDRAWN'].includes(old.state))return report('HISTORICAL',[]);
  if(!['PROPOSED','APPROVED'].includes(old.state)||old.state==='APPROVED'&&(!old.decision||old.decision.by!=='d1'||old.decision.outcome!=='APPROVED'||old.decision.bindingHash!==old.bindingHash||!stamp(old.decision.at)||!note(old.decision.reason)))return report('BLOCKED',['SAVED_BATCH_INVALID']);
  const p=prepareMockCohortProgression({...input,now});if(!p.ok)return report('UNAVAILABLE',['CURRENT_SOURCE_UNAVAILABLE']);
  const reasons=[];
  if(!equal(old.preview.source,p.source))reasons.push('SOURCE_CHANGED');
  if(!equal(old.preview.structure,p.structure))reasons.push('STRUCTURE_CHANGED');
  if(!equal(old.preview.cohort,p.cohort))reasons.push('COHORT_CHANGED');
  if(!equal(old.preview.rows.map(r=>r.studentId),p.rows.map(r=>r.studentId)))reasons.push('MEMBERSHIP_CHANGED');
  if(!equal(old.preview.rows,p.rows)||!equal(old.preview.counts,p.counts))reasons.push('STUDENT_RECORDS_CHANGED');
  const before=Object.fromEntries(p.rows.map(r=>[r.studentId,ledger.placements[r.studentId]??null]));
  if(!equal(old.before,before)||!p.rows.every(r=>{const s=input.roster.students.find(s=>s.studentId===r.studentId),e=s.enrollments.find(e=>e.status==='CURRENT');return equal(before[r.studentId],placement(s,e))}))reasons.push('PLACEMENTS_CHANGED');
  if(!equal(old.preview,p)&&!reasons.length)reasons.push('PREVIEW_CHANGED');
  return report(reasons.length?'STALE':'CURRENT',reasons);
 }catch{return report('BLOCKED',['SAVED_BATCH_INVALID'])}
}

export function createMockCohortLedger(input){
 const p=prepareMockCohortProgression(input);if(!p.ok)return fail(p.reason);
 const placements=Object.fromEntries(input.roster.students.map(s=>[s.studentId,placement(s,s.enrollments.find(e=>e.status==='CURRENT'))]));
 return {ok:true,ledger:{mode:'MOCK',fictional:true,revision:0,placements,batches:[],history:[]}};
}

// revision is an optimistic concurrency precondition, not permission or persistence.
// A successful transition returns detached state; a denial returns no partial state.
export async function transitionMockCohortBatch(command){
 try{return await transition(clone(command))}catch{return fail('INVALID_LEDGER_OR_COMMAND')}
}
async function transition({ledger,actor,revision,action,batchId,bindingHash,reason,input,now=new Date().toISOString()}){
 if(!validLedger(ledger))return fail('SERVER_OWNED_MOCK_LEDGER_REQUIRED');
 if(!Number.isSafeInteger(revision)||revision!==ledger.revision)return fail('STALE_LEDGER');
 if(!stamp(now)||!key(batchId))return fail('INVALID_COMMAND');
 if(ledger.history.length&&(!stamp(ledger.history.at(-1).at)||now<ledger.history.at(-1).at))return fail('EVENT_TIME_INVALID');
 if(!['PROPOSE','APPROVE','REJECT','APPLY','WITHDRAW'].includes(action))return fail('INVALID_COMMAND');
 if((['PROPOSE','APPLY','WITHDRAW'].includes(action)?actor!=='c1':actor!=='d1'))return fail('ROLE_DENIED');
 if(action!=='APPLY'&&!note(reason))return fail('REASON_REQUIRED');
 // Retiring a saved pending batch neither advances placements nor requires the
 // obsolete/current source to be available. Never overwrite its source binding.
 if(action==='WITHDRAW'){
  const old=ledger.batches.find(b=>b.id===batchId);if(!old)return fail('BATCH_NOT_FOUND');
  if(!['PROPOSED','APPROVED'].includes(old.state))return fail('BATCH_STATE_CONFLICT');
  if(old.preparedBy!==actor)return fail('ROLE_DENIED');
  if(bindingHash!==old.bindingHash||await digest(binding(old))!==old.bindingHash)return fail('BATCH_BINDING_INVALID');
  if(now<old.preparedAt||old.decision&&now<old.decision.at)return fail('EVENT_TIME_INVALID');
  if(old.state==='APPROVED'&&(!old.decision||old.decision.by!=='d1'||old.decision.outcome!=='APPROVED'||old.decision.bindingHash!==old.bindingHash||!stamp(old.decision.at)||!note(old.decision.reason)))return fail('INDEPENDENT_APPROVAL_REQUIRED');
  const next=clone(ledger),batch=next.batches.find(b=>b.id===batchId),fromState=batch.state;
  batch.state='WITHDRAWN';batch.withdrawal={by:actor,at:now,reason:reason.trim(),fromState,bindingHash:old.bindingHash};
  next.revision++;
  next.history.push({revision:next.revision,batchId,action,actor,at:now,bindingHash:old.bindingHash,fromState,reason:reason.trim()});
  return {ok:true,changed:true,ledger:next,batch:clone(batch),officialWriteBack:false};
 }
 const p=prepareMockCohortProgression({...input,now});if(!p.ok)return fail('CURRENT_SOURCE_REQUIRED');
 const old=ledger.batches.find(b=>b.id===batchId);
 if(action==='PROPOSE'){
  if(old)return fail('BATCH_ID_EXISTS');
  if(p.counts.finalReview)return fail('FINAL_SEMESTER_SEPARATE_REVIEW_REQUIRED');
  if(!p.counts.advance)return fail('NO_ADVANCEMENT_ROWS');
  if(ledger.batches.some(b=>b.preview.cohort.id===p.cohort.id&&['PROPOSED','APPROVED'].includes(b.state)))return fail('COHORT_BATCH_PENDING');
 }else{
  if(!old)return fail('BATCH_NOT_FOUND');
  if(!['PROPOSED','APPROVED','REJECTED','APPLIED','WITHDRAWN'].includes(old.state)||await digest(binding(old))!==old.bindingHash)return fail('BATCH_BINDING_INVALID');
  if(now<old.preparedAt||old.decision&&now<old.decision.at)return fail('EVENT_TIME_INVALID');
  if(old.preparedBy===actor&&action!=='APPLY')return fail('INDEPENDENT_REVIEW_REQUIRED');
  if(action==='APPLY'?old.state!=='APPROVED':old.state!=='PROPOSED')return fail('BATCH_STATE_CONFLICT');
  if(action==='APPLY'&&(!old.decision||old.decision.by!=='d1'||old.decision.by===old.preparedBy||old.decision.outcome!=='APPROVED'||old.decision.bindingHash!==old.bindingHash||!stamp(old.decision.at)||!note(old.decision.reason)))return fail('INDEPENDENT_APPROVAL_REQUIRED');
  if(!equal(old.preview,p))return fail('SOURCE_OR_PROPOSAL_CHANGED');
 }
 // Bind EVERY row, including the official Left College exclusion. A conflict in
 // any member blocks the whole batch; no fees/attendance/grade filtering exists.
 const before={};
 for(const row of p.rows){
  const current=ledger.placements[row.studentId],s=input.roster.students.find(s=>s.studentId===row.studentId),e=s.enrollments.find(e=>e.status==='CURRENT');
  if(!current||!equal(current,placement(s,e)))return fail('PLACEMENT_CONFLICT');
  before[row.studentId]=clone(current);
 }
 if(old&&!equal(old.before,before))return fail('PLACEMENT_CONFLICT');
 const next=clone(ledger),rev=ledger.revision+1;
 let batch;
 if(action==='PROPOSE'){
  batch={id:batchId,state:'PROPOSED',preparedBy:actor,preparedAt:now,reason:reason.trim(),preview:clone(p),before};
  batch.bindingHash=await digest(binding(batch));next.batches.push(batch);
 }else{
  batch=next.batches.find(b=>b.id===batchId);
  if(action==='APPLY'){
   for(const row of p.rows.filter(r=>r.decision==='ADVANCE_PREVIEW'))next.placements[row.studentId]={...before[row.studentId],semesterId:row.to.semesterId,version:before[row.studentId].version+1};
   batch.state='APPLIED';batch.appliedAt=now;batch.appliedBy=actor;
   batch.after=Object.fromEntries(p.rows.map(r=>[r.studentId,clone(next.placements[r.studentId])]));
  }else{
   batch.state=action==='APPROVE'?'APPROVED':'REJECTED';batch.decision={by:actor,at:now,reason:reason.trim(),outcome:batch.state,bindingHash:batch.bindingHash};
  }
 }
 next.revision=rev;
 next.history.push({revision:rev,batchId,action,actor,at:now,bindingHash:batch.bindingHash,...(action==='APPLY'?{before:clone(batch.before),after:clone(batch.after)}:{})});
 return {ok:true,changed:true,ledger:next,batch:clone(batch),officialWriteBack:false};
}
