const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const build=fs.readFileSync(path.join(__dirname,'..','build.js'),'utf8');
const original=fs.readFileSync(path.join(__dirname,'..','welcome-letter.html'),'utf8');
const model=fs.readFileSync(path.join(__dirname,'..','lib','soa_spa_projection_core.js'),'utf8');

function fnBetween(start,end,name,args){
 const a=build.indexOf(start),b=build.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Build marker '+start+' must exist');
 return new Function(...(args||[]),build.slice(a,b)+';return '+name+';');
}
const refine=fnBetween('function refineSoaDocumentVisuals(source){','function reviseSoaFiguresUsingSignedSpa(source){','refineSoaDocumentVisuals')();
const update=fnBetween('function reviseSoaFiguresUsingSignedSpa(source){','function testDocumentSafety(source){','reviseSoaFiguresUsingSignedSpa',['fs','path','ROOT'])({
 readFileSync:()=>model
},{join:(...segments)=>segments.join('/')},'/');

test('SOA layout, all scene primitives, labels and download behavior remain byte-for-byte unchanged',()=>{
 const baseline=refine(original);
 const revised=update(baseline);
 const boundary='async function soaFonts(pdf)';
 assert.ok(baseline.includes(boundary)&&revised.includes(boundary));
 assert.equal(revised.slice(revised.indexOf(boundary)),baseline.slice(baseline.indexOf(boundary)));
 assert.match(revised,/table\(819,\[42,184,190,76,190,163,173,154\]/);
 assert.match(revised,/PURCHASE PRICE/);
 assert.match(revised,/Installment Amount\\n\(AED\)/);
 assert.doesNotMatch(revised,/SIGNED SPA RECONCILIATION|APPROVED SUPPLEMENTARY CREDITS|Net Cash Due/);
});

test('revised amount engine works without altering original SOA styling, page layout or document functions',()=>{
 const revised=update(refine(original));
 assert.match(revised,/SunblissSoaSpaProjection\.project\(schedule,ctx\.priceRevision\.model/);
 assert.match(revised,/spaProjection\?spaProjection\.total:c\.total/);
 assert.match(revised,/ctx\.priceRevision\.signedOn/);
 const scriptParts=revised.split('</script>');
 let parsed=0;
 for(const segment of scriptParts){
   const begin=segment.lastIndexOf('<script');
   if(begin<0)continue;
   const open=segment.indexOf('>',begin);
   if(open<0)continue;
   const code=segment.slice(open+1);
   if(!code.trim())continue;
   assert.doesNotThrow(()=>new Function(code));
   parsed++;
 }
 assert.ok(parsed>=1);
});
