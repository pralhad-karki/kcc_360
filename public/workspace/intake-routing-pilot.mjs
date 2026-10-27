// Pure proposed routing resolver. Caller must authenticate and load authoritative inputs.
// No live engine, invitation UI, directory API, grant provisioning or workflow writes.
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const positive=v=>Number.isSafeInteger(v)&&v>0;
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const block=reason=>({status:'BLOCKED',reason,leadReviewer:null,approvalAuthority:null,binding:null});
export function resolveIntakeRoutingPilot({proposal:p,students=[],confirmations=[],assignments=[],policy,now,expectedBinding}={}){
 if(!p||!id(p.id)||!positive(p.version)||!positive(p.teamVersion)||!id(p.institutionId)||!id(p.leadStudentId)||!['MULTIDISCIPLINARY_RESEARCH','SAME_BATCH_ACADEMIC'].includes(p.kind)||!Array.isArray(p.memberIds)||!p.memberIds.length||p.memberIds.length>100||!p.memberIds.every(id)||new Set(p.memberIds).size!==p.memberIds.length||!p.memberIds.includes(p.leadStudentId)||!stamp(now)||![students,confirmations,assignments].every(Array.isArray))return block('INVALID_PROPOSAL_OR_CONTEXT');
 if(!policy||!id(policy.id)||!positive(policy.version)||policy.institutionId!==p.institutionId||policy.kind!==p.kind||!id(policy.approvalRole))return block('APPROVAL_POLICY_REQUIRED');
 const team=[];
 for(const studentId of [...p.memberIds].sort()){
  const matches=students.filter(s=>s.id===studentId);
  if(matches.length!==1)return block('UNIQUE_AUTHORITATIVE_STUDENT_REQUIRED');
  const s=matches[0];
  if(s.institutionId!==p.institutionId||s.status!=='ACTIVE'||!positive(s.version)||!id(s.personId)||!id(s.departmentId)||!id(s.programmeId))return block('CURRENT_SCOPED_STUDENT_REQUIRED');
  const accepted=confirmations.filter(c=>c.proposalId===p.id&&c.studentId===studentId&&c.teamVersion===p.teamVersion);
  if(accepted.length!==1||accepted[0].state!=='ACCEPTED'||accepted[0].studentVersion!==s.version||!positive(accepted[0].version))return block('CURRENT_MEMBER_ACCEPTANCE_REQUIRED');
  if(p.kind==='SAME_BATCH_ACADEMIC'&&(![p.programmeId,p.batchId,p.semesterId,p.courseId].every(id)||s.programmeId!==p.programmeId||s.batchId!==p.batchId||s.semesterId!==p.semesterId||!Array.isArray(s.courseIds)||!s.courseIds.includes(p.courseId)))return block('VERIFIED_BATCH_COURSE_MEMBERSHIP_REQUIRED');
  team.push({studentId,personId:s.personId,studentVersion:s.version,confirmationVersion:accepted[0].version,departmentId:s.departmentId,programmeId:s.programmeId});
 }
 if(new Set(team.map(m=>m.personId)).size!==team.length)return block('DUPLICATE_STABLE_PERSON');
 if(p.kind==='MULTIDISCIPLINARY_RESEARCH'&&new Set(team.map(s=>s.departmentId+':'+s.programmeId)).size<2)return block('MULTIDISCIPLINARY_TEAM_REQUIRED');
 const active=a=>a.institutionId===p.institutionId&&a.kind===p.kind&&!a.revokedAt&&stamp(a.validFrom)&&stamp(a.validUntil)&&Date.parse(a.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(a.validUntil);
 const subjectScope=a=>a.programmeId===p.programmeId&&a.batchId===p.batchId&&a.semesterId===p.semesterId&&a.courseId===p.courseId;
 const scoped=(capability,subject=false)=>assignments.filter(a=>a.capability===capability&&active(a)&&(!subject||subjectScope(a)));
 const valid=a=>id(a.id)&&positive(a.version)&&id(a.personId)&&!team.some(m=>m.personId===a.personId);
 let chosen,route,subjectCandidates=[];
 if(p.kind==='MULTIDISCIPLINARY_RESEARCH'){
  const rs=scoped('RESEARCH_FIRST_REVIEW');if(rs.length!==1)return block(rs.length?'CONFLICTING_RESEARCH_ASSIGNMENTS':'RESEARCH_REVIEWER_ASSIGNMENT_REQUIRED');chosen=rs[0];route='RESEARCH_COORDINATOR';
 }else{
  subjectCandidates=scoped('SUBJECT_FIRST_REVIEW',true);
  if(subjectCandidates.length>1)return block('CONFLICTING_SUBJECT_ASSIGNMENTS');
  const faculty=subjectCandidates[0];
  if(faculty&&faculty.availability==='AVAILABLE'){chosen=faculty;route='SUBJECT_FACULTY'}
  else{
   if(faculty&&faculty.availability!=='UNAVAILABLE')return block('FACULTY_AVAILABILITY_UNCONFIRMED');
   const fallback=scoped('ACADEMIC_FALLBACK',true);if(fallback.length!==1)return block(fallback.length?'CONFLICTING_FALLBACK_ASSIGNMENTS':'ACADEMIC_COORDINATOR_ASSIGNMENT_REQUIRED');chosen=fallback[0];route=faculty?'ACADEMIC_COORDINATOR_FACULTY_UNAVAILABLE':'ACADEMIC_COORDINATOR_FACULTY_UNASSIGNED';
  }
 }
 if(!valid(chosen))return block('INVALID_OR_SELF_REVIEW_ASSIGNMENT');
 if(chosen.availability!=='AVAILABLE')return block('LEAD_REVIEWER_UNAVAILABLE');
 const final=scoped('FINAL_APPROVE',p.kind==='SAME_BATCH_ACADEMIC').filter(a=>a.role===policy.approvalRole);
 if(final.length!==1||!valid(final[0]))return block('UNIQUE_INDEPENDENT_APPROVAL_AUTHORITY_REQUIRED');
 const ref=a=>({assignmentId:a.id,assignmentVersion:a.version,personId:a.personId,capability:a.capability});
 const binding=canonical({proposalId:p.id,proposalVersion:p.version,teamVersion:p.teamVersion,kind:p.kind,institutionId:p.institutionId,leadStudentId:p.leadStudentId,academicContext:p.kind==='SAME_BATCH_ACADEMIC'?{programmeId:p.programmeId,batchId:p.batchId,semesterId:p.semesterId,courseId:p.courseId}:null,team,policy:{id:policy.id,version:policy.version,approvalRole:policy.approvalRole},route,lead:ref(chosen),approval:ref(final[0]),subjectCandidates:subjectCandidates.map(a=>({...ref(a),availability:a.availability}))});
 if(expectedBinding!==undefined&&expectedBinding!==binding)return block('STALE_ROUTE_BINDING');
 return {status:'READY_FOR_FIRST_REVIEW',reason:null,leadReviewer:{...ref(chosen),route},approvalAuthority:{...ref(final[0]),role:policy.approvalRole},binding,consultationRequired:p.kind==='MULTIDISCIPLINARY_RESEARCH',executionAuthorized:false};
}
