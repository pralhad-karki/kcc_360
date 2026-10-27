import {identity,json,failure,sameOrigin,ServiceError} from '../../../server/service';
import {mockCohortProgression} from '../../../server/cohort-progression';
export async function GET(){try{const user=await identity();return json(await mockCohortProgression(user.userId))}catch(error){return failure(error)}}
export async function POST(request:Request){try{sameOrigin(request);const user=await identity();const raw=await request.text();if(raw.length>2000)throw new ServiceError(413,'Preview request too large.');let body;try{body=JSON.parse(raw)}catch{throw new ServiceError(400,'Invalid preview request.')}return json(await mockCohortProgression(user.userId,body))}catch(error){return failure(error)}}
