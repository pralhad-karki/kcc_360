// Server composition only: provider functions must read approved institutional sources.
// No request fields, demo names or client roles provision identity or authority.
import {prepareAuthorizationContext} from './identity-grant-adapter.mjs';
export const intakeTrustedSourceConfiguration=Object.freeze({enabled:false});
export class IntakeTrustedSourceError extends Error{
 constructor(status,message){super(message);this.status=status}
}
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const stamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const requireSource=(v,status,message)=>{if(!v)throw new IntakeTrustedSourceError(status,message)};
const providerNames=['loadVerifiedSession','loadIdentityAuthority','loadWorkspace','loadRoster','loadAcademicMasters','loadReviewAuthority'];
function approved(source,institution,now,arrays){
 return object(source)&&id(source.id)&&Number.isSafeInteger(source.version)&&source.version>0&&source.status==='APPROVED'&&source.institutionId===institution&&id(source.approvalReference)&&Number.isFinite(Date.parse(source.validFrom))&&Number.isFinite(Date.parse(source.validUntil))&&Date.parse(source.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(source.validUntil)&&arrays.every(k=>Array.isArray(source[k]));
}
/** Composition root, never a client-controlled setting. No providers installed by default.
 * Each call loads fresh sources; existing dispatcher reload/version guards protect writes.
 * Provider callbacks are an injection boundary, not an implemented MIS connection.
 */
export function createIntakeTeamRuntime({configuration=intakeTrustedSourceConfiguration,providers,clock=()=>new Date().toISOString()}={}){
 if(configuration?.enabled!==true)return Object.freeze({configuration:Object.freeze({enabled:false})});
 requireSource(object(providers)&&providerNames.every(k=>typeof providers[k]==='function')&&typeof clock==='function',503,'Approved intake source providers are not configured.');
 // Capture functions so later mutation of a registry cannot swap the security boundary.
 const readers=Object.fromEntries(providerNames.map(k=>[k,providers[k]]));
 return Object.freeze({configuration:Object.freeze({enabled:true}),loadTrusted:async request=>{
  requireSource(object(request)&&Object.keys(request).every(k=>['subject','actor','proposalId'].includes(k))&&typeof request.subject==='string'&&request.subject.length>0&&request.subject.length<=200&&id(request.actor)&&(request.proposalId===undefined||id(request.proposalId)),400,'Invalid intake source request.');
  const input=structuredClone(request),now=clock();
  requireSource(stamp(now),503,'Intake source time is unavailable.');
  try{
   const session=structuredClone(await readers.loadVerifiedSession({subject:input.subject,now}));
   requireSource(session?.subject===input.subject,403,'Current institutional identity is unavailable.');
   const identityAuthority=structuredClone(await readers.loadIdentityAuthority({tenantId:session.tenantId,now}));
   const identity=prepareAuthorizationContext({session,authority:identityAuthority,now});
   requireSource(identity.ok&&identity.principal.active&&Object.hasOwn(identity.personMap,input.actor)&&identity.personMap[input.actor]===identity.principal.personId,403,'Current institutional identity is unavailable.');
   const scope={institutionId:identity.principal.tenantId,subject:input.subject,actor:input.actor,now};
   const workspace=structuredClone(await readers.loadWorkspace({...scope}));
   requireSource(object(workspace)&&id(workspace.id)&&workspace.institutionId===scope.institutionId&&Number.isSafeInteger(workspace.revision)&&workspace.revision>=0&&object(workspace.data)&&Array.isArray(workspace.data.activityIntakes),403,'Current scoped intake workspace is unavailable.');
   if(input.proposalId!==undefined)requireSource(workspace.data.activityIntakes.filter(r=>r.id===input.proposalId).length===1,403,'Current scoped intake is unavailable.');
   const roster=structuredClone(await readers.loadRoster({...scope}));
   const academicMasters=structuredClone(await readers.loadAcademicMasters({...scope}));
   const authority=structuredClone(await readers.loadReviewAuthority({...scope}));
   requireSource(approved(roster,scope.institutionId,now,['students'])&&approved(academicMasters,scope.institutionId,now,['programmes','offerings'])&&approved(authority,scope.institutionId,now,['grants','assignments','policies']),403,'Approved current intake sources are unavailable.');
   // If any source expired while providers were loading, do not return a stale context.
   const completed=clock();
   requireSource(stamp(completed)&&Date.parse(completed)>=Date.parse(now)&&Date.parse(completed)<Date.parse(identity.validUntil)&&[roster,academicMasters,authority].every(s=>Date.parse(completed)<Date.parse(s.validUntil)),403,'Intake sources expired during loading.');
   return {subject:input.subject,actorId:input.actor,now,identity,activePersonIds:identityAuthority.people.filter(p=>p.status==='ACTIVE').map(p=>p.personId).sort(),workspace,roster,academicMasters,authority,configuration:{enabled:true},normalizationConfiguration:{enabled:true}};
  }catch(error){
   if(error instanceof IntakeTrustedSourceError)throw error;
   // Provider errors can contain tokens or personal data; never forward them to clients.
   throw new IntakeTrustedSourceError(503,'Approved intake sources could not be loaded.');
  }
 }});
}
