import {createEngine} from './engine.mjs';
import {identity,readSession,loadWorkspace,ServiceError} from './service';
import {preparePrivatePortfolioExportPilot,preparePrivatePortfolioPrintPilot,preparePrivateCVExport,preparePrivateCVPrint} from './portfolio-export-pilot.mjs';
export const privatePortfolioPrintHeaders={
 'X-KCC360-Export':'private-achievements-print-v1','Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache',
 'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow, nosnippet','Referrer-Policy':'no-referrer',
 'Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
};
// Read-only owner-private demo path. Existing identity/session guards remain
// authoritative; fixed personas are not institutional student accounts or SSO.
export async function privatePortfolioExportAction(body:any){
 const user=await identity(),actor=await readSession(user.userId),row=await loadWorkspace();
 if(!['s1','s2'].includes(actor))throw new ServiceError(403,'Select your own student account to prepare a private export.');
 if(!body||typeof body!=='object'||Array.isArray(body)||!['preview','print'].includes(body.mode))throw new ServiceError(400,'Invalid private export request.');
 const cv=Object.hasOwn(body,'declarationSections');
 const keys=[...(cv?['declarationSections',...(Object.hasOwn(body,'certificateReferences')?['certificateReferences']:[])]:[]),'mode','actor','revision','projectIds','includeHours',...(body.mode==='print'?['previewDigest']:[])];
 if(Object.keys(body).length!==keys.length||Object.keys(body).some(k=>!keys.includes(k))||!Number.isSafeInteger(body.revision)||body.revision<0)throw new ServiceError(400,'Use only the approved private export fields.');
 if(body.actor!==actor||body.revision!==row.revision)throw new ServiceError(409,'The account or records changed. Refresh and preview again.');
 const engine=createEngine(row.data,actor),context={data:engine.snapshot(),users:engine.actors(),actor,input:{projectIds:body.projectIds,includeHours:body.includeHours,...(cv?{declarationSections:body.declarationSections,...(Object.hasOwn(body,'certificateReferences')?{certificateReferences:body.certificateReferences}:{})}:{})},now:new Date().toISOString()};
 let result:any;
 try{
  if(body.mode==='preview'){const prepared=await (cv?preparePrivateCVExport:preparePrivatePortfolioExportPilot)(context);result={mode:'preview',actor,revision:row.revision,preview:prepared.preview,previewDigest:prepared.digest}}
  else {const prepared=await (cv?preparePrivateCVPrint:preparePrivatePortfolioPrintPilot)({...context,expectedDigest:body.previewDigest});result={mode:'print',actor,revision:row.revision,html:prepared.html}}
 }catch(error){if((error as Error).message==='EXPORT_SOURCE_CHANGED')throw new ServiceError(409,'The selected records changed. Preview the current selection again.');throw new ServiceError(400,'Choose current saved sections or verified achievements and preview the exact selection before printing.');}
 // Authenticate/reload after asynchronous projection/digest work, immediately
 // before releasing content. This is a point-in-time read, not a policy lock.
 const currentRow=await loadWorkspace(),currentUser=await identity(),currentActor=await readSession(currentUser.userId);
 if(currentUser.userId!==user.userId||currentActor!==actor||currentRow.revision!==row.revision||currentRow.payload!==row.payload)throw new ServiceError(409,'The account or records changed while preparing the export. Refresh and preview again.');
 return result;
}
