// Server-only pure mapping of existing intake shapes. No live import or migration.
// Caller loads the intake, freshly resolved identity and approved masters/roster.
import {IDENTITY_GRANT_ADAPTER_VERSION} from './identity-grant-adapter.mjs';
export const intakeNormalizationConfiguration=Object.freeze({enabled:false});
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const canonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const deny=reason=>({ok:false,reason,proposal:null,mapping:null});
const approved=(s,institution,now)=>s?.institutionId===institution&&s.status==='APPROVED'&&id(s.id)&&pos(s.version)&&id(s.approvalReference)&&stamp(s.validFrom)&&stamp(s.validUntil)&&Date.parse(s.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(s.validUntil);
export function normalizeExistingIntakePilot({configuration=intakeNormalizationConfiguration,intake:r,identity,roster,academicMasters,now,expectedMapping}={}){
 if(configuration?.enabled!==true)return deny('NORMALIZATION_DISABLED');
 if(!stamp(now)||!identity?.ok||identity.adapterVersion!==IDENTITY_GRANT_ADAPTER_VERSION||!identity.principal?.active||!id(identity.principal.tenantId)||!pos(identity.authorizationVersion)||identity.evaluatedAt!==now||!stamp(identity.validUntil)||Date.parse(now)>=Date.parse(identity.validUntil))return deny('FRESH_RESOLVED_IDENTITY_REQUIRED');
 if(!r||!id(r.id)||!id(r.student)||!pos(r.revision)||!['DRAFT','RETURNED'].includes(r.state)||!r.content)return deny('EDITABLE_EXISTING_INTAKE_REQUIRED');
 const choice=r.teamInitiation;
 if(!choice||choice.enabled!==true)return deny('LEGACY_INTAKE_NOT_OPTED_IN');
 if(!['SAME_BATCH_ACADEMIC','MULTIDISCIPLINARY_RESEARCH'].includes(choice.kind)||!pos(choice.teamVersion))return deny('EXPLICIT_TEAM_CASE_REQUIRED');
 if(choice.kind==='SAME_BATCH_ACADEMIC'?r.content.type!=='Project':r.content.type!=='Research')return deny('INTAKE_TYPE_CASE_MISMATCH');
 const institution=identity.principal.tenantId;
 if(!approved(roster,institution,now)||!Array.isArray(roster.students)||!approved(academicMasters,institution,now)||!Array.isArray(academicMasters.programmes)||!Array.isArray(academicMasters.offerings))return deny('APPROVED_CURRENT_MASTERS_REQUIRED');
 if(!identity.personMap||!Object.hasOwn(identity.personMap,r.student)||!id(identity.personMap[r.student]))return deny('VERIFIED_ACTOR_LINK_REQUIRED');
 const person=identity.personMap[r.student],students=roster.students.filter(s=>s.institutionId===institution&&s.personId===person);
 if(students.length!==1)return deny('UNIQUE_STUDENT_IDENTITY_REQUIRED');const student=students[0];
 if(!id(student.id)||!pos(student.version)||student.status!=='ACTIVE'||roster.students.filter(s=>s.institutionId===institution&&s.id===student.id).length!==1)return deny('CURRENT_STUDENT_SOURCE_REQUIRED');
 const programmes=academicMasters.programmes.filter(p=>p.id===student.programmeId&&p.label===r.content.programme);
 if(programmes.length!==1||!id(programmes[0].id)||!pos(programmes[0].version))return deny('EXACT_PROGRAMME_MAPPING_REQUIRED');
 const proposal={id:r.id,version:r.revision,teamVersion:choice.teamVersion,institutionId:institution,leadStudentId:student.id,kind:choice.kind,state:r.state};let offering=null;
 if(choice.kind==='SAME_BATCH_ACADEMIC'){
  if(!id(choice.offeringId))return deny('EXPLICIT_COURSE_OFFERING_REQUIRED');
  const matches=academicMasters.offerings.filter(o=>o.id===choice.offeringId);
  if(matches.length!==1)return deny('UNIQUE_COURSE_OFFERING_REQUIRED');offering=matches[0];
  if(!pos(offering.version)||![offering.programmeId,offering.batchId,offering.semesterId,offering.courseId].every(id)||offering.programmeId!==student.programmeId||offering.batchId!==student.batchId||offering.semesterId!==student.semesterId||!Array.isArray(student.courseIds)||!student.courseIds.includes(offering.courseId)||offering.semesterLabel!==r.content.semester||offering.courseLabel!==r.content.course)return deny('EXACT_COHORT_COURSE_MAPPING_REQUIRED');
  Object.assign(proposal,{programmeId:offering.programmeId,batchId:offering.batchId,semesterId:offering.semesterId,courseId:offering.courseId});
 }
 const mapping={intakeId:r.id,intakeRevision:r.revision,teamVersion:choice.teamVersion,kind:choice.kind,state:r.state,actorId:r.student,personId:person,studentId:student.id,studentVersion:student.version,authorizationVersion:identity.authorizationVersion,rosterId:roster.id,rosterVersion:roster.version,mastersId:academicMasters.id,mastersVersion:academicMasters.version,programmeId:programmes[0].id,programmeVersion:programmes[0].version,offeringId:offering?.id??null,offeringVersion:offering?.version??null,academicScope:offering?{batchId:offering.batchId,semesterId:offering.semesterId,courseId:offering.courseId}:null};
 if(expectedMapping!==undefined&&canonical(expectedMapping)!==canonical(mapping))return deny('NORMALIZED_SOURCE_CHANGED');
 return {ok:true,reason:'ISOLATED_NORMALIZED_SOURCE',proposal:structuredClone(proposal),mapping:structuredClone(mapping)};
}
