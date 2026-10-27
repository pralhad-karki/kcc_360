import {createEngine} from './engine.mjs';
import {identity,readSession,loadWorkspace,ServiceError} from './service';
import {certificateRecord} from './certificate-policy.mjs';
export async function verifyCertificate(reference:string){const user=await identity(),actor=await readSession(user.userId),row=await loadWorkspace();if(!reference||reference.length>220)throw new ServiceError(404,'Reference unavailable.');const engine=createEngine(row.data,actor);const record=certificateRecord(engine.snapshot(),reference,actor,engine.actors());if(!record)throw new ServiceError(404,'Reference unavailable.');return record}
