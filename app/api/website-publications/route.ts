import {identity,sameOrigin,json,failure,ServiceError} from '../../../server/service';
import {websiteV1Operator} from '../../../server/website-v1-operator.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await identity();return json(await websiteV1Operator.execute(user.userId,{action:'read',eventId:new URL(request.url).searchParams.get('eventId')}))}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);const user=await identity();const raw=await request.text();if(raw.length>4000)throw new ServiceError(413,'Publication request too large.');let body;try{body=JSON.parse(raw)}catch{throw new ServiceError(400,'JSON required.')};return json(await websiteV1Operator.execute(user.userId,body))}catch(e){return failure(e)}}
