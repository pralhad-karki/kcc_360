import { requireChatGPTUser } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home(){await requireChatGPTUser('/');return <iframe title="KCC360 learning workspace" src="/workspace/index.html" style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,background:'#f4f6f9'}}/>}
