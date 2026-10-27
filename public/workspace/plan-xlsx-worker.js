// Classic dedicated worker; local assets only. Never calls workspace APIs.
importScripts('sheetjs-0.20.3.mini.min.js?v=120');
self.onmessage=async event=>{try{const {processPlanXlsxMessage}=await import('./plan-xlsx-worker-core.mjs?v=120');self.postMessage({ok:true,result:processPlanXlsxMessage(event.data,self.XLSX)})}catch(error){self.postMessage({ok:false,error:error.message||'WORKBOOK_READ_FAILED'})}};
