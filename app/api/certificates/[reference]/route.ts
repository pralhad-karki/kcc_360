import {verifyCertificate} from '../../../../server/certificates';
import {json,failure} from '../../../../server/service';
export const dynamic='force-dynamic';
export async function GET(_request:Request,context:{params:Promise<{reference:string}>}){try{return json(await verifyCertificate((await context.params).reference))}catch(e){return failure(e)}}
