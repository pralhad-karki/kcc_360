import {uploadFile} from '../../../server/files';
import {json,failure} from '../../../server/service';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{return json(await uploadFile(request))}catch(e){return failure(e)}}
