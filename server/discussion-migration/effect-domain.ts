import {DiscussionValidationError,canonicalJson,jsonObject,extractDiscussion} from './domain';
import {changedFields,discussionProject} from './command-domain';
import type {Json,JsonObject} from './domain';
import type {DiscussionCommand} from './command-domain';
const check=(ok:unknown)=>{if(!ok)throw new DiscussionValidationError('Discussion effect is outside the bounded rehearsal contract.');};
const same=(a:unknown,b:unknown)=>canonicalJson(a)===canonicalJson(b);
const utc=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const array=(v:unknown):JsonObject[]=>{check(Array.isArray(v));return (v as unknown[]).map(jsonObject)};
function appended(before:JsonObject[],after:JsonObject[],front=false){check(after.length===before.length+1);check(same(before,front?after.slice(1):after.slice(0,-1)));return front?after[0]:after.at(-1)!;}
function notificationIdentity(n:JsonObject){
 check(['id','base','recipient','group','sourceId','route','phase','title'].every(k=>typeof n[k]==='string'&&n[k]!==''));
 const base=JSON.parse(n.base as string);check(Array.isArray(base)&&base.length===5&&base[0]===n.group&&base[1]===n.sourceId&&base[3]===n.sourceVersion);
 const id='NF-'+JSON.stringify([n.base,n.phase,n.recipient,n.due]).split('').map(c=>c.charCodeAt(0).toString(16).padStart(4,'0')).join('');check(n.id===id);
}
function notifications(before:unknown,after:unknown){
 const old=array(before??[]),next=array(after);check(next.length>=old.length&&new Set(next.map(n=>n.id)).size===next.length);
 for(const [index,n] of next.entries()){
  if(index>=old.length){notificationIdentity(n);check(n.state==='ACTIVE'&&n.readAt===null&&n.ackAt===null&&utc(n.deliveredAt)&&same(n.history,[{state:'DELIVERED_IN_APP',time:n.deliveredAt}]));
   check(Object.keys(n).every(k=>['id','base','recipient','title','group','sourceId','route','due','phase','mandatory','policyVersion','sourceVersion','taskId','taskAssignee','informational','detail','state','deliveredAt','readAt','ackAt','history'].includes(k)));continue;}
  const p=old[index];check(p.id===n.id);
  if(same(p,n))continue;
  notificationIdentity(n);
  check(changedFields(p,n).every(k=>['title','policyVersion','mandatory','detail','informational','taskId','taskAssignee','state','readAt','ackAt','history','resolvedAt'].includes(k)));
  const h=array(p.history),nh=array(n.history);
  if(p.state==='ACTIVE'&&n.state==='ACTIVE')check(same(p.readAt,n.readAt)&&same(p.ackAt,n.ackAt)&&same(h,nh)&&!changedFields(p,n).includes('resolvedAt'));
  else if(p.state==='ACTIVE'&&['RESOLVED','SUPERSEDED'].includes(String(n.state))){check(changedFields(p,n).every(k=>['state','resolvedAt','history'].includes(k)));const e=appended(h,nh);check(same(p.readAt,n.readAt)&&same(p.ackAt,n.ackAt)&&utc(n.resolvedAt)&&same(e,{state:n.state,time:n.resolvedAt}));}
  else if(['RESOLVED','SUPERSEDED'].includes(String(p.state))&&n.state==='ACTIVE'){const e=appended(h,nh);check(n.readAt===null&&n.ackAt===null&&!Object.hasOwn(n,'resolvedAt')&&utc(e.time)&&same(e,{state:'REOPENED',time:e.time,previousReadAt:p.readAt,previousAckAt:p.ackAt}));}
  else check(false);
 }
}
export interface FieldEffect {field:string;beforePresent:boolean;before:Json;afterPresent:boolean;after:Json}
export interface DiscussionEffects {schema:'KCC360_DISCUSSION_EFFECTS_V1';projectId:string;project:FieldEffect[];workspace:FieldEffect[]}
const fields=(before:JsonObject,after:JsonObject):FieldEffect[]=>changedFields(before,after).map(field=>({field,beforePresent:Object.hasOwn(before,field),before:before[field]??null,afterPresent:Object.hasOwn(after,field),after:after[field]??null}));

