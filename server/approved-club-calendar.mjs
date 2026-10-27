import {newPlanApproval} from './plan-approval-policy.mjs';
import {samePlanValue as same} from './plan-amendment.mjs';
// Read-only projection of the protected AP-001 ledger, never legacy state labels.
// This owner-demo DTO is not an institutional reporting grant or execution permit.
const check=(ok)=>{if(!ok)throw Error('APPROVED_CALENDAR_SOURCE_INVALID')};
const text=x=>typeof x==='string'&&x.trim().length>0&&x.length<=200;
const day=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
function approvedSource(record,data,workspaceId){
 const p=record.approvedSnapshot,source=p?.content?.source;
 check(record.policy==='AP001_V1'&&record.kind==='CLUB'&&p?.kind==='CLUB'&&p.id===record.planId&&p.version===record.planVersion&&p.institutionId===record.institutionId&&p.unitId===record.unitId&&source?.workspaceId===workspaceId&&source.kind==='CLUB');
 check(newPlanApproval({plan:p,now:record.createdAt}).sourceBinding===record.sourceBinding&&same(p,JSON.parse(record.sourceBinding)));
 const steps=[['SUBMIT','DRAFT','UNIT_REVIEW','owner'],['UNIT_FORWARD','UNIT_REVIEW','FINANCE_ADMIN_REVIEW','unit'],['FINANCE_FORWARD','FINANCE_ADMIN_REVIEW','PRINCIPAL_REVIEW','finance'],['APPROVE','PRINCIPAL_REVIEW','APPROVED','principal']];
 check(record.state==='APPROVED'&&record.revision===5&&record.decisions?.length===4);
 let time=record.createdAt;for(let i=0;i<steps.length;i++){const d=record.decisions[i],[action,from,to,slot]=steps[i];check(d.action===action&&d.from===from&&d.to===to&&d.authority?.slot===slot&&text(d.authority.personId)&&d.sourceBinding===record.sourceBinding&&d.planVersion===p.version&&typeof d.at==='string'&&Number.isFinite(Date.parse(d.at))&&d.at>=time);time=d.at}
 check(record.decisions[0].authority.personId===p.ownerPersonId&&record.decisions.slice(1).every(d=>d.authority.personId!==p.ownerPersonId)&&record.decisions[3].authority.personId!==record.decisions[1].authority.personId&&record.decisions[3].authority.personId!==record.decisions[2].authority.personId);
 const clubs=(data.clubs||[]).filter(c=>c.id===source.clubId);check(clubs.length===1);const club=clubs[0],roots=(club.plans||[]).filter(r=>r.id===source.record?.id&&(r.version??1)===(source.record?.version??1));check(roots.length===1&&same(roots[0],source.record));
 let effective=source.record;
 if(source.amendmentId){const overlays=(data.planAmendments||[]).filter(a=>a.id===source.amendmentId&&a.planId===p.id&&a.planVersion===p.version);check(overlays.length===1&&same(overlays[0].proposedPlan,p)&&source.proposedRecord?.version===p.version);effective=source.proposedRecord}
 check(Array.isArray(effective.items)&&effective.items.length>0&&new Set(effective.items.map(i=>i.id)).size===effective.items.length&&effective.items.every(i=>text(i.id)&&text(i.title)&&day(i.start)&&day(i.end)&&i.start<=i.end));
 return {club,plan:p,effective,approvedAt:time};
}
export function projectApprovedClubCalendar({data,workspaceId,audience}={}){
 if(audience!=='STUDENT_AFFAIRS_OWNER_DEMO')return null;
 const groups=new Map();let withheldPlans=0;
 for(const record of data.planApprovalRecords||[]){if(record.kind!=='CLUB'||record.state!=='APPROVED')continue;try{const p=JSON.parse(record.sourceBinding),source=p.content.source;check(p.kind==='CLUB'&&text(source.clubId)&&text(source.record?.id));const key=JSON.stringify([source.clubId,source.record.family||source.record.id]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(record)}catch{withheldPlans++}}
 const events=[];let approvedPlans=0,cancelledItems=0;
 for(const records of groups.values()){try{check(records.every(r=>Number.isSafeInteger(r.planVersion)&&r.planVersion>0));records.sort((a,b)=>b.planVersion-a.planVersion);check(!records[1]||records[0].planVersion!==records[1].planVersion);const {club,plan,effective,approvedAt}=approvedSource(records[0],data,workspaceId);const rows=[];for(const item of effective.items){if(item.status==='CANCELLED'){cancelledItems++;continue}rows.push({clubId:club.id,clubName:club.title,planId:plan.id,planVersion:plan.version,cycle:String(effective.year??''),itemId:item.id,title:item.title,start:item.start,end:item.end,approvedAt,status:'APPROVED_PLAN',executionAuthorized:false})}events.push(...rows);approvedPlans++}catch{withheldPlans++}}
 events.sort((a,b)=>a.start.localeCompare(b.start)||a.clubId.localeCompare(b.clubId)||a.itemId.localeCompare(b.itemId));
 return {schema:'KCC360_APPROVED_CLUB_CALENDAR_V1',scope:'OWNER_DEMO',approvedPlans,withheldPlans,cancelledItems,events,basis:'Finally approved protected club plans only. Pending amendments retain the last approved schedule. Calendar entries are planned activities, not verified achievements or execution permissions.'};
}
