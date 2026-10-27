// Existing in-app queues and source navigation only. No authority or delivery channel added.
function linkedIntakeFollowupActions(){
 const rows=[],add=(kind,recipient,title,route,sourceId,version)=>rows.push({key:'linked-intake:'+kind,recipient,title,group:'PROJECT',route,sourceId,version,due:null,chain:[],mandatory:true});
 for(const r of db.activityIntakes||[])if(individualIntakeCanCreate(r,'c1'))add('HANDOFF','c1','Create linked individual draft: '+r.content.title,'Activity Intake',r.id,individualIntakeSource(r).binding);
 for(const p of db.projects){if(!p.intakeProvenance||!activityControlActive(p)||!['CREATED','PENDING_APPROVAL','APPROVED'].includes(p.state))continue;
  if(!individualIntakeProjectCurrent(p)){add('SOURCE','c1','Review changed linked-intake source: '+p.title,'Projects',p.id,JSON.stringify([p.intakeProvenance.intakeRevision,p.proposalVersion||0,p.state]));continue;}
  if(p.state==='CREATED')add('DRAFT',p.owner,'Review and submit linked draft: '+p.title,'Projects',p.id,(p.proposalVersion||0)+1);
  if(p.state==='APPROVED')add('PREPARE',p.owner,'Prepare approved linked activity for start: '+p.title,'Projects',p.id,p.proposalVersion||1);
 }
 return rows;
}
function linkedIntakeProposalCurrent(p){return !!p?.intakeProvenance&&p.state==='PENDING_APPROVAL'&&activityControlActive(p)&&individualIntakeProjectCurrent(p)&&proposalSnapshotCurrent(p)&&p.mentor!==p.owner&&p.mentor!==p.createdBy&&!p.members.includes(p.mentor)}
function linkedIntakeNoticeKey(n){if(typeof n?.base==='string'){try{const b=JSON.parse(n.base);return Array.isArray(b)?b[2]:null}catch{return null}}return n?.key}
const linkedIntakePreviousNotificationActions=notificationActions;
notificationActions=function(today=localDay()){return linkedIntakePreviousNotificationActions(today).flatMap(a=>{const p=a.route==='Projects'&&a.key==='proposal'&&db.projects.find(p=>p.id===a.sourceId);if(!p?.intakeProvenance)return [a];return linkedIntakeProposalCurrent(p)?[{...a,version:p.proposalVersion||1}]:[]}).concat(linkedIntakeFollowupActions())};
const linkedIntakePreviousNotificationAccess=notificationAccess;
notificationAccess=function(n,actor=uid){
 const key=linkedIntakeNoticeKey(n);
 if(typeof key==='string'&&key.startsWith('linked-intake:')){
  const a=linkedIntakeFollowupActions().find(a=>a.key===key&&a.recipient===actor&&a.sourceId===n.sourceId);
  if(!a||n.recipient!==actor||n.route!==a.route||n.group!==a.group||n.due!==null||n.informational||n.mandatory!==true)return false;
  if(!n.base)return n.version===a.version;
  const base=JSON.stringify([a.group,a.sourceId,a.key,a.version,a.recipient]);return n.phase==='ACTION'&&n.sourceVersion===a.version&&n.base===base&&n.id===notificationId([base,'ACTION',actor,null]);
 }
 if(typeof n?.base==='string'&&n.base.includes('linked-intake:'))return false;
 const p=key==='proposal'&&n.route==='Projects'&&db.projects.find(p=>p.id===n.sourceId);
 if(p?.intakeProvenance){
  if(!linkedIntakeProposalCurrent(p)||n.group!=='PROJECT'||n.mandatory!==true||n.informational)return false;const version=p.proposalVersion||1;
  if(!n.base){if(n.recipient!==p.mentor||actor!==p.mentor||n.version!==version)return false;}
  else{
   const base=JSON.stringify(['PROJECT',p.id,'proposal',version,p.mentor]);if(n.base!==base||n.sourceVersion!==version||n.due!==p.due||n.id!==notificationId([base,n.phase,actor,p.due]))return false;
   const days=notificationDateOffset(p.due,localDay()),rule=approvedNotificationPolicy()?.rules.PROJECT;
   if(['ACTION','REMINDER','OVERDUE'].includes(n.phase)){if(actor!==p.mentor||n.phase==='REMINDER'&&(!rule||days===null||days< -rule.soon||days>0)||n.phase==='OVERDUE'&&(!rule||days===null||days<=0))return false;}
   else{const levels=['supervisor','coordinator','administrative'],i=levels.findIndex(l=>n.phase===l.toUpperCase()+'_ESCALATION');if(i<0||actor!==['c1','d1','a1'][i]||!rule||rule[levels[i]]===null||days===null||days<rule[levels[i]])return false;}
  }
 }
 return linkedIntakePreviousNotificationAccess(n,actor);
};
function openLinkedActivityIntake(projectId){const p=db.projects.find(p=>p.id===projectId),r=p?.intakeProvenance&&intakeRecord(p.intakeProvenance.intakeId);if(!p||!canSee(p)||!r||!intakeVisible(r)||r.projectId!==p.id||r.individualHandoff?.projectId!==p.id)return toast('The linked intake is unavailable in your current scope.');openIntake(r.id)}
function linkedIntakeSourcePanel(p){if(!p?.intakeProvenance||!canSee(p))return '';const r=intakeRecord(p.intakeProvenance.intakeId),allowed=r&&intakeVisible(r)&&r.projectId===p.id&&r.individualHandoff?.projectId===p.id;return `<section class="card"><h3>Source activity intake</h3><p>${esc(p.intakeProvenance.intakeId)} · Submitted version ${esc(p.intakeProvenance.submissionVersion)}</p>${allowed?btn('Open source intake',`openLinkedActivityIntake(${esc(JSON.stringify(p.id))})`):'<p>The source intake requires its existing access permissions.</p>'}<p>Intake acceptance, proposal approval and permission to start are separate steps.</p></section>`}
const linkedIntakePreviousOverview=projectOverview;
projectOverview=function(p){return linkedIntakePreviousOverview(p)+linkedIntakeSourcePanel(p)};
