import {WithdrawalAccessError,WithdrawalConflictError,validateRequest,withdrawalKey,validateRecord} from './domain';
import type {ShareBinding,WithdrawalRequest,WithdrawalRecord} from './domain';
export interface WithdrawalRepository {
 find(key:string,binding:ShareBinding):Promise<WithdrawalRecord|null>;
 assertFence(request:WithdrawalRequest):Promise<void>;
 append(key:string,record:WithdrawalRecord,request:WithdrawalRequest):Promise<boolean>;
}
export class ShareWithdrawalService {
 constructor(private readonly repository:WithdrawalRepository,private readonly clock:()=>string=()=>new Date().toISOString()){}
 async find(binding:ShareBinding){return this.repository.find(await withdrawalKey(binding),binding);}
 async withdraw(request:WithdrawalRequest){
  validateRequest(request);const key=await withdrawalKey(request),prior=await this.repository.find(key,request);
  if(prior){await this.repository.assertFence(request);if(prior.subject!==request.subject||prior.actor!==request.actor)throw new WithdrawalAccessError('Withdrawal receipt is outside current ownership.');return {record:prior,replayed:true};}
  const record=validateRecord({schema:'KCC360_SHARE_WITHDRAWAL_V1',workspaceId:request.workspaceId,shareId:request.shareId,tokenHash:request.tokenHash,subject:request.subject,actor:request.actor,sourceRevision:request.sourceRevision,time:this.clock()},request);
  if(await this.repository.append(key,record,request))return {record,replayed:false};
  // A competing identical withdrawal is an existing receipt; source/session
  // conflicts still fail closed, and do not create a second audit row.
  await this.repository.assertFence(request);const saved=await this.repository.find(key,request);
  if(!saved)throw new WithdrawalConflictError('Share or session changed. Refresh before retrying.');
  if(saved.subject!==request.subject||saved.actor!==request.actor)throw new WithdrawalAccessError('Withdrawal receipt is outside current ownership.');
  return {record:saved,replayed:true};
 }
}
