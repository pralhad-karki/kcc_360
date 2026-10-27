import {identity,json,failure,ServiceError} from '../../../server/service';
import {misUploadAPI} from '../../../server/mis-upload-api';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const user=await identity();return json(await misUploadAPI(user.userId,request))}catch(e){return failure(e)}}
export async function POST(request:Request){try{if(request.headers.get('origin')!==new URL(request.url).origin)throw new ServiceError(403,'Same-origin upload required.');const user=await identity();return json(await misUploadAPI(user.userId,request))}catch(e){return failure(e)}}
