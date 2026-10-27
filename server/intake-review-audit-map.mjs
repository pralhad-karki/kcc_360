// Maps only trusted guarded-save snapshots; never request-supplied records or reasons.
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const commands=new Set(['reviewActivityIntake','assignIntakeMentor','respondIntakeMentor','withdrawActivityIntake','withdrawIntakeMentor','requestIntakeSupport','respondIntakeSupport','withdrawIntakeSupport']);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const omit=(v,keys)=>Object.fromEntries(Object.entries(v).filter(([k])=>!keys.includes(k)));
const reason=v=>typeof v==='string'&&v===v.trim()&&v.length>0&&v.length<=2000;
const time=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const fail=()=>{throw Error('INVALID_INTAKE_REVIEW_AUDIT_TRANSITION')};
export function mapIntakeReviewAuditMetadata({command,actor,before,after,commit}){
 if(!commands.has(command))return {status:'UNMAPPED',recordValue:null};
 if(!Array.isArray(before?.activityIntakes)||!Array.isArray(after?.activityIntakes)||!equal(before.projects,after.projects))fail();
 const oldRows=before.activityIntakes,rows=after.activityIntakes;
 if(oldRows.length!==rows.length||new Set(oldRows.map(r=>r.id)).size!==oldRows.length||oldRows.some((r,i)=>r.id!==rows[i].id))fail();
 const changed=oldRows.map((r,i)=>equal(r,rows[i])?-1:i).filter(i=>i>=0);
 if(!changed.length)return {status:'NO_CHANGE',recordValue:null};
 if(changed.length!==1)fail();
 const i=changed[0],old=oldRows[i],r=rows[i];let record;
 if(command==='withdrawActivityIntake'){
  const previous=old.decisions??[],next=r.decisions??[],d=next.at(-1);
  if(!['s1','s2'].includes(actor)||actor!==r.student||!['DRAFT','RETURNED','SUBMITTED'].includes(old.state)||r.state!=='WITHDRAWN'||!Number.isSafeInteger(r.revision)||r.revision<1||next.length!==previous.length+1||!equal(previous,next.slice(0,-1))||!d||d.decision!=='WITHDRAWN'||d.by!==actor||d.version!==(old.submissions?.at(-1)?.version??null)||!reason(d.reason)||!time(d.at)||!equal(omit(old,['decisions','state','history']),omit(r,['decisions','state','history'])))fail();
  record={type:'INTAKE',id:r.id,versionBefore:r.revision,versionAfter:r.revision,stateBefore:old.state,stateAfter:'WITHDRAWN'};
 }else if(command==='reviewActivityIntake'){
  const previous=old.decisions??[],next=r.decisions??[],d=next.at(-1),v=old.submissions?.at(-1)?.version;
  if(actor!=='c1'||actor===r.student||old.state!=='SUBMITTED'||next.length!==previous.length+1||!equal(previous,next.slice(0,-1))||!d||d.by!==actor||d.version!==v||!Number.isSafeInteger(v)||v<1||!['ROUTING_CONFIRMED','RETURNED'].includes(d.decision)||r.state!==d.decision||!reason(d.reason)||!time(d.at)||!equal(omit(old,['decisions','state','routing','history']),omit(r,['decisions','state','routing','history'])))fail();
  if(d.decision==='RETURNED'){if(!equal(old.routing,r.routing)||d.routing!==undefined)fail()}
  else if(!d.routing||!equal(r.routing,{...d.routing,submissionVersion:v,by:actor,at:d.at,reason:d.reason}))fail();
  record={type:'INTAKE',id:r.id,versionBefore:v,versionAfter:v,stateBefore:old.state,stateAfter:r.state};
 }else if(['requestIntakeSupport','respondIntakeSupport','withdrawIntakeSupport'].includes(command)){
  const previous=old.supportRequests??[],next=r.supportRequests??[];
  if(!equal(omit(old,['supportRequests','history']),omit(r,['supportRequests','history'])))fail();
  let q,prior;
  if(command==='requestIntakeSupport'){
   q=next.at(-1);prior=q&&previous.findLast(x=>x.target===q.target);
   if(actor!=='c1'||next.length!==previous.length+1||!equal(previous,next.slice(0,-1))||!q||q.by!==actor||q.state!=='REQUESTED'||!q.reviewer||[actor,r.student].includes(q.reviewer)||q.version!==(prior?.version??0)+1||['REQUESTED','ACCEPTED'].includes(prior?.state)||previous.some(x=>x.id===q.id)||!['responsibility','deliverable','reason'].every(k=>reason(q[k]))||!time(q.at)||typeof q.basis!=='string'||!q.basis)fail();
   record={type:'INTAKE_SUPPORT_REQUEST',id:q.id,versionBefore:null,versionAfter:q.version,stateBefore:null,stateAfter:'REQUESTED'};
  }else{
   if(next.length!==previous.length)fail();
   const changes=previous.map((x,j)=>equal(x,next[j])?-1:j).filter(j=>j>=0);if(changes.length!==1)fail();
   const j=changes[0];prior=previous[j];q=next[j];
   if(!equal(omit(prior,['state','response','withdrawal']),omit(q,['state','response','withdrawal']))||previous.findLast(x=>x.target===q.target)?.id!==q.id)fail();
   if(command==='respondIntakeSupport'){
    const response=q.response;
    if(prior.state!=='REQUESTED'||prior.response!==undefined||prior.reviewer!==actor||[prior.by,r.student].includes(actor)||!equal(prior.withdrawal,q.withdrawal)||!response||response.by!==actor||!['ACCEPTED','DECLINED'].includes(response.decision)||q.state!==response.decision||response.authorityConfirmed!==(q.state==='ACCEPTED')||!reason(response.reason)||!time(response.at))fail();
   }else{
    const w=q.withdrawal;
    if(actor!=='c1'||old.projectId||!['REQUESTED','ACCEPTED','DECLINED'].includes(prior.state)||prior.withdrawal!==undefined||!equal(prior.response,q.response)||q.state!=='WITHDRAWN'||!w||w.by!==actor||w.priorState!==prior.state||!reason(w.reason)||!time(w.at))fail();
   }
   record={type:'INTAKE_SUPPORT_REQUEST',id:q.id,versionBefore:q.version,versionAfter:q.version,stateBefore:prior.state,stateAfter:q.state};
  }
 }else{
  const previous=old.mentorAssignments??[],next=r.mentorAssignments??[],a=next.at(-1);
  if(!equal(omit(old,['mentorAssignments','history']),omit(r,['mentorAssignments','history']))||!a)fail();
  if(command==='assignIntakeMentor'){
   const prior=previous.at(-1);
   if(actor!=='c1'||actor===r.student||next.length!==previous.length+1||!equal(previous,next.slice(0,-1))||a.by!==actor||a.state!=='REQUESTED'||!['m1','m2'].includes(a.mentor)||[actor,r.student].includes(a.mentor)||a.version!==(prior?.version??0)+1||previous.some(x=>x.id===a.id)||!a.id||!time(a.at)||!['fit','capacity','reason'].every(k=>reason(a[k]))||typeof a.basis!=='string'||!a.basis||!equal(a.sourceSnapshot,{submission:old.submissions?.at(-1),routing:old.routing}))fail();
   // Each new assignment is a distinct record; its version is the intake assignment sequence.
   record={type:'INTAKE_MENTOR_ASSIGNMENT',id:a.id,versionBefore:null,versionAfter:a.version,stateBefore:null,stateAfter:'REQUESTED'};
  }else if(command==='withdrawIntakeMentor'){
   const prior=previous.at(-1),w=a.withdrawal;
   if(actor!=='c1'||old.projectId||!prior||next.length!==previous.length||!equal(previous.slice(0,-1),next.slice(0,-1))||!equal(omit(prior,['withdrawal','state']),omit(a,['withdrawal','state']))||!['REQUESTED','ACCEPTED','REASSIGNMENT_REQUESTED'].includes(prior.state)||prior.withdrawal!==undefined||a.state!=='WITHDRAWN'||!w||w.by!==actor||w.priorState!==prior.state||!reason(w.reason)||!time(w.at))fail();
   record={type:'INTAKE_MENTOR_ASSIGNMENT',id:a.id,versionBefore:a.version,versionAfter:a.version,stateBefore:prior.state,stateAfter:'WITHDRAWN'};
  }else{
   const prior=previous.at(-1),response=a.response;
   if(!prior||next.length!==previous.length||!equal(previous.slice(0,-1),next.slice(0,-1))||!equal(omit(prior,['response','state']),omit(a,['response','state']))||prior.response!==undefined||prior.state!=='REQUESTED'||!['m1','m2'].includes(actor)||prior.mentor!==actor||[prior.by,r.student].includes(actor)||!response||response.by!==actor||!['ACCEPTED','REASSIGNMENT_REQUESTED'].includes(response.decision)||a.state!==response.decision||response.noUnresolvedConflict!==(a.state==='ACCEPTED')||!reason(response.reason)||!time(response.at))fail();
   record={type:'INTAKE_MENTOR_ASSIGNMENT',id:a.id,versionBefore:a.version,versionAfter:a.version,stateBefore:'REQUESTED',stateAfter:a.state};
  }
 }
 return {status:'MAPPED',recordValue:formatAuditRecordMetadata({correlationId:commit.id,workspaceId:commit.workspaceId,actorId:actor,action:command,occurredAt:commit.time,institutionId:null,workspaceRevisionBefore:commit.revisionBefore,workspaceRevisionAfter:commit.revisionAfter,mapping:'MAPPED',record,reason:{status:'REFERENCED',reference:{recordType:record.type,recordId:record.id,recordVersion:record.versionAfter,field:command.startsWith('withdraw')?'withdrawalReason':'reason'}}})};
}
