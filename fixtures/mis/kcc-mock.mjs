// Entirely fictional. No vendor schema, real students, credentials, URL or authentication protocol.
export function createMockMISSnapshot(){
 const validity={validFrom:'2026-01-01T00:00:00.000Z',validUntil:'2028-01-01T00:00:00.000Z'};
 return {contract:'KCC360_MIS_NORMALIZED_V1',mode:'MOCK',fictional:true,tenantId:'MOCK_KCC',snapshotId:'MOCK_SNAPSHOT_1',version:1,...validity,
  people:[{personId:'MOCK_PERSON_A',displayName:'Fictional Student A',status:'ACTIVE'},{personId:'MOCK_PERSON_B',displayName:'Fictional Student B',status:'ACTIVE'},{personId:'MOCK_PERSON_G',displayName:'Fictional Guardian A',status:'ACTIVE'}],
  // MIS identifiers are explicitly linked to application person identifiers; never match by name/email.
  personLinks:[{externalPersonId:'MOCK_MIS_PERSON_A',personId:'MOCK_PERSON_A',version:1},{externalPersonId:'MOCK_MIS_PERSON_B',personId:'MOCK_PERSON_B',version:1},{externalPersonId:'MOCK_MIS_PERSON_G',personId:'MOCK_PERSON_G',version:1}],
  students:[{studentId:'MOCK_STUDENT_A',personId:'MOCK_PERSON_A',version:1,collegeStatus:'ENROLLED'},{studentId:'MOCK_STUDENT_B',personId:'MOCK_PERSON_B',version:1,collegeStatus:'LEFT_COLLEGE'}],
  enrollments:[{id:'MOCK_ENROLLMENT_A',studentId:'MOCK_STUDENT_A',departmentId:'MOCK_ACADEMIC',programmeId:'MOCK_PROGRAMME',batchId:'MOCK_BATCH',semesterId:'MOCK_SEMESTER_3',courseIds:['MOCK_COURSE'],version:1,status:'CURRENT'},{id:'MOCK_ENROLLMENT_B',studentId:'MOCK_STUDENT_B',departmentId:'MOCK_ACADEMIC',programmeId:'MOCK_PROGRAMME',batchId:'MOCK_BATCH',semesterId:'MOCK_SEMESTER_3',courseIds:['MOCK_COURSE'],version:1,status:'CURRENT'}],
  contacts:[{id:'MOCK_CONTACT_A',studentId:'MOCK_STUDENT_A',personId:'MOCK_PERSON_A',kind:'STUDENT',email:'fictional-student-a@example.test',version:1,status:'VERIFIED',relationshipStatus:'NOT_APPLICABLE',relationshipVersion:null,communicationPermission:'GRANTED',communicationPermissionVersion:1,purpose:'REFLECTION_APPRECIATION',...validity},{id:'MOCK_CONTACT_G',studentId:'MOCK_STUDENT_A',personId:'MOCK_PERSON_G',kind:'GUARDIAN',email:'fictional-guardian-a@example.test',version:1,status:'VERIFIED',relationshipStatus:'VERIFIED',relationshipVersion:1,communicationPermission:'GRANTED',communicationPermissionVersion:1,purpose:'REFLECTION_APPRECIATION',...validity}],
  identityLinks:[{provider:'MOCK_PROVIDER',issuer:'MOCK_ISSUER',subject:'MOCK_SUBJECT_A',tenantId:'MOCK_KCC',personId:'MOCK_PERSON_A',version:1,status:'ACTIVE',...validity}]
 };
}
