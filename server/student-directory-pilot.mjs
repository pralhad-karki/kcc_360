// Isolated minimum-data search. Trusted source/identity/grant loader required; no live API.
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const positive=v=>Number.isSafeInteger(v)&&v>0;
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const check=(v,m)=>{if(!v)throw Error(m)};
const cleanName=v=>typeof v==='string'&&v.trim().length>0&&v.length<=200&&!/[\u0000-\u001f]/.test(v);
const normalized=v=>v.normalize('NFKC').trim().toLocaleLowerCase('en');
export function searchStudentDirectoryPilot({proposal:p,viewerPersonId,students=[],grants=[],now,query,filters={},offset=0,limit=20}={}){
 check(p&&id(p.id)&&positive(p.version)&&id(p.institutionId)&&id(p.leadStudentId)&&['MULTIDISCIPLINARY_RESEARCH','SAME_BATCH_ACADEMIC'].includes(p.kind)&&['DRAFT','RETURNED'].includes(p.state),'EDITABLE_PROPOSAL_REQUIRED');
 check(id(viewerPersonId)&&stamp(now)&&Array.isArray(students)&&Array.isArray(grants),'TRUSTED_DIRECTORY_CONTEXT_REQUIRED');
 const lead=students.filter(s=>s.id===p.leadStudentId&&s.institutionId===p.institutionId);
 check(lead.length===1&&lead[0].personId===viewerPersonId&&lead[0].status==='ACTIVE'&&positive(lead[0].version),'CURRENT_PROPOSAL_LEAD_REQUIRED');
 const permits=grants.filter(g=>g.capability==='STUDENT_DIRECTORY_SEARCH'&&g.personId===viewerPersonId&&g.institutionId===p.institutionId&&g.proposalId===p.id&&g.proposalVersion===p.version&&!g.revokedAt&&stamp(g.validFrom)&&stamp(g.validUntil)&&Date.parse(g.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(g.validUntil));
 check(permits.length===1&&id(permits[0].id)&&positive(permits[0].version),'EXPLICIT_SCOPED_DIRECTORY_GRANT_REQUIRED');
 check(typeof query==='string'&&query.length<=120&&!/[\u0000-\u001f]/.test(query)&&normalized(query).length>=2,'BOUNDED_SEARCH_QUERY_REQUIRED');
 check(plain(filters)&&Object.keys(filters).every(k=>['departmentId','programmeId','batchId','semesterId'].includes(k))&&Object.values(filters).every(id),'INVALID_DIRECTORY_FILTER');
 check(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000&&Number.isSafeInteger(limit)&&limit>=1&&limit<=20,'INVALID_SEARCH_PAGE');
 if(p.kind==='SAME_BATCH_ACADEMIC'){
  check([p.programmeId,p.batchId,p.semesterId,p.courseId].every(id),'VERIFIED_ACADEMIC_CONTEXT_REQUIRED');
  check(['programmeId','batchId','semesterId'].every(k=>lead[0][k]===p[k])&&Array.isArray(lead[0].courseIds)&&lead[0].courseIds.includes(p.courseId),'LEAD_ACADEMIC_SCOPE_REQUIRED');
  check(['programmeId','batchId','semesterId'].every(k=>!filters[k]||filters[k]===p[k]),'FILTER_OUTSIDE_PROPOSAL_SCOPE');
 }
 const institutionStudents=students.filter(s=>s.institutionId===p.institutionId),q=normalized(query);
 const matches=institutionStudents.filter(s=>{
  if(!id(s.id)||!id(s.personId)||!positive(s.version)||!cleanName(s.displayName)||s.status!=='ACTIVE'||s.personId===viewerPersonId||![s.departmentId,s.programmeId,s.batchId,s.semesterId].every(id))return false;
  // Ambiguous source identity must never become a selectable student.
  if(institutionStudents.filter(x=>x.id===s.id).length!==1||institutionStudents.filter(x=>x.personId===s.personId).length!==1)return false;
  if(p.kind==='SAME_BATCH_ACADEMIC'&&(s.programmeId!==p.programmeId||s.batchId!==p.batchId||s.semesterId!==p.semesterId||!Array.isArray(s.courseIds)||!s.courseIds.includes(p.courseId)))return false;
  return Object.entries(filters).every(([k,v])=>s[k]===v)&&(normalized(s.id).includes(q)||normalized(s.displayName).includes(q));
 }).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
 const rows=matches.slice(offset,offset+limit).map(s=>({studentId:s.id,studentVersion:s.version,displayName:s.displayName.trim(),departmentId:s.departmentId,programmeId:s.programmeId,batchId:s.batchId,semesterId:s.semesterId}));
 return {pilot:true,proposalId:p.id,proposalVersion:p.version,rows,nextOffset:offset+limit<matches.length?offset+limit:null,membershipGranted:false};
}
