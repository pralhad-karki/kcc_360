import {parseWorkbook} from './plan-xlsx-reader-pilot.mjs';
import {parseMISCSV} from './mis-manual-import.mjs';
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
export async function misFileHash(bytes){check(bytes instanceof Uint8Array,'MIS_FILE_BYTES_REQUIRED');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export function decodeMISFile({bytes,filename,sheet=null,mapping,XLSX}){
 check(bytes instanceof Uint8Array&&bytes.length>0&&bytes.length<=1000000,'MIS_FILE_SIZE_LIMIT');
 check(typeof filename==='string'&&filename.length<=200&&!/[\u0000-\u001f\u007f/\\]/.test(filename),'INVALID_MIS_FILENAME');
 if(/\.csv$/i.test(filename)){check(sheet===null&&bytes.length<=250000,'CSV_SHEET_OR_SIZE_INVALID');let csv;try{csv=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes)}catch{throw Error('CSV_UTF8_REQUIRED')}parseMISCSV(csv);return {csv,sheet:null,mime:'text/csv',decoderVersion:'MIS-UTF8-CSV-1'}}
 check(/\.xlsx$/i.test(filename),'MIS_CSV_OR_XLSX_REQUIRED');const workbook=parseWorkbook(bytes,XLSX);
 check(Array.isArray(workbook.SheetNames)&&workbook.SheetNames.length>0&&workbook.SheetNames.length<=20,'MIS_WORKSHEET_COUNT');
 if(sheet===null){check(workbook.SheetNames.length===1,'EXPLICIT_WORKSHEET_REQUIRED');sheet=workbook.SheetNames[0]}
 check(typeof sheet==='string'&&workbook.SheetNames.includes(sheet),'MIS_WORKSHEET_UNAVAILABLE');const index=workbook.SheetNames.indexOf(sheet),ws=workbook.Sheets[sheet];
 check(!workbook.Workbook?.Sheets?.[index]?.Hidden&&ws?.['!ref'],'VISIBLE_WORKSHEET_REQUIRED');const range=XLSX.utils.decode_range(ws['!ref']);
 check(range.s.r===0&&range.s.c===0&&range.e.r>=1&&range.e.r<=1000&&range.e.c<40,'MIS_WORKSHEET_RANGE');
 check(!(ws['!merges']||[]).length&&!(ws['!rows']||[]).some(x=>x?.hidden)&&!(ws['!cols']||[]).some(x=>x?.hidden),'VISIBLE_UNMERGED_LAYOUT_REQUIRED');
 const cell=(r,c)=>ws[XLSX.utils.encode_cell({r,c})],headers=[];
 for(let c=0;c<=range.e.c;c++){const h=cell(0,c);check(h?.t==='s'&&typeof h.v==='string'&&!h.f&&!h.l,'MIS_TEXT_HEADERS_REQUIRED');headers.push(h.v)}
 const mapped=Object.values(mapping?.columns??{});check(mapped.length>0&&mapped.every(h=>headers.includes(h)),'MAPPED_COLUMN_MISSING');
 const rows=[headers];for(let r=1;r<=range.e.r;r++){const row=[];for(let c=0;c<=range.e.c;c++){const x=cell(r,c);if(!x||x.t==='z'||x.v===undefined){row.push('');continue}check(!x.f&&!x.l&&['s','str','n'].includes(x.t),'MIS_UNSUPPORTED_CELL');check(!mapped.includes(headers[c])||['s','str'].includes(x.t),'MIS_MAPPED_FIELDS_REQUIRE_TEXT');check(typeof x.v==='string'||(typeof x.v==='number'&&Number.isFinite(x.v)),'MIS_INVALID_CELL');check(String(x.v).length<=2000,'MIS_CELL_SIZE');row.push(String(x.v))}rows.push(row)}
 const csv=rows.map(row=>row.map(v=>'"'+v.replaceAll('"','""')+'"').join(',')).join('\n');parseMISCSV(csv);return {csv,sheet,mime:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',decoderVersion:'MIS-XLSX-TEXT-1/SHEETJS-0.20.3'};
}
