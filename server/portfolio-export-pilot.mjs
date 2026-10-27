// Owner-private projection used by the authenticated demo export path.
// No PDF generation or sharing action.
// Caller must authenticate and freshly load workspace, actor and directory server-side.
import {shareEligible,shareItem,sourceBinding,shareHash} from './share-policy.mjs';
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&[Object.prototype,null].includes(Object.getPrototypeOf(v));
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const timestamp=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&new Date(v).toISOString().slice(0,19)===v.slice(0,19);
export async function preparePrivatePortfolioExportPilot({data,users,actor,input,now}){
 check(['s1','s2'].includes(actor),'OWN_STUDENT_REQUIRED');
 check(plain(data)&&Array.isArray(data.projects)&&Array.isArray(users)&&timestamp(now),'TRUSTED_EXPORT_CONTEXT_REQUIRED');
 const identities=users.filter(u=>u?.id===actor);check(identities.length===1&&typeof identities[0].name==='string'&&identities[0].name.trim(),'STUDENT_NAME_REQUIRED');
 check(plain(input)&&Object.keys(input).length===2&&Object.hasOwn(input,'projectIds')&&Object.hasOwn(input,'includeHours')&&Array.isArray(input.projectIds)&&input.projectIds.length>=1&&input.projectIds.length<=20&&input.projectIds.every(id=>typeof id==='string'&&id.trim()===id&&id.length>0&&id.length<=200)&&new Set(input.projectIds).size===input.projectIds.length&&typeof input.includeHours==='boolean','EXACT_EXPORT_SELECTION_REQUIRED');
 const items=[],bindings=[];
 for(const id of input.projectIds){
  const matches=data.projects.filter(p=>p?.id===id);check(matches.length===1,'UNIQUE_ACHIEVEMENT_REQUIRED');const p=matches[0];
  check((!p.activityControl||p.activityControl.state==='ACTIVE')&&shareEligible(p,actor),'CURRENT_VERIFIED_ACHIEVEMENT_REQUIRED');
  const projected=shareItem(p,actor,input.includeHours);
  check(['title','programme','type','sdg','verification'].every(k=>typeof projected[k]==='string'),'VALID_ACHIEVEMENT_FIELDS_REQUIRED');
  const item=Object.fromEntries(['title','programme','type','sdg','verification'].map(k=>[k,projected[k]]));
  if(input.includeHours){check(['attendanceMinutes','contributionMinutes'].every(k=>typeof projected[k]==='number'&&Number.isFinite(projected[k])&&projected[k]>=0),'VALID_VERIFIED_HOURS_REQUIRED');item.attendanceMinutes=projected.attendanceMinutes;item.contributionMinutes=projected.contributionMinutes}
  items.push(item);
  // Private downloads are independent of public link/QR consent and its epoch.
  bindings.push({projectId:id,fingerprint:await sourceBinding({...p,shareConsentEpoch:undefined},actor,input.includeHours)});
 }
 const preview={schema:'PRIVATE_VERIFIED_ACHIEVEMENTS_PILOT_1',demo:true,studentName:identities[0].name,audience:'OWNER_PRIVATE',generatedAt:now,coverage:'Selected verified achievements only; not a complete CV or official credential.',includeHours:input.includeHours,items};
 const digest=await shareHash(JSON.stringify({schema:preview.schema,actor,studentName:preview.studentName,includeHours:input.includeHours,items,bindings}));
 return {preview,digest,bindings};
}

