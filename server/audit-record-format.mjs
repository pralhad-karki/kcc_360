// Isolated metadata codec, not an authorization boundary or live audit writer.
// Trusted callers must resolve record/state/reason references server-side.
export const AUDIT_RECORD_FORMAT='KCC360_AUDIT_METADATA';
export const AUDIT_RECORD_VERSION=1;
const types=new Set(['ACTIVITY','ACTIVITY_TASK','ACTIVITY_EVIDENCE','ACADEMIC_PLAN','CLUB','CLUB_PLAN','INTAKE','INTAKE_MENTOR_ASSIGNMENT','INTAKE_SUPPORT_REQUEST','INTAKE_CONSULTATION_SCOPE','INTAKE_FINAL_REVIEW','INTAKE_TEAM_HANDOFF','INTAKE_TEAM_START','CV_DECLARATION','DISCUSSION_THREAD','NOTICE','DOCUMENT','CERTIFICATE','WORKSPACE']);
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const exact=(v,keys)=>plain(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const id=v=>typeof v==='string'&&v.length<=220&&/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(v);
const version=v=>v===null||Number.isSafeInteger(v)&&v>=0;
const state=v=>v===null||typeof v==='string'&&/^[A-Z][A-Z0-9_]{0,63}$/.test(v);
const time=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const keys=['correlationId','workspaceId','actorId','action','occurredAt','institutionId','workspaceRevisionBefore','workspaceRevisionAfter','mapping','record','reason'];
function validMetadata(m){
 if(!exact(m,keys)||!['correlationId','workspaceId','actorId'].every(k=>id(m[k]))||typeof m.action!=='string'||!/^[A-Za-z][A-Za-z0-9._-]{0,119}$/.test(m.action)||!time(m.occurredAt)||!(m.institutionId===null||id(m.institutionId))||!Number.isSafeInteger(m.workspaceRevisionBefore)||m.workspaceRevisionBefore<0||!Number.isSafeInteger(m.workspaceRevisionAfter)||m.workspaceRevisionAfter!==m.workspaceRevisionBefore+1||!['MAPPED','UNMAPPED'].includes(m.mapping))return false;
 if(m.mapping==='UNMAPPED'){if(m.record!==null)return false}else if(!exact(m.record,['type','id','versionBefore','versionAfter','stateBefore','stateAfter'])||!types.has(m.record.type)||!id(m.record.id)||!version(m.record.versionBefore)||!version(m.record.versionAfter)||!state(m.record.stateBefore)||!state(m.record.stateAfter))return false;
 if(!exact(m.reason,['status','reference'])||!['NOT_REQUIRED','REFERENCED','UNAVAILABLE'].includes(m.reason.status))return false;
 if(m.reason.status!=='REFERENCED')return m.reason.reference===null;
 const r=m.reason.reference;
 return exact(r,['recordType','recordId','recordVersion','field'])&&types.has(r.recordType)&&id(r.recordId)&&Number.isSafeInteger(r.recordVersion)&&r.recordVersion>=1&&['reason','correctionReason','decisionReason','withdrawalReason','mappingReason','executionHistory.reason','submissions.teamSubmissionSource.reason','teamEvidenceVerification.reason','taskReviews.feedback'].includes(r.field);
}
function canonical(m){return Object.fromEntries(keys.map(k=>[k,structuredClone(m[k])]))}
export function formatAuditRecordMetadata(metadata){
 if(!validMetadata(metadata))throw Error('INVALID_AUDIT_METADATA');
 const value=JSON.stringify({format:AUDIT_RECORD_FORMAT,version:AUDIT_RECORD_VERSION,metadata:canonical(metadata)});
 if(value.length>8192)throw Error('AUDIT_METADATA_TOO_LARGE');return value;
}
export function readAuditRecordMetadata(value,ledger=null){
 const result=(kind,reason)=>({kind,reason,recordReference:null,metadata:null});
 if(value===null||value===undefined)return result('LEGACY','STRUCTURED_METADATA_UNAVAILABLE');
 if(typeof value!=='string'||value.length>8192)return result('INVALID','INVALID_RECORD_VALUE');
 if(id(value))return {...result('LEGACY','STRUCTURED_METADATA_UNAVAILABLE'),recordReference:value};
 let parsed;try{parsed=JSON.parse(value)}catch{return result('INVALID','MALFORMED_RECORD_VALUE')}
 // Existing pilots use unrelated JSON shapes. Never reinterpret or expose their contents.
 if(!plain(parsed)||parsed.format!==AUDIT_RECORD_FORMAT)return result('OTHER_FORMAT','STRUCTURED_METADATA_UNAVAILABLE');
 if(parsed.version!==AUDIT_RECORD_VERSION)return result('UNSUPPORTED_VERSION','UNSUPPORTED_AUDIT_VERSION');
 if(!exact(parsed,['format','version','metadata'])||!validMetadata(parsed.metadata))return result('INVALID','INVALID_AUDIT_METADATA');
 const m=parsed.metadata;
 if(ledger!==null&&(!plain(ledger)||ledger.id!==m.correlationId||ledger.workspace!==m.workspaceId||ledger.actor!==m.actorId||ledger.command!==m.action||ledger.revision!==m.workspaceRevisionAfter||ledger.time!==m.occurredAt))return result('INVALID','LEDGER_METADATA_MISMATCH');
 return {kind:'STRUCTURED',reason:'VALID_METADATA',recordReference:m.record?.id||null,metadata:canonical(m)};
}