// This bounds structural effects and existing in-app lifecycle mutations. The
// trusted legacy adapter still owns candidate generation and access policy.
export function constrainDiscussionEffects(input:unknown,output:unknown,projectId:string,actor:string,command:DiscussionCommand):DiscussionEffects {
 const before=jsonObject(input),after=jsonObject(output),p=discussionProject(before,projectId),q=discussionProject(after,projectId);
 check(changedFields(before,after).every(k=>['projects','audit','notificationInbox'].includes(k)));
 const old=array(before.projects),next=array(after.projects);check(old.length===next.length);
 for(let i=0;i<old.length;i++){check(old[i].id===next[i].id);if(old[i].id!==projectId)check(same(old[i],next[i]));}
 check(changedFields(p,q).every(k=>['messages','discussionEvents','history'].includes(k)));
 const previous=extractDiscussion(p),current=extractDiscussion(q),changed=!same(previous,current);
 if(changed){
  let event:JsonObject;
  if(command.kind==='SET_STATE'){
   check(same(previous.messages,current.messages));event=appended(previous.events,current.events);
   check(Object.keys(event).sort().join(',')==='by,reason,state,threadRef,time,version'&&event.by===actor&&event.reason===command.reason.trim()&&event.state===command.state&&event.threadRef===command.threadRef&&event.version===command.expectedVersion+1&&previous.messages.length===command.expectedCount);
  }else{
   check(same(previous.events,current.events)&&previous.eventsPresent===current.eventsPresent);event=appended(previous.messages,current.messages);
   let n=previous.messages.length+1,id=projectId+':message:'+n;while(previous.messages.some(m=>m.id===id))id=projectId+':message:'+(++n);
   check(event.id===id&&event.by===actor&&event.text===command.text.trim()&&Object.keys(event).sort().join(',')===(command.kind==='POST'?'by,id,text,time':'by,id,parentRef,text,time'));
   if(command.kind==='REPLY')check(event.parentRef===command.threadRef&&previous.messages.length===command.expectedCount);
  }
  check(utc(event.time));
  const log=appended(array(p.history),array(q.history),true),audit=appended(array(before.audit),array(after.audit),true);
  const action=command.kind==='POST'?'Project message posted':command.kind==='REPLY'?'Project discussion reply posted':command.state==='OPEN'?'Project discussion reopened':'Project discussion resolved';
  check(same(log,audit)&&Object.keys(log).sort().join(',')==='action,actor,project,time'&&log.action===action&&log.project===projectId&&utc(log.time)&&Date.parse(log.time as string)>=Date.parse(event.time as string)&&typeof log.actor==='string'&&log.actor.length>0);
 }else check(same(p.history,q.history)&&same(before.audit,after.audit));
 notifications(before.notificationInbox,after.notificationInbox);
 return {schema:'KCC360_DISCUSSION_EFFECTS_V1',projectId,project:fields(p,q),workspace:fields(before,after).filter(f=>f.field!=='projects')};
}
export function applyDiscussionEffects(input:unknown,effects:DiscussionEffects):JsonObject {
 check(effects?.schema==='KCC360_DISCUSSION_EFFECTS_V1');
 const before=jsonObject(input),project=discussionProject(before,effects.projectId);
 for(const [list,allowed] of [[effects.project,['messages','discussionEvents','history']],[effects.workspace,['audit','notificationInbox']]] as const){check(Array.isArray(list)&&new Set(list.map(f=>f.field)).size===list.length);for(const f of list)check((allowed as readonly string[]).includes(f.field)&&Object.keys(f).sort().join(',')==='after,afterPresent,before,beforePresent,field'&&typeof f.beforePresent==='boolean'&&typeof f.afterPresent==='boolean');}
 const apply=(target:JsonObject,list:FieldEffect[])=>{for(const f of list){check(Object.hasOwn(target,f.field)===f.beforePresent&&(!f.beforePresent||same(target[f.field],f.before)));if(f.afterPresent)target[f.field]=f.after;else delete target[f.field];}};
 apply(project,effects.project);before.projects=(before.projects as JsonObject[]).map(p=>p.id===effects.projectId?project:p);apply(before,effects.workspace);return jsonObject(before);
}
