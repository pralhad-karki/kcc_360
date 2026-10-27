import assert from 'node:assert/strict';
import {createIntakeTeamRuntime} from './server/intake-trusted-loader.mjs';
const now='2026-10-20T08:00:00.000Z',period={validFrom:'2026-01-01T00:00:00.000Z',validUntil:'2027-01-01T00:00:00.000Z'};
const session={provider:'FIXTURE',issuer:'approved',subject:'SUB',tenantId:'KCC',authorizationVersion:1,expiresAt:'2026-10-20T09:00:00.000Z'};
const identityAuthority={tenantId:'KCC',version:1,...period,issuers:[{provider:'FIXTURE',issuer:'approved'}],people:[{personId:'P1',status:'ACTIVE'}],identityLinks:[{id:'L1',version:1,provider:'FIXTURE',issuer:'approved',subject:'SUB',tenantId:'KCC',personId:'P1',status:'ACTIVE',...period}],actorLinks:[{id:'AL1',version:1,tenantId:'KCC',actorId:'s1',personId:'P1',status:'VERIFIED'}],roleAssignments:[]};
const common={id:'SNAP',version:1,status:'APPROVED',approvalReference:'AP1',institutionId:'KCC',...period};
const base={session,identityAuthority,workspace:{id:'W',institutionId:'KCC',revision:0,data:{activityIntakes:[{id:'IN1'}]}},roster:{...common,students:[]},academicMasters:{...common,programmes:[],offerings:[]},authority:{...common,grants:[],assignments:[],policies:[]}};
let source=structuredClone(base),reads=0,clockValue=now,expireDuringLoad=false;
const providers={loadVerifiedSession:async()=>{reads++;return source.session},loadIdentityAuthority:async()=>source.identityAuthority,loadWorkspace:async()=>source.workspace,loadRoster:async()=>source.roster,loadAcademicMasters:async()=>source.academicMasters,loadReviewAuthority:async()=>{if(expireDuringLoad)clockValue=session.expiresAt;return source.authority}};
assert.equal(createIntakeTeamRuntime().configuration.enabled,false);
assert.equal(createIntakeTeamRuntime({providers}).loadTrusted,undefined);
assert.throws(()=>createIntakeTeamRuntime({configuration:{enabled:true},providers:{}}),e=>e.status===503);
assert.equal(reads,0);
const runtime=createIntakeTeamRuntime({configuration:{enabled:true},providers,clock:()=>clockValue}),request={subject:'SUB',actor:'s1',proposalId:'IN1'};
const loaded=await runtime.loadTrusted(request);assert.equal(loaded.identity.ok,true);assert.equal(loaded.identity.principal.personId,'P1');assert.equal(loaded.actorId,'s1');assert.deepEqual(loaded.activePersonIds,source.identityAuthority.people.filter(p=>p.status==='ACTIVE').map(p=>p.personId).sort());assert.equal(loaded.workspace.institutionId,'KCC');
loaded.roster.students.push({private:'changed'});assert.deepEqual(source.roster.students,[]);assert.deepEqual(base,source);
async function denied(change,status=403){source=structuredClone(base);change(source);await assert.rejects(runtime.loadTrusted(request),e=>e.status===status);source=structuredClone(base)}
await denied(s=>s.session.subject='OTHER');await denied(s=>s.identityAuthority.people[0].status='INACTIVE');await denied(s=>s.identityAuthority.version=2);await denied(s=>s.session.expiresAt=now);await denied(s=>s.identityAuthority.actorLinks[0].personId='OTHER');
await denied(s=>s.workspace.institutionId='OTHER');await denied(s=>s.workspace.data.activityIntakes.push({id:'IN1'}));await denied(s=>s.workspace.data.activityIntakes=[]);
for(const key of ['roster','academicMasters','authority']){await denied(s=>s[key].status='DRAFT');await denied(s=>s[key].institutionId='OTHER');await denied(s=>s[key].validUntil=now);await denied(s=>s[key].approvalReference='');}
await assert.rejects(runtime.loadTrusted({...request,identity:{ok:true}}),e=>e.status===400);await assert.rejects(runtime.loadTrusted({...request,actor:'s2'}),e=>e.status===403);
await runtime.loadTrusted(request);source.identityAuthority.identityLinks[0].status='REVOKED';await assert.rejects(runtime.loadTrusted(request),e=>e.status===403);source=structuredClone(base);
expireDuringLoad=true;await assert.rejects(runtime.loadTrusted(request),e=>e.status===403);expireDuringLoad=false;clockValue=now;
const unavailable=createIntakeTeamRuntime({configuration:{enabled:true},providers:{...providers,loadRoster:async()=>{throw Error('PRIVATE TOKEN')}},clock:()=>now});await assert.rejects(unavailable.loadTrusted(request),e=>e.status===503&&!e.message.includes('TOKEN'));
providers.loadVerifiedSession=async()=>{throw Error('registry mutated')};assert.equal((await runtime.loadTrusted(request)).identity.ok,true);
assert.deepEqual(source,base);console.log('PASS trusted intake loader: default disabled, server provider requirements, fresh verified person/tenant mapping, approved dated sources, workspace/proposal scope, revocation/expiry during load, detached outputs, captured providers, forged-field denial and sanitized failures.');
