import {misDigest} from './mis-manual-import.mjs';
import {prepareMISImportForContext,misImportContext} from './mis-import-dispatch.mjs';
export const manualMISConfiguration=Object.freeze({enabled:false});
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
// A trusted institutional composition must supply these values. Request JSON and demo
// persona switching cannot supply authority, select the ledger, or activate imports.
async function stage(loadTrusted,request,confirmation,kind){
 const s=structuredClone(await loadTrusted());
 check(s?.configuration?.enabled===true&&s.workspace?.id===`KCC-MIS-STUDENTS:${s.trusted?.institutionId}`&&s.workspace.id!==s.trusted?.authorityFence?.workspaceId,'MIS_IMPORT_RUNTIME_DISABLED_OR_INVALID');
 const selected=misImportContext(s,kind),result=await prepareMISImportForContext({s,kind,request,confirmation,provenance:s.provenance??null});
 s.workspace=selected.workspace;s.dependencyFences=selected.dependencies;
 if(s.storageFence)check(typeof s.storageFence.workspaceId==='string'&&s.storageFence.workspaceId!==s.workspace.id&&Number.isSafeInteger(s.storageFence.revision)&&s.storageFence.revision>=0,'INVALID_MIS_STORAGE_FENCE');
 return {s,result,authority:await misDigest({configuration:s.configuration,trusted:{...s.trusted,now:null},provenance:s.provenance??null,storageFence:s.storageFence??null,dependencies:s.dependencyFences})};
}
export async function saveMISImport({db,loadTrusted,request,confirmation,kind='STUDENTS',clock=()=>new Date().toISOString()}){
 check(db&&typeof db.batch==='function'&&typeof db.prepare==='function'&&typeof loadTrusted==='function','TRUSTED_MIS_DEPENDENCIES_REQUIRED');
 const r=structuredClone(request),c=structuredClone(confirmation),a=await stage(loadTrusted,r,c,kind),b=await stage(loadTrusted,r,c,kind),now=clock();
 check(a.authority===b.authority&&JSON.stringify(a.s.workspace)===JSON.stringify(b.s.workspace)&&a.result.replayed===b.result.replayed,'MIS_IMPORT_CONTEXT_CHANGED');
 check(typeof now==='string'&&new Date(now).toISOString()===now&&now>=b.s.trusted.now&&now<b.s.trusted.validUntil,'MIS_IMPORT_AUTHORITY_EXPIRED');
 if(b.result.replayed)return {replayed:true,report:b.result.report};
 const {workspace:w,trusted:t}=b.s,id=crypto.randomUUID(),revision=w.revision+1,f=t.authorityFence;
 const audit={operationId:r.operationId,fileFingerprint:b.result.report.fileFingerprint,counts:b.result.report.counts,sourceSystem:r.sourceSystem,institutionId:r.institutionId,reportReference:{workspace:w.id,operationId:r.operationId}};
 const guards=[...(b.s.storageFence?[b.s.storageFence]:[]),...b.s.dependencyFences];check(guards.length<=3&&guards.every(g=>typeof g.workspaceId==='string'&&g.workspaceId!==w.id&&Number.isSafeInteger(g.revision)&&g.revision>=0),'INVALID_MIS_DEPENDENCY_FENCE');
 const dependencySQL=guards.map(()=> ' AND EXISTS (SELECT 1 FROM kcc_workspaces AS dependency_fence WHERE dependency_fence.id=? AND dependency_fence.revision=?)').join('');
 const result=await db.batch([
  db.prepare('UPDATE kcc_workspaces SET payload=?,revision=?,commit_id=?,updated_at=? WHERE id=? AND revision=? AND EXISTS (SELECT 1 FROM kcc_workspaces AS authority_fence WHERE authority_fence.id=? AND authority_fence.revision=?)'+dependencySQL).bind(JSON.stringify(b.result.ledger),revision,id,now,w.id,w.revision,f.workspaceId,f.revision,...guards.flatMap(g=>[g.workspaceId,g.revision])),
  db.prepare('INSERT INTO kcc_server_audit (id,workspace,revision,subject,actor,command,record,time) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM kcc_workspaces WHERE id=? AND commit_id=? AND revision=?)').bind(id,w.id,revision,t.subject,t.personId,kind==='STUDENTS'?'mis.manual.students.commit':'mis.manual.'+kind.toLowerCase()+'.commit',JSON.stringify(audit),now,w.id,id,revision)
 ]);
 check(result[0]?.meta?.changes===1&&result[1]?.meta?.changes===1,'MIS_IMPORT_LEDGER_OR_AUTHORITY_CONFLICT');return {replayed:false,report:b.result.report};
}

// Backward-compatible student-service name retained for existing callers.
export const saveMISStudentImport=saveMISImport;
