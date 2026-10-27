import assert from 'node:assert/strict';
import {createHash,webcrypto} from 'node:crypto';
import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync('prototype/intake-team-task-revision-client.js','utf8');
function context(crypto){const c=vm.createContext({crypto,TextEncoder,projectOverview:()=>'',resetIntakeTeamClient(){},document:{addEventListener(){}}});vm.runInContext(source,c);return c}
const canonical=v=>JSON.stringify(Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))])):v);
const digest=v=>createHash('sha256').update(canonical(v)).digest('hex');
for(const crypto of [undefined,{},webcrypto]){const c=context(crypto);
 for(const value of [null,true,0,'',{},[],{z:'नेपाल 🧠',a:[0,null,{b:'\ud800',a:'feedback'}]},...Array.from({length:130},(_,n)=>'x'.repeat(n)), 'x'.repeat(1000000)]){c.value=value;assert.equal(await vm.runInContext('teamTaskClientHistoryDigest(value)',c),digest(value))}
 c.value={a:1,b:2};const original=await vm.runInContext('teamTaskClientHistoryDigest(value)',c);c.value={b:2,a:1};assert.equal(await vm.runInContext('teamTaskClientHistoryDigest(value)',c),original);c.value.a=2;assert.notEqual(await vm.runInContext('teamTaskClientHistoryDigest(value)',c),original);
 // Raw-byte vectors exercise padding boundaries independently of canonical JSON.
 for(const n of [0,1,55,56,57,63,64,65,119,120,127,128,1024,65536]){c.bytes=Uint8Array.from({length:n},(_,i)=>(i*137+23)%256);assert.equal(vm.runInContext('teamTaskClientSha256Fallback(bytes)',c),createHash('sha256').update(c.bytes).digest('hex'))}
}
const failed=context({subtle:{digest:async()=>{throw Error('native digest failure')}}});await assert.rejects(vm.runInContext('teamTaskClientHistoryDigest({a:1})',failed),/native digest failure/);
console.log('PASS SHA-256 saved-history proof: fallback/native match Node across canonical Unicode, padding boundaries and large inputs; deterministic order, tamper difference and native failure propagation.');
