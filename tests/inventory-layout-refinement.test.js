const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('inventory_layout_refinement_patch.js','utf8');
const toolbar=fs.readFileSync('units_action_toolbar_patch.js','utf8');
const breakdown=fs.readFileSync('unit_type_breakdown_patch.js','utf8');
function css(){
 let stylesheet=null,insertions=0;
 const document={createElement(tag){assert.equal(tag,'style');return {id:'',textContent:''};},head:{appendChild(el){stylesheet=el;insertions++;}}};
 const window={};
 vm.runInNewContext(source,{window,document});
 assert.equal(insertions,1);
 return stylesheet.textContent;
}
test('Filters and Export Units occupy two equally sized columns on mobile',()=>{
 const s=css();
 assert.match(s,/@media\(max-width:1023px\)/);
 assert.match(s,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
 assert.match(s,/\.units-action-toolbar>#btnToggleFilters\{order:0!important;grid-column:1!important/);
 assert.match(s,/\.units-action-toolbar>\.units-secondary-actions\{order:1!important;grid-column:2!important/);
 assert.match(s,/\.units-action-toolbar>\.filter-panel\{order:3!important;grid-column:1\/-1!important/);
 assert.match(s,/\.units-action-toolbar>\.active-pills\{order:2!important;grid-column:1\/-1!important/);
 assert.match(s,/height:44px!important/);
 assert.match(s,/@media\(max-width:359px\)/);
});
test('existing Filters and Export actions are moved by existing toolbar without rewiring',()=>{
 const s=css();
 assert.match(toolbar,/toolbar\.appendChild\(filters\)/);
 assert.match(toolbar,/actionRow\.appendChild\(exportBtn\)/);
 assert.match(toolbar,/toolbar\.appendChild\(filterPanel\)/);
 assert.match(s,/background:var\(--ink\)!important/);
 assert.doesNotMatch(source,/addEventListener|innerHTML|\.onclick|\.remove\(|\.click\(/);
});
test('breakdown retains count drilldowns, cuts clutter and preserves touch states',()=>{
 const s=css();
 assert.match(s,/#sunblissUnitTypeBreakdown \.utb-table th\{/);
 assert.match(s,/#sunblissUnitTypeBreakdown \.utb-total td\{/);
 assert.match(s,/#sunblissUnitTypeBreakdown \.utb-count\.available:disabled/);
 assert.match(s,/#sunblissUnitTypeBreakdown \.utb-foot\{display:none!important/);
 assert.match(breakdown,/data-utb-count/);
 assert.match(breakdown,/data-utb-toggle/);
 assert.match(breakdown,/\.from\('units'\)/);
 assert.doesNotMatch(source,/supabase|fetch\(|\.from\(/);
});
