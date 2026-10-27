import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Exercise the actual shared helper across consecutive loading/form/dialog phases.
const source=fs.readFileSync('prototype/app.js','utf8');
const helper=source.slice(source.indexOf('function modal(html){'),source.indexOf('function closeModal(){'));
const attrs=new Map();let title,cancelled=0,shown=0;
const dialog={innerHTML:'',querySelector(selector){assert.equal(selector,'h1,h2,h3,h4,h5,h6');return title},removeAttribute(name){attrs.delete(name)},setAttribute(name,value){attrs.set(name,value)},showModal(){shown++}};
const context=vm.createContext({$:selector=>{assert.equal(selector,'#modal');return dialog},planXlsxCancel:()=>cancelled++});
vm.runInContext(helper,context);
title={id:'',textContent:'Checking current task progress…'};context.html='<h2>Checking current task progress…</h2>';vm.runInContext('modal(html)',context);
assert.equal(attrs.get('aria-labelledby'),title.id);assert.equal(title.id,'modal-title');assert.equal(cancelled,1);
// Replacing the body must name the new heading rather than retain the loading title.
title={id:'',textContent:'Update my task progress'};context.html='<section><h2>Update my task progress</h2><form></form></section>';vm.runInContext('modal(html)',context);
assert.equal(attrs.get('aria-labelledby'),title.id);assert.equal(dialog.innerHTML,context.html);assert(!attrs.has('aria-label'));
title={id:'existing-review-title'};vm.runInContext('modal(html)',context);assert.equal(attrs.get('aria-labelledby'),'existing-review-title');
// Heading-free views receive a generic name without a dangling old ID reference.
title=null;context.html='<p>Workspace information</p>';vm.runInContext('modal(html)',context);assert(!attrs.has('aria-labelledby'));assert.equal(attrs.get('aria-label'),'Workspace dialog');
title={id:'',textContent:'Review <script>literal text</script>'};vm.runInContext('modal(html)',context);assert(!attrs.has('aria-label'));assert.equal(attrs.get('aria-labelledby'),title.id);assert.equal(shown,5);
console.log('PASS shared dialog accessible naming: loading/form replacement, retained heading IDs, heading-free fallback and no stale label; native showModal and import cancellation preserved.');
