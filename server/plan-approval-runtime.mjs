import {attachPlanTargetProofs,planNeedsTargetProofs} from './plan-target-proof.mjs';
import {newPlanApproval,decidePlanApproval} from './plan-approval-policy.mjs';
import {prepareAuthorizationContext} from './identity-grant-adapter.mjs';
import {projectExistingPlanApprovalSource} from './plan-approval-source.mjs';
export const planApprovalRuntimeConfiguration=Object.freeze({enabled:false});
export class PlanApprovalAccessError extends Error{constructor(status,message){super(message);this.status=status}}
const requireValue=(v,status,message)=>{if(!v)throw new PlanApprovalAccessError(status,message)};
const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(x);
const stamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;
const names=['loadVerifiedSession','loadIdentityAuthority','loadWorkspace','loadApprovalConfiguration','loadAuthorizationFence'];
export function createPlanApprovalRuntime({configuration=planApprovalRuntimeConfiguration,providers,clock=()=>new Date().toISOString()}={}){
 if(configuration.enabled!==true)return Object.freeze({enabled:false});
 requireValue(providers&&names.every(n=>typeof providers[n]==='function'),503,'Approved plan sources are not configured.');
 const read=Object.fromEntries(names.map(n=>[n,providers[n]]));
 return Object.freeze({enabled:true,loadTrusted:async({subject,reference})=>{
  requireValue(typeof subject==='string'&&subject.length>0&&subject.length<=200&&reference&&Object.keys(reference).length===2&&id(reference.planId)&&Number.isSafeInteger(reference.planVersion)&&reference.planVersion>0,400,'Invalid plan reference.');
  try{
   const now=clock();requireValue(stamp(now),503,'Plan source time is unavailable.');
   const session=structuredClone(await read.loadVerifiedSession({subject,now}));
   requireValue(session?.subject===subject,403,'Current institutional identity is unavailable.');
   const authority=structuredClone(await read.loadIdentityAuthority({institutionId:session.tenantId,now}));
   const identity=prepareAuthorizationContext({session,authority,now});
   requireValue(identity.ok,403,'Current institutional identity is unavailable.');
   const scope={subject,institutionId:identity.principal.tenantId,reference:structuredClone(reference),now};
   const workspace=structuredClone(await read.loadWorkspace(scope));
   requireValue(id(workspace?.id)&&workspace.institutionId===scope.institutionId&&Number.isSafeInteger(workspace.revision)&&workspace.revision>=0&&workspace.data,403,'The scoped plan workspace is unavailable.');
   const approved=structuredClone(await read.loadApprovalConfiguration({...scope,workspaceId:workspace.id}));
   requireValue(approved?.institutionId===scope.institutionId&&approved.workspaceId===workspace.id&&Array.isArray(approved.assignments),403,'Approved plan authority is unavailable.');
   let plan=projectExistingPlanApprovalSource({workspace,reference,configuration:approved,personMap:identity.personMap,now});
   let sourceFences=[];if(planNeedsTargetProofs(plan,approved,workspace.id)){requireValue(typeof providers.loadAnnualTargetWorkspace==='function'&&typeof providers.loadStrategicCatalogWorkspace==='function',503,'Strategic target sources are not configured.');const targetWorkspace=structuredClone(await providers.loadAnnualTargetWorkspace(scope)),catalogWorkspace=structuredClone(await providers.loadStrategicCatalogWorkspace(scope));plan=attachPlanTargetProofs({plan,workspace,targetWorkspace,catalogWorkspace});sourceFences=[{workspaceId:targetWorkspace.id,revision:targetWorkspace.revision},{workspaceId:catalogWorkspace.id,revision:catalogWorkspace.revision}]}
   requireValue(plan.institutionId===scope.institutionId,403,'Plan scope is unavailable.');
   // Membership in the scope must be established before returning a private source.
   const owner=plan.ownerPersonId===identity.principal.personId;
   const assigned=approved.assignments.some(a=>a.status==='ACTIVE'&&a.personId===identity.principal.personId&&a.institutionId===plan.institutionId&&a.unitId===plan.unitId&&a.planId===plan.id&&a.planVersion===plan.version&&(!a.validFrom||a.validFrom<=now)&&(!a.validUntil||now<a.validUntil));
   requireValue(owner||assigned,403,'This plan is outside your assigned scope.');
   const fence=structuredClone(await read.loadAuthorizationFence({...scope,workspaceId:workspace.id}));
   requireValue(id(fence?.id)&&fence.id!==workspace.id&&Number.isSafeInteger(fence.revision)&&fence.revision>0&&fence.authorizationVersion===authority.version&&fence.configurationVersion===approved.version,409,'Plan authority changed. Refresh before retrying.');
   const validUntil=new Date(Math.min(Date.parse(identity.validUntil),Date.parse(approved.validUntil))).toISOString(),completed=clock();
   requireValue(stamp(completed)&&completed>=now&&completed<validUntil,403,'Plan authority expired while loading.');
   const result={subject,workspace,plan,...(sourceFences.length?{sourceFences}:{}),context:{plan,principal:identity.principal,grants:authority.roleAssignments.map(r=>r.grant),assignments:approved.assignments,personMap:identity.personMap,reviewers:authority.people.map(p=>({personId:p.personId,tenantId:authority.tenantId,active:p.status==='ACTIVE'})),now:completed},configuration:approved,authorityFence:{workspaceId:fence.id,revision:fence.revision},validUntil};
   const probe=newPlanApproval({plan,now:completed});
   const capabilities=[['DRAFT','SUBMIT'],['UNIT_REVIEW','RETURN'],['FINANCE_ADMIN_REVIEW','RETURN'],['PRINCIPAL_REVIEW','RETURN']];
   requireValue(capabilities.some(([state,action])=>{try{decidePlanApproval({...probe,state},{action,expectedRevision:1,expectedBinding:probe.sourceBinding,reason:'Read capability check'},result.context);return true}catch{return false}}),403,'Current plan review authority is unavailable.');
   return result;
  }catch(e){if(e instanceof PlanApprovalAccessError)throw e;throw new PlanApprovalAccessError(503,'Approved plan sources could not be loaded.');}
 }});
}
