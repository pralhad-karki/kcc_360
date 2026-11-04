export class WithdrawalValidationError extends Error {readonly code='WITHDRAWAL_INVALID'}
export class WithdrawalAccessError extends Error {readonly code='WITHDRAWAL_DENIED'}
export class WithdrawalConflictError extends Error {readonly code='WITHDRAWAL_CONFLICT'}
export class WithdrawalStorageError extends Error {readonly code='WITHDRAWAL_UNAVAILABLE'}
export interface ShareBinding {workspaceId:string;shareId:string;tokenHash:string}
export interface WithdrawalRecord extends ShareBinding {schema:'KCC360_SHARE_WITHDRAWAL_V1';subject:string;actor:string;sourceRevision:number;time:string}
export interface WithdrawalRequest extends ShareBinding {subject:string;actor:string;ownerActor:string;ownerSubject?:string;sourceRevision:number;sessionGeneration:string}
export const WITHDRAWAL_COMMAND='portfolio.share.quota-withdrawal';
export function identifier(value:unknown):asserts value is string {if(typeof value!=='string'||value.trim()!==value||!value||value.length>200||/[\u0000-\u001f\u007f]/.test(value))throw new WithdrawalValidationError('Valid withdrawal reference required.');}
export function utc(value:unknown):asserts value is string {if(typeof value!=='string'||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw new WithdrawalValidationError('Explicit UTC withdrawal time required.');}
export function validateBinding(binding:ShareBinding){identifier(binding.workspaceId);identifier(binding.shareId);if(typeof binding.tokenHash!=='string'||!/^[a-f0-9]{64}$/.test(binding.tokenHash))throw new WithdrawalValidationError('Valid share binding required.');}
export function validateRequest(r:WithdrawalRequest){validateBinding(r);identifier(r.subject);identifier(r.actor);identifier(r.ownerActor);utc(r.sessionGeneration);if(r.ownerActor!==r.actor||r.ownerSubject!==undefined&&r.ownerSubject!==r.subject)throw new WithdrawalAccessError('Only the current share owner may withdraw this link.');if(!Number.isSafeInteger(r.sourceRevision)||r.sourceRevision<0)throw new WithdrawalValidationError('Current source revision required.');}
export function validateRecord(record:unknown,binding:ShareBinding):WithdrawalRecord {
 if(!record||typeof record!=='object'||Array.isArray(record))throw new WithdrawalValidationError('Invalid withdrawal receipt.');
 const r=record as WithdrawalRecord;
 if(Object.keys(r).sort().join(',')!=='actor,schema,shareId,sourceRevision,subject,time,tokenHash,workspaceId'||r.schema!=='KCC360_SHARE_WITHDRAWAL_V1')throw new WithdrawalValidationError('Invalid withdrawal receipt.');
 validateBinding(r);identifier(r.subject);identifier(r.actor);utc(r.time);
 if(!Number.isSafeInteger(r.sourceRevision)||r.sourceRevision<0||r.workspaceId!==binding.workspaceId||r.shareId!==binding.shareId||r.tokenHash!==binding.tokenHash)throw new WithdrawalValidationError('Withdrawal receipt binding mismatch.');
 return {...r};
}
export async function withdrawalKey(binding:ShareBinding){validateBinding(binding);const bytes=new TextEncoder().encode(JSON.stringify([binding.workspaceId,binding.shareId,binding.tokenHash])),hash=await crypto.subtle.digest('SHA-256',bytes);return 'KCC-SHARE-WITHDRAWAL:'+Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');}
