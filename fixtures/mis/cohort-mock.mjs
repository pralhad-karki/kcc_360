import {createMockMISSnapshot} from './kcc-mock.mjs';
// Fictional cohort only; does not initialize or replace workspace academic profiles.
export function createMockCohortSnapshot(){
 const s=createMockMISSnapshot();s.snapshotId='MOCK_COHORT_SNAPSHOT_1';
 for(const [suffix,collegeStatus,semester] of [['C','ON_BREAK',3],['D','REPEATING',3],['E','UNKNOWN',3],['F','ENROLLED',3],['H','ENROLLED',4]]){
  const personId='MOCK_PERSON_'+suffix,studentId='MOCK_STUDENT_'+suffix;
  s.people.push({personId,displayName:'Fictional Student '+suffix,status:'ACTIVE'});
  s.personLinks.push({externalPersonId:'MOCK_MIS_PERSON_'+suffix,personId,version:1});
  s.students.push({studentId,personId,version:1,collegeStatus});
  s.enrollments.push({id:'MOCK_ENROLLMENT_'+suffix,studentId,departmentId:'MOCK_ACADEMIC',programmeId:'MOCK_PROGRAMME',batchId:'MOCK_BATCH',semesterId:'MOCK_SEMESTER_'+semester,courseIds:['MOCK_COURSE'],version:1,status:'CURRENT'});
 }
 return s;
}
export function mockCohortConfiguration(){return {
 structure:{id:'MOCK_STRUCTURE_1',version:1,tenantId:'MOCK_KCC',programmeId:'MOCK_PROGRAMME',fictional:true,periods:[1,2,3,4].map(n=>({period:'MOCK_SEMESTER_'+n,label:'Fictional semester '+n,year:n<=2?'Fictional year 1':'Fictional year 2'}))},
 cohorts:[{id:'MOCK_SEMESTER_3_COHORT',label:'Fictional cohort — semester 3',tenantId:'MOCK_KCC',programmeId:'MOCK_PROGRAMME',batchId:'MOCK_BATCH',semesterId:'MOCK_SEMESTER_3'},{id:'MOCK_FINAL_COHORT',label:'Fictional cohort — final semester',tenantId:'MOCK_KCC',programmeId:'MOCK_PROGRAMME',batchId:'MOCK_BATCH',semesterId:'MOCK_SEMESTER_4'}]
}}
