const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist');
const PART_COUNT = 6;
const SOURCE_PATCH = path.join(ROOT, 'approved_mobile_header_patch.js');
const DIST_PATCH = path.join(OUT, 'approved_mobile_header_patch.js');
const DIST_IMAGE = path.join(OUT, 'assets', 'sunbliss-mobile-header-background.webp');
const INDEX = path.join(OUT, 'index.html');

function required(file, label){
  if(!fs.existsSync(file)) throw new Error(`${label} is missing: ${path.relative(ROOT,file)}`);
}

function version(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || Date.now())
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,16);
}

for(let i=1;i<=PART_COUNT;i++) required(path.join(ROOT,'assets',`.approved-header-part-${i}.txt`),`Approved header part ${i}`);
required(SOURCE_PATCH,'Approved header patch');
required(INDEX,'Built index');

const encoded = Array.from({length:PART_COUNT},(_,idx)=>
  fs.readFileSync(path.join(ROOT,'assets',`.approved-header-part-${idx+1}.txt`),'utf8').trim()
).join('');

const image = Buffer.from(encoded,'base64');
if(image.length < 30000 || image.slice(0,4).toString('ascii') !== 'RIFF' || image.slice(8,12).toString('ascii') !== 'WEBP'){
  throw new Error('Approved mobile header asset failed WebP validation');
}

fs.mkdirSync(path.dirname(DIST_IMAGE),{recursive:true});
fs.writeFileSync(DIST_IMAGE,image);
fs.copyFileSync(SOURCE_PATCH,DIST_PATCH);

let html = fs.readFileSync(INDEX,'utf8');
html = html.replace(/<script[^>]+src=["']approved_mobile_header_patch\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi,'');
html = html.replace(/<head([^>]*)>/i,`<head$1>\n<script src="approved_mobile_header_patch.js?v=${version()}"></script>`);
fs.writeFileSync(INDEX,html);

console.log(`Applied approved mobile CRM header (${image.length} bytes) to ${path.relative(ROOT,DIST_IMAGE)}`);
