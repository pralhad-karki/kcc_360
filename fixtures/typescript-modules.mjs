// Isolated test loader for infrastructure TS imports; no runtime source edits.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const cache=new Map();
export function compileTSModule(filename){
 filename=path.resolve(filename);if(cache.has(filename))return cache.get(filename);
 let code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/(from\s*|import\s*)(['"])([^'"]+)\2/g,(all,prefix,quote,spec)=>{
  if(spec.startsWith('.')){let target=path.resolve(path.dirname(filename),spec);if(!path.extname(target))target+='.ts';return prefix+JSON.stringify(target.endsWith('.ts')?compileTSModule(target):pathToFileURL(target).href);}
  return /^(?:node:|file:|data:)/.test(spec)?all:prefix+JSON.stringify(import.meta.resolve(spec));
 });
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(filename,url);return url;
}
