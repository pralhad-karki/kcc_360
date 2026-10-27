// Local acceptance-only: execute unchanged application routes against persistent SQLite.
import assert from 'node:assert/strict';
export async function check({service,handlers,fileDownload,context,proof,record}){
 const subject='stage253-s1',identity={userId:subject,email:'fictional-owner@example.test',fullName:'Fictional acceptance owner'};
 const request=(path,body,origin='http://localhost')=>new Request('http://localhost'+path,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
 const note=(id,status,extra={})=>record({id,status,...extra});
 await context.run({identity},async()=>{
  await service.selectActor(subject,'s1');let row=await service.loadWorkspace(),r=row.data.activityIntakes.find(r=>r.content?.title==='Fictional Stage253B internship'),ready=r?.internshipReadiness?.at(-1);assert.equal(ready?.state,'DRAFT');assert.equal(ready.files?.length||0,0,'Do not repeat upload');
  let before=proof();const form=new FormData(),text='FICTIONAL Stage253B host acceptance, supervisor confirmation and learning agreement. No real contract or signature.\n';
  for(const [k,v]of Object.entries({kind:'internship',target:ready.id,index:'',actor:'s1',revision:String(row.revision)}))form.set(k,v);
  form.set('file',new Blob([text],{type:'text/plain'}),'fictional-stage253B-host.txt');
  let res=await handlers.get('/api/files').POST(new Request('http://localhost/api/files',{method:'POST',headers:{origin:'http://localhost','X-KCC-Upload':'1'},body:form}));
  let body=await res.json();assert.equal(res.status,200,body.error);row=await service.loadWorkspace();assert.equal(row.revision,before.workspaces.find(w=>w.id==='KCC-OWNER-DEMO').revision+1);let saved=row.data.activityIntakes.find(x=>x.id===r.id).internshipReadiness.at(-1).files.at(-1);assert.equal(saved.sha256.length,64);note('private-file-upload',res.status,{before,after:proof(),file:{id:saved.id,name:saved.name,size:saved.size,sha256:saved.sha256}});
  res=await fileDownload.GET(new Request('http://localhost/api/files/'+saved.id),{params:Promise.resolve({id:saved.id})});assert.equal(await res.text(),text);assert.equal(res.headers.get('cache-control'),'private, no-store');note('private-file-download',res.status,{sha256:res.headers.get('x-file-sha256')});
  before=proof();await service.selectActor(subject,'s2');res=await fileDownload.GET(new Request('http://localhost/api/files/'+saved.id),{params:Promise.resolve({id:saved.id})});assert.equal(res.status,403);assert.deepEqual(proof(),before);note('peer-file-denial',res.status,{unchanged:true});
  await service.selectActor(subject,'s1');const command={actor:'s1',revision:row.revision,command:'submitInternshipReadiness',args:[r.id,ready.id,ready.version],context:{page:'Activity Intake'}};
  for(const [id,change,origin,status]of [['cross-origin',{},'https://untrusted.example.test',403],['forged-actor',{actor:'d1'},'http://localhost',409],['stale-revision',{revision:0},'http://localhost',409],['unapproved-fields',{command:'draftInternshipReadiness',args:[{form:{state:'START_AUTHORIZED'}},r.id,1]},'http://localhost',400]]){
   before=proof();res=await handlers.get('/api/workspace').POST(request('/api/workspace',{...command,...change},origin));assert.equal(res.status,status);assert.deepEqual(proof(),before);note(id,res.status,{unchanged:true});
  }
  await service.selectActor(subject,'s2');before=proof();res=await handlers.get('/api/workspace').POST(request('/api/workspace',{...command,actor:'s2'}));body=await res.json();assert.equal(res.status,200);assert.deepEqual(proof(),before);assert.equal(body.revision,row.revision);note('peer-workflow-denial',res.status,{unchanged:true,message:body.message});
  await service.selectActor(subject,'s1');note('fixture-checks-complete','PASS',{revision:(await service.loadWorkspace()).revision});
 });
 await context.run({identity:null},async()=>{const before=proof(),res=await handlers.get('/api/workspace').GET();assert.equal(res.status,401);assert.deepEqual(proof(),before);note('anonymous-workspace-denial',res.status,{unchanged:true})});
}
