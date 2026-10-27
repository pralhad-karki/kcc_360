import {env} from 'cloudflare:workers';
import {WORKSPACE} from './service';
import {publicCertificateRecord,validPublicCertificateToken} from './public-certificate-policy.mjs';
export async function readPublicCertificate(token:string){if(!validPublicCertificateToken(token))return null;if(!env.DB)throw Error('Storage unavailable');const row=await env.DB.prepare('SELECT payload FROM kcc_workspaces WHERE id=?').bind(WORKSPACE).first<{payload:string}>();return row?publicCertificateRecord(JSON.parse(row.payload),token):null}
export const publicCertificateHeaders={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Robots-Tag':'noindex, nofollow, nosnippet','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"};
