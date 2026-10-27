// Pure proposed-policy pilot. No live engine, account grants, storage or publication imports.
const copy=structuredClone,check=(v,m)=>{if(!v)throw Error(m)};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const text=v=>typeof v==='string'&&v===v.trim()&&v.length>0&&v.length<=2000&&!/[\u0000-\u001f]/.test(v);
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const capabilities={SUBMIT:'COMMITTEE_PROPOSE',VERIFY:'MENTOR_VERIFY',REVIEW:'STUDENT_AFFAIRS_REVIEW',APPROVE:'COMMITTEE_APPROVE'};
function source(s){
 check(plain(s)&&id(s.clubId)&&id(s.cycle)&&Number.isSafeInteger(s.rosterVersion)&&s.rosterVersion>0&&id(s.mentorPersonId)&&day(s.start)&&day(s.end)&&s.start<=s.end&&Array.isArray(s.members)&&s.members.length>0&&s.members.length<=50,'INVALID_COMMITTEE_SOURCE');
 const seen=new Set();
 const members=s.members.map(m=>{check(plain(m)&&id(m.personId)&&id(m.positionId)&&text(m.responsibility)&&m.membershipState==='ACTIVE','ACTIVE_NOMINEE_REQUIRED');const key=m.personId+':'+m.positionId;check(!seen.has(key),'DUPLICATE_APPOINTMENT');seen.add(key);return {personId:m.personId,positionId:m.positionId,responsibility:m.responsibility,membershipState:'ACTIVE'}}).sort((a,b)=>(a.positionId+':'+a.personId).localeCompare(b.positionId+':'+b.personId));
 return {clubId:s.clubId,cycle:s.cycle,rosterVersion:s.rosterVersion,mentorPersonId:s.mentorPersonId,start:s.start,end:s.end,members};
}
function grant(grants,person,cap,s,now){
 check(Array.isArray(grants)&&id(person)&&stamp(now),'TRUSTED_SCOPE_REQUIRED');
 const found=grants.filter(g=>g.personId===person&&g.capability===cap&&g.clubId===s.clubId&&g.cycle===s.cycle&&!g.revokedAt&&stamp(g.validFrom)&&stamp(g.validUntil)&&Date.parse(g.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(g.validUntil));
 check(found.length===1&&id(found[0].id)&&Number.isSafeInteger(found[0].version)&&found[0].version>0,'EXPLICIT_CURRENT_GRANT_REQUIRED');
 return {id:found[0].id,version:found[0].version};
}
function record(r){check(r?.pilot===true&&Number.isSafeInteger(r.revision)&&r.revision>0&&Array.isArray(r.versions)&&r.versions.length>0&&Array.isArray(r.history)&&r.history.length>0,'PILOT_RECORD_REQUIRED')}
export function createCommitteePilot({id:recordId,source:input,actorPersonId,now,grants=[]}){
 const s=source(input);check(id(recordId),'INVALID_RECORD_ID');grant(grants,actorPersonId,'COMMITTEE_PROPOSE',s,now);
 return {id:recordId,pilot:true,revision:1,state:'DRAFT',versions:[{version:1,source:s,proposerPersonId:actorPersonId,decisions:[]}],history:[{event:'CREATED',by:actorPersonId,at:now,revision:1,version:1}]};
}
export function transitionCommitteePilot(input,{action,expectedRevision,source:currentSource,actorPersonId,now,reason,grants=[]}){
 record(input);check(expectedRevision===input.revision,'STALE_COMMITTEE_REVISION');check(stamp(now)&&Date.parse(now)>=Date.parse(input.history.at(-1).at),'INVALID_EVENT_TIME');const s=source(currentSource),current=input.versions.at(-1);
 check(canonical(s)===canonical(current.source),'COMMITTEE_SOURCE_CHANGED');check(text(reason),'DECISION_REASON_REQUIRED');
 const r=copy(input),v=r.versions.at(-1);
 const required={SUBMITTED:'VERIFY',MENTOR_VERIFIED:'REVIEW',SA_REVIEWED:'APPROVE'};
 const stage=action==='RETURN'?required[r.state]:action;
 check(capabilities[stage],'UNKNOWN_OR_INVALID_STAGE');
 const g=grant(grants,actorPersonId,capabilities[stage],s,now);
 if(stage==='SUBMIT')check(['DRAFT'].includes(r.state)&&actorPersonId===v.proposerPersonId,'PROPOSER_DRAFT_REQUIRED');
 else{
  check(required[r.state]===stage,'PREVIOUS_REVIEW_REQUIRED');
  check(actorPersonId!==v.proposerPersonId&&!s.members.some(m=>m.personId===actorPersonId)&&!v.decisions.some(d=>d.action!=='SUBMIT'&&d.by===actorPersonId),'INDEPENDENT_REVIEW_REQUIRED');
  if(stage==='VERIFY')check(actorPersonId===s.mentorPersonId,'ASSIGNED_MENTOR_REQUIRED');
 }
 // Earlier accepted decisions must still have exactly the same active scoped grant.
 for(const d of v.decisions){const live=grant(grants,d.by,capabilities[d.stage],s,now);check(canonical(live)===canonical(d.grant),'EARLIER_AUTHORITY_CHANGED')}
 v.decisions.push({action,stage,by:actorPersonId,at:now,reason,grant:g});
 r.state=action==='RETURN'?'RETURNED':({SUBMIT:'SUBMITTED',VERIFY:'MENTOR_VERIFIED',REVIEW:'SA_REVIEWED',APPROVE:'APPROVED'})[action];
 r.revision++;r.history.push({event:action,by:actorPersonId,at:now,revision:r.revision,version:v.version});return r;
}
export function reviseCommitteePilot(input,{expectedRevision,source:nextSource,actorPersonId,now,reason,grants=[]}){
 record(input);check(expectedRevision===input.revision,'STALE_COMMITTEE_REVISION');check(['RETURNED','APPROVED'].includes(input.state),'RETURN_OR_APPROVAL_REQUIRED');check(stamp(now)&&Date.parse(now)>=Date.parse(input.history.at(-1).at)&&text(reason),'REVISION_REASON_TIME_REQUIRED');
 const s=source(nextSource),previous=input.versions.at(-1);check(s.clubId===previous.source.clubId&&s.cycle===previous.source.cycle,'SAME_CLUB_CYCLE_REQUIRED');check(actorPersonId===previous.proposerPersonId,'PROPOSER_REQUIRED');grant(grants,actorPersonId,'COMMITTEE_PROPOSE',s,now);
 const r=copy(input);r.versions.push({version:previous.version+1,source:s,proposerPersonId:actorPersonId,decisions:[]});r.state='DRAFT';r.revision++;r.history.push({event:'REVISED',by:actorPersonId,at:now,reason,revision:r.revision,version:r.versions.at(-1).version});return r;
}
