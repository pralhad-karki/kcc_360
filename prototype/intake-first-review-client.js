// Ephemeral scoped views. Only a fresh full-workspace response can replace records after a decision.
let intakeFirstReviewCache=null,intakeFirstReviewGeneration=0,intakeFirstReviewDetailGeneration=0,intakeFirstReviewDetailLock=null,intakeFirstReviewDecisionContext=null;
function intakeFirstReviewContext(){return {snapshot:db,actor:sharedActor,revision:sharedRevision}}
function intakeFirstReviewCurrent(c){return sharedReady&&db===c.snapshot&&uid===c.actor&&sharedActor===c.actor&&sharedRevision===c.revision}
function intakeFirstReviewItem(v){
 const id=x=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(x),routes=['SUBJECT_FACULTY','RESEARCH_COORDINATOR','ACADEMIC_COORDINATOR_FACULTY_UNAVAILABLE','ACADEMIC_COORDINATOR_FACULTY_UNASSIGNED'];
 if(!v||!id(v.proposalId)||!id(v.firstReviewId)||!v.firstReviewId.startsWith(v.proposalId+':first-review:')||!Number.isSafeInteger(v.submissionVersion)||v.submissionVersion<1||typeof v.title!=='string'||v.title.length>120||!['REVIEWER','PARTICIPANT'].includes(v.role)||!['AWAITING_FIRST_REVIEW','SOURCE_CHANGED','WITHDRAWN','RETURNED','REVISION_IN_PROGRESS','FIRST_REVIEWED'].includes(v.status)||typeof v.canDecide!=='boolean'||v.canDecide&&!(v.role==='REVIEWER'&&v.status==='AWAITING_FIRST_REVIEW')||!Number.isFinite(Date.parse(v.submittedAt))||!(['AWAITING_FIRST_REVIEW','FIRST_REVIEWED'].includes(v.status)?routes.includes(v.route):v.status==='RETURNED'?v.route===null||routes.includes(v.route):v.route===null)||v.role==='REVIEWER'&&!['AWAITING_FIRST_REVIEW','RETURNED','FIRST_REVIEWED'].includes(v.status))throw Error('First-review data is unavailable.');
 return Object.fromEntries(['proposalId','firstReviewId','submissionVersion','title','role','status','route','submittedAt','canDecide'].map(k=>[k,v[k]]));
}
function intakeFirstReviewProtocol(r,c,action){if(r?.kind!=='INTAKE_TEAM_COMMAND'||r.action!==action||r.actor!==c.actor||r.revision!==c.revision)throw Error('First-review data changed. Refresh before trying again.')}
function resetIntakeFirstReview(){intakeFirstReviewDecisionContext=null;if(intakeFirstReviewDetailLock){intakeFirstReviewDetailLock=null;lockShared(false)}intakeFirstReviewCache=null;intakeFirstReviewGeneration++;intakeFirstReviewDetailGeneration++;if(document.querySelector('#first-review-detail')&&$('#modal').open)closeModal()}
function currentIntakeFirstReviewCache(){return intakeFirstReviewCache&&intakeFirstReviewCurrent(intakeFirstReviewCache.context)?intakeFirstReviewCache:null}
async function refreshIntakeFirstReviews(offset=0){
 if(!sharedReady||db.intakeTeamAccess?.enabled!==true)return resetIntakeFirstReview();
 const c=intakeFirstReviewContext(),generation=++intakeFirstReviewGeneration;intakeFirstReviewCache=null;
 try{
  const r=await sharedFetch('/api/workspace',{command:'readIntakeFirstReviewQueue',actor:c.actor,revision:c.revision,args:[{offset,limit:20}],context:{page:'Activity Intake'}});
  if(generation!==intakeFirstReviewGeneration||!intakeFirstReviewCurrent(c))return;intakeFirstReviewProtocol(r,c,'REVIEW_QUEUE');const q=r.review;
  if(!q||!Array.isArray(q.items)||!Number.isSafeInteger(q.total)||q.total<0||q.offset!==offset||q.limit!==20||q.items.length!==Math.min(20,Math.max(0,q.total-offset)))throw Error('First-review page is unavailable.');
  const items=q.items.map(intakeFirstReviewItem);if(new Set(items.map(i=>i.proposalId)).size!==items.length)throw Error('First-review references are unavailable.');
  intakeFirstReviewCache={context:c,items,total:q.total,offset,limit:20};if(['Overview','Activity Intake'].includes(page))render();
 }catch(e){if(generation===intakeFirstReviewGeneration&&intakeFirstReviewCurrent(c)){intakeFirstReviewCache=null;if(e.status!==503)toast('First-review access is unavailable. Refresh before trying again.');if(['Overview','Activity Intake'].includes(page))render()}}
}
function intakeFirstReviewOverviewPanel(){
 const q=currentIntakeFirstReviewCache();if(!q||!q.total)return '';
 return `<section class="panel"><h2>First review and team submissions</h2><p>Current assigned reviews and your own team-submission statuses. This view grants no approval or permission to start.</p>${tableHTML(['Submission','Your view','Status','Details'],q.items.map((r,i)=>[esc(r.title)+'<p>'+esc(r.proposalId)+' · submitted v'+r.submissionVersion+'</p>',r.role==='REVIEWER'?'Assigned first reviewer':'Team participant',esc(r.status),'<button type="button" data-first-review-open="'+i+'">View submission</button>']))}<p>${q.items.length?q.offset+1:0}–${Math.min(q.offset+q.items.length,q.total)} of ${q.total} within your current scope.</p><div class="buttons">${q.offset?'<button type="button" data-first-review-page="'+Math.max(0,q.offset-20)+'">Previous</button>':''}${q.offset+20<q.total&&q.offset+20<=10000?'<button type="button" data-first-review-page="'+(q.offset+20)+'">Next</button>':''}<button type="button" data-first-review-page="0">Refresh status</button></div><p class="meta">Opening details rechecks current authority and source versions. Only the current assigned reviewer can record a version-bound first-review decision.</p></section>`;
}
function intakeFirstReviewDashboardCard(){const q=currentIntakeFirstReviewCache();return q?.total?`<section class="panel"><h2>First review and team submissions</h2><p>${q.total} submitted record${q.total===1?'':'s'} within your current review or participation scope.</p>${btn('Open module overview',"go('Activity Intake')")}</section>`:''}
function intakeFirstReviewDetailHTML(review){
 const item=intakeFirstReviewItem(review.item);let body='';
 if(item.role==='REVIEWER'){
  const d=review.detail,p=d?.proposal;
  if(!p||!['title','type','programme','purpose','outputs','start','due'].every(k=>typeof p[k]==='string'&&p[k].length<=3000)||!Array.isArray(d.members)||!d.members.length||d.members.length>100||new Set(d.members.map(m=>m.studentId)).size!==d.members.length||!d.members.every(m=>typeof m.studentId==='string'&&m.studentId.length<=200&&typeof m.displayName==='string'&&m.displayName.length<=200&&typeof m.isLead==='boolean')||typeof d.consultationRequired!=='boolean')throw Error('Submission details are unavailable.');
  body=`<p>${esc(p.type)} · ${esc(p.programme)} · ${esc(p.start)} to ${esc(p.due)}</p><h3>Purpose</h3><p>${esc(p.purpose)}</p><h3>Expected outputs</h3><p>${esc(p.outputs)}</p><h3>Confirmed team</h3>${tableHTML(['Student','Name','Lead'],d.members.map(m=>[esc(m.studentId),esc(m.displayName),m.isLead?'Yes':'No']))}${d.consultationRequired?'<p>Interdepartmental consultation is required; it has not been recorded as complete.</p>':''}`;
 }else if(review.detail!==undefined)throw Error('Participant status contains unexpected details.');
 if(review.feedback){if(!['RETURNED','REVIEWED'].includes(review.feedback.decision)||typeof review.feedback.reason!=='string'||review.feedback.reason.length>2000)throw Error('Review feedback is unavailable.');body+='<h3>Review feedback</h3><p>'+esc(review.feedback.reason)+'</p>'}
 if(item.canDecide)body+=`<form id="first-review-decision-form"><h3>Record first review</h3><label>Decision<select name="decision" required><option value="">Choose a decision</option><option value="RETURNED">Return for revision</option><option value="REVIEWED">First review recorded (not final approval)</option></select></label><label>Feedback / reason<textarea name="reason" required maxlength="2000"></textarea></label><p>A return allows draft revision and requires fresh team acceptance. Neither decision assigns a mentor, approves the activity or authorizes execution.</p><button type="submit">Save first-review decision</button></form>`;
 return `<section id="first-review-detail"><h2>${esc(item.title)}</h2><p>${esc(item.proposalId)} · submitted v${item.submissionVersion} · ${esc(item.status)}</p>${body}<p>Mentor assignment, consultation, final approval and permission to start remain separate.</p></section>`;
}
async function openIntakeFirstReview(index){
 const q=currentIntakeFirstReviewCache();if(!q||sharedBusy||!Number.isSafeInteger(index)||!q.items[index])return;
 intakeFirstReviewDecisionContext=null;const c=q.context,item=q.items[index],generation=++intakeFirstReviewDetailGeneration,token={};intakeFirstReviewDetailLock=token;modal('<section id="first-review-detail"><h2>Checking submission access…</h2></section>');const marker=document.querySelector('#first-review-detail');lockShared(true);
 try{const r=await sharedFetch('/api/workspace',{command:'readIntakeFirstReviewStatus',actor:c.actor,revision:c.revision,args:[{proposalId:item.proposalId}],context:{page:'Activity Intake'}});if(generation!==intakeFirstReviewDetailGeneration||!intakeFirstReviewCurrent(c)||currentIntakeFirstReviewCache()!==q||!$('#modal').open||document.querySelector('#first-review-detail')!==marker)return;intakeFirstReviewProtocol(r,c,'REVIEW_STATUS');if(r.review?.item?.proposalId!==item.proposalId||r.review.item.firstReviewId!==item.firstReviewId||r.review.item.submissionVersion!==item.submissionVersion||r.review.item.role!==item.role)throw Error('Submission reference changed.');modal(intakeFirstReviewDetailHTML(r.review));if(r.review.item.canDecide)intakeFirstReviewDecisionContext={context:c,item:intakeFirstReviewItem(r.review.item),cache:q,marker:document.querySelector('#first-review-detail')}}catch(e){if(generation===intakeFirstReviewDetailGeneration&&intakeFirstReviewCurrent(c)){closeModal();resetIntakeFirstReview();toast('Submission access changed. Refresh the overview before trying again.')}}finally{if(intakeFirstReviewDetailLock===token){intakeFirstReviewDetailLock=null;lockShared(false)}}
}
document.addEventListener('click',event=>{const open=event.target.closest?.('[data-first-review-open]');if(open){openIntakeFirstReview(Number(open.dataset.firstReviewOpen));return}const paging=event.target.closest?.('[data-first-review-page]');if(paging&&!sharedBusy){const offset=Number(paging.dataset.firstReviewPage);if(Number.isSafeInteger(offset)&&offset>=0&&offset<=10000)refreshIntakeFirstReviews(offset)}});
const firstReviewPriorRefresh=refreshIntakeTeamAccess;
refreshIntakeTeamAccess=async function(){resetIntakeFirstReview();await firstReviewPriorRefresh();if(sharedReady&&db.intakeTeamAccess?.enabled===true)await refreshIntakeFirstReviews()};
const firstReviewPriorReset=resetIntakeTeamClient;
resetIntakeTeamClient=function(){resetIntakeFirstReview();return firstReviewPriorReset()};
const firstReviewPriorOverview=overview;
overview=function(){return firstReviewPriorOverview()+intakeFirstReviewDashboardCard()};
const firstReviewPriorIntakesPage=activityIntakesPage;
activityIntakesPage=function(){return intakeFirstReviewOverviewPanel()+firstReviewPriorIntakesPage()};
async function submitIntakeFirstReviewDecision(fields){
 const d=intakeFirstReviewDecisionContext;
 if(!d||sharedBusy||!intakeFirstReviewCurrent(d.context)||currentIntakeFirstReviewCache()!==d.cache||!$('#modal').open||document.querySelector('#first-review-detail')!==d.marker)return toast('Refresh and reopen the current submission before recording a decision.');
 if(!fields||Object.keys(fields).some(k=>!['decision','reason'].includes(k))||!['RETURNED','REVIEWED'].includes(fields.decision)||typeof fields.reason!=='string'||!fields.reason.trim()||fields.reason.trim().length>2000)return toast('Choose a first-review decision and provide feedback.');
 const c=d.context,token={},generation=++intakeFirstReviewDetailGeneration;intakeFirstReviewDetailLock=token;lockShared(true);
 try{
  const r=await sharedFetch('/api/workspace',{command:'decideIntakeTeamFirstReview',actor:c.actor,revision:c.revision,args:[{proposalId:d.item.proposalId,firstReviewId:d.item.firstReviewId,submissionVersion:d.item.submissionVersion,decision:fields.decision,reason:fields.reason.trim()}],context:{page:'Activity Intake'}});
  if(generation!==intakeFirstReviewDetailGeneration||!intakeFirstReviewCurrent(c))return;
  if(r?.kind!=='INTAKE_TEAM_COMMAND'||r.action!=='REVIEW_DECISION'||r.actor!==c.actor||r.revision!==c.revision+1||r.decision?.proposalId!==d.item.proposalId||r.decision.firstReviewId!==d.item.firstReviewId||r.decision.submissionVersion!==d.item.submissionVersion||r.decision.state!==(fields.decision==='RETURNED'?'RETURNED':'FIRST_REVIEWED')||r.decision.executionAuthorized!==false)throw Error('Decision response changed.');
  // Only the existing full-workspace refresh can update db and sharedRevision.
  const fresh=await sharedFetch('/api/workspace');
  if(generation!==intakeFirstReviewDetailGeneration||!intakeFirstReviewCurrent(c))return;
  if(fresh?.actor!==c.actor||!Number.isSafeInteger(fresh.revision)||fresh.revision<r.revision||!Array.isArray(fresh.data?.projects))throw Error('A fresh workspace is required.');
  closeModal();resetIntakeFirstReview();applyShared(fresh);toast('First-review decision saved. Final approval and permission to start remain separate.');
 }catch(e){if(generation===intakeFirstReviewDetailGeneration&&intakeFirstReviewCurrent(c)){closeModal();resetIntakeFirstReview();toast('Unable to confirm the decision. Refresh the workspace before trying again.')}}finally{if(intakeFirstReviewDetailLock===token){intakeFirstReviewDetailLock=null;lockShared(false)}}
}
document.addEventListener('submit',event=>{if(event.target?.id!=='first-review-decision-form')return;event.preventDefault();submitIntakeFirstReviewDecision(Object.fromEntries(new FormData(event.target)))});
