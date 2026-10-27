// Official-source transfer contract; deliberately independent of fictional MIS fixtures and login.
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const text=(v,max=200)=>typeof v==='string'&&v.length>0&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const fields=['studentId','displayName','collegeStatus','exitDate','sourceUpdatedAt'];
export const MANUAL_MIS_CONTRACT='KCC360_MANUAL_MIS_STUDENTS_V1';
export const emptyMISImportLedger=()=>({contract:MANUAL_MIS_CONTRACT,students:[],reports:[]});
const canonical=v=>JSON.stringify(v===undefined?null:v===null||typeof v!=='object'?v:Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])));
export async function misDigest(value){const bytes=typeof value==='string'?new TextEncoder().encode(value):new TextEncoder().encode(canonical(value));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export const misStudentKey=(sourceSystem,institutionId,studentId)=>JSON.stringify([sourceSystem,institutionId,studentId]);
// Strict quoted CSV, no guessing delimiters, headers or vendor-specific field names.
export function parseMISCSV(input){
 check(typeof input==='string'&&new TextEncoder().encode(input).length<=250000,'CSV_SIZE_LIMIT');
 input=input.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
 for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'){if(input[i+1]==='"'){cell+='"';i++}else {quoted=false;closed=true}}else cell+=c;continue}
  if(c==='"'){check(!cell&&!closed,'MALFORMED_CSV');quoted=true;continue}
  if(c===','||c==='\n'||c==='\r'){row.push(cell);cell='';closed=false;if(c!==','){if(c==='\r'&&input[i+1]==='\n')i++;rows.push(row);row=[]}continue}
  check(!closed,'MALFORMED_CSV');cell+=c;
 }
 check(!quoted,'MALFORMED_CSV');if(cell||row.length||closed){row.push(cell);rows.push(row)}
 check(rows.length>=2&&rows.length<=1001,'CSV_ROW_LIMIT');const headers=rows.shift();check(headers.every(x=>text(x))&&new Set(headers).size===headers.length,'INVALID_CSV_HEADERS');check(rows.every(r=>r.length===headers.length),'CSV_COLUMN_COUNT');return {headers,rows};
}
export function assertMISImportAuthority(t){check(t?.enabled===true&&t.canImport===true&&text(t.subject)&&text(t.personId)&&text(t.institutionId)&&text(t.sourceSystem)&&stamp(t.now)&&stamp(t.validUntil)&&t.now<t.validUntil&&text(t.authorityFence?.workspaceId)&&Number.isSafeInteger(t.authorityFence.revision)&&t.authorityFence.revision>0,'MIS_IMPORT_NOT_AUTHORIZED')}
function validateLedger(ledger){check(exact(ledger,['contract','students','reports'])&&ledger.contract===MANUAL_MIS_CONTRACT&&Array.isArray(ledger.students)&&Array.isArray(ledger.reports),'INVALID_MIS_LEDGER');check(new Set(ledger.students.map(s=>s.key)).size===ledger.students.length,'CONFLICTING_STORED_IDENTITIES')}
function request(r,t){
 check(exact(r,['operationId','sourceSystem','institutionId','filename','exportedAt','mode','mapping','csv'])&&text(r.operationId,80)&&text(r.filename)&&r.sourceSystem===t.sourceSystem&&r.institutionId===t.institutionId&&stamp(r.exportedAt)&&r.exportedAt<=t.now&&['FULL_SNAPSHOT','INCREMENTAL'].includes(r.mode),'INVALID_IMPORT_METADATA');
 const m=r.mapping;check(exact(m,['version','columns','statusValues'])&&text(m.version,80)&&m.columns&&typeof m.columns==='object'&&!Array.isArray(m.columns)&&Object.keys(m.columns).every(k=>fields.includes(k))&&['studentId','displayName'].every(k=>text(m.columns[k]))&&Object.values(m.columns).every(x=>text(x))&&new Set(Object.values(m.columns)).size===Object.keys(m.columns).length,'INVALID_COLUMN_MAPPING');
 check(m.statusValues&&typeof m.statusValues==='object'&&!Array.isArray(m.statusValues)&&Object.entries(m.statusValues).every(([k,v])=>text(k)&&['ENROLLED','LEFT_COLLEGE','ON_BREAK','REPEATING','UNKNOWN'].includes(v)),'INVALID_STATUS_MAPPING');
 const data=parseMISCSV(r.csv);check(Object.values(m.columns).every(h=>data.headers.includes(h)),'MAPPED_COLUMN_MISSING');return data;
}
export async function previewMISStudentImport({trusted,ledger,revision,request:r,provenance=null}){
 assertMISImportAuthority(trusted);validateLedger(ledger);check(ledger.students.every(s=>s.institutionId===trusted.institutionId&&s.key===misStudentKey(s.sourceSystem,s.institutionId,s.studentId)),'MIS_LEDGER_SCOPE_OR_IDENTITY_CONFLICT');check(Number.isSafeInteger(revision)&&revision>=0,'INVALID_LEDGER_REVISION');const {headers,rows}=request(r,trusted),m=r.mapping;
 const fingerprint=await misDigest(r.csv),requestFingerprint=await misDigest(r),oldReport=ledger.reports.find(x=>x.operationId===r.operationId);
 if(oldReport)check(oldReport.requestFingerprint===requestFingerprint&&oldReport.uploader===trusted.subject&&oldReport.confirmedBy===trusted.personId,'OPERATION_ID_CONFLICT');
 const mapped=rows.map((row,i)=>{const get=k=>m.columns[k]?row[headers.indexOf(m.columns[k])]:null;return {row:i+2,studentId:get('studentId'),displayName:get('displayName'),collegeStatus:get('collegeStatus')===null?'UNKNOWN':Object.hasOwn(m.statusValues,get('collegeStatus'))?m.statusValues[get('collegeStatus')]:null,exitDate:get('exitDate')||null,sourceUpdatedAt:m.columns.sourceUpdatedAt?get('sourceUpdatedAt'):r.exportedAt}});
 const counts={new:0,changed:0,unchanged:0,duplicate:0,invalid:0,conflicting:0},seen=new Map();for(const row of mapped)seen.set(row.studentId,(seen.get(row.studentId)||0)+1);
 const differences=[];for(const row of mapped){let classification,reason=null;const key=misStudentKey(r.sourceSystem,r.institutionId,row.studentId),existing=ledger.students.find(s=>s.key===key);
  if(existing){if(!m.columns.collegeStatus)row.collegeStatus=existing.collegeStatus;if(!m.columns.exitDate)row.exitDate=existing.exitDate}
  if(!text(row.studentId,120)||row.studentId.trim()!==row.studentId||!text(row.displayName)||!['ENROLLED','LEFT_COLLEGE','ON_BREAK','REPEATING','UNKNOWN'].includes(row.collegeStatus)||!stamp(row.sourceUpdatedAt)||row.sourceUpdatedAt>r.exportedAt||(row.exitDate!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(row.exitDate)||!stamp(row.exitDate+'T00:00:00.000Z')))){classification='invalid';reason='INVALID_MAPPED_STUDENT'}
  else if(seen.get(row.studentId)>1){classification='duplicate';reason='DUPLICATE_STABLE_ID'}
  else if((row.collegeStatus==='LEFT_COLLEGE'&&!row.exitDate)||(row.collegeStatus!=='LEFT_COLLEGE'&&row.exitDate)){classification='conflicting';reason='STATUS_EXIT_DATE_REQUIRES_REVIEW'}
  else if(existing&&(r.exportedAt<existing.exportedAt||row.sourceUpdatedAt<existing.sourceUpdatedAt)){classification='conflicting';reason='STALE_SOURCE_REQUIRES_RECONCILIATION'}
  else if(existing&&row.sourceUpdatedAt===existing.sourceUpdatedAt&&['displayName','collegeStatus','exitDate'].some(k=>row[k]!==existing[k])){classification='conflicting';reason='SAME_SOURCE_TIME_DIFFERENT_VALUES'}
  else classification=!existing?'new':['displayName','collegeStatus','exitDate'].every(k=>row[k]===existing[k])?'unchanged':'changed';
  counts[classification]++;differences.push({...row,key,classification,reason});
 }
 const missing= r.mode==='FULL_SNAPSHOT'?ledger.students.filter(s=>s.sourceSystem===r.sourceSystem&&s.institutionId===r.institutionId&&!seen.has(s.studentId)).length:0;
 if(provenance!==null)check(exact(provenance,['id','filename','sha256','size','mime','uploadedAt','uploader','decoderVersion','sheet'])&&text(provenance.id)&&provenance.filename===r.filename&&/^[a-f0-9]{64}$/.test(provenance.sha256)&&Number.isSafeInteger(provenance.size)&&provenance.size>0&&provenance.size<=1000000&&['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(provenance.mime)&&stamp(provenance.uploadedAt)&&provenance.uploadedAt<=trusted.now&&provenance.uploader===trusted.subject&&text(provenance.decoderVersion)&&(provenance.sheet===null||text(provenance.sheet)),'INVALID_TRUSTED_FILE_PROVENANCE');
 const binding=await misDigest({requestFingerprint,revision,counts,differences,...(provenance?{provenance}:{}),personId:trusted.personId,institutionId:trusted.institutionId});
 return {contract:MANUAL_MIS_CONTRACT,revision,binding,requestFingerprint,fingerprint,counts,differences,missingWithoutAction:missing,canCommit:!counts.invalid&&!counts.duplicate&&!counts.conflicting,replayReport:oldReport??null,sourceAuthority:'MIS',transferMethod:'MANUAL_CSV',fieldAccuracyCertified:false};
}
export async function prepareMISStudentCommit({trusted,ledger,revision,request,confirmation,provenance=null}){
 const p=await previewMISStudentImport({trusted,ledger,revision,request,provenance});
 check(exact(confirmation,['confirmed','binding','expectedRevision'])&&confirmation.confirmed===true,'EXPLICIT_IMPORT_CONFIRMATION_REQUIRED');
 if(p.replayReport){check(await misDigest(p.replayReport.sourceFile??null)===await misDigest(provenance),'OPERATION_FILE_PROVENANCE_CONFLICT');check(confirmation.binding===p.replayReport.confirmedBinding&&confirmation.expectedRevision===p.replayReport.previousRevision,'REPLAY_CONFIRMATION_MISMATCH');return {replayed:true,report:structuredClone(p.replayReport)}}
 check(confirmation.binding===p.binding&&confirmation.expectedRevision===revision,'IMPORT_PREVIEW_CHANGED');check(p.canCommit,'IMPORT_ERRORS_UNRESOLVED');
 const next=structuredClone(ledger);for(const row of p.differences){const {classification,reason,row:rowNumber,...value}=row;const record={...value,sourceSystem:request.sourceSystem,institutionId:request.institutionId,exportedAt:request.exportedAt,importOperationId:request.operationId};const i=next.students.findIndex(s=>s.key===row.key);if(i<0)next.students.push(record);else next.students[i]=record}
 const report={operationId:request.operationId,requestFingerprint:p.requestFingerprint,confirmedBinding:p.binding,previousRevision:revision,committedRevision:revision+1,filename:request.filename,fileFingerprint:p.fingerprint,exportedAt:request.exportedAt,processedAt:trusted.now,uploader:trusted.subject,confirmedBy:trusted.personId,mappingVersion:request.mapping.version,mapping:structuredClone(request.mapping),sourceSystem:request.sourceSystem,institutionId:request.institutionId,mode:request.mode,counts:p.counts,missingWithoutAction:p.missingWithoutAction,result:'COMMITTED',sourceAuthority:'MIS',transferMethod:'MANUAL_CSV',fieldAccuracyCertified:false,originalFileRetained:false};
 // Append immutable before/after values for every mutation; no historical record is replaced.
 report.changes=p.differences.filter(x=>['new','changed','unchanged'].includes(x.classification)).map(x=>({key:x.key,observationOnly:x.classification==='unchanged',before:structuredClone(ledger.students.find(s=>s.key===x.key)??null),after:structuredClone(next.students.find(s=>s.key===x.key))}));
 if(provenance){report.normalizedCSVFingerprint=report.fileFingerprint;report.fileFingerprint=provenance.sha256;report.sourceFile=structuredClone(provenance);report.uploadedAt=provenance.uploadedAt;report.originalFileRetained=true;report.transferMethod=provenance.sheet===null?'MANUAL_CSV':'MANUAL_XLSX'}
 next.reports.push(report);check(new TextEncoder().encode(JSON.stringify(next)).length<=2000000,'MIS_LEDGER_SIZE_LIMIT');return {replayed:false,ledger:next,report};
}
