import {stageMISUpload,previewStagedMISUpload,commitStagedMISUpload,purgeMISUpload,listMISUploads,loadMISStagingContext} from './mis-upload-staging.mjs';
const check=(ok,message)=>{if(!ok)throw Error(message)};
export function createMISUploadService({configuration={enabled:false},providers,db,bucket,XLSX,clock=()=>new Date().toISOString()}={}){
 if(configuration.enabled!==true)return Object.freeze({enabled:false});
 check(typeof providers?.loadTrusted==='function'&&db&&bucket&&XLSX?.version==='0.20.3','MIS_UPLOAD_PROVIDERS_REQUIRED');
 const trusted=subject=>async()=>{const s=await providers.loadTrusted({subject});check(s?.trusted?.subject===subject,'MIS_UPLOAD_SUBJECT_MISMATCH');return s};
 const common=subject=>({db,bucket,XLSX,clock,loadTrusted:trusted(subject)});
 return Object.freeze({enabled:true,list:subject=>listMISUploads(common(subject)),authorize:async(subject)=>{await loadMISStagingContext(trusted(subject));return true},upload:(subject,{input,bytes})=>stageMISUpload({...common(subject),input,bytes}),preview:(subject,id)=>previewStagedMISUpload({...common(subject),id}),commit:(subject,{id,confirmation})=>commitStagedMISUpload({...common(subject),id,confirmation}),purge:(subject,id)=>purgeMISUpload({...common(subject),id})});
}
async function bounded(request,max){const reader=request.body?.getReader();check(reader,'MIS_REQUEST_BODY_REQUIRED');const chunks=[];let total=0;while(true){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>max){await reader.cancel();throw Error('MIS_REQUEST_SIZE_LIMIT')}chunks.push(value)}const bytes=new Uint8Array(total);let p=0;for(const c of chunks){bytes.set(c,p);p+=c.length}return bytes}
const exact=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
export async function handleMISUploadHTTP({service,subject,request}){
 if(!service.enabled){check(request.method==='GET','MIS_UPLOAD_NOT_ACTIVATED');return {available:false,message:'Official MIS uploads await approved institutional identity, staff permission and private-storage configuration.'}}
 const url=new URL(request.url);
 if(request.method==='GET'){if(![...url.searchParams.keys()].length)return service.list(subject);check([...url.searchParams.keys()].length===1&&url.searchParams.has('id'),'MIS_STAGED_REFERENCE_REQUIRED');return service.preview(subject,url.searchParams.get('id'))}
 check(request.method==='POST'&&request.headers.get('origin')===url.origin&&request.headers.get('X-KCC-MIS-Upload')==='1','MIS_SAME_ORIGIN_POST_REQUIRED');
 await service.authorize(subject);
 const type=request.headers.get('content-type')??'';
 if(type.startsWith('multipart/form-data;')){
  const bytes=await bounded(request,1065536),form=await new Response(bytes,{headers:{'content-type':type}}).formData();
  check([...form.keys()].length===2&&form.has('file')&&form.has('metadata'),'MIS_UPLOAD_FORM_INVALID');const file=form.get('file'),metadata=form.get('metadata');check(file&&typeof file!=='string'&&file.size>0&&file.size<=1000000&&typeof metadata==='string'&&metadata.length<=16000,'MIS_UPLOAD_FORM_INVALID');let input;try{input=JSON.parse(metadata)}catch{throw Error('MIS_METADATA_JSON_REQUIRED')}check(input?.filename===file.name,'MIS_FILENAME_MISMATCH');
  return service.upload(subject,{input,bytes:new Uint8Array(await file.arrayBuffer())});
 }
 check(type.split(';')[0]==='application/json','MIS_UPLOAD_CONTENT_TYPE_REQUIRED');const raw=await bounded(request,12000);let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))}catch{throw Error('MIS_COMMAND_JSON_REQUIRED')}
 check(typeof body?.id==='string'&&body.id.length<=80,'MIS_STAGED_REFERENCE_REQUIRED');
 if(body.action==='COMMIT'){check(exact(body,['action','id','confirmation']),'MIS_COMMAND_FIELDS_INVALID');return service.commit(subject,body)}
 check(body.action==='PURGE'&&exact(body,['action','id']),'MIS_COMMAND_FIELDS_INVALID');return service.purge(subject,body.id);
}
