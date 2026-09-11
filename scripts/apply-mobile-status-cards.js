const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const OUT=path.join(ROOT,'dist');
const SOURCE=path.join(ROOT,'mobile_status_cards_patch.js');
const TARGET=path.join(OUT,'mobile_status_cards_patch.js');
const INDEX=path.join(OUT,'index.html');

function required(file,label){
  if(!fs.existsSync(file))throw new Error(`${label} is missing: ${path.relative(ROOT,file)}`);
}
function version(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||Date.now())
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,16);
}

required(SOURCE,'Mobile status card patch');
required(INDEX,'Built index');
fs.copyFileSync(SOURCE,TARGET);

let html=fs.readFileSync(INDEX,'utf8');
html=html.replace(/<script[^>]+src=["']mobile_status_cards_patch\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi,'');
html=html.replace(/<head([^>]*)>/i,`<head$1>\n<script src="mobile_status_cards_patch.js?v=${version()}"></script>`);
fs.writeFileSync(INDEX,html);

console.log('Applied approved mobile SPA/OQOOD/furnishing card design');
