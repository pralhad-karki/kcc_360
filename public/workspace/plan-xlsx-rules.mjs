// Isolated browser-compatible adapter. Caller injects pinned SheetJS; no live import.
const check=(ok,reason)=>{if(!ok)throw Error(reason)};
const dateColumns=['start','end','reportDue'];
function preflight(bytes){
 check(bytes instanceof Uint8Array&&bytes.length>0&&bytes.length<=1_000_000,'XLSX_INPUT_LIMIT');const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),length=bytes.length;
 let end=-1;for(let p=length-22;p>=Math.max(0,length-65557);p--)if(v.getUint32(p,true)===0x06054b50){end=p;break}
 check(end>=0&&end+22+v.getUint16(end+20,true)===length,'INVALID_XLSX_ZIP');
 const count=v.getUint16(end+10,true),size=v.getUint32(end+12,true),start=v.getUint32(end+16,true);
 check(v.getUint16(end+4,true)===0&&v.getUint16(end+6,true)===0&&v.getUint16(end+8,true)===count&&count>0&&count<=200&&start+size===end,'UNSUPPORTED_XLSX_ARCHIVE');
 let p=start,total=0;const names=new Set(),decode=new TextDecoder('utf-8',{fatal:true});
 for(let i=0;i<count;i++){
  check(p+46<=end&&v.getUint32(p,true)===0x02014b50,'INVALID_ZIP_DIRECTORY');const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),compressed=v.getUint32(p+20,true),expanded=v.getUint32(p+24,true),n=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),offset=v.getUint32(p+42,true);check(p+46+n+extra+comment<=end&&!(flags&1)&&[0,8].includes(method),'UNSUPPORTED_ZIP_ENTRY');
  const name=decode.decode(bytes.subarray(p+46,p+46+n)),lower=name.toLowerCase();check(!names.has(name)&&!name.startsWith('/')&&!name.includes('\\')&&!name.split('/').includes('..')&&!name.includes('\0'),'UNSAFE_ZIP_NAME');names.add(name);
  check(!['vbaproject','externallinks/','embeddings/','activex/'].some(k=>lower.includes(k))&&!lower.endsWith('.bin'),'UNSUPPORTED_ACTIVE_WORKBOOK');
  check(expanded<=2_000_000&&expanded<=Math.max(1,compressed)*200,'XLSX_EXPANSION_LIMIT');total+=expanded;check(total<=4_000_000,'XLSX_EXPANSION_LIMIT');
  check(offset+30<=start&&v.getUint32(offset,true)===0x04034b50,'INVALID_ZIP_LOCAL_ENTRY');const localName=v.getUint16(offset+26,true),localExtra=v.getUint16(offset+28,true);check(offset+30+localName+localExtra+compressed<=start&&v.getUint16(offset+6,true)===flags&&v.getUint16(offset+8,true)===method&&decode.decode(bytes.subarray(offset+30,offset+30+localName))===name,'ZIP_ENTRY_MISMATCH');
  p+=46+n+extra+comment;
 }
 check(p===end&&names.has('[Content_Types].xml')&&names.has('xl/workbook.xml'),'XLSX_WORKBOOK_REQUIRED');
}
export function parseWorkbook(bytes,XLSX){
 check(XLSX?.version==='0.20.3'&&typeof XLSX.read==='function','PINNED_PARSER_REQUIRED');preflight(bytes);
 const workbook=XLSX.read(bytes,{type:'array',cellFormula:true,cellNF:true,cellStyles:true,cellDates:false,bookFiles:true});
 const types=workbook.files?.['[Content_Types].xml']?.content;const typeXml=typeof types==='string'?types:new TextDecoder().decode(types);const main=(typeXml.match(/<Override\b[^>]*>/g)||[]).filter(tag=>/PartName=["']\/xl\/workbook\.xml["']/.test(tag));check(main.length===1&&/ContentType=["']application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet\.main\+xml["']/.test(main[0]),'XLSX_CONTENT_TYPE_REQUIRED');
 for(const [name,file]of Object.entries(workbook.files||{}))if(/\.(xml|rels)$/i.test(name)&&file?.content){const raw=typeof file.content==='string'?file.content:new TextDecoder().decode(file.content);check(!/<!DOCTYPE|<!ENTITY/i.test(raw),'UNSUPPORTED_WORKBOOK_XML')}
 return workbook;
}
export function listPlanXlsxSheetsPilot(bytes,{XLSX}={}){const workbook=parseWorkbook(bytes,XLSX);check(Array.isArray(workbook.SheetNames)&&workbook.SheetNames.length>0&&workbook.SheetNames.length<=20,'WORKSHEET_COUNT_LIMIT');return [...workbook.SheetNames]}
export function readPlanXlsxPilot(bytes,{XLSX,columns,sheet}={}){
 check(Array.isArray(columns)&&columns.length>0&&columns.length<=40&&columns.every(c=>typeof c==='string'&&c)&&new Set(columns).size===columns.length,'EXACT_IMPORT_COLUMNS_REQUIRED');const workbook=parseWorkbook(bytes,XLSX);
 check(Array.isArray(workbook.SheetNames)&&workbook.SheetNames.length>0,'WORKSHEET_REQUIRED');if(sheet===undefined){check(workbook.SheetNames.length===1,'EXPLICIT_WORKSHEET_REQUIRED');sheet=workbook.SheetNames[0]}
 check(workbook.SheetNames.includes(sheet),'WORKSHEET_UNAVAILABLE');const index=workbook.SheetNames.indexOf(sheet);check(!workbook.Workbook?.Sheets?.[index]?.Hidden,'VISIBLE_WORKSHEET_REQUIRED');const ws=workbook.Sheets[sheet];check(ws&&ws['!ref'],'WORKSHEET_REQUIRED');const range=XLSX.utils.decode_range(ws['!ref']);
 check(range.s.r===0&&range.s.c===0&&range.e.r<=50&&range.e.c===columns.length-1,'WORKSHEET_RANGE_LIMIT');check(!(ws['!merges']||[]).length&&!(ws['!rows']||[]).some(r=>r?.hidden)&&!(ws['!cols']||[]).some(c=>c?.hidden),'VISIBLE_UNMERGED_LAYOUT_REQUIRED');
 const cell=(r,c)=>ws[XLSX.utils.encode_cell({r,c})];check(columns.every((name,c)=>cell(0,c)?.t==='s'&&cell(0,c).v===name&&!cell(0,c).f&&!cell(0,c).l),'EXACT_HEADER_REQUIRED');
 const rows=[columns];for(let r=1;r<=range.e.r;r++){
  const cells=columns.map((_,c)=>cell(r,c));if(cells.every(c=>!c||c.t==='z'||c.v===undefined))continue;
  rows.push(cells.map((c,i)=>{if(!c||c.t==='z'||c.v===undefined)return '';check(!c.f&&!c.l&&c.t!=='e'&&c.t!=='b','UNSUPPORTED_CELL');if(c.t==='s'||c.t==='str'){check(typeof c.v==='string'&&c.v.length<=2000,'CELL_TEXT_LIMIT');return c.v}
   check(c.t==='n'&&typeof c.v==='number'&&Number.isFinite(c.v)&&Math.abs(c.v)<=Number.MAX_SAFE_INTEGER,'UNSUPPORTED_CELL');check(!['externalId','lead'].includes(columns[i]),'TEXT_IDENTIFIER_REQUIRED');
   if(c.z&&XLSX.SSF.is_date(c.z)){check(dateColumns.includes(columns[i]),'DATE_COLUMN_REQUIRED');const d=XLSX.SSF.parse_date_code(c.v,{date1904:!!workbook.Workbook?.WBProps?.date1904});check(d&&d.y>=1970&&d.y<=2100&&d.H===0&&d.M===0&&d.S===0&&!d.u,'CALENDAR_DATE_REQUIRED');return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`}
   return String(c.v);
  }));
 }
 check(rows.length>1,'DATA_ROW_REQUIRED');const quote=v=>'"'+String(v).replaceAll('"','""')+'"',csv=rows.map(row=>row.map(quote).join(',')).join('\n')+'\n';check(csv.length<=30000,'CONVERTED_CSV_LIMIT');return {sheet,rows:rows.length-1,csv};
}
