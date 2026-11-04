import {createEngine} from '../../engine.mjs';
import {validateCommandForms} from '../../form-fields.mjs';
import {DiscussionAccessError,jsonObject} from '../domain';
import type {JsonObject} from '../domain';
import type {DiscussionCommand} from '../command-domain';
import type {DiscussionTransitionPort} from '../command-ports';

// Anti-corruption adapter: reuse all existing access, activity, participant,
// history, notification and protected-plan guards instead of copying policy.
export class LegacyDiscussionCommandAdapter implements DiscussionTransitionPort {
 async run(workspace:JsonObject,actor:string,projectId:string,input:DiscussionCommand):Promise<JsonObject>{
  const command=input.kind==='POST'?'sendMessage':input.kind==='REPLY'?'replyDiscussion':'setDiscussionState';
  const args=input.kind==='POST'?[{form:{text:input.text}}]
   :input.kind==='REPLY'?[{form:{text:input.text}},input.threadRef,input.expectedVersion,input.expectedCount]
   :[{form:{reason:input.reason}},input.threadRef,input.state,input.expectedVersion,input.expectedCount];
  try{
   validateCommandForms(command,args);
   const engine=createEngine(jsonObject(workspace),actor);
   return jsonObject(engine.run(command,args,{selected:projectId,page:'Projects'}).data);
  }catch{throw new DiscussionAccessError('Discussion command is invalid or outside current access.');}
 }
}
