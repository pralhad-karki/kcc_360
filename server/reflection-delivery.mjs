import {createEngine} from './engine.mjs';
import {createWebsiteDeliveryProtocol} from './website-delivery-protocol.mjs';
export {websiteDeliveryConfiguration,canonicalDeliveryJSON} from './website-delivery-protocol.mjs';
const protocol=createWebsiteDeliveryProtocol((data,options)=>createEngine(data,'a1',options).websiteDeliveryPlan(),(data,id)=>{for(const p of data.projects)for(const r of p.reflectionPublicationRequests||[]){const d=r.websiteDeliveries?.find(v=>v.id===id);if(d)return {p,r,d}}throw Error('Unknown delivery record')});
export const reflectionDeliveryJobs=protocol.jobs,beginReflectionDelivery=protocol.begin,failReflectionDelivery=protocol.fail,acknowledgeReflectionDelivery=protocol.acknowledge;
