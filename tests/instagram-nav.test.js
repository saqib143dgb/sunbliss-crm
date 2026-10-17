const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').resolve(__dirname,'..','instagram_mobile_dock_patch.js'),'utf8');

function boot(){
  const style={textContent:''},labels={};
  const buttons=Object.fromEntries(['[data-view="overview"]','[data-view="insights"]','.dock-add','[data-view="list"]','.dock-search'].map(key=>[key,{setAttribute(k,v){this[k]=v;}}]));
  const dock={setAttribute(k,v){labels[k]=v;},querySelector(selector){return buttons[selector.replace('.tab','')]||null;}};
  const events={};
  const document={createElement(){return style;},head:{appendChild(){}},querySelector(selector){return selector==='body>.tabs'?dock:null;}};
  const window={addEventListener(k,handler){events[k]=handler;}};
  vm.runInNewContext(source,{window,document});
  return {style,labels,buttons,events};
}
test('Instagram-style mobile navigation includes Units and five accessible icon destinations',()=>{
  const {style,labels,buttons,events}=boot();
  assert.equal(labels.role,'navigation');
  assert.equal(labels['aria-label'],'CRM primary navigation');
  assert.deepEqual(Object.values(buttons).map(b=>b['aria-label']),['Overview','Insights','Add new customer','Units','Search units or customers']);
  assert.match(style.textContent,/repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(style.textContent,/repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(style.textContent,/\.tab\[data-view="list"\]\{order:4!important;display:flex!important/);
  assert.match(style.textContent,/\.dock-search\[aria-expanded="true"\]/);
  assert.match(style.textContent,/env\(safe-area-inset-bottom\)/);
  assert.equal(typeof events.pageshow,'function');
});
test('Instagram-style navigation has mobile-only styles and reduced-motion support',()=>{
  const {style}=boot();
  assert.match(style.textContent,/@media\s*\(max-width:\s*1023px\)/);
  assert.match(style.textContent,/prefers-reduced-motion/);
  assert.match(style.textContent,/focus-visible/);
});
