const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const build=fs.readFileSync(path.join(root,'build.js'),'utf8');
const original=fs.readFileSync(path.join(root,'welcome-letter.html'),'utf8');
const projection=fs.readFileSync(path.join(root,'lib/soa_spa_projection_core.js'),'utf8');

const functionPart=(start,end,name,args=[])=>{
 const a=build.indexOf(start),b=build.indexOf(end,a);
 assert.ok(a>=0&&b>a,'SOA function missing: '+start);
 return new Function(...args,build.slice(a,b)+'\nreturn '+name+';');
};
const refine=functionPart('function refineSoaDocumentVisuals(source){',
 'function reviseSoaFiguresUsingSignedSpa(source){','refineSoaDocumentVisuals')();
const revise=functionPart('function reviseSoaFiguresUsingSignedSpa(source){',
 'function testDocumentSafety(source){','reviseSoaFiguresUsingSignedSpa',
 ['fs','path','ROOT'])({readFileSync:()=>projection},
 {join:(...values)=>values.join('/')},root);
const source=revise(refine(original));

test('SOA typography does not change columns, headings, coordinates, or financial model',()=>{
 const baseline=refine(original);
 const scene='async function soaFonts(pdf)';
 assert.equal(source.slice(source.indexOf(scene)),baseline.slice(baseline.indexOf(scene)));
 assert.match(source,/table\(819,\[42,184,190,76,190,163,173,154\]/);
 assert.match(source,/soaProjection\.total/);
 assert.doesNotMatch(source,/SIGNED SPA RECONCILIATION|Approved CN Pending|Net Cash Due/);
 for(const section of source.split('</script>')){
  const a=section.lastIndexOf('<script');
  if(a<0)continue;
  const gt=section.indexOf('>',a);
  if(gt<0)continue;
  const js=section.slice(gt+1);
  if(js.trim())assert.doesNotThrow(()=>new Function(js));
 }
});
function sampleScenes(){
 const start=source.indexOf('function soaScenes('),end=source.indexOf('let soaRenderVersion=0',start);
 assert.ok(start>=0&&end>start);
 const scenesFn=new Function('clean','dateText','soaAmount','soaDisplayDate',
  source.slice(start,end)+'\nreturn soaScenes;')(
  v=>String(v??''),v=>v||'-',
  v=>Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),
  v=>v||'-'
 );
 const fonts={
  regular:{widthOfTextAtSize:(v,size)=>String(v).length*size*.51},
  bold:{widthOfTextAtSize:(v,size)=>String(v).length*size*.56}
 };
 const names=['Down Payment','1st Installment','2nd Installment','3rd Installment',
  '4th Installment','5th Installment','Final Installment (Handover)'];
 const amounts=[200200,200200,100100,100100,100100,100100,1201200];
 const paid=[194300,194300,97150,0,0,0,0];
 const status=['Paid','Paid','Pending Accounts','Overdue','Upcoming','Upcoming','At Possession'];
 const data={
  customer:'TEST CUSTOMER',email:'test@example.com',phone:'0501231234',
  unit:'B2-703',project:'Sunbliss Residences',date:'2026-10-20',
  total:2002000,received:360460,credits:125290,balance:1516250,overdue:97150,
  schedule:names.map((label,i)=>({
   label,due:amounts[i],paid:paid[i],balance:amounts[i]-paid[i],
   date:'20 Oct 2026',status:status[i]
  })),
  history:[{date:'2026-10-15',description:'Payment',due:'20 Oct 2026',
   receipt:'SPRED:100',method:'Online',amount:97150,
   allocated:'2nd Installment',balance:1600000}]
 };
 return scenesFn(data,fonts);
}
test('installment rows and status badges use one consistent 16-point type size',()=>{
 const pages=sampleScenes();
 const cells=pages[0].filter(t=>t.kind==='text'&&t.y>883&&t.y<1184);
 assert.ok(cells.length>=45);
 assert.deepEqual([...new Set(cells.map(x=>x.size))],[16]);
 assert.ok(cells.some(x=>x.text==='Pending'));
 assert.ok(cells.some(x=>x.text==='Accounts'));
 assert.ok(cells.some(x=>x.text==='1,201,200.00'));
});
test('first-page cards and transaction-page amounts have internally consistent sizes',()=>{
 const pages=sampleScenes();
 assert.ok(pages.length>=2);
 const mainAmounts=pages[0].filter(x=>x.kind==='text'&&x.y===679);
 assert.equal(mainAmounts.length,3);
 assert.ok(mainAmounts.every(x=>x.size===26));
 const histAmount=pages[1].filter(x=>x.kind==='text'&&x.y===471);
 assert.equal(histAmount.length,5);
 assert.ok(histAmount.every(x=>x.size===20));
 const historyCells=pages[1].filter(x=>x.kind==='text'&&x.y>685&&x.y<735);
 assert.ok(historyCells.length>0);
 assert.ok(historyCells.every(x=>x.size===16));
});
