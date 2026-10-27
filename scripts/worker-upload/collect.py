"""Read-only native local D1/R2 evidence; session tables and cookies are omitted."""
import pathlib,sqlite3,json,hashlib,sys
root=pathlib.Path(sys.argv[1]).resolve();out=pathlib.Path(sys.argv[2]);assert root.name.startswith('kcc360-worker254') and str(root).startswith('/workspace/scratch/')
v3=root/'runtime/worker-state/v3';paths=list(v3.glob('d1/**/*.sqlite'));db=next(p for p in paths if sqlite3.connect(p).execute("select count(*) from sqlite_master where name='kcc_workspaces'").fetchone()[0]);c=sqlite3.connect(f'file:{db}?mode=ro',uri=True);c.row_factory=sqlite3.Row
workspace=dict(c.execute("select id,revision,payload from kcc_workspaces where id='KCC-OWNER-DEMO'").fetchone());payload=workspace.pop('payload');workspace.update(sha256=hashlib.sha256(payload.encode()).hexdigest(),data=json.loads(payload));audits=[dict(r)for r in c.execute('select * from kcc_server_audit order by revision')];files=[dict(r)for r in c.execute('select id,kind,target,name,mime,size,sha256,uploaded_by,status from kcc_stored_files')];requests=[dict(r)for r in c.execute('select * from stage254_http order by id')]
blobs=[p.read_bytes()for p in v3.glob('r2/*/blobs/*')if p.is_file()];assert files and len(audits)==workspace['revision']
for f in files:assert any(len(b)==f['size'] and hashlib.sha256(b).hexdigest()==f['sha256']for b in blobs);f['nativeR2BytesVerified']=True
for r in requests:
 r['before_proof']=json.loads(r['before_proof']);r['after_proof']=json.loads(r['after_proof'])
 if r['status']>=400:assert r['before_proof']==r['after_proof']
assert any(r['path']=='/api/files' and r['status']==200 and r['authenticated']==1 for r in requests)
assert any(r['path'].startswith('/api/files/')and r['status']==401 and r['authenticated']==0 for r in requests)
assert any(r['path'].startswith('/api/files/')and r['status']==403 and r['authenticated']==1 for r in requests)
assert any(r['path'].startswith('/api/files/')and r['status']==200 and r['authenticated']==1 for r in requests)
result={'kind':'KCC360_NATIVE_WORKER_UPLOAD_STAGE254','boundary':'Real compiled Vinext framework Worker, native local D1 and R2 via Wrangler; separate fictional edge identity only. No production credentials/DB.','fixture':json.loads((root/'worker-upload-fixture.json').read_text()),'workspace':workspace,'serverAudits':audits,'files':files,'requests':requests,'assertions':'PASS upload, authenticated download route, anonymous 401, out-of-scope 403, rejected request no mutation, native R2 byte/hash match'}
out.write_text(json.dumps(result,indent=2)+'\n');print('PASS',len(files),'file(s),',len(audits),'commits,',len(requests),'requests; native D1/R2 evidence retained')
