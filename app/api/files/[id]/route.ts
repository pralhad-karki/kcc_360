import {downloadFile} from '../../../../server/files';
import {failure} from '../../../../server/service';
export const dynamic='force-dynamic';
export async function GET(_request:Request,context:{params:Promise<{id:string}>}){try{return await downloadFile((await context.params).id)}catch(e){return failure(e)}}
