import {identity,sameOrigin,json,failure,ServiceError} from '../../../server/service';
import {websiteV1Operator} from '../../../server/website-v1-operator.mjs';
export const dynamic='force-dynamic';
// Only known integration errors cross the HTTP boundary; unexpected exceptions use
// the existing generic service failure and never expose transport/database details.
const publicationErrors:Record<string,number>={
 SESSION_REQUIRED:401,FORBIDDEN:403,INVALID_OPERATOR_REQUEST:400,
 WITHDRAWAL_REASON_REQUIRED:400,UNKNOWN_REQUEST:404,
 INTEGRATION_DISABLED:503,LIVE_MODE_UNSUPPORTED:503,MOCK_TRANSPORT_REQUIRED:503,WORKSPACE_UNAVAILABLE:503,
 WORKSPACE_SIZE_LIMIT:413,STALE_WORKSPACE:409,SOURCE_NOT_APPROVED:409,
 WITHDRAWAL_TERMINAL:409,RELEASE_EVIDENCE_REQUIRED:409,CATEGORY_MAPPING_REQUIRED:409,
 ZONED_EVENT_TIMES_REQUIRED:409,TIME_MAPPING_MISMATCH:409,MODE_MAPPING_REQUIRED:409,
 SOURCE_MAPPING_REQUIRED:409,SUPERSEDED_REQUEST:409,ATTEMPT_IN_FLIGHT:409,STATUS_NOT_RECEIVED:409,
 UNKNOWN_ATTEMPT:409,RESPONSE_SCOPE_MISMATCH:502,RESPONSE_STATUS_INVALID:502,
 WEBSITE_ID_INVALID:502,WEBSITE_BINDING_CONFLICT:409,PUBLIC_URL_INVALID:502,WITHDRAWAL_NOT_CONFIRMED:502
};
function publicationFailure(error:unknown){const code=(error as {code?:unknown})?.code;if(typeof code==='string'&&Object.hasOwn(publicationErrors,code))return json({error:code},publicationErrors[code]);return failure(error)}
export async function GET(request:Request){try{const user=await identity();return json(await websiteV1Operator.execute(user.userId,{action:'read',eventId:new URL(request.url).searchParams.get('eventId')}))}catch(e){return publicationFailure(e)}}
export async function POST(request:Request){try{sameOrigin(request);const user=await identity();const raw=await request.text();if(raw.length>4000)throw new ServiceError(413,'Publication request too large.');let body;try{body=JSON.parse(raw)}catch{throw new ServiceError(400,'JSON required.')};return json(await websiteV1Operator.execute(user.userId,body))}catch(e){return publicationFailure(e)}}
