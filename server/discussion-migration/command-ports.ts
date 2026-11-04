import type {JsonObject} from './domain';
import type {DiscussionCommand} from './command-domain';

export interface DiscussionTransitionPort {
 // Private workspace stays inside this boundary; public transport is not wired.
 run(workspace:JsonObject,actor:string,projectId:string,command:DiscussionCommand):Promise<JsonObject>;
}
