"""Read-only export of the explicit fictional acceptance DB; never exports session tables."""
import sqlite3,json,hashlib,pathlib,shutil,collections,sys
run=pathlib.Path(sys.argv[1]).resolve();dest=pathlib.Path(sys.argv[2]).resolve()
assert run.name=='runtime' and 'kcc360-fullstack253' in str(run)
c=sqlite3.connect(f'file:{run}/fictional-stage253.sqlite?mode=ro',uri=True);c.row_factory=sqlite3.Row
assert c.execute("select value from acceptance_fixture_meta where key='kind'").fetchone()[0]=='KCC360_STAGE253_FICTIONAL'
workspaces=[]
for r in c.execute('select id,revision,commit_id,updated_at,payload from kcc_workspaces order by id'):
 row=dict(r);payload=row.pop('payload');row.update(sha256=hashlib.sha256(payload.encode()).hexdigest(),data=json.loads(payload));workspaces.append(row)
main=next(w for w in workspaces if w['id']=='KCC-OWNER-DEMO');ledger=next(w for w in workspaces if w['id']=='KCC-MOCK-COHORT-LEDGER-V1')['data']['ledger'];audits=[dict(r)for r in c.execute('select * from kcc_server_audit order by workspace,revision')]
main_audits=[r for r in audits if r['workspace']=='KCC-OWNER-DEMO'];assert main['revision']==15 and [r['revision']for r in main_audits]==list(range(1,16))
assert ledger['revision']==3 and ledger['batches'][0]['state']=='APPLIED'
assert ledger['placements']['MOCK_STUDENT_B']['semesterId']=='MOCK_SEMESTER_3' and ledger['placements']['MOCK_STUDENT_B']['version']==1
assert all(ledger['placements']['MOCK_STUDENT_'+s]['semesterId']=='MOCK_SEMESTER_4' and ledger['placements']['MOCK_STUDENT_'+s]['version']==2 for s in 'ACDEF')
assert main['data']['activityIntakes'][0]['internshipReadiness'][0]['state']=='START_AUTHORIZED'
assert main['data']['projects'][-1]['state']=='APPROVED'
files=[dict(r)for r in c.execute('select id,kind,target,name,mime,size,sha256,uploaded_by,status from kcc_stored_files')]
for f in files:
 key=c.execute('select object_key from kcc_stored_files where id=?',(f['id'],)).fetchone()[0];body=(run/'objects'/hashlib.sha256(key.encode()).hexdigest()).read_bytes();assert len(body)==f['size'] and hashlib.sha256(body).hexdigest()==f['sha256'];f['objectBytesVerified']=True
counts=collections.Counter()
for l in (run/'http-evidence.jsonl').read_text().splitlines():
 r=json.loads(l);counts[str(r['status'])]+=1
 if r['status']>=400:assert r['before']==r['after']
 if r['path']=='/api/academic-cohort-batches':
  a=next(x for x in r['before']['workspaces']if x['id']=='KCC-OWNER-DEMO');b=next(x for x in r['after']['workspaces']if x['id']=='KCC-OWNER-DEMO');assert a==b
result={'kind':'KCC360_STAGE253_FICTIONAL_PERSISTENCE_EVIDENCE','run':'B','date':'2026-10-25','boundary':'Actual route/service/engine code; local SQLite D1 API and filesystem R2 API adapters. No production DB. Authentication/session tables omitted.','assertions':['15 consecutive main-workspace revision/audit commits','3 separate mock-ledger revision/audit commits','Stored object size and SHA-256 match DB','Readiness START_AUTHORIZED and execution APPROVED; no premature execution','Mock A,C,D,E,F advance; official Left College B unchanged','Rejected HTTP requests leave workspace hashes and audit count unchanged'],'httpStatuses':dict(counts),'workspaces':workspaces,'serverAudit':audits,'files':files}
(dest/'STAGE253_PERSISTENCE_EVIDENCE.json').write_text(json.dumps(result,indent=2)+'\n')
for src,dst in [('http-evidence.jsonl','STAGE253_HTTP_EVIDENCE.jsonl'),('controller-setup.jsonl','STAGE253_CONTROLLER_SETUP.jsonl'),('controller-checks.jsonl','STAGE253_CONTROLLER_CHECKS.jsonl')]:shutil.copy2(run/src,dest/dst)
print('PASS persistence assertions:',len(main_audits),'main audits;',len(audits)-len(main_audits),'mock-ledger audits;',len(files),'verified objects; HTTP',dict(counts))
