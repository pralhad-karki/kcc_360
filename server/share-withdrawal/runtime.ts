import {ShareWithdrawalService} from './application';
import {DrizzleShareWithdrawalRepository} from './drizzle-repository';
export {WithdrawalAccessError,WithdrawalConflictError,WithdrawalValidationError,withdrawalKey} from './domain';
// Server composition only; uses existing DB binding and existing schema.
export const createShareWithdrawal=(db:D1Database)=>new ShareWithdrawalService(new DrizzleShareWithdrawalRepository(db));
