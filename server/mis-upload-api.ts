import {ServiceError} from './service';
import {createMISUploadService,handleMISUploadHTTP} from './mis-upload-http.mjs';
// No approved institutional provider registry is installed. This is intentionally
// disconnected from owner demo personas, localStorage and browser-supplied roles.
const service=createMISUploadService();
export async function misUploadAPI(subject:string,request:Request){
 try{return await handleMISUploadHTTP({service,subject,request})}
 catch(e){if(e instanceof Error&&e.message==='MIS_UPLOAD_NOT_ACTIVATED')throw new ServiceError(503,'Official MIS uploads are not activated.');throw new ServiceError(400,'MIS upload could not be processed. Load a current authorized preview before retrying.')}
}
