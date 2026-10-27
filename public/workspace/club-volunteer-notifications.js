// Targeted in-app sources only. No mail/SMS, escalation chain, enrolment or new commands.
function clubVolunteerNotificationActions(today=localDay()){
 const actions=[],push=(kind,p,recipient,version,ref,title)=>actions.push({key:'club-volunteer-notice:'+JSON.stringify([kind,p.id,p.clubVolunteerOpening.version,ref]),recipient,title,group:'CLUB',sourceId:p.sourceClub,route:'Clubs',due:null,chain:[],mandatory:false,informational:true,version});
 if(typeof sharedReady!=='undefined'&&sharedReady){
  for(const r of db.clubVolunteerOpenings||[]){if(r.sourceCurrent!==true)continue;const p={id:r.eventId,title:r.title,sourceClub:r.clubId,clubVolunteerOpening:{version:r.openingVersion}},a=r.ownApplication;
   if(!a&&r.canApply&&today<=r.deadline)push('OPENING',p,uid,r.openingVersion,r.deadline,'Club volunteer applications open (closes '+r.deadline+'): '+r.title);
   if(a?.review&&a.review.state===a.state&&['SELECTED','NOT_SELECTED','APPLIED'].includes(a.state))push('DECISION',p,uid,a.revision,a.id,'Your club volunteer application has review feedback: '+r.title);
  }return actions;
 }
 for(const p of db.projects){const o=p.clubVolunteerOpening;if(!o||!clubVolunteerOpeningCurrent(p))continue;
  for(const actor of users){const own=clubVolunteerOwn(p,actor.id),matches=(p.clubVolunteerApplications||[]).filter(a=>a.student===actor.id&&a.openingVersion===o.version);if(matches.length>1)continue;
   if(!own&&clubVolunteerEligible(p,actor.id)&&today<=o.deadline)push('OPENING',p,actor.id,o.version,o.deadline,'Club volunteer applications open (closes '+o.deadline+'): '+p.title);
   if(own&&own.review&&own.review.state===own.state&&['SELECTED','NOT_SELECTED','APPLIED'].includes(own.state))push('DECISION',p,actor.id,own.revision,own.id,'Your club volunteer application has review feedback: '+p.title);
  }
 }
 return actions;
}
function clubVolunteerNotificationTagged(n){return typeof n?.base==='string'&&n.base.includes('club-volunteer-notice:')}
function clubVolunteerNotificationAccess(n,actor){if(!n||n.recipient!==actor||n.group!=='CLUB'||n.route!=='Clubs'||n.phase!=='INFORMATION'||n.informational!==true||n.mandatory!==false||n.due!==null)return false;
 return clubVolunteerNotificationActions().some(a=>{const base=JSON.stringify([a.group,a.sourceId,a.key,a.version,a.recipient]);return n.base===base&&n.sourceId===a.sourceId&&n.sourceVersion===a.version&&n.id===notificationId([base,'INFORMATION',actor,null])});
}
const clubVolunteerNoticePreviousActions=notificationActions;notificationActions=function(today=localDay()){return clubVolunteerNoticePreviousActions(today).concat(clubVolunteerNotificationActions(today))};
const clubVolunteerNoticePreviousAccess=notificationAccess;notificationAccess=function(n,actor=uid){return clubVolunteerNotificationTagged(n)?clubVolunteerNotificationAccess(n,actor):clubVolunteerNoticePreviousAccess(n,actor)};
