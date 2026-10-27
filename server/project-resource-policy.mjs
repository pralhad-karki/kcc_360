// Pilot project resource adapter / protected summary read. No live route imports this module.
// Session, authority, resource index, workspace and actor must be loaded by trusted server code.
import {prepareAuthorizationContext} from './identity-grant-adapter.mjs';
import {permissionTimestamp,resolvePermission} from './permission-policy.mjs';
import {createEngine} from './engine.mjs';
export const PROJECT_RESOURCE_ADAPTER_VERSION='PILOT-1';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const id=v=>typeof v==='string'&&v.length>0&&v.length<=200&&v===v.trim()&&!v.includes('*');
const exact=(v,keys)=>plain(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const scopeKeys=new Set(['tenantId','departmentId','programmeId','projectId','clubId','recordId']);
const at=permissionTimestamp;
function validBinding(r,tenant){return exact(r,['id','scope','classification'])&&id(r.id)&&plain(r.scope)&&Object.keys(r.scope).every(k=>scopeKeys.has(k)&&id(r.scope[k]))&&['tenantId','projectId','recordId'].every(k=>Object.hasOwn(r.scope,k))&&r.scope.tenantId===tenant&&r.scope.projectId===r.id&&r.scope.recordId===r.id&&['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'].includes(r.classification)}
export function prepareProjectPermission(input={}){
 const fail=reason=>({ok:false,reason,adapterVersion:PROJECT_RESOURCE_ADAPTER_VERSION});
 if(!plain(input)||!id(input.projectId)||!['RECORD.READ','ACTIVITY.APPROVE'].includes(input.permission))return fail('UNSUPPORTED_PROJECT_REQUEST');
 // Never accept caller-provided scope, classification, record or relationship overrides.
 if(Object.keys(input).some(k=>!['session','authority','now','workspace','resourceIndex','projectId','permission','actor'].includes(k)))return fail('UNTRUSTED_RESOURCE_OVERRIDE');
 const context=prepareAuthorizationContext(input);if(!context.ok)return fail(context.reason);
 const {workspace,index}= {workspace:input.workspace,index:input.resourceIndex},time=at(input.now);
 if(!exact(workspace,['id','revision','data'])||!id(workspace.id)||!integer(workspace.revision)||!plain(workspace.data)||!Array.isArray(workspace.data.projects))return fail('INVALID_WORKSPACE');
 if(!exact(index,['workspaceId','workspaceRevision','tenantId','version','validFrom','validUntil','projects'])||index.workspaceId!==workspace.id||index.tenantId!==context.principal.tenantId||!integer(index.workspaceRevision)||!Number.isSafeInteger(index.version)||index.version<1||at(index.validFrom)===null||at(index.validUntil)===null||at(index.validFrom)>=at(index.validUntil)||time<at(index.validFrom)||time>=at(index.validUntil)||!Array.isArray(index.projects)||!index.projects.every(r=>validBinding(r,index.tenantId))||new Set(index.projects.map(r=>r.id)).size!==index.projects.length)return fail('INVALID_RESOURCE_INDEX');
 if(index.workspaceRevision!==workspace.revision)return fail('STALE_RESOURCE_INDEX');
 const binding=index.projects.find(r=>r.id===input.projectId),matches=workspace.data.projects.filter(p=>p?.id===input.projectId);
 if(!binding)return fail('RESOURCE_UNMAPPED');
 if(matches.length!==1)return fail('PROJECT_UNAVAILABLE');
 const p=matches[0];
 if(!plain(p)||!['id','owner','mentor','members'].every(k=>Object.hasOwn(p,k))||!id(p.owner)||!id(p.mentor)||!Array.isArray(p.members)||!p.members.every(id)||new Set(p.members).size!==p.members.length||p.createdBy!=null&&!id(p.createdBy))return fail('INVALID_PROJECT_RELATIONSHIPS');
 if(p.sourceClub?(binding.scope.clubId!==p.sourceClub):Object.hasOwn(binding.scope,'clubId'))return fail('CLUB_SCOPE_MISMATCH');
 const isSelf=actorId=>Object.hasOwn(context.personMap,actorId)&&context.personMap[actorId]===context.principal.personId,relationships=[];
 if(isSelf(p.owner))relationships.push('OWNER');
 if(p.members.some(isSelf))relationships.push('PARTICIPANT');
 if(isSelf(p.mentor))relationships.push('ASSIGNED_MENTOR');
 if(p.createdBy&&isSelf(p.createdBy))relationships.push('RECORD_AUTHOR');
 return {ok:true,adapterVersion:PROJECT_RESOURCE_ADAPTER_VERSION,context,request:{permission:input.permission,scope:structuredClone(binding.scope),classification:binding.classification,relationships,record:{createdBy:p.createdBy??null,owner:p.owner,members:[...p.members]}},workspaceRevision:workspace.revision,resourceIndexVersion:index.version,validUntil:new Date(Math.min(at(context.validUntil),at(index.validUntil))).toISOString()};
}
export function resolveProjectResourcePermission(input={}){
 const prepared=prepareProjectPermission(input);if(!prepared.ok)return {allowed:false,capabilityOnly:true,reason:prepared.reason,adapterVersion:PROJECT_RESOURCE_ADAPTER_VERSION,grants:[]};
 const {context}=prepared,result=resolvePermission({principal:context.principal,grants:context.grants,personMap:context.personMap,request:prepared.request,now:input.now});
 return {...result,adapterVersion:PROJECT_RESOURCE_ADAPTER_VERSION,workspaceRevision:prepared.workspaceRevision,resourceIndexVersion:prepared.resourceIndexVersion,authorizationVersion:context.authorizationVersion,contextValidUntil:prepared.validUntil};
}
export function readProtectedProjectSummary(input={}){
 const fail=reason=>({ok:false,reason});
 if(input?.permission!=='RECORD.READ')return fail('READ_PERMISSION_REQUIRED');
 const prepared=prepareProjectPermission(input);if(!prepared.ok)return fail(prepared.reason);
 const {context}=prepared;
 if(!id(input.actor)||!Object.hasOwn(context.personMap,input.actor)||context.personMap[input.actor]!==context.principal.personId)return fail('ACTOR_PERSON_MISMATCH');
 const decision=resolvePermission({principal:context.principal,grants:context.grants,personMap:context.personMap,request:prepared.request,now:input.now});
 if(!decision.allowed)return fail(decision.reason);
 // Intersection with the existing engine's actor/record view, not a replacement for its access guard.
 const engine=createEngine(input.workspace.data,input.actor);if(!engine.actors().some(actor=>actor.id===input.actor))return fail('EXISTING_ACTOR_UNAVAILABLE');
 const p=engine.view().projects.find(p=>p.id===input.projectId);
 if(!p)return fail('EXISTING_RECORD_ACCESS_DENIED');
 const record={};for(const key of ['id','title','programme','type','state','due']){if(typeof p[key]!=='string')return fail('INVALID_PROJECT_SUMMARY');record[key]=p[key]}
 return {ok:true,record,authorization:{policyVersion:decision.policyVersion,adapterVersion:PROJECT_RESOURCE_ADAPTER_VERSION,authorizationVersion:context.authorizationVersion,workspaceRevision:prepared.workspaceRevision,resourceIndexVersion:prepared.resourceIndexVersion,contextValidUntil:prepared.validUntil,grants:decision.grants}};
}
