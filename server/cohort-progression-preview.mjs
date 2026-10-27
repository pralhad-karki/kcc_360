// Pure read-only planning. No approval, placement update, identity grant or MIS write-back.
const id=v=>typeof v==='string'&&/^MOCK_[A-Z0-9_]{1,100}$/.test(v),version=v=>Number.isSafeInteger(v)&&v>0;
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const unique=(rows,key)=>new Set(rows.map(key)).size===rows.length;
/** @param {{roster?: any, structure?: any, cohort?: any, now?: string}} [input] Validated normalized JSON; never an authentication context. */
export function prepareMockCohortProgression({roster,structure,cohort,now=new Date().toISOString()}={}){
 const fail=reason=>({ok:false,status:'BLOCKED',reason,canApply:false});
 const source=roster?.source;
 if(roster?.ok!==true||source?.mode!=='MOCK'||source.fictional!==true||source.contract!=='KCC360_MIS_NORMALIZED_V1'||![source.tenantId,source.snapshotId].every(id)||!version(source.version)||!stamp(now)||!stamp(source.validUntil)||now>=source.validUntil||!Array.isArray(roster.students))return fail('CURRENT_FICTIONAL_ROSTER_REQUIRED');
 if(structure?.fictional!==true||!id(structure.id)||!version(structure.version)||structure.tenantId!==source.tenantId||!id(structure.programmeId)||!Array.isArray(structure.periods)||!structure.periods.length||!structure.periods.every(p=>p&&typeof p==='object'&&id(p.period)&&typeof p.label==='string'&&p.label.trim()&&typeof p.year==='string'&&p.year.trim())||!unique(structure.periods,p=>p.period))return fail('EXPLICIT_FICTIONAL_PROGRAMME_STRUCTURE_REQUIRED');
 if(!cohort||typeof cohort.label!=='string'||!cohort.label.trim()||cohort.tenantId!==source.tenantId||cohort.programmeId!==structure.programmeId||![cohort.id,cohort.batchId,cohort.semesterId].every(id))return fail('SCOPED_COHORT_REQUIRED');
 const index=structure.periods.findIndex(p=>p.period===cohort.semesterId);if(index<0)return fail('COHORT_PERIOD_NOT_CONFIGURED');
 const students=roster.students;
 if(!students.every(s=>s&&typeof s==='object'&&id(s.studentId)&&id(s.personId)&&version(s.version)&&typeof s.displayName==='string'&&s.displayName.startsWith('Fictional ')&&['ENROLLED','LEFT_COLLEGE','ON_BREAK','REPEATING','UNKNOWN'].includes(s.collegeStatus)&&Array.isArray(s.enrollments))||!unique(students,s=>s.studentId)||!unique(students,s=>s.personId))return fail('UNIQUE_STABLE_ROSTER_REQUIRED');
 const enrollmentIds=new Set(),members=[];
 for(const student of students){
  const current=student.enrollments.filter(e=>e?.status==='CURRENT');
  if(current.length!==1)return fail('UNAMBIGUOUS_CURRENT_ENROLLMENT_REQUIRED');
  const e=current[0];if(e.studentId!==student.studentId||![e.id,e.programmeId,e.batchId,e.semesterId].every(id)||!version(e.version)||enrollmentIds.has(e.id))return fail('INVALID_CURRENT_ENROLLMENT');enrollmentIds.add(e.id);
  if(e.programmeId===cohort.programmeId&&!structure.periods.some(p=>p.period===e.semesterId))return fail('ENROLLMENT_PERIOD_NOT_CONFIGURED');
  if(e.programmeId===cohort.programmeId&&e.batchId===cohort.batchId&&e.semesterId===cohort.semesterId)members.push({student,enrollment:e});
 }
 if(!members.length)return fail('COHORT_HAS_NO_RECORDED_MEMBERS');
 const period=p=>p?{semesterId:p.period,label:p.label,year:p.year}:null,from=period(structure.periods[index]),next=period(structure.periods[index+1]);
 const rows=members.map(({student:s,enrollment:e})=>{
  const left=s.collegeStatus==='LEFT_COLLEGE';return {studentId:s.studentId,personId:s.personId,displayName:s.displayName,collegeStatus:s.collegeStatus,studentVersion:s.version,enrollmentId:e.id,enrollmentVersion:e.version,from:{...from},to:!left&&next?{...next}:null,decision:left?'EXCLUDED_LEFT_COLLEGE':next?'ADVANCE_PREVIEW':'FINAL_SEMESTER_REVIEW'};
 }).sort((a,b)=>a.studentId.localeCompare(b.studentId));
 const excluded=rows.filter(r=>r.decision==='EXCLUDED_LEFT_COLLEGE').length;
 return {ok:true,status:'MOCK_PREVIEW_ONLY',fictional:true,canApply:false,canApprove:false,canSubmit:false,source:{snapshotId:source.snapshotId,version:source.version,tenantId:source.tenantId,validUntil:source.validUntil},structure:{id:structure.id,version:structure.version,fictional:true},cohort:{id:cohort.id,label:cohort.label,programmeId:cohort.programmeId,batchId:cohort.batchId,from,to:next},counts:{cohort:rows.length,included:rows.length-excluded,excludedLeftCollege:excluded,advance:rows.filter(r=>r.decision==='ADVANCE_PREVIEW').length,finalReview:rows.filter(r=>r.decision==='FINAL_SEMESTER_REVIEW').length},rows};
}
