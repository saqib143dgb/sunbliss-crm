const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'dist');
const SOURCE_PATCH = path.join(ROOT, 'approved_mobile_header_patch.js');
const DIST_PATCH = path.join(OUT, 'approved_mobile_header_patch.js');
const DIST_IMAGE = path.join(OUT, 'assets', 'sunbliss-mobile-header-background.webp');
const INDEX = path.join(OUT, 'index.html');
const EXPECTED_BASE64_LENGTH = 45812;
const EXPECTED_BYTES = 34358;
const EXPECTED_SHA256 = 'deefbd2a2185325116ab657615ed862a70ffef1c7de5b1104f787e669cb47eb9';

function required(file, label){
  if(!fs.existsSync(file)) throw new Error(`${label} is missing: ${path.relative(ROOT,file)}`);
}

function version(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || Date.now())
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,16);
}

const chunkFiles = [
  ...Array.from({length:7},(_,idx)=>path.join(ROOT,'assets',`.approved-header-head-${idx+1}.txt`)),
  ...[4,5,6].map(i=>path.join(ROOT,'assets',`.approved-header-part-${i}.txt`))
];
chunkFiles.forEach((file,idx)=>required(file,`Approved header chunk ${idx+1}`));
required(SOURCE_PATCH,'Approved header patch');
required(INDEX,'Built index');

const encoded = chunkFiles.map(file=>fs.readFileSync(file,'utf8').trim()).join('');
if(encoded.length !== EXPECTED_BASE64_LENGTH){
  throw new Error(`Approved header base64 length mismatch: ${encoded.length} !== ${EXPECTED_BASE64_LENGTH}`);
}

const image = Buffer.from(encoded,'base64');
const declaredBytes = image.readUInt32LE(4) + 8;
const sha256 = crypto.createHash('sha256').update(image).digest('hex');
if(
  image.length !== EXPECTED_BYTES ||
  declaredBytes !== EXPECTED_BYTES ||
  image.slice(0,4).toString('ascii') !== 'RIFF' ||
  image.slice(8,12).toString('ascii') !== 'WEBP' ||
  sha256 !== EXPECTED_SHA256
){
  throw new Error(`Approved mobile header validation failed: bytes=${image.length}, declared=${declaredBytes}, sha256=${sha256}`);
}

fs.mkdirSync(path.dirname(DIST_IMAGE),{recursive:true});
fs.writeFileSync(DIST_IMAGE,image);
fs.copyFileSync(SOURCE_PATCH,DIST_PATCH);

let html = fs.readFileSync(INDEX,'utf8');
html = html.replace(/<script[^>]+src=["']approved_mobile_header_patch\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi,'');
html = html.replace(/<head([^>]*)>/i,`<head$1>\n<script src="approved_mobile_header_patch.js?v=${version()}"></script>`);
fs.writeFileSync(INDEX,html);

console.log(`Applied exact approved mobile CRM header (${image.length} bytes, sha256 ${sha256}) to ${path.relative(ROOT,DIST_IMAGE)}`);
