// Synthetic integration probe only. This is NOT a deployable assignment adapter.
import assert from 'node:assert/strict';
import {prepareAuthorizationContext} from './server/identity-grant-adapter.mjs';
import {createClubActionClosurePilot as create,transitionClubActionClosurePilot as transition,readClubActionClosurePilot as read} from './server/club-action-closure-pilot.mjs';
const now='2026-10-18T15:55:00Z',validFrom='2026-10-01T00:00:00Z',validUntil='2027-01-01T00:00:00Z';
const authority={tenantId:'TEST-KCC',version:1,validFrom,validUntil,issuers:[{provider:'TEST',issuer:'fixture-issuer'}],people:['OWNER','REVIEWER','OTHER'].map(personId=>({personId,status:'ACTIVE'})),identityLinks:['OWNER','REVIEWER','OTHER'].map(personId=>({id:'LINK-'+personId,version:1,provider:'TEST',issuer:'fixture-issuer',subject:personId,tenantId:'TEST-KCC',personId,status:'ACTIVE',validFrom,validUntil})),actorLinks:[['demo-owner','OWNER'],['owner-alias','OWNER'],['demo-reviewer','REVIEWER']].map(([actorId,personId],i)=>({id:'ACTOR-'+i,version:1,tenantId:'TEST-KCC',actorId,personId,status:'VERIFIED'})),roleAssignments:[]};
const session=subject=>({provider:'TEST',issuer:'fixture-issuer',subject,tenantId:'TEST-KCC',authorizationVersion:1,expiresAt:'2026-10-18T17:00:00Z'});
const evaluation={id:'EV',version:1,annualVersion:1,clubId:'CLUB',cycle:'2026-27',state:'VERIFIED',criteria:[{key:'PLAN',title:'Planning',action:{title:'Review plan delivery',owner:'demo-owner',due:'2026-12-01',state:'OPEN'}}]};
const evidenceRegistry=[{id:'PROOF',version:1,binding:'bound-content',verified:true,current:true,clubId:'CLUB',cycle:'2026-27'}];
// Deliberately test-only mapping; explicit assignment fixture is not institutionally approved.
function fixtureContext(subject,{directory=authority,reviewerActor='demo-reviewer',ownerActor='demo-owner',sessionPatch={}}={}){
 const identity=prepareAuthorizationContext({session:{...session(subject),...sessionPatch},authority:directory,now});assert.equal(identity.ok,true,identity.reason);
 const person=actor=>{const resolved=identity.personMap[actor];assert.ok(resolved&&directory.people.some(p=>p.personId===resolved&&p.status==='ACTIVE'),'UNRESOLVED_ACTIVE_PERSON');return resolved};
 assert.equal(person(ownerActor),person(evaluation.criteria[0].action.owner),'SOURCE_OWNER_MISMATCH');
 return {now,evaluation,evidenceRegistry,actorPersonId:identity.principal.personId,assignment:{id:'FICTIONAL-ASSIGNMENT',version:1,ownerPersonId:person(ownerActor),reviewerPersonId:person(reviewerActor),sourceOwnerActorId:evaluation.criteria[0].action.owner,clubId:evaluation.clubId,cycle:evaluation.cycle,evaluationId:evaluation.id,evaluationVersion:evaluation.version,criterionKey:'PLAN',validFrom,validUntil}};
}
const owner=fixtureContext('OWNER'),reviewer=fixtureContext('REVIEWER');let r=create({...owner,id:'CLOSURE',criterionKey:'PLAN'});const original=structuredClone(r);
r=transition(r,{...owner,action:'SUBMIT',expectedRevision:r.revision,fields:{explanation:'Completed delivery review',evidence:[{id:'PROOF',version:1}]}});assert.equal(read(r,reviewer).viewer,'REVIEWER');r=transition(r,{...reviewer,action:'VERIFY',expectedRevision:r.revision,fields:{reason:'Review evidence confirmed'}});assert.equal(read(r,owner).latestSubmission.decision.state,'VERIFIED');assert.equal(original.state,'OPEN');assert.equal(authority.roleAssignments.length,0);
assert.throws(()=>create({...fixtureContext('OWNER',{reviewerActor:'owner-alias'}),id:'BAD',criterionKey:'PLAN'}),/INDEPENDENT/);
assert.throws(()=>read(r,fixtureContext('OTHER')),/ASSIGNED_PERSON/);
assert.deepEqual(fixtureContext('OWNER',{ownerActor:'owner-alias'}).assignment,owner.assignment);
const renewed=fixtureContext('OWNER',{sessionPatch:{expiresAt:'2026-10-18T18:00:00Z'}});assert.deepEqual(renewed.assignment,owner.assignment);assert.equal(read(r,renewed).state,'VERIFIED');
for(const sessionPatch of [{tenantId:'OTHER'},{authorizationVersion:2},{issuer:'unknown'},{expiresAt:now}])assert.throws(()=>fixtureContext('OWNER',{sessionPatch}));
for(const mutate of [a=>a.people.find(p=>p.personId==='OWNER').status='INACTIVE',a=>a.people.find(p=>p.personId==='REVIEWER').status='INACTIVE',a=>a.identityLinks.find(p=>p.personId==='OWNER').status='REVOKED',a=>a.actorLinks.find(p=>p.actorId==='demo-owner').status='UNRESOLVED',a=>a.actorLinks.push({...a.actorLinks[0],id:'DUPLICATE'})]){const directory=structuredClone(authority);mutate(directory);assert.throws(()=>fixtureContext('OWNER',{directory}))}
// Cross-record reuse is rejected by the closure helper even with valid identity.
assert.throws(()=>read(r,{...owner,evaluation:{...evaluation,id:'OTHER'}}),/ASSESSMENT/);
console.log('PASS: synthetic identity-to-closure submit/review/read flow, stable owner aliases, same-person reviewer denial, inactive/unresolved/revoked identities, tenant/issuer/expiry/version checks, outsider denial, session renewal and exact source scope. No live authentication, assignment approval or policy adapter implemented.');
