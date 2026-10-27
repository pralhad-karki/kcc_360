import {createMockMISSnapshot} from '../fixtures/mis/kcc-mock.mjs';
export const misIntegrationConfiguration=Object.freeze({mode:'DISABLED'});
export const MIS_CONTRACT='KCC360_MIS_NORMALIZED_V1';
const clone=v=>structuredClone(v),plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const exact=(v,keys)=>plain(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const id=v=>typeof v==='string'&&/^MOCK_[A-Z0-9_]{1,100}$/.test(v),version=v=>Number.isSafeInteger(v)&&v>0;
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const period=v=>stamp(v.validFrom)&&stamp(v.validUntil)&&v.validFrom<v.validUntil;
const current=(v,now)=>period(v)&&v.validFrom<=now&&now<v.validUntil;
const unique=(rows,key)=>new Set(rows.map(key)).size===rows.length;
const tuple=v=>JSON.stringify([v.provider,v.issuer,v.subject,v.tenantId]);
const deny=reason=>({ok:false,reason,mode:'MOCK',fictional:true,authenticated:false,canAccessLiveWorkspace:false});
// Validates only our normalized fictional contract. Official vendor translation is deliberately absent.
export function validateMockMISSnapshot(s){
 const fail=reason=>({ok:false,reason});
 if(!exact(s,['contract','mode','fictional','tenantId','snapshotId','version','validFrom','validUntil','people','personLinks','students','enrollments','contacts','identityLinks'])||s.contract!==MIS_CONTRACT||s.mode!=='MOCK'||s.fictional!==true||![s.tenantId,s.snapshotId].every(id)||!version(s.version)||!period(s)||!['people','personLinks','students','enrollments','contacts','identityLinks'].every(k=>Array.isArray(s[k])))return fail('INVALID_MOCK_ENVELOPE');
 if(!s.people.every(p=>exact(p,['personId','displayName','status'])&&id(p.personId)&&typeof p.displayName==='string'&&p.displayName.startsWith('Fictional ')&&p.displayName.length<=100&&['ACTIVE','INACTIVE'].includes(p.status))||!unique(s.people,p=>p.personId))return fail('INVALID_MOCK_PEOPLE');
 const people=new Map(s.people.map(p=>[p.personId,p]));
 if(!s.personLinks.every(p=>exact(p,['externalPersonId','personId','version'])&&id(p.externalPersonId)&&people.has(p.personId)&&version(p.version))||!unique(s.personLinks,p=>p.externalPersonId)||!unique(s.personLinks,p=>p.personId)||s.people.some(p=>!s.personLinks.some(l=>l.personId===p.personId)))return fail('AMBIGUOUS_PERSON_MAPPING');
 if(!s.students.every(p=>exact(p,['studentId','personId','version','collegeStatus'])&&id(p.studentId)&&people.has(p.personId)&&version(p.version)&&['ENROLLED','LEFT_COLLEGE','ON_BREAK','REPEATING','UNKNOWN'].includes(p.collegeStatus))||!unique(s.students,p=>p.studentId)||!unique(s.students,p=>p.personId))return fail('INVALID_MOCK_STUDENTS');
 const students=new Map(s.students.map(p=>[p.studentId,p]));
 if(!s.enrollments.every(p=>exact(p,['id','studentId','departmentId','programmeId','batchId','semesterId','courseIds','version','status'])&&[p.id,p.departmentId,p.programmeId,p.batchId,p.semesterId].every(id)&&students.has(p.studentId)&&Array.isArray(p.courseIds)&&p.courseIds.every(id)&&unique(p.courseIds,v=>v)&&version(p.version)&&['CURRENT','HISTORICAL'].includes(p.status))||!unique(s.enrollments,p=>p.id)||!unique(s.enrollments.filter(p=>p.status==='CURRENT'),p=>p.studentId))return fail('INVALID_MOCK_ENROLLMENTS');
 if(!s.contacts.every(p=>exact(p,['id','studentId','personId','kind','email','version','status','relationshipStatus','relationshipVersion','communicationPermission','communicationPermissionVersion','purpose','validFrom','validUntil'])&&id(p.id)&&students.has(p.studentId)&&people.has(p.personId)&&version(p.version)&&['STUDENT','GUARDIAN'].includes(p.kind)&&typeof p.email==='string'&&/^[a-z0-9.-]+@example\.test$/.test(p.email)&&['VERIFIED','UNVERIFIED','REVOKED'].includes(p.status)&&['GRANTED','WITHDRAWN','UNKNOWN'].includes(p.communicationPermission)&&version(p.communicationPermissionVersion)&&p.purpose==='REFLECTION_APPRECIATION'&&period(p)&&(p.kind==='STUDENT'?p.personId===students.get(p.studentId).personId&&p.relationshipStatus==='NOT_APPLICABLE'&&p.relationshipVersion===null:p.personId!==students.get(p.studentId).personId&&['VERIFIED','UNVERIFIED','REVOKED'].includes(p.relationshipStatus)&&version(p.relationshipVersion)))||!unique(s.contacts,p=>p.id)||!unique(s.contacts,p=>JSON.stringify([p.studentId,p.personId,p.kind])))return fail('INVALID_MOCK_CONTACTS');
 if(!s.identityLinks.every(p=>exact(p,['provider','issuer','subject','tenantId','personId','version','status','validFrom','validUntil'])&&[p.provider,p.issuer,p.subject].every(id)&&p.tenantId===s.tenantId&&people.has(p.personId)&&version(p.version)&&['ACTIVE','REVOKED'].includes(p.status)&&period(p))||!unique(s.identityLinks,tuple))return fail('INVALID_MOCK_IDENTITY_LINKS');
 return {ok:true};
}
// Configuration belongs to server composition, never to request JSON or browser storage.
/** @param {{configuration?: {mode: 'DISABLED'|'MOCK'|'OFFICIAL'}, snapshot?: ReturnType<typeof createMockMISSnapshot>, clock?: ()=>string}} [options] */
export function createMISAdapter({configuration=misIntegrationConfiguration,snapshot,clock=()=>new Date().toISOString()}={}){
 const mode=configuration?.mode;
 if(!['DISABLED','MOCK','OFFICIAL'].includes(mode))throw Error('Unknown MIS integration mode');
 if(mode!=='MOCK'){
  const reason=mode==='OFFICIAL'?'OFFICIAL_MIS_ADAPTER_NOT_INSTALLED':'MIS_INTEGRATION_DISABLED';
  const blocked=async()=>({ok:false,mode,reason});
  return Object.freeze({mode,readiness:()=>({mode,ready:false,reason}),loadStudents:blocked,loadContacts:blocked,resolveMockIdentity:blocked});
 }
 const fixture=clone(snapshot??createMockMISSnapshot()),validation=validateMockMISSnapshot(fixture);if(!validation.ok)throw Error(validation.reason);
 const evidence=()=>({mode:'MOCK',fictional:true,contract:MIS_CONTRACT,tenantId:fixture.tenantId,snapshotId:fixture.snapshotId,version:fixture.version,validUntil:fixture.validUntil});
 const fresh=()=>{const now=clock();return stamp(now)&&current(fixture,now)?now:null};
 return Object.freeze({mode,readiness:()=>({...evidence(),ready:!!fresh(),productionReady:false}),
  async loadStudents(){if(!fresh())return deny('MOCK_SOURCE_EXPIRED');return {ok:true,source:evidence(),students:fixture.students.map(s=>({...clone(s),displayName:fixture.people.find(p=>p.personId===s.personId).displayName,enrollments:clone(fixture.enrollments.filter(e=>e.studentId===s.studentId))}))}},
  async loadContacts({studentId,purpose}={}){const now=fresh();if(!now)return deny('MOCK_SOURCE_EXPIRED');if(!id(studentId)||purpose!=='REFLECTION_APPRECIATION')return deny('SCOPED_CONTACT_PURPOSE_REQUIRED');if(!fixture.students.some(s=>s.studentId===studentId))return deny('MOCK_STUDENT_UNAVAILABLE');return {ok:true,source:evidence(),contacts:clone(fixture.contacts.filter(c=>c.studentId===studentId&&c.status==='VERIFIED'&&fixture.people.find(p=>p.personId===c.personId)?.status==='ACTIVE'&&c.communicationPermission==='GRANTED'&&c.purpose===purpose&&current(c,now)&&(c.kind!=='GUARDIAN'||c.relationshipStatus==='VERIFIED')))}},
  async resolveMockIdentity(assertion){const now=fresh();if(!now)return deny('MOCK_SOURCE_EXPIRED');if(!exact(assertion,['provider','issuer','subject','tenantId'])||![assertion.provider,assertion.issuer,assertion.subject].every(id)||assertion.tenantId!==fixture.tenantId)return deny('EXACT_MOCK_IDENTITY_REQUIRED');const link=fixture.identityLinks.find(l=>tuple(l)===tuple(assertion));if(!link||link.status!=='ACTIVE'||!current(link,now)||fixture.people.find(p=>p.personId===link.personId)?.status!=='ACTIVE')return deny('MOCK_IDENTITY_UNAVAILABLE');return {ok:true,source:evidence(),authenticated:false,canAccessLiveWorkspace:false,authorizationContext:null,grants:[],principal:{tenantId:fixture.tenantId,personId:link.personId},validUntil:[fixture.validUntil,link.validUntil].sort()[0]}}
 });
}
export const misAdapter=createMISAdapter();
