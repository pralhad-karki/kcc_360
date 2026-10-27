import {reflectionEmailConfiguration,planReflectionAppreciation,stageReflectionEmailIntents} from './reflection-email.mjs';
// Server composition only. No provider, registry, transport or enable flag comes from a request.
export function createReflectionEmailRuntime({configuration=reflectionEmailConfiguration,providers,clock=()=>new Date().toISOString()}={}){
 if(configuration?.enabled!==true)return Object.freeze({enabled:false,async stage(){return {status:'DISABLED',queued:0}}});
 if(typeof providers?.loadRegisteredContacts!=='function'||typeof configuration.institutionId!=='string')throw Error('Approved registered-contact provider and institution are required.');
 const institutionId=configuration.institutionId,load=providers.loadRegisteredContacts;
 return Object.freeze({enabled:true,async stage(context){
  const blocked=reason=>({status:'BLOCKED',queued:0,reason});
  try{
   const request={workspaceId:context.workspaceId,institutionId,subject:context.subject,actor:context.actor,projectId:context.projectId,studentActor:context.studentActor};
   const registry=structuredClone(await load(request));
   const input={configuration:{enabled:true},workspaceId:context.workspaceId,institutionId,projectId:context.projectId,studentActor:context.studentActor,actor:context.actor,before:context.before,after:context.after,registry,now:clock()};
   const plan=await planReflectionAppreciation(input);if(plan.status!=='PLANNED')return blocked(plan.reason||'CONTACTS_NOT_READY');
   const current=structuredClone(await load(request));if(JSON.stringify(registry)!==JSON.stringify(current))return blocked('REGISTERED_CONTACT_SOURCE_CHANGED');
   const rechecked=await planReflectionAppreciation({...input,registry:current,now:clock()});if(rechecked.status!=='PLANNED')return blocked(rechecked.reason||'CONTACTS_NOT_READY');
   const target={reflectionEmailOutbox:structuredClone(context.after.reflectionEmailOutbox||[])};
   const queued=stageReflectionEmailIntents(target,rechecked);if(queued)context.after.reflectionEmailOutbox=target.reflectionEmailOutbox;
   return {status:queued?'QUEUED':'ALREADY_QUEUED',queued};
  }catch{return blocked('REGISTERED_CONTACT_SOURCE_UNAVAILABLE')}
 }});
}
export const reflectionEmailRuntime=createReflectionEmailRuntime();
