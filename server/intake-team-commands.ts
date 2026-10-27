import {env} from 'cloudflare:workers';
import {readSession,loadWorkspace,ServiceError} from './service';
import {dispatchIntakeTeamCommand,IntakeTeamCommandError} from './intake-team-command-bridge.mjs';
import {createIntakeTeamRuntime,IntakeTrustedSourceError} from './intake-trusted-loader.mjs';
export {isIntakeTeamCommand} from './intake-team-command-bridge.mjs';
// Existing owner authentication/same-origin checks run in the workspace route.
// Server composition only; no approved provider registry is installed yet.
const intakeTeamRuntime=createIntakeTeamRuntime();
export async function intakeTeamCommandAction(subject:string,body:any){
 const actor=await readSession(subject),row=await loadWorkspace();
 if(body.actor!==actor)throw new ServiceError(409,'The demo account changed. Refresh before retrying.');
 if(!Number.isSafeInteger(body.revision)||body.revision!==row.revision)throw new ServiceError(409,'Shared data changed. Refresh before retrying.');
 try{return await dispatchIntakeTeamCommand({subject,actor,body},{db:env.DB,...intakeTeamRuntime})}
 catch(error){if(error instanceof IntakeTeamCommandError||error instanceof IntakeTrustedSourceError)throw new ServiceError(error.status,error.message);throw error}
}
