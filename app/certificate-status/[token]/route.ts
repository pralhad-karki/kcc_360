import {readPublicCertificate,publicCertificateHeaders} from '../../../server/public-certificates';
import {publicCertificateHtml} from '../../../server/public-certificate-policy.mjs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){let record;try{record=await readPublicCertificate((await params).token)}catch{return new Response('Certificate status temporarily unavailable.',{status:503,headers:{...publicCertificateHeaders,'Content-Type':'text/plain; charset=utf-8'}})}return new Response(publicCertificateHtml(record),{status:record?200:404,headers:{...publicCertificateHeaders,'Content-Type':'text/html; charset=utf-8'}})}
