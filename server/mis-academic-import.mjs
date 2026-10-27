import {assertMISImportAuthority,parseMISCSV,misDigest,misStudentKey} from './mis-manual-import.mjs';
const check=(v,m)=>{if(!v)throw Error(m)},clone=v=>structuredClone(v);
const text=(v,max=200)=>typeof v==='string'&&v.length>0&&v.length<=max&&v===v.trim()&&!/[\u0000-\u001f\u007f]/.test(v);
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&stamp(v+'T00:00:00.000Z');
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const types=['PROGRAMME','BATCH','ACADEMIC_SESSION','SEMESTER','SECTION','COURSE'];
const parentType={PROGRAMME:null,BATCH:'PROGRAMME',ACADEMIC_SESSION:null,SEMESTER:'PROGRAMME',SECTION:'SEMESTER',COURSE:'PROGRAMME'};
const structureFields=['structureId','structureKind','label','parentId','sequence','finalSemester','sourceUpdatedAt'];
const enrollmentFields=['enrollmentId','studentId','programmeId','batchId','sessionId','semesterId','sectionId','courseId','status','effectiveFrom','effectiveUntil','sourceUpdatedAt'];
export const academicKey=(source,institution,kind,id)=>JSON.stringify([source,institution,kind,id]);
export const emptyMISAcademicLedger=()=>({contract:'KCC360_MIS_ACADEMIC_V1',structures:[],enrollments:[],reports:[]});
const values=(r,fields)=>fields.map(k=>r[k]);
const same=(a,b,fields)=>JSON.stringify(values(a,fields))===JSON.stringify(values(b,fields));
// Official local progression is a separate trusted source, never a browser field or
// the existing fictional cohort ledger. This comparator is read-only.
export function reconcileMISClassEnrollment({enrollment:e,localProgressions,exportedAt}){
 const relevant=localProgressions.filter(p=>p.studentId===e.studentId&&p.sourceSystem===e.sourceSystem&&p.institutionId===e.institutionId&&p.programmeId===e.programmeId&&p.batchId===e.batchId&&p.sessionId===e.sessionId&&p.state==='APPLIED');
 if(!relevant.length)return {status:'MIS_ONLY',officialWriteBack:false,localMutation:false};
 const applicable=relevant.filter(p=>p.effectiveDate<=exportedAt.slice(0,10)).sort((a,b)=>a.effectiveDate.localeCompare(b.effectiveDate));
 if(!applicable.length)return {status:'MIS_BEFORE_LOCAL_EFFECTIVE_DATE',officialWriteBack:false,localMutation:false};
 const latest=applicable.at(-1);if(applicable.length>1&&applicable.at(-2).effectiveDate===latest.effectiveDate)return {status:'AMBIGUOUS_LOCAL_PROGRESSION',officialWriteBack:false,localMutation:false};
 return {status:e.semesterId===latest.toSemesterId?'MIS_CONFIRMS_LOCAL_PROGRESSION':e.semesterId===latest.fromSemesterId?'MIS_BEHIND_LOCAL_PROGRESSION':'MIS_DIVERGES_FROM_LOCAL_PROGRESSION',progressionId:latest.id,officialWriteBack:false,localMutation:false};
}
function validateSources({trusted:t,ledger:l,students,localProgressions}){
 assertMISImportAuthority(t);check(t.canImportAcademics===true,'MIS_ACADEMIC_IMPORT_NOT_AUTHORIZED');
 check(exact(l,['contract','structures','enrollments','reports'])&&l.contract==='KCC360_MIS_ACADEMIC_V1'&&['structures','enrollments','reports'].every(k=>Array.isArray(l[k])),'INVALID_MIS_ACADEMIC_LEDGER');
 check(l.structures.every(r=>r.institutionId===t.institutionId&&types.includes(r.structureKind)&&r.key===academicKey(r.sourceSystem,r.institutionId,r.structureKind,r.structureId))&&l.enrollments.every(r=>r.institutionId===t.institutionId&&r.key===academicKey(r.sourceSystem,r.institutionId,'ENROLLMENT',r.enrollmentId))&&[l.structures,l.enrollments].every(rows=>new Set(rows.map(r=>r.key)).size===rows.length),'MIS_ACADEMIC_IDENTITY_CONFLICT');
 check(students?.contract==='KCC360_MANUAL_MIS_STUDENTS_V1'&&Array.isArray(students.students)&&students.students.every(s=>s.institutionId===t.institutionId&&s.key===misStudentKey(s.sourceSystem,s.institutionId,s.studentId))&&new Set(students.students.map(s=>s.key)).size===students.students.length,'MIS_STUDENT_REFERENCE_SOURCE_INVALID');
 check(Array.isArray(localProgressions)&&localProgressions.every(p=>p&&['id','sourceSystem','institutionId','studentId','programmeId','batchId','sessionId','fromSemesterId','toSemesterId'].every(k=>text(p[k]))&&p.institutionId===t.institutionId&&p.state==='APPLIED'&&date(p.effectiveDate)&&stamp(p.appliedAt)&&p.appliedAt<=t.now&&p.fromSemesterId!==p.toSemesterId)&&new Set(localProgressions.map(p=>p.id)).size===localProgressions.length,'INVALID_OFFICIAL_LOCAL_PROGRESSION_SNAPSHOT');
}
function mappedRows(r,t,kind){
 check(exact(r,['operationId','sourceSystem','institutionId','filename','exportedAt','mode','mapping','csv'])&&text(r.operationId,80)&&text(r.filename)&&r.sourceSystem===t.sourceSystem&&r.institutionId===t.institutionId&&stamp(r.exportedAt)&&r.exportedAt<=t.now&&['FULL_SNAPSHOT','INCREMENTAL'].includes(r.mode),'INVALID_ACADEMIC_IMPORT_METADATA');
 const allowed=kind==='STRUCTURES'?structureFields:enrollmentFields,required=kind==='STRUCTURES'?['structureId','structureKind','label']:['enrollmentId','studentId','programmeId','batchId','sessionId','semesterId','status'],m=r.mapping;
 check(exact(m,['version','columns','valueMaps'])&&text(m.version,80)&&m.columns&&typeof m.columns==='object'&&!Array.isArray(m.columns)&&Object.keys(m.columns).every(k=>allowed.includes(k))&&required.every(k=>text(m.columns[k]))&&Object.values(m.columns).every(v=>text(v))&&new Set(Object.values(m.columns)).size===Object.keys(m.columns).length&&m.valueMaps&&typeof m.valueMaps==='object'&&!Array.isArray(m.valueMaps),'INVALID_ACADEMIC_COLUMN_MAPPING');
 const enumFields=kind==='STRUCTURES'?{structureKind:types,finalSemester:['TRUE','FALSE']}:{status:['CURRENT','HISTORICAL']};
 check(Object.entries(m.valueMaps).every(([field,map])=>Object.hasOwn(enumFields,field)&&map&&typeof map==='object'&&!Array.isArray(map)&&Object.entries(map).every(([raw,value])=>text(raw)&&enumFields[field].includes(value)))&&Object.hasOwn(m.valueMaps,kind==='STRUCTURES'?'structureKind':'status'),'INVALID_ACADEMIC_VALUE_MAPPING');
 const {headers,rows}=parseMISCSV(r.csv);check(Object.values(m.columns).every(v=>headers.includes(v)),'MAPPED_COLUMN_MISSING');
 return rows.map((row,i)=>{const out={row:i+2};for(const field of allowed){let v=m.columns[field]?row[headers.indexOf(m.columns[field])]:null;if(v!==null&&v!==''&&Object.hasOwn(enumFields,field))v=Object.hasOwn(m.valueMaps[field]??{},v)?m.valueMaps[field][v]:undefined;out[field]=v===''?null:v}if(!m.columns.sourceUpdatedAt)out.sourceUpdatedAt=r.exportedAt;if(kind==='STRUCTURES'){out.sequence=out.sequence===null?null:/^[1-9]\d?$/.test(out.sequence)?Number(out.sequence):NaN;out.finalSemester=out.finalSemester===null?null:out.finalSemester==='TRUE'?true:out.finalSemester==='FALSE'?false:undefined}return out});
}
const fieldsFor=kind=>kind==='STRUCTURES'?structureFields.filter(x=>x!=='sourceUpdatedAt'):enrollmentFields.filter(x=>x!=='sourceUpdatedAt');
function validateRow(r,kind){
 if(!stamp(r.sourceUpdatedAt))return false;
 if(kind==='STRUCTURES')return text(r.structureId,120)&&types.includes(r.structureKind)&&text(r.label)&& (parentType[r.structureKind]?text(r.parentId,120):r.parentId===null)&&(r.structureKind==='SEMESTER'?Number.isInteger(r.sequence)&&r.sequence>=1&&r.sequence<=99&&(r.finalSemester===null||typeof r.finalSemester==='boolean'):r.sequence===null&&r.finalSemester===null);
 return ['enrollmentId','studentId','programmeId','batchId','sessionId','semesterId'].every(k=>text(r[k],120))&&['sectionId','courseId'].every(k=>r[k]===null||text(r[k],120))&&['CURRENT','HISTORICAL'].includes(r.status)&&['effectiveFrom','effectiveUntil'].every(k=>r[k]===null||date(r[k]))&&(!r.effectiveFrom||!r.effectiveUntil||r.effectiveFrom<=r.effectiveUntil);
}
export async function previewMISAcademicImport({trusted,ledger,students,revision,kind,request:r,provenance=null,localProgressions=[]}){
 check(['STRUCTURES','ENROLLMENTS'].includes(kind),'MIS_ACADEMIC_KIND_REQUIRED');validateSources({trusted,ledger,students,localProgressions});check(Number.isSafeInteger(revision)&&revision>=0,'INVALID_ACADEMIC_REVISION');
 const rows=mappedRows(r,trusted,kind),stored=kind==='STRUCTURES'?ledger.structures:ledger.enrollments,fields=fieldsFor(kind),requestFingerprint=await misDigest({kind,request:r}),fingerprint=await misDigest(r.csv);
 const previous=ledger.reports.find(x=>x.operationId===r.operationId);if(previous)check(previous.kind===kind&&previous.requestFingerprint===requestFingerprint&&previous.uploader===trusted.subject&&previous.confirmedBy===trusted.personId,'OPERATION_ID_CONFLICT');
 if(provenance)check(exact(provenance,['id','filename','sha256','size','mime','uploadedAt','uploader','decoderVersion','sheet'])&&text(provenance.id)&&provenance.filename===r.filename&&/^[a-f0-9]{64}$/.test(provenance.sha256)&&Number.isSafeInteger(provenance.size)&&provenance.size>0&&provenance.size<=1000000&&['text/csv','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(provenance.mime)&&stamp(provenance.uploadedAt)&&provenance.uploadedAt<=trusted.now&&provenance.uploader===trusted.subject&&text(provenance.decoderVersion)&&(provenance.sheet===null||text(provenance.sheet)),'INVALID_TRUSTED_FILE_PROVENANCE');
 const keys=rows.map(x=>academicKey(r.sourceSystem,r.institutionId,kind==='STRUCTURES'?x.structureKind:'ENROLLMENT',kind==='STRUCTURES'?x.structureId:x.enrollmentId));
 const differences=rows.map((row,i)=>{const key=keys[i],old=stored.find(x=>x.key===key),value={...row,key,sourceSystem:r.sourceSystem,institutionId:r.institutionId};
  // Absent optional date/section/course columns preserve existing values. Empty
  // mapped cells are explicit values and still undergo conflict checks.
  if(old&&kind==='ENROLLMENTS')for(const field of ['sectionId','courseId','effectiveFrom','effectiveUntil'])if(!r.mapping.columns[field])value[field]=old[field];
  let classification,reason=null;
  if(!validateRow(value,kind)||value.sourceUpdatedAt>r.exportedAt){classification='invalid';reason='INVALID_ACADEMIC_ROW'}
  else if(keys.filter(x=>x===key).length>1){classification='duplicate';reason='DUPLICATE_STABLE_ACADEMIC_ID'}
  else if(old&&(r.exportedAt<old.exportedAt||value.sourceUpdatedAt<old.sourceUpdatedAt)){classification='conflicting';reason='STALE_SOURCE_REQUIRES_RECONCILIATION'}
  else if(old&&(kind==='STRUCTURES'?!same(value,old,['parentId','sequence','finalSemester']):!same(value,old,['studentId','programmeId','batchId','sessionId']))){classification='conflicting';reason='ACADEMIC_IDENTITY_REASSIGNMENT_REQUIRES_REVIEW'}
  else if(old&&value.sourceUpdatedAt===old.sourceUpdatedAt&&!same(value,old,fields)){classification='conflicting';reason='SAME_SOURCE_TIME_DIFFERENT_VALUES'}
  else classification=!old?'new':same(value,old,fields)?'unchanged':'changed';
  return {...value,classification,reason};
 });
 const candidate=clone(stored);for(const row of differences.filter(x=>['new','changed','unchanged'].includes(x.classification))){const i=candidate.findIndex(x=>x.key===row.key);if(i<0)candidate.push(row);else candidate[i]=row}
 const structures=kind==='STRUCTURES'?candidate:ledger.structures,find=(type,id)=>structures.find(x=>x.key===academicKey(r.sourceSystem,r.institutionId,type,id));
 for(const row of differences){if(!['new','changed','unchanged'].includes(row.classification))continue;let reason=null;
  if(kind==='STRUCTURES'){
   if(parentType[row.structureKind]&&!find(parentType[row.structureKind],row.parentId))reason='STRUCTURE_PARENT_MISSING';
   if(row.structureKind==='SEMESTER'&&structures.some(x=>x.key!==row.key&&x.sourceSystem===r.sourceSystem&&x.structureKind==='SEMESTER'&&x.parentId===row.parentId&&x.sequence===row.sequence))reason='SEMESTER_SEQUENCE_CONFLICT';
  }else{
   const p=find('PROGRAMME',row.programmeId),batch=find('BATCH',row.batchId),semester=find('SEMESTER',row.semesterId),session=find('ACADEMIC_SESSION',row.sessionId),section=row.sectionId?find('SECTION',row.sectionId):null,course=row.courseId?find('COURSE',row.courseId):null;
   if(!students.students.some(s=>s.key===misStudentKey(r.sourceSystem,r.institutionId,row.studentId)))reason='STABLE_STUDENT_REFERENCE_MISSING';
   else if(!p||!batch||!semester||!session||(row.sectionId&&!section)||(row.courseId&&!course))reason='ENROLLMENT_STRUCTURE_REFERENCE_MISSING';
   else if(batch.parentId!==p.structureId||semester.parentId!==p.structureId||(section&&section.parentId!==semester.structureId)||(course&&course.parentId!==p.structureId))reason='ENROLLMENT_PARENT_SCOPE_CONFLICT';
   const identity=['studentId','programmeId','batchId','sessionId','semesterId','sectionId','courseId'];
   if(candidate.some(x=>x.key!==row.key&&x.sourceSystem===r.sourceSystem&&same(x,row,identity)))reason='DUPLICATE_ENROLLMENT_IDENTITY_MAPPING';
   if(!reason&&row.status==='CURRENT'&&!row.courseId&&candidate.some(x=>x.key!==row.key&&x.sourceSystem===r.sourceSystem&&x.status==='CURRENT'&&!x.courseId&&same(x,row,['studentId','programmeId','batchId','sessionId'])))reason='CONFLICTING_CURRENT_CLASS_ENROLLMENTS';
   if(!reason&&row.status==='CURRENT'&&!row.courseId){const relevant=localProgressions.filter(p=>p.sourceSystem===row.sourceSystem&&p.studentId===row.studentId&&p.programmeId===row.programmeId&&p.batchId===row.batchId&&p.sessionId===row.sessionId);if(relevant.some(p=>{const from=find('SEMESTER',p.fromSemesterId),to=find('SEMESTER',p.toSemesterId);return !from||!to||from.parentId!==row.programmeId||to.parentId!==row.programmeId||to.sequence!==from.sequence+1||from.finalSemester===true})){reason='LOCAL_PROGRESSION_SOURCE_REFERENCE_INVALID'}row.reconciliation=reconcileMISClassEnrollment({enrollment:row,localProgressions,exportedAt:r.exportedAt});if(!reason&&['MIS_BEHIND_LOCAL_PROGRESSION','MIS_DIVERGES_FROM_LOCAL_PROGRESSION','AMBIGUOUS_LOCAL_PROGRESSION'].includes(row.reconciliation.status))reason='LOCAL_PROGRESSION_RECONCILIATION_REQUIRED'}
  }
  if(reason){row.classification='conflicting';row.reason=reason}
 }
 const counts={new:0,changed:0,unchanged:0,duplicate:0,invalid:0,conflicting:0};for(const row of differences)counts[row.classification]++;
 const missingWithoutAction=r.mode==='FULL_SNAPSHOT'?stored.filter(x=>x.sourceSystem===r.sourceSystem&&!keys.includes(x.key)).length:0;
 const binding=await misDigest({kind,requestFingerprint,revision,differences,counts,provenance,students,localProgressions,personId:trusted.personId});
 return {kind,revision,binding,requestFingerprint,fingerprint,counts,differences,missingWithoutAction,canCommit:!counts.duplicate&&!counts.invalid&&!counts.conflicting,replayReport:previous??null,sourceAuthority:'MIS',officialWriteBack:false,localProgressionMutated:false};
}
export async function prepareMISAcademicCommit(args){
 const {trusted,ledger,revision,request,confirmation,kind,provenance=null}=args,p=await previewMISAcademicImport(args);
 check(exact(confirmation,['confirmed','binding','expectedRevision'])&&confirmation.confirmed===true,'EXPLICIT_IMPORT_CONFIRMATION_REQUIRED');
 if(p.replayReport){check(await misDigest(p.replayReport.sourceFile??null)===await misDigest(provenance)&&confirmation.binding===p.replayReport.confirmedBinding&&confirmation.expectedRevision===p.replayReport.previousRevision,'ACADEMIC_REPLAY_CONFIRMATION_CONFLICT');return {replayed:true,report:clone(p.replayReport)}}
 check(confirmation.binding===p.binding&&confirmation.expectedRevision===revision,'IMPORT_PREVIEW_CHANGED');check(p.canCommit,'IMPORT_ERRORS_UNRESOLVED');
 const next=clone(ledger),target=kind==='STRUCTURES'?next.structures:next.enrollments,changes=[];
 for(const row of p.differences){const {row:rowNumber,classification,reason,reconciliation,...value}=row,record={...value,exportedAt:request.exportedAt,importOperationId:request.operationId},i=target.findIndex(x=>x.key===row.key),before=i<0?null:clone(target[i]);if(i<0)target.push(record);else target[i]=record;changes.push({key:row.key,observationOnly:classification==='unchanged',before,after:clone(record),reconciliation:reconciliation??null})}
 const report={operationId:request.operationId,kind,requestFingerprint:p.requestFingerprint,confirmedBinding:p.binding,previousRevision:revision,committedRevision:revision+1,filename:request.filename,fileFingerprint:provenance?.sha256??p.fingerprint,normalizedCSVFingerprint:p.fingerprint,sourceFile:clone(provenance),exportedAt:request.exportedAt,processedAt:trusted.now,...(provenance?{uploadedAt:provenance.uploadedAt}:{}),uploader:trusted.subject,confirmedBy:trusted.personId,mappingVersion:request.mapping.version,mapping:clone(request.mapping),sourceSystem:request.sourceSystem,institutionId:request.institutionId,mode:request.mode,counts:p.counts,missingWithoutAction:p.missingWithoutAction,result:'COMMITTED',sourceAuthority:'MIS',transferMethod:provenance?.sheet?'MANUAL_XLSX':'MANUAL_CSV',fieldAccuracyCertified:false,originalFileRetained:!!provenance,officialWriteBack:false,localProgressionMutated:false,changes};
 next.reports.push(report);check(new TextEncoder().encode(JSON.stringify(next)).length<=2000000,'MIS_ACADEMIC_LEDGER_SIZE_LIMIT');return {replayed:false,ledger:next,report};
}

// Read-only roster projection for future assignment routing. It identifies the
// imported MIS observation explicitly; it does not apply local progression,
// create task permissions, or infer class membership from course membership.
export function projectMISAcademicRoster({trusted,ledger,students,selection,asOf=trusted?.now?.slice(0,10)}){
 validateSources({trusted,ledger,students,localProgressions:[]});
 check(exact(selection,['programmeId','batchId','sessionId','semesterId','sectionId','courseId'])&&['programmeId','batchId','sessionId','semesterId'].every(k=>text(selection[k],120))&&['sectionId','courseId'].every(k=>selection[k]===null||text(selection[k],120))&&date(asOf),'INVALID_MIS_ROSTER_SELECTION');
 const rows=ledger.enrollments.filter(e=>e.sourceSystem===trusted.sourceSystem&&e.institutionId===trusted.institutionId&&e.status==='CURRENT'&&same(e,selection,['programmeId','batchId','sessionId','semesterId','sectionId','courseId'])&&(!e.effectiveFrom||e.effectiveFrom<=asOf)&&(!e.effectiveUntil||asOf<=e.effectiveUntil));
 check(new Set(rows.map(e=>e.studentId)).size===rows.length,'AMBIGUOUS_MIS_ROSTER');
 return {authority:'IMPORTED_MIS_ENROLLMENT',selection:clone(selection),asOf,officialWriteBack:false,localProgressionApplied:false,assignmentAuthorized:false,students:rows.map(e=>{const s=students.students.find(s=>s.key===misStudentKey(e.sourceSystem,e.institutionId,e.studentId));check(s,'MIS_ROSTER_STUDENT_MISSING');return {studentId:s.studentId,sourceSystem:e.sourceSystem,institutionId:e.institutionId,displayName:s.displayName,collegeStatus:s.collegeStatus,exitDate:s.exitDate,enrollmentId:e.enrollmentId,exportedAt:e.exportedAt,importOperationId:e.importOperationId}})};
}
