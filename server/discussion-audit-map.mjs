// Bounded discussion-state mapper used by the atomic save dispatcher. Not an authorization boundary.
// Input snapshots and commit context must come from the authenticated guarded engine save.
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const exact=(v,keys)=>plain(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const time=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const fail=()=>{throw Error('INVALID_DISCUSSION_AUDIT_TRANSITION')};
const events=p=>p.discussionEvents??[];
const unchangedFields=p=>Object.fromEntries(Object.entries(p).filter(([key])=>!['discussionEvents','history'].includes(key)));
function roots(p){
 if(!Array.isArray(p.messages))fail();
 const result=new Map();
 p.messages.forEach((m,i)=>{if(!plain(m))fail();if(m.parentRef)return;const ref=m.id||`${p.id}:legacy-message:${i}`;if(typeof ref!=='string'||!ref.startsWith(p.id+':')||result.has(ref))fail();result.set(ref,m)});
 return result;
}
function states(p){
 const r=roots(p),s=new Map();if(!Array.isArray(events(p)))fail();
 for(const e of events(p)){
  if(!exact(e,['threadRef','version','state','by','time','reason'])||!r.has(e.threadRef)||!time(e.time)||typeof e.by!=='string'||!e.by||typeof e.reason!=='string'||!e.reason.length||e.reason.length>1000||e.reason!==e.reason.trim()||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(e.reason))fail();
  const prev=s.get(e.threadRef)||{version:0,state:'OPEN'};
  if(!Number.isSafeInteger(e.version)||e.version!==prev.version+1||!['OPEN','RESOLVED'].includes(e.state)||e.state===prev.state)fail();
  s.set(e.threadRef,{version:e.version,state:e.state});
 }
 return {roots:r,states:s};
}
export function mapDiscussionAuditMetadata(input){
 if(!exact(input,['command','actor','before','after','commit']))throw Error('INVALID_AUDIT_MAPPING_CONTEXT');
 if(input.command!=='setDiscussionState')return {status:'UNMAPPED',recordValue:null};
 if(!plain(input.before)||!plain(input.after)||!Array.isArray(input.before.projects)||!Array.isArray(input.after.projects))fail();
 const before=input.before.projects,after=input.after.projects;
 if(before.length!==after.length||new Set(before.map(p=>p.id)).size!==before.length||before.some((p,i)=>!plain(p)||!plain(after[i])||p.id!==after[i].id))fail();
 const changed=before.map((p,i)=>equal(events(p),events(after[i]))?-1:i).filter(i=>i>=0);
 if(!changed.length)return {status:'NO_CHANGE',recordValue:null};
 if(changed.length!==1)fail();
 const i=changed[0],p=before[i],q=after[i];
 if(before.some((p,j)=>j!==i&&!equal(p,after[j]))||!equal(unchangedFields(p),unchangedFields(q)))fail();
 const old=events(p),next=events(q);if(!Array.isArray(old)||!Array.isArray(next)||next.length!==old.length+1||!equal(old,next.slice(0,-1)))fail();
 const prior=states(p),current=states(q),e=next.at(-1),root=prior.roots.get(e.threadRef),previous=prior.states.get(e.threadRef)||{version:0,state:'OPEN'};
 if(e.by!==input.actor||![root.by,p.mentor].includes(input.actor)||!current.states.has(e.threadRef))fail();
 if(!exact(input.commit,['id','workspaceId','revisionBefore','revisionAfter','time']))throw Error('INVALID_AUDIT_COMMIT_CONTEXT');
 const c=input.commit;
 return {status:'MAPPED',recordValue:formatAuditRecordMetadata({correlationId:c.id,workspaceId:c.workspaceId,actorId:input.actor,action:input.command,occurredAt:c.time,institutionId:null,workspaceRevisionBefore:c.revisionBefore,workspaceRevisionAfter:c.revisionAfter,mapping:'MAPPED',record:{type:'DISCUSSION_THREAD',id:e.threadRef,versionBefore:previous.version,versionAfter:e.version,stateBefore:previous.state,stateAfter:e.state},reason:{status:'REFERENCED',reference:{recordType:'DISCUSSION_THREAD',recordId:e.threadRef,recordVersion:e.version,field:'reason'}}})};
}
