// Current task queues reuse the existing workflow gates. This adds no decision authority.
function taskQueueDescriptor(n){
 let key=n?.key;
 if(n?.base){try{const b=JSON.parse(n.base);if(Array.isArray(b)&&typeof b[2]==='string')key=b[2]}catch{return String(n.base).includes('task-review:')||String(n.base).includes('"task:')?{invalid:true}:null}}
 if(typeof key!=='string')return null;
 const type=key.startsWith('task-review:')?'REVIEW':key.startsWith('task:')?'ASSIGNMENT':null;
 return type?{type,key,taskId:key.slice(type==='REVIEW'?'task-review:'.length:'task:'.length)}:null;
}
function taskQueueCurrent(p,t,type){
 if(!p||!t||!activityControlActive(p)||!clubExecutionAllowed(p)||!activeParticipant(p,t.assignee))return null;
 if(type==='REVIEW'){
  const sub=taskLatestSubmission(t);
  if(!t.mappingVersion||!['STARTED','IN_PROGRESS'].includes(p.state)||t.workState!=='SUBMITTED'||p.mentor===t.assignee||!sub||!Number.isSafeInteger(sub.version)||sub.version<1||sub.student!==t.assignee||sub.mappingVersion!==t.mappingVersion||!p.evidence[sub.evidenceIndex])return null;
  return {recipient:p.mentor,version:sub.version,chain:['c1','d1','a1']};
 }
 if(!['APPROVED','STARTED','IN_PROGRESS'].includes(p.state)||t.workState==='SUBMITTED'||t.done&&(!t.mappingVersion||taskAssessmentCurrent(p,t)))return null;
 const correction=taskReturnedReviewCurrent(t),assignment=(t.assignmentHistory||[]).length+1;
 return {recipient:t.assignee,version:correction?'RETURN:'+assignment+':'+t.mappingVersion+':'+correction.version+':'+correction.submissionVersion:assignment,chain:t.assignee===p.mentor?['c1','d1','a1']:[p.mentor,'c1','a1']};
}
function taskQueueCurrentSource(n,descriptor){
 if(descriptor.invalid||n.group!=='PROJECT'||n.route!=='Projects')return null;
 const p=db.projects.find(p=>p.id===n.sourceId),matches=p?.tasks.filter(t=>t.id===descriptor.taskId)||[],t=matches.length===1?matches[0]:null,current=taskQueueCurrent(p,t,descriptor.type);
 if(!current)return null;
 const due=t.due||p.due,deadline=validWorkDate(due)?due:null;
 if(n.due!==deadline)return null;
 if(n.base){const expected=JSON.stringify(['PROJECT',p.id,descriptor.key,current.version,current.recipient]);if(n.base!==expected||n.sourceVersion!==current.version||n.id!==notificationId([expected,n.phase,n.recipient,n.due]))return null}
 else if(n.recipient!==current.recipient||n.version!==current.version)return null;
 return current;
}
const taskQueuePreviousActions=notificationActions;notificationActions=function(today=localDay()){
 return taskQueuePreviousActions(today).filter(a=>{const d=taskQueueDescriptor(a);return !d||!!taskQueueCurrentSource(a,d)});
};
const taskQueuePreviousAccess=notificationAccess;notificationAccess=function(n,actor=uid){
 const d=taskQueueDescriptor(n);if(!d)return taskQueuePreviousAccess(n,actor);
 const current=taskQueueCurrentSource(n,d);if(!current||n.recipient!==actor)return false;
 const phase=n.phase||'ACTION',recipient=['ACTION','REMINDER','OVERDUE'].includes(phase)?current.recipient:current.chain[{SUPERVISOR_ESCALATION:0,COORDINATOR_ESCALATION:1,ADMINISTRATIVE_ESCALATION:2}[phase]];
 return recipient===actor&&taskQueuePreviousAccess(n,actor);
};
