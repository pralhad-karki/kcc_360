import {env} from 'cloudflare:workers';
import {ServiceError} from './service';
import {createPlanApprovalRuntime,PlanApprovalAccessError} from './plan-approval-runtime.mjs';
import {readPlanApprovalReview,decidePlanApprovalReview} from './plan-approval-review.mjs';
// Server-owned composition root. No official provider registry is installed.
// A demo persona, email or browser body cannot enable this runtime.
const runtime=createPlanApprovalRuntime();
export async function planApprovalReviewAPI(subject:string,url?:URL,body?:unknown){
 if(!runtime.enabled){if(body!==undefined)throw new ServiceError(503,'Institutional plan review is not activated.');return {available:false,message:'Institutional plan review awaits approved identity, source and reviewer mappings.'}}
 try{
  if(body!==undefined)return {available:true,result:await decidePlanApprovalReview({runtime,db:env.DB,subject,body})};
  if(!url)throw new ServiceError(400,'A plan reference is required.');
  const reference={planId:url.searchParams.get('planId'),planVersion:Number(url.searchParams.get('planVersion'))};
  return {available:true,review:await readPlanApprovalReview({runtime,subject,reference})};
 }catch(e){if(e instanceof PlanApprovalAccessError)throw new ServiceError(e.status,e.message);throw e}
}
