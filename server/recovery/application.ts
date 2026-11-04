import {RecoveryError,check,canonical,sha256,inspectSnapshot,MAX_RECOVERY_BYTES} from './domain';
import type {RecoverySnapshot,RecoveryPackage} from './domain';
export interface RecoveryReader {readSnapshot():Promise<RecoverySnapshot>}
export interface PrivateObjectReader {read(key:string):Promise<Uint8Array|null>}
export interface RecoveryAuthority {assertPrivateRecovery(subject:string):Promise<void>}

// Deliberately no writer, route, hosted binding or default authority provider.
// Objects travel separately; this package is the private DB/reference manifest.
export class PrivateRecoveryService {
 constructor(private readonly repository:RecoveryReader,private readonly objects:PrivateObjectReader,private readonly authority:RecoveryAuthority){}
 private async verifyObjects(snapshot:RecoverySnapshot){let total=0;for(const row of snapshot.files){total+=row.size;check(total<=MAX_RECOVERY_BYTES);const bytes=await this.objects.read(row.objectKey);check(bytes&&bytes.length===row.size&&await sha256(bytes)===row.sha256);}}
 async exportPrivate(subject:string){
  try{
   await this.authority.assertPrivateRecovery(subject);
   const {snapshot,inventory}=await inspectSnapshot(await this.repository.readSnapshot());
   await this.verifyObjects(snapshot);
   const digest=await sha256(canonical({schema:'KCC360_PRIVATE_RECOVERY_V1',snapshot}));
   // Database and object storage have no joint transaction. Recheck database
   // after object reads; this detects drift, not a hosted point-in-time backup.
   check(canonical((await inspectSnapshot(await this.repository.readSnapshot())).snapshot)===canonical(snapshot));
   await this.authority.assertPrivateRecovery(subject);
   return {package:{schema:'KCC360_PRIVATE_RECOVERY_V1',snapshot,digest} as RecoveryPackage,inventory};
  }catch{throw new RecoveryError();}
 }
 async verifyPrivate(subject:string,bundle:RecoveryPackage,expectedDigest:string){
  try{
   await this.authority.assertPrivateRecovery(subject);
   check(bundle&&Object.keys(bundle).sort().join(',')==='digest,schema,snapshot'&&bundle.schema==='KCC360_PRIVATE_RECOVERY_V1'&&/^[a-f0-9]{64}$/.test(expectedDigest));
   const {snapshot,inventory}=await inspectSnapshot(bundle.snapshot);
   check(bundle.digest===expectedDigest&&await sha256(canonical({schema:bundle.schema,snapshot}))===expectedDigest);
   await this.verifyObjects(snapshot);await this.authority.assertPrivateRecovery(subject);return {snapshot,inventory};
  }catch{throw new RecoveryError();}
 }
}
