import {readInternshipLetter,internshipLetterHeaders} from '../../../server/internship-letters';
import {internshipLetterHtml} from '../../../server/internship-letter-policy.mjs';
import {shareQR} from '../../../server/qr.mjs';
import {failure} from '../../../server/service';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){try{const record=await readInternshipLetter((await params).id),nonce=crypto.randomUUID(),link=new URL('/internship-letters/'+encodeURIComponent(record.id),request.url).href,qrSvg=await shareQR(link);return new Response(internshipLetterHtml(record,{nonce,qrSvg}),{headers:internshipLetterHeaders(nonce)})}catch(error){return failure(error)}}
