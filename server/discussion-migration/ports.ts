import type {DiscussionSnapshot,JsonObject} from './domain';
export interface RevisionFence {recordId:string;revision:number}
export interface MigrationAuthority {actor:string;fence:RevisionFence}
export interface LegacyDiscussion {project:JsonObject;fence:RevisionFence}
export interface StagedDiscussion {format:1;revision:number;operationId:string;subject:string;actor:string;occurredAt:string;sourceDigest:string;discussionDigest:string;sourceFence:RevisionFence;snapshot:DiscussionSnapshot}
export interface DiscussionMigrationRepository {
 readLegacy(projectId:string):Promise<LegacyDiscussion>;
 readStaged(projectId:string):Promise<StagedDiscussion|null>;
 saveStage(input:{projectId:string;expectedRevision:number;document:StagedDiscussion;fences:RevisionFence[]}):Promise<void>;
}
export interface MigrationAuthorityPort {authorize(subject:string,projectId:string):Promise<MigrationAuthority>}
export interface DigestPort {sha256(value:string):Promise<string>}
