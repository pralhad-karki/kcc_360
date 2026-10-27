// Immutable final review references. Approval never implies permission to start.
const check=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(v);
export const finalReviewCanonical=v=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(finalReviewCanonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(finalReviewCanonical(v[k]))])):v);
export async function finalReviewPrerequisiteDigest(r,f){const v={review:f,submission:r.submissions.at(-1),mentors:r.mentorAssignments||[],consultations:r.supportRequests||[],scopes:r.teamConsultationScopes||[]};return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(finalReviewCanonical(v))))).map(x=>x.toString(16).padStart(2,'0')).join('')}
export function currentTeamFinalReview(r,f){
 const history=r.teamFinalReviews||[];check(Array.isArray(history)&&history.every((d,i)=>d.version===i+1&&id(d.id))&&new Set(history.map(d=>d.id)).size===history.length,'VALID_FINAL_REVIEW_HISTORY_REQUIRED');const matches=history.filter(d=>d.firstReviewId===f.id);if(!matches.length)return null;check(matches.length===1,'UNIQUE_FINAL_REVIEW_REQUIRED');const d=matches[0];
 check(d.firstReviewVersion===f.version&&d.submissionVersion===f.submissionVersion&&d.by===f.route.approvalAuthority.personId&&id(d.actor)&&['APPROVED','REJECTED'].includes(d.decision)&&typeof d.reason==='string'&&d.reason.trim().length>0&&d.reason.length<=2000&&Number.isFinite(Date.parse(d.at))&&typeof d.sourceDigest==='string'&&/^[a-f0-9]{64}$/.test(d.sourceDigest)&&finalReviewCanonical(d.authority)===finalReviewCanonical(f.route.approvalAuthority),'VALID_FINAL_REVIEW_REQUIRED');return d;
}

export async function finalReviewPreviewToken(r,f,expectedFinalVersion){
 const value={prerequisites:await finalReviewPrerequisiteDigest(r,f),authority:f.route.approvalAuthority,expectedFinalVersion};return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(finalReviewCanonical(value))))).map(x=>x.toString(16).padStart(2,'0')).join('');
}
