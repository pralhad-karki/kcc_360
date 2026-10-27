// Pilot trusted-data adapter, deliberately disconnected from live sessions and endpoints.
// The caller must authenticate the session and load an authoritative, approved snapshot.
import {isValidPermissionGrant,permissionTimestamp,resolvePermission} from './permission-policy.mjs';
export const IDENTITY_GRANT_ADAPTER_VERSION='PILOT-1';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const id=v=>typeof v==='string'&&v.length>0&&v.length<=200&&v===v.trim()&&!v.includes('*');
const exact=(value,keys)=>plain(value)&&Object.keys(value).length===keys.length&&keys.every(key=>Object.hasOwn(value,key));
const integer=v=>Number.isSafeInteger(v)&&v>0;
const unique=(rows,key)=>new Set(rows.map(key)).size===rows.length;
const at=permissionTimestamp;
const period=(from,until)=>at(from)!==null&&at(until)!==null&&at(from)<at(until);
const active=(row,time)=>row.status==='ACTIVE'&&at(row.validFrom)<=time&&time<at(row.validUntil);
const identityKey=r=>JSON.stringify([r.provider,r.issuer,r.subject,r.tenantId]);
export function prepareAuthorizationContext(input={}){
 const fail=reason=>({ok:false,reason,adapterVersion:IDENTITY_GRANT_ADAPTER_VERSION});
 if(!plain(input))return fail('INVALID_INPUT');
 const {session,authority,now}=input,time=at(now);
 if(time===null)return fail('INVALID_TIME');
 if(!exact(session,['provider','issuer','subject','tenantId','authorizationVersion','expiresAt'])||!['provider','issuer','subject','tenantId'].every(k=>id(session[k]))||!integer(session.authorizationVersion)||at(session.expiresAt)===null||time>=at(session.expiresAt))return fail('INVALID_SESSION');
 if(!exact(authority,['tenantId','version','validFrom','validUntil','issuers','people','identityLinks','actorLinks','roleAssignments'])||!id(authority.tenantId)||!integer(authority.version)||!period(authority.validFrom,authority.validUntil)||time<at(authority.validFrom)||time>=at(authority.validUntil))return fail('INVALID_AUTHORITY_SNAPSHOT');
 if(session.tenantId!==authority.tenantId)return fail('TENANT_MISMATCH');
 if(session.authorizationVersion!==authority.version)return fail('STALE_AUTHORIZATION_VERSION');
 if(!Array.isArray(authority.issuers)||!authority.issuers.every(r=>exact(r,['provider','issuer'])&&id(r.provider)&&id(r.issuer))||!unique(authority.issuers,r=>JSON.stringify([r.provider,r.issuer]))||!authority.issuers.some(r=>r.provider===session.provider&&r.issuer===session.issuer))return fail('UNRECOGNIZED_ISSUER');
 if(!Array.isArray(authority.people)||!authority.people.every(r=>exact(r,['personId','status'])&&id(r.personId)&&['ACTIVE','INACTIVE'].includes(r.status))||!unique(authority.people,r=>r.personId))return fail('INVALID_PEOPLE_DIRECTORY');
 const people=new Map(authority.people.map(r=>[r.personId,r]));
 if(!Array.isArray(authority.identityLinks)||!authority.identityLinks.every(r=>exact(r,['id','version','provider','issuer','subject','tenantId','personId','status','validFrom','validUntil'])&&['id','provider','issuer','subject','tenantId','personId'].every(k=>id(r[k]))&&integer(r.version)&&r.tenantId===authority.tenantId&&people.has(r.personId)&&['ACTIVE','INACTIVE','REVOKED'].includes(r.status)&&period(r.validFrom,r.validUntil)&&authority.issuers.some(i=>i.provider===r.provider&&i.issuer===r.issuer))||!unique(authority.identityLinks,r=>r.id)||!unique(authority.identityLinks,identityKey))return fail('INVALID_IDENTITY_LINKS');
 const link=authority.identityLinks.find(r=>identityKey(r)===identityKey(session));
 if(!link||!active(link,time)||people.get(link.personId).status!=='ACTIVE')return fail('IDENTITY_NOT_ACTIVE');
 if(!Array.isArray(authority.actorLinks)||!authority.actorLinks.every(r=>exact(r,['id','version','tenantId','actorId','personId','status'])&&['id','tenantId','actorId'].every(k=>id(r[k]))&&integer(r.version)&&r.tenantId===authority.tenantId&&['VERIFIED','UNRESOLVED'].includes(r.status)&&(r.status==='VERIFIED'?id(r.personId)&&people.has(r.personId):r.personId===null))||!unique(authority.actorLinks,r=>r.id)||!unique(authority.actorLinks,r=>r.actorId))return fail('INVALID_ACTOR_LINKS');
 const personMap=Object.create(null);for(const r of authority.actorLinks)if(r.status==='VERIFIED')personMap[r.actorId]=r.personId;
 if(!Array.isArray(authority.roleAssignments)||!authority.roleAssignments.every(r=>exact(r,['grant','source','approval'])&&r.source==='KCC360_APPLICATION'&&isValidPermissionGrant(r.grant)&&r.grant.scope.tenantId===authority.tenantId&&people.has(r.grant.personId)&&(r.grant.status==='PENDING'?r.approval===null:exact(r.approval,['reference','requestedByPersonId','approvedByPersonId','approvedAt'])&&id(r.approval.reference)&&people.has(r.approval.requestedByPersonId)&&people.has(r.approval.approvedByPersonId)&&r.approval.requestedByPersonId!==r.approval.approvedByPersonId&&r.grant.personId!==r.approval.approvedByPersonId&&at(r.approval.approvedAt)!==null&&at(r.approval.approvedAt)<=time))||!unique(authority.roleAssignments,r=>r.grant.id))return fail('INVALID_ROLE_ASSIGNMENTS');
 const rows=authority.roleAssignments.filter(r=>r.grant.personId===link.personId),grants=rows.map(r=>structuredClone(r.grant));
 // A context must be rebuilt at the next known policy transition, not cached past it.
 const transitions=[at(session.expiresAt),at(authority.validUntil),at(link.validUntil)];for(const g of grants)for(const key of ['validFrom','validUntil','revokedAt']){let transition=at(g[key]);if(transition!==null&&transition>time)transitions.push(transition)}
 return {ok:true,adapterVersion:IDENTITY_GRANT_ADAPTER_VERSION,principal:{personId:link.personId,tenantId:authority.tenantId,active:true},grants,personMap:{...personMap},authorizationVersion:authority.version,evaluatedAt:now,validUntil:new Date(Math.min(...transitions)).toISOString(),provenance:{identityLink:{id:link.id,version:link.version},actorLinks:authority.actorLinks.filter(r=>r.status==='VERIFIED').map(r=>({id:r.id,version:r.version})),assignments:rows.map(r=>({id:r.grant.id,version:r.grant.version,approvalReference:r.approval?.reference||null}))}};
}
export function resolveTrustedPermission(input={}){
 const context=prepareAuthorizationContext(input);if(!context.ok)return {allowed:false,capabilityOnly:true,reason:context.reason,adapterVersion:IDENTITY_GRANT_ADAPTER_VERSION,grants:[]};
 const result=resolvePermission({principal:context.principal,grants:context.grants,personMap:context.personMap,request:input.request,now:input.now});
 return {...result,adapterVersion:IDENTITY_GRANT_ADAPTER_VERSION,authorizationVersion:context.authorizationVersion,contextValidUntil:context.validUntil};
}
