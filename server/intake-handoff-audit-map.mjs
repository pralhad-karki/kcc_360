// Content-free provenance for a guarded individual draft creation, using trusted save snapshots.
import {formatAuditRecordMetadata} from './audit-record-format.mjs';
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=()=>{throw Error('INVALID_INTAKE_HANDOFF_AUDIT_TRANSITION')};
export function mapIntakeHandoffAuditMetadata({command,actor,before,after,commit}){
 if(command!=='handoffIndividualIntake')return {status:'UNMAPPED',recordValue:null};
 if(!Array.isArray(before?.projects)||!Array.isArray(after?.projects)||!Array.isArray(before.activityIntakes)||!Array.isArray(after.activityIntakes))fail();
 if(equal(before.projects,after.projects)&&equal(before.activityIntakes,after.activityIntakes))return {status:'NO_CHANGE',recordValue:null};
 if(actor!=='c1'||after.projects.length!==before.projects.length+1||!equal(before.projects,after.projects.slice(0,-1))||before.activityIntakes.length!==after.activityIntakes.length)fail();
 const p=after.projects.at(-1),s=p.intakeProvenance;
 const changed=before.activityIntakes.map((r,i)=>equal(r,after.activityIntakes[i])?-1:i).filter(i=>i>=0);
 if(changed.length!==1||!s)fail();
 const old=before.activityIntakes[changed[0]],r=after.activityIntakes[changed[0]],h=r.individualHandoff;
 if(before.projects.some(q=>q.id===p.id)||old.projectId||old.individualHandoff||!h||r.id!==old.id||s.intakeId!==r.id||h.projectId!==p.id||r.projectId!==p.id||p.state!=='CREATED'||p.createdBy!==actor||s.by!==actor||h.by!==actor||s.at!==h.at||s.intakeRevision!==r.revision||h.revision!==r.revision||s.submissionVersion!==h.submissionVersion||p.owner!==r.student||!equal(p.members,[r.student])||typeof h.reason!=='string'||!h.reason.trim()||h.reason.length>2000)fail();
 const stable=v=>Object.fromEntries(Object.entries(v).filter(([k])=>!['projectId','individualHandoff','history'].includes(k)));
 if(!equal(stable(old),stable(r)))fail();
 return {status:'MAPPED',recordValue:formatAuditRecordMetadata({correlationId:commit.id,workspaceId:commit.workspaceId,actorId:actor,action:command,occurredAt:commit.time,institutionId:null,workspaceRevisionBefore:commit.revisionBefore,workspaceRevisionAfter:commit.revisionAfter,mapping:'MAPPED',record:{type:'ACTIVITY',id:p.id,versionBefore:null,versionAfter:null,stateBefore:null,stateAfter:'CREATED'},reason:{status:'REFERENCED',reference:{recordType:'INTAKE',recordId:r.id,recordVersion:r.revision,field:'reason'}}})};
}
