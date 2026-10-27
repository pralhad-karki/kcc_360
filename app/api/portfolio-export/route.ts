import {sameOrigin,json,failure,ServiceError} from '../../../server/service';
import {privatePortfolioExportAction,privatePortfolioPrintHeaders} from '../../../server/portfolio-exports';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{sameOrigin(request);const raw=await request.text();if(raw.length>10000)throw new ServiceError(413,'Private export request too large.');let body;try{body=JSON.parse(raw)}catch{throw new ServiceError(400,'Invalid JSON request.')}const result=await privatePortfolioExportAction(body);return result.mode==='print'?new Response(result.html,{headers:privatePortfolioPrintHeaders}):json(result)}catch(error){return failure(error)}}
