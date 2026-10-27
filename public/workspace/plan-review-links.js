// Contextual links only. Institutional reviewer authority comes from the server.
const planReviewURL=p=>'/workspace/plan-approvals.html?'+new URLSearchParams({planId:p.id,planVersion:String(p.version||1)});
const planReviewLink=p=>`<a class="button" href="${esc(planReviewURL(p))}" target="_blank" rel="noopener">Open plan approval review</a>`;
const planReviewPriorControls=planControls;
planControls=function(p){return p.approvalControl?.managed?planReviewLink(p):planReviewPriorControls(p)+planReviewLink(p)};
const planReviewPriorEditable=editablePlan;
editablePlan=function(p){return !p?.approvalControl?.managed&&planReviewPriorEditable(p)};
const planReviewPriorClubEditable=editableClubPlan;
editableClubPlan=function(c,p){return !p?.approvalControl?.managed&&planReviewPriorClubEditable(c,p)};
const planReviewPriorClubCard=clubPlanCard;
clubPlanCard=function(c,p){return planReviewPriorClubCard(c,p)+planReviewLink(p)};
