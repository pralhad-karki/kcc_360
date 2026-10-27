import {readSession,ServiceError} from './service';
import {createMISAdapter} from './mis-adapter.mjs';
import {createMockCohortSnapshot,mockCohortConfiguration} from '../fixtures/mis/cohort-mock.mjs';
import {prepareMockCohortProgression} from './cohort-progression-preview.mjs';
// Fixed owner-demo composition. Neither official provider settings nor raw student data come from a request.
const adapter=createMISAdapter({configuration:{mode:'MOCK'},snapshot:createMockCohortSnapshot()});
export async function mockCohortProgression(subject:string,request?:unknown){
 const actor=await readSession(subject);
 if(!['c1','d1','a1'].includes(actor))throw new ServiceError(403,'Academic progression preview is restricted to academic review demo personas.');
 const config=mockCohortConfiguration(),roster=await adapter.loadStudents();
 if(await readSession(subject)!==actor)throw new ServiceError(409,'The demo account changed. Refresh before retrying.');
 if(!roster.ok||!('source' in roster))throw new ServiceError(503,'The fictional cohort source is unavailable.');
 const common={actor,mode:'MOCK',fictional:true,canApply:false};
 if(request===undefined)return {...common,source:roster.source,cohorts:config.cohorts.map(c=>({id:c.id,label:c.label}))};
 const body=request as {cohortId?:string,snapshotId?:string,snapshotVersion?:number};
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==3||!['cohortId','snapshotId','snapshotVersion'].every(k=>Object.hasOwn(body,k)))throw new ServiceError(400,'Choose a current fictional cohort preview.');
 if(body.snapshotId!==roster.source.snapshotId||body.snapshotVersion!==roster.source.version)throw new ServiceError(409,'The fictional source changed. Load a fresh preview.');
 const cohort=config.cohorts.find(c=>c.id===body.cohortId);if(!cohort)throw new ServiceError(400,'Unknown fictional cohort.');
 const preview=prepareMockCohortProgression({roster,structure:config.structure,cohort});
 if(!preview.ok)throw new ServiceError(409,'The fictional cohort cannot be prepared from the current source.');
 return {...common,preview};
}
