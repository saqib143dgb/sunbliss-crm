const fs=require('fs');
const src=fs.readFileSync('welcome-letter.html','utf8');
console.log('--- Demand Letter runtime inspection ---');
for(const term of ['drawHeader','drawFooter','makeDocumentPdf','letterhead','supplied-letterhead','PDFDocument.load','embedPage','embedPdf','accountDetails']){
  const i=src.indexOf(term);
  console.log(term+': '+i);
  if(i>=0) console.log(src.slice(Math.max(0,i-500),Math.min(src.length,i+1600)).replace(/\s+/g,' '));
}
const am=src.match(/const\s+ASSETS\s*=\s*(\{[\s\S]*?\});/);
if(am){
  try{
    const obj=Function('return ('+am[1]+')')();
    console.log('ASSETS keys:',Object.keys(obj));
    for(const [k,v] of Object.entries(obj)) console.log('ASSET',k,typeof v==='string'?v.slice(0,80):typeof v);
  }catch(e){console.log('ASSETS parse error',e.message)}
}else console.log('ASSETS object not matched');
console.log('--- end inspection ---');
