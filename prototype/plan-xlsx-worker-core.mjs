import {listPlanXlsxSheetsPilot,readPlanXlsxPilot} from './plan-xlsx-rules.mjs?v=120';
export function processPlanXlsxMessage(message,XLSX){const {action,bytes,columns,sheet}=message||{},input=new Uint8Array(bytes);if(action==='LIST')return listPlanXlsxSheetsPilot(input,{XLSX});if(action==='CONVERT')return readPlanXlsxPilot(input,{XLSX,columns,sheet});throw Error('UNKNOWN_FILE_ACTION')}
