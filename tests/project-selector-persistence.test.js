const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
test('project selector survives asynchronous header rebuild and restores after app refresh',()=>{
  const ids=new Map();let repairs;let row;let destination;
  const header={insertAdjacentElement(position,node){assert.equal(position,'afterend');row=node;}};
  const app={};
  const document={querySelector:()=>header,getElementById:id=>id==='app'?app:ids.get(id),addEventListener(){},createElement(){return {style:{},children:[],set id(value){ids.set(value,this)},setAttribute(){},appendChild(child){this.children.push(child)},addEventListener(event,fn){this[event]=fn}}}};
  const window={render(){},MutationObserver:class{constructor(fn){repairs=fn}observe(target,options){assert.equal(target,app);assert.deepEqual(JSON.parse(JSON.stringify(options)),{childList:true})}}};
  vm.runInNewContext(fs.readFileSync('project_workspace.js','utf8'),{window,document,MutationObserver:window.MutationObserver,location:{assign:value=>destination=value}});
  assert(row);const original=ids.get('crm-project-selector');
  header.innerHTML='Header rebuilt';repairs();assert.equal(ids.get('crm-project-selector'),original);
  ids.clear();repairs();const restored=ids.get('crm-project-selector');assert(restored);assert.notEqual(restored,original);
  restored.value='triana';restored.change();assert.equal(destination,'triana.html');
  repairs();assert.equal(ids.get('crm-project-selector'),restored);
});
