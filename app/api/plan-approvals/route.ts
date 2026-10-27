import {identity,sameOrigin,json,failure,ServiceError} from '../../../server/service';
import {planApprovalReviewAPI} from '../../../server/plan-approval-api';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await identity();return json(await planApprovalReviewAPI(user.userId,new URL(request.url)))}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);const user=await identity();const raw=await request.text();if(raw.length>12000)throw new ServiceError(413,'Plan review request is too large.');let body;try{body=JSON.parse(raw)}catch{throw new ServiceError(400,'A JSON plan review request is required.')}return json(await planApprovalReviewAPI(user.userId,undefined,body))}catch(e){return failure(e)}}
