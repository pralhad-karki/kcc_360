import {identity,sameOrigin,readSession,selectActor,json,failure,ServiceError} from '../../../server/service';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{sameOrigin(request);const user=await identity();await readSession(user.userId);let raw=await request.text();if(raw.length>1000)throw new ServiceError(413,'Request too large.');let body=JSON.parse(raw);if(typeof body.actor!=='string')throw new ServiceError(400,'Choose a valid demo persona.');return json(await selectActor(user.userId,body.actor))}catch(e){return failure(e)}}
