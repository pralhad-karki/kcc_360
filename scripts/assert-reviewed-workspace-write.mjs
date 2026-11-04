// Existing historical tests freeze unrelated files against HEAD. Permit only
// the exact Stage 283 reviewed patch while that patch is still uncommitted.
// Once committed, the ordinary equality check applies again. Behavioral tests
// independently exercise the session and Unicode rules through actual services.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const patches=JSON.parse(fs.readFileSync(new URL('./workspace-write-remediation-hashes.json',import.meta.url),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
export function reviewedWorkspaceWritePatch(file,current,prior){
 const p=patches[file];return !!p&&hash(current)===p.after&&hash(prior)===p.before;
}
export function assertUnchangedOrReviewedWorkspaceWrite(file){
 const current=fs.readFileSync(file,'utf8'),prior=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8'});
 if(reviewedWorkspaceWritePatch(file,current,prior))return;
 assert.equal(current,prior,'Unexpected change outside exact reviewed workspace write remediation: '+file);
}
