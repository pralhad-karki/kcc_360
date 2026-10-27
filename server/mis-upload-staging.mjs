import {assertMISImportAuthority,misDigest} from './mis-manual-import.mjs';
import {decodeMISFile,misFileHash} from './mis-file-decoder.mjs';
import {previewMISImportForContext} from './mis-import-dispatch.mjs';
import {saveMISImport} from './mis-manual-save.mjs';
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const clone=x=>structuredClone(x),stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
export const emptyMISStagingLedger=()=>({contract:'KCC360_MIS_STAGING_V1',files:[]});
export async function loadMISStagingContext(loadTrusted){const s=clone(await loadTrusted());assertMISImportAuthority(s.trusted);
 check(s.configuration?.enabled===true&&typeof s.configuration.storagePolicyVersion==='string'&&s.configuration.storagePolicyVersion.length>0&&Number.isSafeInteger(s.configuration.stagingTTLSeconds)&&s.configuration.stagingTTLSeconds>=60&&s.configuration.stagingTTLSeconds<=86400,'MIS_STORAGE_POLICY_REQUIRED');
 check(s.workspace?.id===`KCC-MIS-STUDENTS:${s.trusted.institutionId}`&&s.staging?.id===`KCC-MIS-STAGING:${s.trusted.institutionId}`&&s.staging.id!==s.trusted.authorityFence.workspaceId&&s.workspace.id!==s.trusted.authorityFence.workspaceId&&Number.isSafeInteger(s.staging.revision)&&s.staging.revision>=0&&s.staging.data?.contract==='KCC360_MIS_STAGING_V1'&&Array.isArray(s.staging.data.files),'MIS_STAGING_SCOPE_INVALID');return s;
}
const authority=s=>({trusted:{...s.trusted,now:null},configuration:s.configuration});
async function fresh(loadTrusted,previous){const s=await loadMISStagingContext(loadTrusted);check(await misDigest(authority(s))===await misDigest(authority(previous)),'MIS_STAGING_AUTHORITY_CHANGED');return s}
function owned(s,id,allowExpired=false){const f=s.staging.data.files.find(x=>x.id===id);check(f&&f.institutionId===s.trusted.institutionId&&f.sourceSystem===s.trusted.sourceSystem&&f.uploader===s.trusted.subject&&f.personId===s.trusted.personId,'MIS_STAGED_FILE_UNAVAILABLE');check(allowExpired||s.trusted.now<f.expiresAt,'MIS_STAGED_FILE_EXPIRED');return f}
function provenance(f){return {id:f.id,filename:f.filename,sha256:f.sha256,size:f.size,mime:f.mime,uploadedAt:f.uploadedAt,uploader:f.uploader,decoderVersion:f.decoderVersion,sheet:f.sheet}}
function requestFor(f,csv){return {operationId:f.operationId,sourceSystem:f.sourceSystem,institutionId:f.institutionId,filename:f.filename,exportedAt:f.exportedAt,mode:f.mode,mapping:clone(f.mapping),csv}}
async function update({db,s,data,action,fileId,clock}){
 const now=clock();check(stamp(now)&&now>=s.trusted.now&&now<s.trusted.validUntil,'MIS_STAGING_AUTHORITY_EXPIRED');const payload=JSON.stringify(data);check(new TextEncoder().encode(payload).length<=2000000,'MIS_STAGING_LEDGER_SIZE_LIMIT');
 const id=crypto.randomUUID(),revision=s.staging.revision+1,f=s.trusted.authorityFence;
 const out=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=? AND EXISTS (SELECT 1 FROM kcc_workspaces AS authority_fence WHERE authority_fence.id=? AND authority_fence.revision=?)').bind(payload,revision,id,now,s.staging.id,s.staging.revision,f.workspaceId,f.revision),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=? AND revision=?)').bind(id,s.staging.id,revision,s.trusted.subject,s.trusted.personId,action,JSON.stringify({fileId,storagePolicyVersion:s.configuration.storagePolicyVersion}),now,s.staging.id,id,revision)
 ]);check(out[0]?.meta?.changes===1&&out[1]?.meta?.changes===1,'MIS_STAGING_OR_AUTHORITY_CONFLICT');
}
// Persist a reservation before writing R2. Failed/interrupted writes stay visible as
// STAGING and can be retried or purged; they are never readable or committable.
export async function stageMISUpload({db,bucket,loadTrusted,input,bytes,XLSX,clock=()=>new Date().toISOString()}){
 check(bytes instanceof Uint8Array&&bytes.length>0&&bytes.length<=1000000,'MIS_FILE_SIZE_LIMIT');const i=clone(input),raw=new Uint8Array(bytes);let s=await loadMISStagingContext(loadTrusted);
 check(i&&typeof i==='object'&&Object.keys(i).length===7&&['operationId','filename','sheet','exportedAt','mode','mapping','kind'].every(k=>Object.hasOwn(i,k))&&['STUDENTS','STRUCTURES','ENROLLMENTS'].includes(i.kind),'INVALID_MIS_UPLOAD_INPUT');
 const decoded=decodeMISFile({bytes:raw,filename:i.filename,sheet:i.sheet,mapping:i.mapping,XLSX}),sha256=await misFileHash(raw),request={operationId:i.operationId,sourceSystem:s.trusted.sourceSystem,institutionId:s.trusted.institutionId,filename:i.filename,exportedAt:i.exportedAt,mode:i.mode,mapping:i.mapping,csv:decoded.csv};
 await previewMISImportForContext({s,kind:i.kind,request});
 const inputFingerprint=await misDigest({input:i,sha256}),matches=s.staging.data.files.filter(x=>x.operationId===i.operationId);check(matches.length<=1,'AMBIGUOUS_MIS_UPLOAD_OPERATION');let f=matches[0];
 if(f){owned(s,f.id);check(f.inputFingerprint===inputFingerprint&&['STAGING','AVAILABLE'].includes(f.status),'MIS_UPLOAD_OPERATION_CONFLICT');if(f.status==='AVAILABLE')return {id:f.id,status:f.status,sourceFile:provenance(f),replayed:true}}
 else{
  const id=crypto.randomUUID(),institutionHash=await misDigest(s.trusted.institutionId);f={id,kind:i.kind,operationId:i.operationId,inputFingerprint,institutionId:s.trusted.institutionId,sourceSystem:s.trusted.sourceSystem,filename:i.filename,sha256,size:raw.length,mime:decoded.mime,decoderVersion:decoded.decoderVersion,sheet:decoded.sheet,uploadedAt:s.trusted.now,expiresAt:new Date(Date.parse(s.trusted.now)+s.configuration.stagingTTLSeconds*1000).toISOString(),uploader:s.trusted.subject,personId:s.trusted.personId,exportedAt:i.exportedAt,mode:i.mode,mapping:clone(i.mapping),status:'STAGING',objectKey:`private/mis/${institutionHash}/${id}`,storagePolicyVersion:s.configuration.storagePolicyVersion};
  s=await fresh(loadTrusted,s);check(!s.staging.data.files.some(x=>x.operationId===i.operationId),'MIS_STAGING_OR_AUTHORITY_CONFLICT');const data=clone(s.staging.data);data.files.push(f);await update({db,s,data,action:'mis.upload.reserved',fileId:id,clock});
 }
 try{await bucket.put(f.objectKey,raw,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{sha256}})}catch{throw Error('MIS_FILE_WRITE_FAILED_STAGING_RETAINED')}
 s=await fresh(loadTrusted,s);const current=owned(s,f.id,true);if(['PURGE_PENDING','PURGED'].includes(current.status)){try{await bucket.delete(f.objectKey)}catch{const error=Error('MIS_LATE_WRITE_CLEANUP_REQUIRED_RETRY_PURGE');error.fileId=f.id;error.cleanupRequired=true;throw error}throw Error('MIS_UPLOAD_PURGED_DURING_WRITE')}check(s.trusted.now<current.expiresAt,'MIS_STAGED_FILE_EXPIRED');check(current.inputFingerprint===inputFingerprint&&['STAGING','AVAILABLE'].includes(current.status),'MIS_UPLOAD_STATE_CHANGED');if(current.status==='STAGING'){const data=clone(s.staging.data);data.files.find(x=>x.id===f.id).status='AVAILABLE';await update({db,s,data,action:'mis.upload.available',fileId:f.id,clock})}
 return {id:f.id,status:'AVAILABLE',sourceFile:provenance(f),replayed:false};
}
async function loadFile({loadTrusted,bucket,id,XLSX}){
 let s=await loadMISStagingContext(loadTrusted);const f=owned(s,id);check(f.status==='AVAILABLE','MIS_STAGED_FILE_NOT_AVAILABLE');const object=await bucket.get(f.objectKey);check(object,'MIS_STAGED_OBJECT_MISSING');check(object.size===f.size&&object.size<=1000000,'MIS_STAGED_OBJECT_INTEGRITY_FAILED');const bytes=new Uint8Array(await object.arrayBuffer());check(bytes.length===f.size&&await misFileHash(bytes)===f.sha256,'MIS_STAGED_OBJECT_INTEGRITY_FAILED');const decoded=decodeMISFile({bytes,filename:f.filename,sheet:f.sheet,mapping:f.mapping,XLSX});check(decoded.decoderVersion===f.decoderVersion&&decoded.sheet===f.sheet,'MIS_STAGED_DECODER_CHANGED');
 const next=await fresh(loadTrusted,s),current=owned(next,id);check(JSON.stringify(current)===JSON.stringify(f),'MIS_UPLOAD_STATE_CHANGED');s=next;
 return {s,f,request:requestFor(f,decoded.csv)};
}
export async function previewStagedMISUpload(args){const {s,f,request}=await loadFile(args),sourceFile=provenance(f);const preview=await previewMISImportForContext({s,kind:f.kind??'STUDENTS',request,provenance:sourceFile});return {id:f.id,expiresAt:f.expiresAt,sourceFile,preview}}
export async function commitStagedMISUpload({db,bucket,loadTrusted,id,confirmation,XLSX,clock}){
 const read=async()=>{const {s,f,request}=await loadFile({loadTrusted,bucket,id,XLSX});return {...s,request,provenance:provenance(f),storageFence:{workspaceId:s.staging.id,revision:s.staging.revision},trusted:{...s.trusted,validUntil:[s.trusted.validUntil,f.expiresAt].sort()[0]}}};
 const first=await read();return saveMISImport({kind:first.staging.data.files.find(x=>x.id===id).kind??'STUDENTS',db,loadTrusted:read,request:first.request,confirmation,clock});
}
// Tombstone first, then delete private bytes. A deletion failure remains durably
// PURGE_PENDING and retryable; purge cannot make student history disappear.
export async function purgeMISUpload({db,bucket,loadTrusted,id,clock=()=>new Date().toISOString()}){
 let s=await loadMISStagingContext(loadTrusted),f=owned(s,id,true);if(f.status==='PURGED'){try{await bucket.delete(f.objectKey)}catch{throw Error('MIS_LATE_WRITE_CLEANUP_REQUIRED_RETRY_PURGE')}return {id,status:'PURGED',replayed:true}};
 if(f.status!=='PURGE_PENDING'){s=await fresh(loadTrusted,s);f=owned(s,id,true);const data=clone(s.staging.data);data.files.find(x=>x.id===id).status='PURGE_PENDING';await update({db,s,data,action:'mis.upload.purge.requested',fileId:id,clock})}
 try{await bucket.delete(f.objectKey)}catch{throw Error('MIS_PURGE_PENDING_RETRY_REQUIRED')}
 s=await fresh(loadTrusted,s);f=owned(s,id,true);check(f.status==='PURGE_PENDING','MIS_UPLOAD_STATE_CHANGED');const data=clone(s.staging.data),record=data.files.find(x=>x.id===id);record.status='PURGED';record.purgedAt=s.trusted.now;await update({db,s,data,action:'mis.upload.purged',fileId:id,clock});return {id,status:'PURGED',replayed:false};
}

export async function listMISUploads({loadTrusted}){const s=await loadMISStagingContext(loadTrusted);return {files:s.staging.data.files.filter(f=>f.institutionId===s.trusted.institutionId&&f.sourceSystem===s.trusted.sourceSystem&&f.uploader===s.trusted.subject&&f.personId===s.trusted.personId).map(f=>({id:f.id,operationId:f.operationId,kind:f.kind??'STUDENTS',filename:f.filename,status:f.status,uploadedAt:f.uploadedAt,expiresAt:f.expiresAt,expired:s.trusted.now>=f.expiresAt}))}}
