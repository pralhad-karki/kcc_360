// Isolated pure feasibility helper. No live imports, authentication, grants or persistence.
// Source, stable-person assignment and evidence registry must be server-loaded.
const copy=structuredClone,check=(ok,message)=>{if(!ok)throw Error(message)};
const id=v=>typeof v==='string'&&v.trim()===v&&v.length>0&&v.length<=200;
const version=v=>Number.isSafeInteger(v)&&v>0;
const text=v=>typeof v==='string'&&!!v.trim()&&v.length<=4000;
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
function source(e,criterionKey){
 check(e&&id(e.id)&&id(e.clubId)&&id(e.cycle)&&version(e.version)&&version(e.annualVersion)&&e.state==='VERIFIED'&&Array.isArray(e.criteria),'VERIFIED_ASSESSMENT_REQUIRED');
 const matches=e.criteria.filter(c=>c.key===criterionKey);check(matches.length===1,'EXACT_CRITERION_REQUIRED');const c=matches[0];
 check(id(c.key)&&text(c.title)&&c.action&&text(c.action.title)&&id(c.action.owner)&&id(c.action.due)&&c.action.state==='OPEN','RECORDED_OPEN_ACTION_REQUIRED');
 return {evaluationId:e.id,evaluationVersion:e.version,annualVersion:e.annualVersion,clubId:e.clubId,cycle:e.cycle,criterionKey:c.key,indicator:c.title,action:copy(c.action)};
}
function assignment(a,s,now,recordId){
 check(stamp(now)&&a&&id(a.id)&&version(a.version)&&id(a.ownerPersonId)&&id(a.reviewerPersonId),'TRUSTED_ASSIGNMENT_REQUIRED');
 check(stamp(a.validFrom)&&stamp(a.validUntil)&&Date.parse(a.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(a.validUntil)&&!a.revokedAt,'ASSIGNMENT_INACTIVE');
 check(a.ownerPersonId!==a.reviewerPersonId,'INDEPENDENT_REVIEWER_REQUIRED');
 check(a.clubId===s.clubId&&a.cycle===s.cycle&&a.evaluationId===s.evaluationId&&a.evaluationVersion===s.evaluationVersion&&a.criterionKey===s.criterionKey&&a.sourceOwnerActorId===s.action.owner,'ASSIGNMENT_SCOPE_MISMATCH');
 if(a.binding?.scope){const b=a.binding.scope;check(b.closureId===recordId&&b.annualVersion===s.annualVersion&&b.evaluationId===s.evaluationId&&b.evaluationVersion===s.evaluationVersion&&b.clubId===s.clubId&&b.cycle===s.cycle&&b.criterionKey===s.criterionKey,'ASSIGNMENT_RECORD_SCOPE_MISMATCH');}
 return copy(a);
}
function evidence(refs,registry,s){
 check(Array.isArray(refs)&&refs.length>0&&Array.isArray(registry),'COMPLETION_EVIDENCE_REQUIRED');const seen=new Set();
 return refs.map(ref=>{check(ref&&Object.keys(ref).every(k=>['id','version'].includes(k))&&id(ref.id)&&version(ref.version)&&!seen.has(ref.id),'INVALID_EVIDENCE_REFERENCE');seen.add(ref.id);const matches=registry.filter(e=>e.id===ref.id);const e=matches[0];check(matches.length===1&&e.version===ref.version&&e.verified===true&&e.current===true&&id(e.binding)&&e.clubId===s.clubId&&e.cycle===s.cycle,'CURRENT_SCOPED_VERIFIED_EVIDENCE_REQUIRED');return {id:e.id,version:e.version,binding:e.binding};});
}
export function createClubActionClosurePilot({id:recordId,evaluation,criterionKey,assignment:a,actorPersonId,now}){
 const s=source(evaluation,criterionKey),trusted=assignment(a,s,now,recordId);check(id(recordId)&&actorPersonId===trusted.ownerPersonId,'ACTION_OWNER_REQUIRED');
 return {id:recordId,pilot:true,revision:1,state:'OPEN',source:s,assignment:trusted,submissions:[],history:[{event:'OPENED',by:actorPersonId,at:now,revision:1}]};
}
export function transitionClubActionClosurePilot(record,{action,actorPersonId,expectedRevision,now,evaluation,assignment:a,evidenceRegistry=[],fields={}}){
 check(record?.pilot===true&&expectedRevision===record.revision,'REVISION_CONFLICT');
 const s=source(evaluation,record.source.criterionKey);check(canonical(s)===canonical(record.source),'ASSESSMENT_ACTION_CHANGED');
 check(Date.parse(now)>=Date.parse(record.history.at(-1).at),'EVENT_TIME_REVERSED');
 const trusted=assignment(a,s,now,record.id);check(canonical(trusted)===canonical(record.assignment),'ASSIGNMENT_CHANGED');
 check(fields&&typeof fields==='object'&&!Array.isArray(fields),'INVALID_FIELDS');const r=copy(record);
 if(action==='SUBMIT'){
  check(actorPersonId===trusted.ownerPersonId,'ACTION_OWNER_REQUIRED');check(['OPEN','RETURNED'].includes(r.state),'ACTION_NOT_EDITABLE');
  check(Object.keys(fields).every(k=>['explanation','evidence'].includes(k))&&text(fields.explanation),'COMPLETION_EXPLANATION_REQUIRED');
  const refs=evidence(fields.evidence,evidenceRegistry,s);r.submissions.push({version:r.submissions.length+1,explanation:fields.explanation.trim(),evidence:refs,by:actorPersonId,at:now});r.state='SUBMITTED';
 }else{
  check(['RETURN','VERIFY'].includes(action),'UNKNOWN_ACTION');check(actorPersonId===trusted.reviewerPersonId&&actorPersonId!==trusted.ownerPersonId,'INDEPENDENT_REVIEWER_REQUIRED');check(r.state==='SUBMITTED','SUBMISSION_REQUIRED');
  check(Object.keys(fields).every(k=>k==='reason')&&text(fields.reason),'DECISION_REASON_REQUIRED');const submitted=r.submissions.at(-1);
  if(action==='VERIFY'){const current=evidence(submitted.evidence.map(({id,version})=>({id,version})),evidenceRegistry,s);check(canonical(current)===canonical(submitted.evidence),'EVIDENCE_CHANGED');}
  r.state=action==='VERIFY'?'VERIFIED':'RETURNED';submitted.decision={state:r.state,by:actorPersonId,at:now,reason:fields.reason.trim()};
 }
 r.revision++;r.history.push({event:action,by:actorPersonId,at:now,revision:r.revision,submissionVersion:r.submissions.at(-1).version});return r;
}

// Trusted-loader projection only; deliberately not an HTTP endpoint or UI grant.
// It exposes latest submitted content, never the underlying evidence or identities.
export function readClubActionClosurePilot(record,{actorPersonId,now,evaluation,assignment:a,evidenceRegistry=[]}){
 check(record?.pilot===true,'PILOT_RECORD_REQUIRED');
 const s=source(evaluation,record.source.criterionKey);check(canonical(s)===canonical(record.source),'ASSESSMENT_ACTION_CHANGED');
 const trusted=assignment(a,s,now,record.id);check(canonical(trusted)===canonical(record.assignment),'ASSIGNMENT_CHANGED');
 const owner=actorPersonId===trusted.ownerPersonId,reviewer=actorPersonId===trusted.reviewerPersonId;
 check(owner||reviewer,'ASSIGNED_PERSON_REQUIRED');
 check(owner||['SUBMITTED','VERIFIED'].includes(record.state),'REVIEWER_CONTENT_UNAVAILABLE');
 const submitted=record.submissions.at(-1);let current=null;
 if(submitted){try{const refs=evidence(submitted.evidence.map(({id,version})=>({id,version})),evidenceRegistry,s);current=canonical(refs)===canonical(submitted.evidence)}catch{current=false}}
 return {id:record.id,pilot:true,revision:record.revision,state:record.state,viewer:owner?'OWNER':'REVIEWER',
  source:{evaluationId:s.evaluationId,evaluationVersion:s.evaluationVersion,annualVersion:s.annualVersion,clubId:s.clubId,cycle:s.cycle,criterionKey:s.criterionKey,indicator:s.indicator,actionTitle:s.action.title,recordedDeadline:s.action.due},
  latestSubmission:submitted?{version:submitted.version,explanation:submitted.explanation,submittedAt:submitted.at,evidenceCount:submitted.evidence.length,evidenceCurrent:current,decision:submitted.decision?{state:submitted.decision.state,reason:submitted.decision.reason,at:submitted.decision.at}:null}:null};
}
