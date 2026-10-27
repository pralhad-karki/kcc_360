import {identity,json,failure,sameOrigin,ServiceError} from '../../../server/service';
import {mockCohortBatches} from '../../../server/cohort-progression-batches';
export async function GET(){try{const user=await identity();return json(await mockCohortBatches(user.userId))}catch(error){return failure(error)}}
export async function POST(request:Request){try{sameOrigin(request);const user=await identity();const raw=await request.text();if(raw.length>4000)throw new ServiceError(413,'Fictional batch request too large.');let body;try{body=JSON.parse(raw)}catch{throw new ServiceError(400,'Invalid fictional batch request.')}return json(await mockCohortBatches(user.userId,body))}catch(error){return failure(error)}}
