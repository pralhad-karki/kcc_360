// Read-only bridge assessment. Never grants activity creation or execution rights.
export const teamProposalPreviewKeys=['title','type','programme','semester','course','purpose','outputs','start','due','sdgs','primaryUnit','supportingUnits','alignmentReason','mentorSuggestion'];
export function teamProposalPreview(s,r,f){
 const content=r.submissions.at(-1).content,round=f.team.rounds.at(-1),tenant=s.identity.principal.tenantId;
 return {proposal:Object.fromEntries(teamProposalPreviewKeys.filter(k=>Object.hasOwn(content,k)).map(k=>[k,structuredClone(content[k])])),members:round.invitations.map(i=>({studentId:i.source.studentId,displayName:(name=>typeof name==='string'&&name.length<=200?name:i.source.studentId)(s.roster.students.find(x=>x.id===i.source.studentId&&x.institutionId===tenant)?.displayName),isLead:i.source.studentId===round.proposal.leadStudentId}))};
}
export function approvedTeamHandoffPreview(s,r,f,final,issues){
 if(final?.decision!=='APPROVED'||r.teamHandoff)return null;
 const source=teamProposalPreview(s,r,f),kind=f.team.rounds.at(-1).proposal.kind,a=r.mentorAssignments?.at(-1),content=source.proposal;
 // The existing execution workspace has a narrower type/programme scope than intake.
 // Keep unmatched source values explicit; do not relabel research or drop students.
 const type=kind==='SAME_BATCH_ACADEMIC'?({Project:'Course project',Workshop:'Workshop',Seminar:'Seminar'}[content.type]||null):null;
 const blockers=['CONTROLLED_TEAM_HANDOFF_PENDING'];if(issues.length)blockers.push('CURRENT_PREREQUISITES_REQUIRE_REVIEW');if(!type)blockers.push('ACTIVITY_TYPE_MAPPING_REQUIRED');if(!['BCA','BBA','BIT','Civil Engineering'].includes(content.programme))blockers.push('EXECUTION_PROGRAMME_MAPPING_REQUIRED');
 return {status:'PENDING_CONTROLLED_HANDOFF',finalDecisionId:final.id,finalDecisionVersion:final.version,sourceKind:kind,sourceActivityType:content.type,proposedState:'CREATED',activity:{title:content.title,description:content.purpose,programme:content.programme,type,start:content.start,due:content.due,semester:content.semester,course:content.course,outputs:content.outputs,sdgs:[...(content.sdgs||[])]},members:source.members,mentor:a?{actor:a.mentor,assignmentId:a.id,assignmentVersion:a.version}:null,blockers,canCreate:false,executionAuthorized:false};
}