// Renderer accepts the minimal private projection only. It does not authenticate.
export function renderPrivatePortfolioPrintPilot(preview){
 const exact=(v,keys)=>plain(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
 const text=(v,max=2000)=>typeof v==='string'&&v.length>0&&v.length<=max;
 const keys=['schema','demo','studentName','audience','generatedAt','coverage','includeHours','items'];
 check(exact(preview,keys)&&preview.schema==='PRIVATE_VERIFIED_ACHIEVEMENTS_PILOT_1'&&preview.demo===true&&preview.audience==='OWNER_PRIVATE'&&text(preview.studentName,200)&&timestamp(preview.generatedAt)&&typeof preview.includeHours==='boolean'&&preview.coverage==='Selected verified achievements only; not a complete CV or official credential.'&&Array.isArray(preview.items)&&preview.items.length>=1&&preview.items.length<=20,'PRIVATE_PRINT_PROJECTION_REQUIRED');
 const itemKeys=['title','programme','type','sdg','verification',...(preview.includeHours?['attendanceMinutes','contributionMinutes']:[])];
 check(preview.items.every(i=>exact(i,itemKeys)&&text(i.title,120)&&text(i.programme,160)&&text(i.type,160)&&text(i.sdg,100)&&text(i.verification,200)&&(!preview.includeHours||['attendanceMinutes','contributionMinutes'].every(k=>typeof i[k]==='number'&&Number.isFinite(i[k])&&i[k]>=0))),'MINIMAL_PRINT_ITEMS_REQUIRED');
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const when=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kathmandu',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(preview.generatedAt))+' NPT';
 const items=preview.items.map((i,n)=>`<article class="achievement"><p class="index">Achievement ${n+1}</p><h3>${esc(i.title)}</h3><dl><dt>Activity programme</dt><dd>${esc(i.programme)}</dd><dt>Activity type</dt><dd>${esc(i.type)}</dd><dt>SDG alignment</dt><dd>${esc(i.sdg)}</dd></dl><p>${esc(i.verification)}</p>${preview.includeHours?`<table><caption>Separate verified participation measures</caption><thead><tr><th scope="col">Measure</th><th scope="col">Hours</th></tr></thead><tbody><tr><th scope="row">Attendance</th><td>${(i.attendanceMinutes/60).toFixed(2)}</td></tr><tr><th scope="row">Contribution</th><td>${(i.contributionMinutes/60).toFixed(2)}</td></tr></tbody></table><p class="note">Attendance and contribution are separate measures and are not added together.</p>`:''}</article>`).join('');
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,nosnippet"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>KCC360 · Private verified achievements</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;background:#edf2f4;color:#172c36;font:11pt/1.5 Arial,'Noto Sans Devanagari',sans-serif}.sheet{max-width:186mm;margin:24px auto;padding:16mm;background:#fff}header{border-bottom:2px solid #24675b;padding-bottom:14px}.eyebrow,.index{font-size:9pt;font-weight:bold;letter-spacing:.06em;color:#31584f}h1{font-size:24pt;line-height:1.2;margin:10px 0;overflow-wrap:anywhere}h2{font-size:16pt;line-height:1.3}h3{font-size:13pt;line-height:1.35;margin:6px 0 12px;overflow-wrap:anywhere}.meta,.note,footer{font-size:9pt;color:#42545d}.coverage{border-left:3px solid #24675b;padding-left:12px}.achievement{padding:18px 0;border-top:1px solid #ccd6da;break-inside:avoid;page-break-inside:avoid}dl{display:grid;grid-template-columns:38mm 1fr;gap:4px 12px}dt{font-weight:bold}dd{margin:0;overflow-wrap:anywhere}p{overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;margin-top:12px}caption{text-align:left;font-weight:bold;margin-bottom:6px}th,td{text-align:left;border:1px solid #ccd6da;padding:6px 10px}footer{border-top:1px solid #ccd6da;padding-top:12px;margin-top:16px}@media print{body{background:#fff}.sheet{max-width:none;margin:0;padding:0}header,h2{break-after:avoid}footer{break-inside:avoid}}@media screen and (max-width:600px){.sheet{margin:0;padding:20px}dl{grid-template-columns:1fr;gap:2px}dd{margin-bottom:8px}}</style></head><body><main class="sheet"><header><p class="eyebrow">KCC360 · PRIVATE DEMONSTRATION EXPORT</p><h1>${esc(preview.studentName)}</h1><h2>Selected verified achievements</h2><p class="meta">Generated ${esc(when)} · ${preview.items.length} selected ${preview.items.length===1?'achievement':'achievements'}</p></header><p class="coverage">${esc(preview.coverage)}</p>${items}<footer><p>Point-in-time demonstration of selected records. Recheck current institutional records before relying on this document.</p><p>This private view excludes grades, private feedback, reflections, peer details, files and contact information. Academic history, experience and certificate sections are not included.</p></footer></main></body></html>`;
}

// Future route must call this with freshly authenticated server storage. Never
// print a caller-supplied preview; compare the exact selection/source digest first.
export async function preparePrivatePortfolioPrintPilot(context){
 check(plain(context)&&typeof context.expectedDigest==='string'&&/^[a-f0-9]{64}$/.test(context.expectedDigest),'PREVIEW_DIGEST_REQUIRED');
 const {expectedDigest,...trusted}=context,prepared=await preparePrivatePortfolioExportPilot(trusted);
 check(prepared.digest===expectedDigest,'EXPORT_SOURCE_CHANGED');
 return {html:renderPrivatePortfolioPrintPilot(prepared.preview),digest:prepared.digest};
}

const cvSections={summary:'Personal summary',education:'Education and school history',training:'External training and certificates',skills:'Professional skills and languages',experience:'External work, internships and volunteering'};
export async function preparePrivateCVExport(context){
 const {data,users,actor,input,now}=context;
 check(['s1','s2'].includes(actor)&&plain(data)&&Array.isArray(data.projects)&&Array.isArray(users)&&timestamp(now),'TRUSTED_EXPORT_CONTEXT_REQUIRED');
 check(plain(input)&&Object.keys(input).length===(Object.hasOwn(input,'certificateReferences')?4:3)&&Array.isArray(input.declarationSections)&&input.declarationSections.length<=5&&new Set(input.declarationSections).size===input.declarationSections.length&&input.declarationSections.every(k=>Object.hasOwn(cvSections,k))&&Array.isArray(input.projectIds)&&input.projectIds.length<=20&&typeof input.includeHours==='boolean','EXACT_CV_SELECTION_REQUIRED');
 const identity=users.filter(u=>u.id===actor);check(identity.length===1&&typeof identity[0].name==='string'&&identity[0].name.trim(),'STUDENT_NAME_REQUIRED');
 const base=input.projectIds.length?await preparePrivatePortfolioExportPilot({...context,input:{projectIds:input.projectIds,includeHours:input.includeHours}}):null;
 const record=data.cvDeclarations?.[actor];const declarations=input.declarationSections.map(key=>{check(record?.classification==='STUDENT_DECLARED'&&typeof record.content?.[key]==='string'&&record.content[key].trim()&&record.content[key].length<=2000,'CURRENT_DECLARATION_REQUIRED');return {key,title:cvSections[key],text:record.content[key],classification:'STUDENT_DECLARED'}});
 const certificateReferences=Object.hasOwn(input,'certificateReferences')?input.certificateReferences:[];
 check(Array.isArray(certificateReferences)&&certificateReferences.length<=20&&new Set(certificateReferences).size===certificateReferences.length&&certificateReferences.every(r=>typeof r==='string'&&r.length>0&&r.length<=220),'EXACT_CERTIFICATE_SELECTION_REQUIRED');
 const certificateBindings=[];
 const certificates=[];
 for(const reference of certificateReferences){
  const matches=data.projects.flatMap(p=>Object.entries(p.certs||{}).filter(([,c])=>c?.id===reference).map(([student,c])=>({p,student,c})));
  check(matches.length===1,'UNIQUE_CURRENT_CERTIFICATE_REQUIRED');const {p,student,c}=matches[0];
  check(student===actor&&c.recipient===actor&&c.status==='VALID'&&(!p.activityControl||p.activityControl.state==='ACTIVE')&&shareEligible(p,actor)&&p.evaluations[actor].certificateEligible!==false&&(!c.evaluationVersion||c.evaluationVersion===(p.evaluations[actor].version||1)),'CURRENT_OWN_CERTIFICATE_REQUIRED');
  const item={reference:c.id,title:c.projectTitle||p.title,issuer:c.issuerName||'Assigned demo issuer',issuedAt:c.issued,version:c.version||1,status:'VALID',verification:'Valid demonstration certificate; not an official credential'};
  check(typeof item.title==='string'&&item.title.length>0&&item.title.length<=200&&typeof item.issuer==='string'&&item.issuer.length>0&&item.issuer.length<=200&&timestamp(item.issuedAt)&&Number.isSafeInteger(item.version)&&item.version>0,'VALID_CERTIFICATE_FIELDS_REQUIRED');
  certificates.push(item);certificateBindings.push({reference,fingerprint:await sourceBinding({...p,shareConsentEpoch:undefined},actor,false),certificate:item});
 }
 check(declarations.length||base?.preview.items.length||certificates.length,'NONEMPTY_CV_REQUIRED');
 const preview={schema:'PRIVATE_CV_1',demo:true,audience:'OWNER_PRIVATE',studentName:identity[0].name,generatedAt:now,includeHours:input.includeHours,items:base?.preview.items||[],declarations,certificates};
 const digest=await shareHash(JSON.stringify({actor,studentName:preview.studentName,includeHours:input.includeHours,items:preview.items,achievementDigest:base?.digest||null,declarations,certificates,certificateBindings}));
 return {preview,digest};
}
export function renderPrivateCV(preview){
 check(preview?.schema==='PRIVATE_CV_1'&&preview.audience==='OWNER_PRIVATE'&&preview.demo===true&&Array.isArray(preview.declarations)&&Array.isArray(preview.items),'PRIVATE_CV_REQUIRED');
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const declarations=preview.declarations.map(d=>`<section><h2>${esc(d.title)}</h2><p class="label">Student-declared · Not verified by KCC</p><p class="declared">${esc(d.text)}</p></section>`).join('');
 // Reuse the already validated achievement renderer for each selected verified source.
 const achievements=preview.items.length?renderPrivatePortfolioPrintPilot({schema:'PRIVATE_VERIFIED_ACHIEVEMENTS_PILOT_1',demo:true,studentName:preview.studentName,audience:'OWNER_PRIVATE',generatedAt:preview.generatedAt,coverage:'Selected verified achievements only; not a complete CV or official credential.',includeHours:preview.includeHours,items:preview.items}).match(/<article class="achievement">[\s\S]*?(?=<footer>)/)[0]:'';
 const certificates=(preview.certificates||[]).map(c=>`<section><h3>${esc(c.title)}</h3><p>${esc(c.verification)}</p><p>Issuer: ${esc(c.issuer)} · Issued ${esc(c.issuedAt.slice(0,10))}</p><p>Reference: ${esc(c.reference)} · Version ${esc(c.version)} · ${esc(c.status)}</p></section>`).join('');
 const when=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kathmandu',dateStyle:'medium',timeStyle:'short'}).format(new Date(preview.generatedAt));
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>KCC360 · Private CV</title><style>@page{size:A4;margin:16mm}body{font:11pt/1.5 Arial,sans-serif;color:#172c36;max-width:180mm;margin:24px auto;padding:16px}h1{font-size:24pt}h2{font-size:15pt}h3{font-size:12pt}h1,h2,h3,p,dd{overflow-wrap:anywhere}.label,footer{font-size:9pt;color:#42545d}.declared{white-space:pre-wrap}section,.achievement{border-top:1px solid #ccd6da;padding:12px 0}h2,h3{break-after:avoid}dl{display:grid;grid-template-columns:38mm 1fr}dd{margin:0}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccd6da;padding:6px;text-align:left}@media print{body{margin:0;padding:0}}</style></head><body><main><header><p>PRIVATE · DEMONSTRATION CV</p><h1>${esc(preview.studentName)}</h1><p class="label">Generated ${esc(when)} NPT</p><p>Selected student declarations and verified portfolio achievements. Declaration sections are the student's own statements; this CV is not an official KCC credential.</p></header>${declarations}${preview.items.length?'<h2>Verified portfolio achievements</h2>'+achievements:''}${certificates?'<h2>Selected issued demonstration certificates</h2>'+certificates:''}<footer>Private point-in-time copy. Later changes or public-link withdrawal cannot recall a saved or printed copy. Academic results and official credential documents are not included.</footer></main></body></html>`;
}
export async function preparePrivateCVPrint(context){check(typeof context.expectedDigest==='string'&&/^[a-f0-9]{64}$/.test(context.expectedDigest),'PREVIEW_DIGEST_REQUIRED');const prepared=await preparePrivateCVExport(context);check(prepared.digest===context.expectedDigest,'EXPORT_SOURCE_CHANGED');return {html:renderPrivateCV(prepared.preview),digest:prepared.digest}}
