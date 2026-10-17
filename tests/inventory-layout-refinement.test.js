const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const stylesheet=fs.readFileSync('inventory_layout_refinement_patch.js','utf8');
const inventory=fs.readFileSync('inventory_foundation_v2_patch.js','utf8');
const breakdown=fs.readFileSync('unit_type_breakdown_patch.js','utf8');
const toolbar=fs.readFileSync('units_action_toolbar_patch.js','utf8');
function css(){
 let value='';
 const document={createElement(){return {set textContent(v){value=v;},set id(v){}};},head:{appendChild(){}}};
 vm.runInNewContext(stylesheet,{window:{},document});
 return value;
}
test('single understated Filters and Export toolbar is responsive and retains original controls',()=>{
 const s=css();
 assert.match(s,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
 assert.match(s,/\.units-action-toolbar>#btnToggleFilters\{grid-column:1!important/);
 assert.match(s,/\.units-action-toolbar>\.units-secondary-actions\{grid-column:2!important/);
 assert.match(s,/\.units-action-toolbar>\.filter-panel\{grid-column:1\/-1!important/);
 assert.match(s,/\.units-action-toolbar \.units-secondary-actions>#btnExportList\{display:flex!important/);
 assert.match(s,/\.units-action-toolbar \.units-secondary-actions>#btnExportList\{[^}]*background:var\(--paper\)!important;color:var\(--ink\)!important/);
 assert.match(toolbar,/toolbar\.appendChild\(filters\)/);
 assert.match(toolbar,/actionRow\.appendChild\(exportBtn\)/);
 assert.doesNotMatch(stylesheet,/addEventListener|innerHTML|\.onclick|\.click\(/);
});
test('inventory and type breakdown are one visible workspace without repeated grand total',()=>{
 const s=css();
 assert.match(s,/\.inventory-status-bar:has\(\+ #sunblissUnitTypeBreakdown\)/);
 assert.match(s,/\.inventory-status-bar \+ #sunblissUnitTypeBreakdown/);
 assert.match(inventory,/>Inventory<\/span><span class="inventory-status-total">/);
 assert.match(inventory,/line\.style\.setProperty\('display','none','important'\)/);
 assert.match(breakdown,/By unit type/);
 assert.doesNotMatch(breakdown,/var sum='<tr class="utb-total">/);
 assert.doesNotMatch(breakdown,/active '\+\(total\.all/);
});
test('only search results display a count above the unit list',()=>{
 const start=inventory.indexOf('  function updateResultLine(');
 const end=inventory.indexOf('\n  function applyInventoryView()',start);
 assert(start>=0&&end>start);
 const fn=inventory.slice(start,end);
 const style={display:'',setProperty(name,value){if(name==='display')this.display=value;},removeProperty(name){if(name==='display')this.display='';}};
 const line={textContent:'',style};
 const ctx={document:{querySelector(){return line;}},hasCustomerConditionFilter:()=>false,currentSearch:()=>'',activeFilter:'all',text:String};
 vm.runInNewContext(fn+'\nthis.renderResult=updateResultLine;',ctx);
 ctx.renderResult(76,0);
 assert.equal(style.display,'none');
 ctx.currentSearch=()=> 'B2';
 ctx.renderResult(2,0);
 assert.equal(style.display,'');
 assert.equal(line.textContent,'2 matching sold units');
});
