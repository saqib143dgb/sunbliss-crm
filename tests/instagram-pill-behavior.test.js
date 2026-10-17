const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'..','instagram_pill_proportions_patch.js'),'utf8');
function setup(){
 var classes=new Set(),backClasses=new Set(),callbacks={},style={textContent:''};
 var bar={classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}};
 var window={innerWidth:390,scrollY:0,requestAnimationFrame(cb){cb();},addEventListener(n,fn){callbacks['window:'+n]=fn;}};
 var document={documentElement:{scrollTop:0},head:{appendChild(){}},createElement(){return style;},querySelector(selector){return selector==='body>.tabs'?bar:null;},getElementById(id){return id==='sunblissPersistentBack'?{classList:{toggle(name,on){if(on)backClasses.add(name);else backClasses.delete(name);}}}:null;},addEventListener(n,fn){callbacks['document:'+n]=fn;}};
 vm.runInNewContext(source,{window,document});
 return {classes,backClasses,callbacks,style,window};
}
test('matching the reference dimensions without modifying CRM icon content',()=>{
 const {style}=setup();
 assert.match(style.textContent,/calc\(100vw - 44px\)/);
 assert.match(style.textContent,/height:58px/);
 assert.match(style.textContent,/#sunblissPersistentBack\{width:calc\(100vw - 44px\)!important/);
 assert.match(style.textContent,/#sunblissPersistentBack\.sunbliss-scroll-compact\{width:calc\(100vw - 80px\)!important/);
 assert.match(style.textContent,/#sunblissPersistentBackDock\{padding-bottom:calc\(24px \+ env\(safe-area-inset-bottom\)\)/);
 assert.match(style.textContent,/safe-area-inset-bottom/);
 assert.doesNotMatch(source,/innerHTML|removeChild|replaceChildren|setAttribute/);
});
test('minimizes on scroll down and restores on up, top and tab selection',()=>{
 const {classes,backClasses,callbacks,window}=setup();
 window.scrollY=105;callbacks['window:scroll']();
 assert(classes.has('sunbliss-scroll-compact'));
 assert(backClasses.has('sunbliss-scroll-compact'));
 window.scrollY=65;callbacks['window:scroll']();
 assert(!classes.has('sunbliss-scroll-compact'));
 assert(!backClasses.has('sunbliss-scroll-compact'));
 window.scrollY=170;callbacks['window:scroll']();
 assert(classes.has('sunbliss-scroll-compact'));
 callbacks['document:click']({target:{closest(sel){return sel==='body>.tabs .tab'?{}:null;}}});
 assert(!classes.has('sunbliss-scroll-compact'));
 window.scrollY=12;callbacks['window:scroll']();
 assert(!classes.has('sunbliss-scroll-compact'));
});
test('tapping Back restores the expanded pill without changing navigation',()=>{
 const {classes,backClasses,callbacks,window}=setup();
 window.scrollY=110;callbacks['window:scroll']();
 assert(backClasses.has('sunbliss-scroll-compact'));
 callbacks['document:click']({target:{closest(sel){return sel==='#sunblissPersistentBack'?{}:null;}}});
 assert(!backClasses.has('sunbliss-scroll-compact'));
 assert(!classes.has('sunbliss-scroll-compact'));
});
