import {identity,json,failure} from '../../../server/service';
import {reflectionEmailMonitoring} from '../../../server/reflection-email-monitor';
export async function GET(){try{const user=await identity();return json(await reflectionEmailMonitoring(user.userId))}catch(error){return failure(error)}}
