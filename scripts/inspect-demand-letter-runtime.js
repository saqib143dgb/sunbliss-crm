const fs=require('fs');
const path=require('path');
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
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['node_modules','.git','dist','assets'].includes(ent.name))continue;
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p);
    else if(/\.(?:js|html|mjs|cjs)$/.test(ent.name)){
      let s='';try{s=fs.readFileSync(p,'utf8')}catch(_e){continue}
      for(const term of ['welcome-letter.html','crmDocumentDialog']){
        let from=0,shown=0;
        while((from=s.indexOf(term,from))>=0&&shown<6){
          console.log('SOURCE',p,'TERM',term,'AT',from,':',s.slice(Math.max(0,from-350),Math.min(s.length,from+900)).replace(/\s+/g,' '));
          from+=term.length;shown++;
        }
      }
    }
  }
}
walk('.');
console.log('--- end inspection ---');
