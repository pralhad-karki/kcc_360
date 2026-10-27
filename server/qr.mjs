import QRCode from 'qrcode';
export async function shareQR(url){return QRCode.toString(url,{type:'svg',errorCorrectionLevel:'M',margin:4,width:256,color:{dark:'#183443',light:'#ffffff'}})}
