import {createMISAdapter,misIntegrationConfiguration} from './mis-adapter.mjs';
// Lifecycle names only. No guessed E-Digital URL, OAuth/OIDC/SAML flow, token parser or cookie.
export function createMISSSOInterface({configuration=misIntegrationConfiguration,adapter=createMISAdapter({configuration})}={}){
 const mode=configuration?.mode;if(adapter.mode!==mode)throw Error('SSO and MIS adapter modes differ');
 const blocked=()=>({ok:false,authenticated:false,canAccessLiveWorkspace:false,reason:mode==='OFFICIAL'?'OFFICIAL_SSO_SPECIFICATION_REQUIRED':'SSO_INTEGRATION_DISABLED',redirectUrl:null});
 return Object.freeze({
  readiness(){return {mode,productionReady:false,protocol:null,liveSignInEnabled:false}},
  async beginSignIn(){return mode==='MOCK'?{ok:true,mode:'MOCK',fictional:true,authenticated:false,canAccessLiveWorkspace:false,redirectUrl:null,next:'LOCAL_FICTIONAL_IDENTITY_SELECTION_ONLY'}:blocked()},
  async completeSignIn(mockIdentity){return mode==='MOCK'?adapter.resolveMockIdentity(mockIdentity):blocked()}
 });
}
export const misSSO=createMISSSOInterface();
