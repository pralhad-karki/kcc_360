import {sameOrigin,json,failure,ServiceError} from '../../../server/service';
import {listPortfolioShares,portfolioShareAction} from '../../../server/shares';
export const dynamic='force-dynamic';
export async function GET(){try{return json(await listPortfolioShares())}catch(e){return failure(e)}}
export async function POST(request:Request){try{sameOrigin(request);const raw=await request.text();if(raw.length>15000)throw new ServiceError(413,'Sharing request too large.');return json(await portfolioShareAction(JSON.parse(raw),new URL(request.url).origin))}catch(e){return failure(e)}}
