import {readSession,loadWorkspace,WORKSPACE,ServiceError} from './service';
import {reflectionEmailRuntime} from './reflection-email-runtime.mjs';
import {reflectionEmailRunner} from './reflection-email-runner.mjs';
import {reflectionEmailDeliverySummary,reflectionEmailActivationReadiness} from './reflection-email-monitor.mjs';
export async function reflectionEmailMonitoring(subject:string){
 const actor=await readSession(subject);
 if(actor!=='a1')throw new ServiceError(403,'Delivery monitoring requires the administration demo persona.');
 const row=await loadWorkspace();
 if(await readSession(subject)!==actor)throw new ServiceError(409,'The demo account changed. Refresh before retrying.');
 return {revision:row.revision,checkedAt:new Date().toISOString(),scope:'Owner-controlled administration demo; institutional access is not configured.',delivery:reflectionEmailDeliverySummary(row.data,WORKSPACE),readiness:reflectionEmailActivationReadiness(reflectionEmailRuntime,reflectionEmailRunner)};
}
