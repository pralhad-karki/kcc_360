// Pilot capability resolver. Inputs must come from trusted server identity, grant and record loaders.
// This is not wired into live authorization. Workflow/version/record guards remain mandatory.
export const PERMISSION_POLICY_VERSION='PILOT-1';
const relationshipCodes=new Set(['OWNER','PARTICIPANT','ASSIGNED_MENTOR','PLAN_AUTHOR','INSTITUTION_REVIEWER','INSTITUTION_REPORTER','RECORD_AUTHOR','AUDIENCE_RECIPIENT','SELF','ROLE_APPROVER']);
const grantKeys=new Set(['id','version','personId','roleId','status','effect','scope','permissions','clearance','validFrom','validUntil','revokedAt','relationships']);
const scopeKeys=new Set(['tenantId','departmentId','programmeId','projectId','clubId','recordId']);
const classificationOrder=['PUBLIC','INTERNAL','CONFIDENTIAL','RESTRICTED'];
function definePolicy(spec){for(const value of Object.values(spec))if(Array.isArray(value))Object.freeze(value);return Object.freeze(spec)}
// Internal pilot codes: final institutional catalogue/authority mapping requires adoption.
export const PERMISSION_CATALOG=Object.freeze({
 'PLAN.TARGET_BIND':definePolicy({relationship:'PLAN_AUTHOR',scope:['departmentId','recordId']}),
 'PLAN.TARGET_ALLOCATE':definePolicy({relationship:'INSTITUTION_REVIEWER',scope:['departmentId','recordId']}),
 'PLAN.TARGET_ISSUE':definePolicy({relationship:'INSTITUTION_REVIEWER',scope:['departmentId','recordId']}),
 'PLAN.SUBMIT':definePolicy({relationship:'PLAN_AUTHOR',scope:['recordId']}),
 'PLAN.UNIT_REVIEW':definePolicy({relationship:'INSTITUTION_REVIEWER',scope:['recordId'],independent:['owner']}),
 'PLAN.FINANCE_REVIEW':definePolicy({relationship:'INSTITUTION_REVIEWER',scope:['recordId'],independent:['owner']}),
 'PLAN.FINAL_APPROVE':definePolicy({relationship:'INSTITUTION_REVIEWER',scope:['recordId'],independent:['owner']}),
 'ACTIVITY.CREATE':definePolicy({}),
 'ACTIVITY.APPROVE':definePolicy({relationship:'ASSIGNED_MENTOR',scope:['projectId'],independent:['createdBy','owner'],independentList:'members'}),
 'REFLECTION.EVALUATE':definePolicy({relationship:'ASSIGNED_MENTOR',scope:['projectId','recordId'],independent:['student']}),
 'EVIDENCE.VERIFY':definePolicy({relationship:'ASSIGNED_MENTOR',scope:['projectId','recordId'],independent:['by']}),
 'RECORD.READ':definePolicy({scope:['recordId']}),
 'FILE.READ':definePolicy({scope:['recordId']}),
 'REPORT.READ':definePolicy({relationship:'INSTITUTION_REPORTER'}),
 'AUDIT.READ':definePolicy({relationship:'INSTITUTION_REVIEWER'}),
 'ROLE.ASSIGN':definePolicy({relationship:'ROLE_APPROVER',scope:['recordId'],independent:['requestedBy','subject']})
});
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&[Object.prototype,null].includes(Object.getPrototypeOf(value));
const own=(value,keys)=>keys.every(key=>Object.hasOwn(value,key));
const identifier=value=>typeof value==='string'&&value.length>0&&value.length<=200&&value===value.trim()&&!value.includes('*');
function timestamp(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value))return null;let parsed=Date.parse(value);return Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,19)===value.slice(0,19)?parsed:null}
function validScope(scope){return object(scope)&&Object.hasOwn(scope,'tenantId')&&identifier(scope.tenantId)&&Object.keys(scope).every(key=>scopeKeys.has(key)&&identifier(scope[key]))}
function covers(granted,requested){return Object.entries(granted).every(([key,value])=>requested[key]===value)}
function validGrant(g){return object(g)&&own(g,['id','version','personId','roleId','status','effect','scope','permissions','clearance'])&&Object.keys(g).every(key=>grantKeys.has(key))&&identifier(g.id)&&identifier(g.personId)&&identifier(g.roleId)&&Number.isSafeInteger(g.version)&&g.version>0&&validScope(g.scope)&&['APPROVED','PENDING','REVOKED'].includes(g.status)&&['ALLOW','DENY'].includes(g.effect)&&Array.isArray(g.permissions)&&g.permissions.length>0&&g.permissions.every(code=>Object.hasOwn(PERMISSION_CATALOG,code))&&classificationOrder.includes(g.clearance)&&(g.validFrom==null||timestamp(g.validFrom)!==null)&&(g.validUntil==null||timestamp(g.validUntil)!==null)&&(g.revokedAt==null||timestamp(g.revokedAt)!==null)&&(!(g.validFrom&&g.validUntil)||timestamp(g.validFrom)<timestamp(g.validUntil))&&(g.relationships===undefined||Array.isArray(g.relationships)&&g.relationships.length>0&&g.relationships.every(code=>relationshipCodes.has(code)))}
function activeGrant(g,now){return g.status==='APPROVED'&&(g.validFrom==null||timestamp(g.validFrom)<=now)&&(g.validUntil==null||now<timestamp(g.validUntil))&&(g.revokedAt==null||now<timestamp(g.revokedAt))}
function independenceProblem(policy,record,personMap,personId){
 if(!policy.independent)return null;
 if(!object(record)||!object(personMap))return 'INDEPENDENCE_UNRESOLVED';
 const actors=[];for(const key of policy.independent){if(!Object.hasOwn(record,key)||!identifier(record[key]))return 'INDEPENDENCE_UNRESOLVED';actors.push(record[key])}
 if(policy.independentList){if(!Object.hasOwn(record,policy.independentList)||!Array.isArray(record[policy.independentList])||!record[policy.independentList].every(identifier))return 'INDEPENDENCE_UNRESOLVED';actors.push(...record[policy.independentList])}
 for(const actorId of actors){if(!Object.hasOwn(personMap,actorId)||!identifier(personMap[actorId]))return 'INDEPENDENCE_UNRESOLVED';if(personMap[actorId]===personId)return 'SAME_PERSON_REVIEW'}
 return null;
}
export function resolvePermission(input={}){
 const {principal,grants,request,personMap={},now=new Date().toISOString()}=object(input)?input:{};
 const time=timestamp(now),base={capabilityOnly:true,policyVersion:PERMISSION_POLICY_VERSION,permission:typeof request?.permission==='string'?request.permission:null,personId:identifier(principal?.personId)?principal.personId:null,evaluatedAt:time===null?null:now};
 const deny=reason=>({...base,allowed:false,reason,grants:[]});
 if(time===null)return deny('INVALID_TIME');
 if(!object(principal)||!own(principal,['personId','tenantId','active'])||!identifier(principal.personId)||!identifier(principal.tenantId)||principal.active!==true)return deny('INVALID_PRINCIPAL');
 if(!object(request)||!own(request,['permission','scope','classification','relationships'])||typeof request.permission!=='string'||!Object.hasOwn(PERMISSION_CATALOG,request.permission))return deny('UNKNOWN_PERMISSION');
 if(!validScope(request.scope)||request.scope.tenantId!==principal.tenantId)return deny('SCOPE_DENIED');
 if(!classificationOrder.includes(request.classification)||!Array.isArray(request.relationships)||!request.relationships.every(code=>relationshipCodes.has(code)))return deny('INVALID_CONTEXT');
 const policy=PERMISSION_CATALOG[request.permission];
 if((policy.scope||[]).some(key=>!identifier(request.scope[key])))return deny('RECORD_SCOPE_REQUIRED');
 if(policy.relationship&&!request.relationships.includes(policy.relationship))return deny('RELATIONSHIP_REQUIRED');
 if(!Array.isArray(grants)||grants.some(g=>!validGrant(g))||new Set(grants.map(g=>g.id)).size!==grants.length)return deny('INVALID_GRANTS');
 // Each complete grant must match on its own. Scope fragments from different roles are never combined.
 const candidates=grants.filter(g=>g.personId===principal.personId&&activeGrant(g,time)&&g.permissions.includes(request.permission)&&covers(g.scope,request.scope));
 // Scoped explicit denials override all allows, independently of clearance/relationship restrictions on allows.
 if(candidates.some(g=>g.effect==='DENY'))return deny('EXPLICIT_DENY');
 const applicable=candidates.filter(g=>g.effect==='ALLOW'&&classificationOrder.indexOf(g.clearance)>=classificationOrder.indexOf(request.classification)&&(!g.relationships||g.relationships.some(code=>request.relationships.includes(code))));
 if(!applicable.length)return deny('NO_APPLICABLE_GRANT');
 const independent=independenceProblem(policy,request.record,personMap,principal.personId);if(independent)return deny(independent);
 return {...base,allowed:true,reason:'CAPABILITY_GRANTED',grants:applicable.map(g=>({id:g.id,version:g.version,roleId:g.roleId}))};
}

// Shared strict validators for trusted-source adapters; these do not authenticate a source.
export const permissionTimestamp=timestamp;
export const isValidPermissionGrant=validGrant;
