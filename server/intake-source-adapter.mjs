// Server-only integration seam, not imported by live services. Inputs must be server-loaded.
// This does not authenticate requests, infer MIS fields or provision authority.
export const intakeSourceConfiguration=Object.freeze({enabled:false});
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const validPeriod=(s,now)=>stamp(s?.validFrom)&&stamp(s?.validUntil)&&Date.parse(s.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(s.validUntil);
const approved=(s,institution,now)=>s?.status==='APPROVED'&&id(s.id)&&pos(s.version)&&s.institutionId===institution&&validPeriod(s,now)&&id(s.approvalReference);
const deny=reason=>({ok:false,reason,serverContext:null});
const proposalKeys=['id','version','teamVersion','institutionId','leadStudentId','kind','state','programmeId','batchId','semesterId','courseId'];
const studentKeys=['id','personId','version','institutionId','status','displayName','departmentId','programmeId','batchId','semesterId','courseIds'];
const grantKeys=['id','version','capability','personId','institutionId','proposalId','proposalVersion','validFrom','validUntil','revokedAt'];
const assignmentKeys=['id','version','capability','personId','institutionId','kind','programmeId','batchId','semesterId','courseId','role','availability','validFrom','validUntil','revokedAt'];
const pick=(s,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(s,k)).map(k=>[k,structuredClone(s[k])]));
export function resolveIntakeSourceContext({configuration=intakeSourceConfiguration,identity,proposal,roster,authority,team=null,purpose='DIRECTORY',now,expectedSources}={}){
 if(configuration?.enabled!==true)return deny('INTAKE_INTEGRATION_DISABLED');
 if(!stamp(now)||!identity?.ok||!identity.principal?.active||!id(identity.principal.personId)||!id(identity.principal.tenantId))return deny('VERIFIED_IDENTITY_REQUIRED');
 const institution=identity.principal.tenantId,actor=identity.principal.personId;
 if(!proposal||proposal.institutionId!==institution||!id(proposal.id)||!pos(proposal.version)||!pos(proposal.teamVersion)||!id(proposal.leadStudentId)||!['DRAFT','RETURNED'].includes(proposal.state)||!['SAME_BATCH_ACADEMIC','MULTIDISCIPLINARY_RESEARCH'].includes(proposal.kind))return deny('CURRENT_SCOPED_PROPOSAL_REQUIRED');
 if(!approved(roster,institution,now)||!approved(authority,institution,now)||!Array.isArray(roster.students)||!Array.isArray(authority.grants)||!Array.isArray(authority.assignments)||!Array.isArray(authority.policies))return deny('APPROVED_CURRENT_SOURCES_REQUIRED');
 const selected=roster.students.filter(s=>s.institutionId===institution);
 if(selected.some(s=>!id(s.id)||!id(s.personId)||!pos(s.version))||new Set(selected.map(s=>s.id)).size!==selected.length||new Set(selected.map(s=>s.personId)).size!==selected.length)return deny('UNIQUE_STABLE_ROSTER_REQUIRED');
 const lead=selected.find(s=>s.id===proposal.leadStudentId);if(!lead||lead.status!=='ACTIVE')return deny('ACTIVE_LEAD_SOURCE_REQUIRED');
 if(!['DIRECTORY','TEAM_MANAGEMENT','INVITATION_RESPONSE','INVITATION_READ','ROUTING'].includes(purpose))return deny('UNKNOWN_CONTEXT_PURPOSE');
 const grants=authority.grants.filter(g=>g.institutionId===institution&&g.personId===lead.personId&&g.proposalId===proposal.id&&g.proposalVersion===proposal.version&&!g.revokedAt&&validPeriod(g,now));
 const required=purpose==='DIRECTORY'?'STUDENT_DIRECTORY_SEARCH':'TEAM_INVITE';
 const relevant=grants.filter(g=>g.capability===required);if(relevant.length!==1||!id(relevant[0].id)||!pos(relevant[0].version))return deny('CURRENT_EXPLICIT_LEAD_GRANT_REQUIRED');
 if(['INVITATION_RESPONSE','INVITATION_READ'].includes(purpose)){
  const r=team?.rounds?.at(-1),invite=r?.invitations?.filter(i=>i.source.personId===actor);
  if(team?.pilot!==true||team.proposalId!==proposal.id||r?.version!==proposal.teamVersion||['id','version','teamVersion','institutionId','leadStudentId','kind','programmeId','batchId','semesterId','courseId'].some(k=>r.proposal[k]!==proposal[k]&&!(proposal.kind==='MULTIDISCIPLINARY_RESEARCH'&&['programmeId','batchId','semesterId','courseId'].includes(k)))||invite?.length!==1||invite[0].source.studentId===proposal.leadStudentId||!(purpose==='INVITATION_READ'?['PENDING','ACCEPTED','DECLINED','WITHDRAWN','CANCELLED']:['PENDING','ACCEPTED']).includes(invite[0].state))return deny('CURRENT_INVITEE_RELATIONSHIP_REQUIRED');
  const s=selected.find(s=>s.id===invite[0].source.studentId);if(!s||s.status!=='ACTIVE'||s.personId!==actor||s.version!==invite[0].source.studentVersion)return deny('INVITEE_SOURCE_CHANGED');
 }else if(actor!==lead.personId)return deny('PROPOSAL_LEAD_REQUIRED');
 const sources={rosterId:roster.id,rosterVersion:roster.version,authorityId:authority.id,authorityVersion:authority.version,proposalId:proposal.id,proposalVersion:proposal.version,teamVersion:proposal.teamVersion};
 if(expectedSources&&(Object.keys(expectedSources).length!==Object.keys(sources).length||Object.keys(sources).some(k=>expectedSources[k]!==sources[k])))return deny('SOURCE_SNAPSHOT_CHANGED');
 const policies=authority.policies.filter(p=>p.institutionId===institution&&p.kind===proposal.kind);if(policies.length!==1||!id(policies[0].id)||!pos(policies[0].version)||!id(policies[0].approvalRole))return deny('UNIQUE_APPROVAL_POLICY_REQUIRED');
 return {ok:true,reason:'TRUSTED_PILOT_CONTEXT_ONLY',sources,serverContext:{actorPersonId:actor,viewerPersonId:actor,proposal:pick(proposal,proposalKeys),students:selected.map(s=>pick(s,studentKeys)),grants:grants.map(g=>pick(g,grantKeys)),assignments:authority.assignments.filter(a=>a.institutionId===institution&&a.kind===proposal.kind).map(a=>pick(a,assignmentKeys)),policy:pick(policies[0],['id','version','institutionId','kind','approvalRole']),now}};
}
