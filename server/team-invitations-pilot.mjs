// Pure isolated invitation rounds. No live messages, records, membership grants or sessions.
const copy=structuredClone,check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
const pos=v=>Number.isSafeInteger(v)&&v>0;
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const json=v=>JSON.stringify(v);
function proposal(p){check(p&&id(p.id)&&pos(p.version)&&pos(p.teamVersion)&&id(p.institutionId)&&id(p.leadStudentId)&&['DRAFT','RETURNED'].includes(p.state)&&['SAME_BATCH_ACADEMIC','MULTIDISCIPLINARY_RESEARCH'].includes(p.kind),'EDITABLE_PROPOSAL_REQUIRED');return {id:p.id,version:p.version,teamVersion:p.teamVersion,institutionId:p.institutionId,leadStudentId:p.leadStudentId,kind:p.kind,...(p.kind==='SAME_BATCH_ACADEMIC'?{programmeId:p.programmeId,batchId:p.batchId,semesterId:p.semesterId,courseId:p.courseId}:{})}}
function student(p,studentId,students){
 check(Array.isArray(students),'TRUSTED_ROSTER_REQUIRED');const matches=students.filter(s=>s.id===studentId);check(matches.length===1,'UNIQUE_CURRENT_STUDENT_REQUIRED');const s=matches[0];
 check(id(s.id)&&id(s.personId)&&pos(s.version)&&s.institutionId===p.institutionId&&s.status==='ACTIVE'&&id(s.departmentId)&&id(s.programmeId)&&students.filter(x=>x.institutionId===p.institutionId&&x.personId===s.personId).length===1,'CURRENT_SCOPED_PERSON_REQUIRED');
 if(p.kind==='SAME_BATCH_ACADEMIC')check([p.programmeId,p.batchId,p.semesterId,p.courseId].every(id)&&['programmeId','batchId','semesterId'].every(k=>s[k]===p[k])&&Array.isArray(s.courseIds)&&s.courseIds.includes(p.courseId),'ACADEMIC_SCOPE_REQUIRED');
 return {studentId:s.id,personId:s.personId,studentVersion:s.version,departmentId:s.departmentId,programmeId:s.programmeId,batchId:s.batchId??null,semesterId:s.semesterId??null,courseIds:[...(s.courseIds||[])].sort()};
}
function authority(p,grants,now,lead){check(Array.isArray(grants)&&stamp(now),'TRUSTED_AUTHORITY_REQUIRED');const found=grants.filter(g=>g.capability==='TEAM_INVITE'&&g.personId===lead.personId&&g.proposalId===p.id&&g.proposalVersion===p.version&&g.institutionId===p.institutionId&&!g.revokedAt&&stamp(g.validFrom)&&stamp(g.validUntil)&&Date.parse(g.validFrom)<=Date.parse(now)&&Date.parse(now)<Date.parse(g.validUntil));check(found.length===1&&id(found[0].id)&&pos(found[0].version),'CURRENT_TEAM_INVITE_GRANT_REQUIRED');return {id:found[0].id,version:found[0].version}}
function round({proposal:p,memberIds,students,grants=[],actorPersonId,now}){
 const bound=proposal(p),lead=student(p,p.leadStudentId,students),grant=authority(p,grants,now,lead);check(actorPersonId===lead.personId,'PROPOSAL_LEAD_REQUIRED');
 check(Array.isArray(memberIds)&&memberIds.length>0&&memberIds.length<=100&&memberIds.every(id)&&new Set(memberIds).size===memberIds.length&&memberIds.includes(p.leadStudentId),'EXPLICIT_UNIQUE_TEAM_REQUIRED');
 const invitations=[...memberIds].sort().map(studentId=>({source:student(p,studentId,students),version:1,state:studentId===p.leadStudentId?'ACCEPTED':'PENDING',response:studentId===p.leadStudentId?{by:lead.personId,at:now,decision:'ACCEPTED'}:null}));
 return {version:p.teamVersion,proposal:bound,grant,createdBy:actorPersonId,createdAt:now,invitations,events:[]};
}
function current(record,ctx){
 check(record?.pilot===true&&pos(record.revision)&&Array.isArray(record.rounds)&&record.rounds.length>0,'TEAM_PILOT_RECORD_REQUIRED');const r=record.rounds.at(-1),p=proposal(ctx.proposal);check(json(p)===json(r.proposal),'PROPOSAL_OR_TEAM_CHANGED');check(stamp(ctx.now)&&Date.parse(ctx.now)>=Date.parse(record.updatedAt),'INVALID_EVENT_TIME');
 const lead=student(p,p.leadStudentId,ctx.students),grant=authority(p,ctx.grants??[],ctx.now,lead);check(json(grant)===json(r.grant),'INVITER_AUTHORITY_CHANGED');
 for(const i of r.invitations)check(json(student(p,i.source.studentId,ctx.students))===json(i.source),'STUDENT_SOURCE_CHANGED');return r;
}
export function createTeamInvitationsPilot(ctx){const r=round(ctx);return {pilot:true,proposalId:r.proposal.id,revision:1,updatedAt:ctx.now,rounds:[r]}}
export function respondTeamInvitationPilot(record,ctx){
 const r=current(record,ctx);check(ctx.expectedRevision===record.revision,'STALE_TEAM_REVISION');check(['ACCEPTED','DECLINED','WITHDRAWN','CANCELLED'].includes(ctx.decision),'INVALID_INVITATION_DECISION');const i=r.invitations.find(i=>i.source.studentId===ctx.studentId);check(i&&ctx.studentId!==r.proposal.leadStudentId,'INVITED_NONLEAD_REQUIRED');
 if(ctx.decision==='CANCELLED')check(ctx.actorPersonId===r.createdBy&&['PENDING','ACCEPTED'].includes(i.state),'LEAD_CANCELLATION_REQUIRED');
 else{check(ctx.actorPersonId===i.source.personId,'INVITEE_RESPONSE_REQUIRED');check(ctx.decision==='WITHDRAWN'?i.state==='ACCEPTED':i.state==='PENDING','INVITATION_RESPONSE_NOT_CURRENT');}
 const result=copy(record),latest=result.rounds.at(-1),next=latest.invitations.find(x=>x.source.studentId===ctx.studentId);next.version++;next.state=ctx.decision;next.response={by:ctx.actorPersonId,at:ctx.now,decision:ctx.decision};result.revision++;result.updatedAt=ctx.now;latest.events.push({studentId:ctx.studentId,version:next.version,...next.response,revision:result.revision});return result;
}
export function reviseTeamInvitationsPilot(record,ctx){
 check(record?.pilot===true&&ctx.expectedRevision===record.revision,'STALE_TEAM_REVISION');const previous=record.rounds.at(-1);check(ctx.proposal.id===record.proposalId&&ctx.proposal.institutionId===previous.proposal.institutionId&&ctx.proposal.leadStudentId===previous.proposal.leadStudentId&&ctx.proposal.version>=previous.proposal.version&&ctx.proposal.teamVersion===previous.version+1,'NEXT_TEAM_VERSION_REQUIRED');check(stamp(ctx.now)&&Date.parse(ctx.now)>=Date.parse(record.updatedAt),'INVALID_EVENT_TIME');
 const r=round(ctx),result=copy(record);result.rounds.push(r);result.revision++;result.updatedAt=ctx.now;return result;
}
export function confirmedTeamRoutingPilot(record,ctx){
 const r=current(record,ctx);check(r.invitations.every(i=>i.state==='ACCEPTED'),'ALL_MEMBERS_MUST_ACCEPT');
 return {proposal:{...copy(r.proposal),memberIds:r.invitations.map(i=>i.source.studentId)},confirmations:r.invitations.map(i=>({proposalId:record.proposalId,studentId:i.source.studentId,studentVersion:i.source.studentVersion,teamVersion:r.version,state:'ACCEPTED',version:i.version})),executionAuthorized:false};
}

// Minimal latest-round projection only. Caller first establishes current read scope.
export function readOwnTeamInvitationPilot(record,ctx){
 const r=current(record,ctx),matches=r.invitations.filter(i=>i.source.personId===ctx.actorPersonId);
 check(matches.length===1&&matches[0].source.studentId!==r.proposal.leadStudentId,'OWN_NONLEAD_INVITATION_REQUIRED');
 const i=matches[0];return {proposalId:r.proposal.id,proposalVersion:r.proposal.version,teamVersion:r.version,teamRevision:record.revision,ownInvitation:{studentId:i.source.studentId,state:i.state,version:i.version},canAccept:i.state==='PENDING',canDecline:i.state==='PENDING',canWithdraw:i.state==='ACCEPTED'};
}
