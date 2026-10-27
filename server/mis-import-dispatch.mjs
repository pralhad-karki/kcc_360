import {previewMISStudentImport,prepareMISStudentCommit} from './mis-manual-import.mjs';
import {previewMISAcademicImport,prepareMISAcademicCommit} from './mis-academic-import.mjs';
const check=(v,m)=>{if(!v)throw Error(m)};
export function misImportContext(s,kind='STUDENTS'){
 if(kind==='STUDENTS')return {workspace:s.workspace,args:{trusted:s.trusted,ledger:s.workspace.data,revision:s.workspace.revision},dependencies:[]};
 check(['STRUCTURES','ENROLLMENTS'].includes(kind)&&s.configuration?.academicImportsEnabled===true&&s.trusted?.canImportAcademics===true&&s.academic?.id===`KCC-MIS-ACADEMIC:${s.trusted.institutionId}`&&s.academic.id!==s.trusted.authorityFence.workspaceId&&s.academic.id!==s.staging?.id&&Number.isSafeInteger(s.academic.revision)&&s.academic.revision>=0,'MIS_ACADEMIC_SOURCE_NOT_CONFIGURED');
 check(['NOT_INSTALLED','INSTALLED'].includes(s.configuration.localProgressionMode),'MIS_LOCAL_PROGRESSION_MODE_REQUIRED');
 if(s.configuration.localProgressionMode==='NOT_INSTALLED')check(!s.progression||(s.progression.data?.contract==='KCC360_LOCAL_PROGRESSION_V1'&&Array.isArray(s.progression.data.records)&&s.progression.data.records.length===0),'LOCAL_PROGRESSION_MODE_CONFLICT');
 let localProgressions=[];const dependencies=[{workspaceId:s.workspace.id,revision:s.workspace.revision}];
 if(s.configuration.localProgressionMode==='INSTALLED'){
  const p=s.progression;check(p?.id===`KCC-LOCAL-PROGRESSION:${s.trusted.institutionId}`&&p.id!==s.trusted.authorityFence.workspaceId&&Number.isSafeInteger(p.revision)&&p.revision>=0&&p.data?.contract==='KCC360_LOCAL_PROGRESSION_V1'&&Array.isArray(p.data.records),'OFFICIAL_LOCAL_PROGRESSION_SNAPSHOT_REQUIRED');localProgressions=p.data.records;dependencies.push({workspaceId:p.id,revision:p.revision});
 }
 return {workspace:s.academic,args:{trusted:s.trusted,ledger:s.academic.data,students:s.workspace.data,revision:s.academic.revision,localProgressions,kind},dependencies};
}
export async function previewMISImportForContext({s,kind='STUDENTS',request,provenance=null}){const {args}=misImportContext(s,kind);return kind==='STUDENTS'?previewMISStudentImport({...args,request,provenance}):previewMISAcademicImport({...args,request,provenance})}
export async function prepareMISImportForContext({s,kind='STUDENTS',request,confirmation,provenance=null}){const {args}=misImportContext(s,kind);return kind==='STUDENTS'?prepareMISStudentCommit({...args,request,confirmation,provenance}):prepareMISAcademicCommit({...args,request,confirmation,provenance})}
