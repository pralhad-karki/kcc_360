import {validateRecord,withdrawalKey,WITHDRAWAL_COMMAND} from '../share-withdrawal/domain';
import {fileRecord} from '../file-policy.mjs';

export class RecoveryError extends Error {readonly code='RECOVERY_UNAVAILABLE';constructor(){super('Private recovery verification failed.');}}
export interface WorkspaceRow {id:string;revision:number;payload:string;commitId:string;updatedAt:string}
export interface AuditRow {id:string;workspace:string;revision:number;subject:string;actor:string;command:string;record:string|null;time:string}
export interface FileRow {id:string;workspace:string;kind:string;target:string;evidenceIndex:number|null;objectKey:string;name:string;mime:string;size:number;sha256:string;uploadedBy:string;subject:string;createdAt:string;status:string}
export interface RecoverySnapshot {workspaces:WorkspaceRow[];audit:AuditRow[];files:FileRow[]}
export interface RecoveryPackage {schema:'KCC360_PRIVATE_RECOVERY_V1';snapshot:RecoverySnapshot;digest:string}
export const MAX_RECOVERY_ROWS=10_000,MAX_RECOVERY_BYTES=32*1024*1024;
export function check(ok:unknown):asserts ok {if(!ok)throw new RecoveryError();}
export function canonical(value:unknown):string {
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
}
export async function sha256(value:string|Uint8Array){const bytes=typeof value==='string'?new TextEncoder().encode(value):value;return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes))),n=>n.toString(16).padStart(2,'0')).join('');}
const text=(v:unknown)=>typeof v==='string'&&v.length>0;
const integer=(v:unknown)=>Number.isSafeInteger(v)&&Number(v)>=0;
const exact=(v:object,keys:string)=>Object.keys(v).sort().join(',')===keys.split(',').sort().join(',');
export function ordered(input:RecoverySnapshot):RecoverySnapshot {
 check(input&&exact(input,'workspaces,audit,files'));
 const snapshot=structuredClone(input);
 for(const rows of [snapshot.workspaces,snapshot.audit,snapshot.files]){
  check(Array.isArray(rows)&&rows.length<=MAX_RECOVERY_ROWS&&rows.every(r=>r&&text(r.id)));
  rows.sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);check(new Set(rows.map(r=>r.id)).size===rows.length);
 }
 check(new TextEncoder().encode(canonical(snapshot)).length<=MAX_RECOVERY_BYTES);
 return snapshot;
}

// All namespaces are retained verbatim, including unknown future/private rows.
// This validates known relationships; it does not infer institutional identities.
export async function inspectSnapshot(input:RecoverySnapshot){
 const snapshot=ordered(input),byId=new Map(snapshot.workspaces.map(r=>[r.id,r])),data=new Map<string,any>();
 const namespaces:Record<string,number>=Object.create(null),collections:Record<string,number>=Object.create(null);let payloadBytes=0,markers=0,markersWithoutAudit=0,attachmentReferences=0;
 for(const row of snapshot.workspaces){
  check(exact(row,'id,revision,payload,commitId,updatedAt')&&integer(row.revision)&&text(row.payload)&&text(row.commitId)&&text(row.updatedAt));
  const value=JSON.parse(row.payload);check(value&&typeof value==='object');data.set(row.id,value);
  payloadBytes+=new TextEncoder().encode(row.payload).length;
  const namespace=row.id.includes(':')?row.id.slice(0,row.id.indexOf(':')+1):row.id;namespaces[namespace]=(namespaces[namespace]??0)+1;
  for(const [key,v] of Object.entries(value))if(Array.isArray(v))collections[key]=(collections[key]??0)+v.length;
 }
 for(const row of snapshot.audit)check(exact(row,'id,workspace,revision,subject,actor,command,record,time')&&byId.has(row.workspace)&&integer(row.revision)&&[row.subject,row.actor,row.command,row.time].every(text)&&(row.record===null||typeof row.record==='string'));
 for(const row of snapshot.workspaces)if(row.id.startsWith('KCC-SHARE-WITHDRAWAL:')){
  const record=data.get(row.id),valid=validateRecord(record,record);
  check(await withdrawalKey(valid)===row.id&&row.revision===1&&row.updatedAt===valid.time&&byId.has(valid.workspaceId));markers++;
  const audit=snapshot.audit.find(a=>a.id===row.commitId);
  if(!audit)markersWithoutAudit++;
  else {const r=JSON.parse(audit.record??'null');check(audit.command===WITHDRAWAL_COMMAND&&audit.workspace===valid.workspaceId&&audit.revision===valid.sourceRevision&&audit.actor===valid.actor&&audit.subject===valid.subject&&audit.time===valid.time&&r?.schema==='KCC360_SHARE_WITHDRAWAL_AUDIT_V1'&&r.markerId===row.id&&r.shareId===valid.shareId&&r.tokenHash===valid.tokenHash&&r.sourceRevision===valid.sourceRevision);}
 }
 // A surviving audit must never be restored without its authoritative marker.
 for(const a of snapshot.audit)if(a.command===WITHDRAWAL_COMMAND){const r=JSON.parse(a.record??'null');check(r&&byId.get(r.markerId)?.commitId===a.id);}
 const objectKeys=new Set<string>();
 for(const row of snapshot.files){
  check(exact(row,'id,workspace,kind,target,evidenceIndex,objectKey,name,mime,size,sha256,uploadedBy,subject,createdAt,status')&&byId.has(row.workspace)&&[row.kind,row.target,row.objectKey,row.name,row.mime,row.uploadedBy,row.subject,row.createdAt,row.status].every(text)&&integer(row.size)&&/^[a-f0-9]{64}$/.test(row.sha256)&&(row.evidenceIndex===null||integer(row.evidenceIndex))&&!objectKeys.has(row.objectKey));objectKeys.add(row.objectKey);
  // Unknown historical statuses are preserved; every metadata row still needs
  // its object. AVAILABLE rows must retain the exact application association.
  if(row.status==='AVAILABLE'){
   const item=fileRecord(data.get(row.workspace),row.kind,row.target,row.evidenceIndex),refs=item?.files?.filter((f:{id:string})=>f.id===row.id);
   check(refs?.length===1&&refs[0].sha256===row.sha256&&refs[0].size===row.size&&refs[0].name===row.name&&refs[0].mime===row.mime&&refs[0].uploadedBy===row.uploadedBy&&refs[0].createdAt===row.createdAt);attachmentReferences++;
  }
 }
 // Detect embedded references without metadata, including historical records.
 let embeddedReferences=0;
 function walk(v:any,workspace:string){if(!v||typeof v!=='object')return;if(Array.isArray(v)){for(const x of v)walk(x,workspace);return;}
  for(const [key,value] of Object.entries(v)){if(key==='files'&&Array.isArray(value))for(const ref of value){check(ref&&typeof ref==='object'&&snapshot.files.some(f=>f.workspace===workspace&&f.id===ref.id));embeddedReferences++;}else walk(value,workspace);}
 }
 for(const [id,value] of data)walk(value,id);
 return {snapshot,inventory:{schema:'KCC360_RECOVERY_INVENTORY_V1',workspaceRows:snapshot.workspaces.length,auditRows:snapshot.audit.length,fileRows:snapshot.files.length,namespaces,collections,payloadBytes,withdrawalMarkers:markers,markersWithoutAudit,attachmentReferences,embeddedReferences,objectBytes:snapshot.files.reduce((n,r)=>n+r.size,0),sessionsIncluded:false,objectListingComplete:false}};
}
