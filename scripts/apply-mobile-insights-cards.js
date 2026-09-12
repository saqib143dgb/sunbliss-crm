const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const OUT=path.join(ROOT,'dist');
const SOURCE=path.join(ROOT,'mobile_insights_cards_patch.js');
const TARGET=path.join(OUT,'mobile_insights_cards_patch.js');
const DLD_SOURCE=path.join(ROOT,'dld_tracker_heading_patch.js');
const DLD_TARGET=path.join(OUT,'dld_tracker_heading_patch.js');
const INDEX=path.join(OUT,'index.html');

function required(file,label){
  if(!fs.existsSync(file))throw new Error(`${label} is missing: ${path.relative(ROOT,file)}`);
}
function version(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||Date.now())
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,16);
}

required(SOURCE,'Mobile insights card patch');
required(DLD_SOURCE,'DLD tracker heading patch');
required(INDEX,'Built index');
fs.copyFileSync(SOURCE,TARGET);
fs.copyFileSync(DLD_SOURCE,DLD_TARGET);

let html=fs.readFileSync(INDEX,'utf8');
html=html.replace(/<script[^>]+src=["']mobile_insights_cards_patch\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi,'');
html=html.replace(/<script[^>]+src=["']dld_tracker_heading_patch\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi,'');
html=html.replace(/<head([^>]*)>/i,`<head$1>\n<script src="dld_tracker_heading_patch.js?v=${version()}"></script>\n<script src="mobile_insights_cards_patch.js?v=${version()}"></script>`);
fs.writeFileSync(INDEX,html);

console.log('Applied approved mobile insights and DLD tracker styling');
