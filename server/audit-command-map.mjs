// Isolated first command mapper. Never accepts request-supplied audit snapshots.
// Caller must authenticate, execute the guarded command and supply trusted snapshots/commit metadata.
import {mapDiscussionAuditMetadata} from './discussion-audit-map.mjs';
import {mapIntakeHandoffAuditMetadata} from './intake-handoff-audit-map.mjs';
import {mapIntakeReviewAuditMetadata} from './intake-review-audit-map.mjs';
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const fields=['summary','education','training','skills','experience'];
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const exact=(v,keys)=>plain(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const timestamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const validRecord=r=>exact(r,['version','classification','updatedAt','content'])&&Number.isSafeInteger(r.version)&&r.version>=1&&r.classification==='STUDENT_DECLARED'&&timestamp(r.updatedAt)&&exact(r.content,fields)&&fields.every(k=>typeof r.content[k]==='string'&&r.content[k].length<=2000&&r.content[k]===r.content[k].trim()&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(r.content[k]));
function fail(){throw Error('INVALID_CV_AUDIT_TRANSITION')}
export function mapAuditCommandMetadata(input){
 if(!exact(input,['command','actor','before','after','commit']))throw Error('INVALID_AUDIT_MAPPING_CONTEXT');
 if(input.command==='setDiscussionState')return mapDiscussionAuditMetadata(input);
 if(input.command==='handoffIndividualIntake')return mapIntakeHandoffAuditMetadata(input);
 if(['reviewActivityIntake','assignIntakeMentor','respondIntakeMentor','withdrawActivityIntake','withdrawIntakeMentor','requestIntakeSupport','respondIntakeSupport','withdrawIntakeSupport'].includes(input.command))return mapIntakeReviewAuditMetadata(input);
 if(input.command!=='saveCVDeclarations')return {status:'UNMAPPED',recordValue:null};
 if(!plain(input.before)||!plain(input.after))throw Error('INVALID_AUDIT_MAPPING_CONTEXT');
 const oldStore=input.before.cvDeclarations??{},newStore=input.after.cvDeclarations??{};
 if(!plain(oldStore)||!plain(newStore))fail();
 const peers=store=>Object.fromEntries(Object.entries(store).filter(([id])=>id!==input.actor));
 if(!equal(peers(oldStore),peers(newStore)))fail();
 const previous=oldStore[input.actor],next=newStore[input.actor];
 if(equal(previous,next))return {status:'NO_CHANGE',recordValue:null};
 if(!['s1','s2'].includes(input.actor)||!validRecord(next)||previous!==undefined&&!validRecord(previous)||next.version!==(previous?.version||0)+1||equal(previous?.content,next.content))fail();
 if(!exact(input.commit,['id','workspaceId','revisionBefore','revisionAfter','time']))throw Error('INVALID_AUDIT_COMMIT_CONTEXT');
 const recordValue=formatAuditRecordMetadata({correlationId:input.commit.id,workspaceId:input.commit.workspaceId,actorId:input.actor,action:input.command,occurredAt:input.commit.time,institutionId:null,workspaceRevisionBefore:input.commit.revisionBefore,workspaceRevisionAfter:input.commit.revisionAfter,mapping:'MAPPED',record:{type:'CV_DECLARATION',id:input.actor,versionBefore:previous?.version??null,versionAfter:next.version,stateBefore:null,stateAfter:null},reason:{status:'NOT_REQUIRED',reference:null}});
 return {status:'MAPPED',recordValue};
}
