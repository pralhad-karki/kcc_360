import {createEngine} from './engine.mjs';
import {createWebsiteDeliveryProtocol} from './website-delivery-protocol.mjs';
export {websiteDeliveryConfiguration,canonicalDeliveryJSON} from './website-delivery-protocol.mjs';
// Pure adapter only: no live transport, scheduler or endpoint. Persist attempt with CAS before sending.
const protocol=createWebsiteDeliveryProtocol((data,options)=>createEngine(data,'a1',options).activityWebsiteDeliveryPlan(),(data,id)=>{for(const p of data.projects){const r=p.activityWebsiteDraft,d=r?.websiteDeliveries?.find(v=>v.id===id);if(d)return {p,r,d}}throw Error('Unknown delivery record')});
export const activityWebsiteDeliveryJobs=protocol.jobs,beginActivityWebsiteDelivery=protocol.begin,failActivityWebsiteDelivery=protocol.fail,acknowledgeActivityWebsiteDelivery=protocol.acknowledge;
