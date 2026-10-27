import {createEngine} from './engine.mjs';
import {identity,readSession,loadWorkspace,ServiceError} from './service';
import {issuedInternshipLetter} from './internship-letter-policy.mjs';
export async function readInternshipLetter(id:string){const user=await identity(),actor=await readSession(user.userId),row=await loadWorkspace();const engine=createEngine(row.data,actor),record=issuedInternshipLetter(engine.view(),id);if(!record)throw new ServiceError(404,'Letter unavailable.');return record}
export function internshipLetterHeaders(nonce:string){return {'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':`default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`}}
