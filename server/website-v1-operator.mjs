// Server composition only: no persona/role/enablement may be supplied by a browser.
const fail=(status,code)=>{throw Object.assign(Error(code),{status,code})};
const id=x=>typeof x==='string'&&x.length>0&&x.length<=150;
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
export function createWebsiteV1Operator({mode='disabled',authenticate,runtime}={}){
 if(!['disabled','mock'].includes(mode))fail(503,'LIVE_MODE_UNSUPPORTED');
 return Object.freeze({async execute(subject,input){
 if(mode==='disabled')return {available:false,message:'Website integration is disabled. Institutional access and cross-system acceptance are pending.'};
 if(!id(subject))fail(401,'SESSION_REQUIRED');const actor=await authenticate?.(subject);if(!id(actor))fail(401,'SESSION_REQUIRED');
 const keys={read:['action','eventId'],enqueue:['action','eventId','deliveryId'],deliver:['action','eventId','requestId'],refresh:['action','eventId','requestId'],withdraw:['action','eventId','reason']}[input?.action];
 if(!keys||!exact(input,keys)||!id(input.eventId)||('deliveryId' in input&&!id(input.deliveryId))||('requestId' in input&&!id(input.requestId)))fail(400,'INVALID_OPERATOR_REQUEST');
 // Always check scoped read authority before any command; action authority is checked again in runtime.
 await runtime.read(actor,input.eventId);
 if(input.action==='enqueue')await runtime.enqueue(actor,input.eventId,input.deliveryId);
 if(input.action==='deliver'||input.action==='refresh')await runtime[input.action](actor,input.eventId,input.requestId);
 if(input.action==='withdraw')await runtime.withdraw(actor,input.eventId,input.reason);
 return {available:true,mode:'mock',view:await runtime.read(actor,input.eventId)};
 }});
}
export const websiteV1Operator=createWebsiteV1Operator();
