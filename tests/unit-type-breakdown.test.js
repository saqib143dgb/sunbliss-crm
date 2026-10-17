const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const code=fs.readFileSync(path.resolve(__dirname,'../unit_type_breakdown_patch.js'),'utf8');

async function fixture(records){
 let section=null,reads=0;
 const events={};
 const controls={
   querySelector(){return null;},
   appendChild(el){section=el;el.isConnected=true;}
 };
 const document={
   createElement(tag){return {tagName:tag,id:'',innerHTML:'',isConnected:false,setAttribute(name,value){this[name]=value;}};},
   head:{appendChild(){}},
   querySelector(selector){return selector==='#main .controls'?controls:null;},
   getElementById(id){return section&&section.id===id?section:null;},
   addEventListener(type,cb){events[type]=cb;}
 };
 const query={
   select(){return this;},
   order(){return this;},
   limit(){reads++;return Promise.resolve({data:records,error:null});}
 };
 const state={view:'list'};
 const window={state,sb:{from(table){assert.equal(table,'units');return query;}},addEventListener(){}};
 const context={window,document,state,console,Date,setTimeout};
 vm.runInNewContext(code,context);
 await new Promise(resolve=>setImmediate(resolve));
 function click(attributes){
   const button={hasAttribute(name){return Object.prototype.hasOwnProperty.call(attributes,name);},getAttribute(name){return attributes[name];}};
   const target={closest(selector){
     if(selector==='#sunblissUnitTypeBreakdown')return section;
     if(selector.includes('[data-utb-toggle]'))return button;
     return null;
   }};
   events.click({target,preventDefault(){},stopPropagation(){}});
   return section.innerHTML;
 }
 function selectProject(name){
   events.change({target:{value:name,closest(selector){return selector==='#sunblissUnitTypeBreakdown'?section:null;},matches(selector){return selector==='[data-utb-project]';}}});
   return section.innerHTML;
 }
 return {section,click,selectProject,reads:()=>reads};
}
function unit(type,status,no,project='Sunbliss Residences'){
 return {unit_no:no,unit_type:type,availability_status:status,project_name:project};
}
test('collapsed summary, no duplicate filters, zero types excluded, and correct totals',async()=>{
 const f=await fixture([unit('2BR','Sold','B2-101'),unit('2BR','Available','B2-102'),unit('2BR+STORE','Sold','B2-103'),unit('1BR','Cancelled','B2-404')]);
 assert.match(f.section.innerHTML,/By unit type/);
 assert.doesNotMatch(f.section.innerHTML,/3 active units|2 unit types/);
 assert.doesNotMatch(f.section.innerHTML,/<table/);
 const html=f.click({'data-utb-toggle':''});
 assert.match(html,/<table class="utb-table">/);
 assert.doesNotMatch(html,/data-utb-status|data-utb-type|data-utb-refresh/);
 assert.doesNotMatch(html,/class="utb-type">1BR</);
 assert.match(html,/data-utb-count="2BR" data-utb-scope="available"[^>]*>1<\/button>/);
 assert.doesNotMatch(html,/data-utb-count="ALL"|<td>TOTAL<\/td>/);
 assert.equal(f.reads(),1);
});
test('count drilldowns show correct numbers, collapse, and retain read-only behavior',async()=>{
 const f=await fixture([unit('2BR','Available','B2-202'),unit('2BR','Sold','B2-203'),unit('3BR','Sold','B2-101')]);
 f.click({'data-utb-toggle':''});
 let html=f.click({'data-utb-count':'2BR','data-utb-scope':'available'});
 assert.match(html,/B2-202/);
 assert.doesNotMatch(html,/B2-203/);
 assert.match(html,/1 available units/);
 html=f.click({'data-utb-count':'2BR','data-utb-scope':'sold'});
 assert.match(html,/B2-203/);
 assert.doesNotMatch(html,/B2-202/);
 html=f.click({'data-utb-toggle':''});
 assert.doesNotMatch(html,/<table/);
 assert.equal(f.reads(),1);
});
test('multiple projects stay scoped and unit numbers are safely escaped',async()=>{
 const f=await fixture([unit('2BR','Available','A<script>'),unit('3BR','Sold','T-101','Triana Residences')]);
 let html=f.click({'data-utb-toggle':''});
 assert.match(html,/data-utb-project/);
 html=f.selectProject('Triana Residences');
 assert.match(html,/By unit type/);
 assert.doesNotMatch(html,/1 active unit/);
 html=f.click({'data-utb-count':'3BR','data-utb-scope':'all'});
 assert.match(html,/T-101/);
 assert.doesNotMatch(html,/A<script>/);
 html=f.selectProject('Sunbliss Residences');
 html=f.click({'data-utb-count':'2BR','data-utb-scope':'all'});
 assert.match(html,/A&lt;script&gt;/);
});