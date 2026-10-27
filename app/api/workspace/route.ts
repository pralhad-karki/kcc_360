import {reflectionEmailRuntime} from '../../../server/reflection-email-runtime.mjs';
import {isIntakeTeamCommand,intakeTeamCommandAction} from '../../../server/intake-team-commands';
import {identity,sameOrigin,workspaceResponse,execute,json,failure,ServiceError} from '../../../server/service';
export const dynamic='force-dynamic';
export async function GET(){try{const user=await identity();return json(await workspaceResponse(user.userId))}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);const user=await identity();const raw=await request.text();if(raw.length>100_000)throw new ServiceError(413,'Request is too large.');const body=JSON.parse(raw);if(isIntakeTeamCommand(body?.command))return json(await intakeTeamCommandAction(user.userId,body));return json(await execute(user.userId,body,{reflectionEmail:reflectionEmailRuntime}))}catch(e){return failure(e)}}
