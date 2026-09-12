const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const OUT=path.join(ROOT,'dist');
const SOURCE=path.join(ROOT,'payment_plan_construction_deadline_v3_patch.js');
const TARGET=path.join(OUT,'payment_plan_construction_deadline_v3_patch.js');
const INDEX=path.join(OUT,'index.html');

function required(file,label){
  if(!fs.existsSync(file))throw new Error(`${label} is missing: ${path.relative(ROOT,file)}`);
}
function version(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||Date.now())
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,16);
}

required(SOURCE,'Construction payment plan deadline patch');
required(INDEX,'Built index');
fs.copyFileSync(SOURCE,TARGET);

let html=fs.readFileSync(INDEX,'utf8');
[
  'payment_milestone_filter_export_patch.js',
  'payment_milestone_filter_export_v2_patch.js',
  'payment_plan_construction_deadline_v3_patch.js'
].forEach(function(file){
  const escaped=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  html=html.replace(new RegExp(`<script[^>]+src=["']${escaped}(?:\\?[^"']*)?["'][^>]*><\\/script>\\s*`,'gi'),'');
});
const tag=`<script defer src="payment_plan_construction_deadline_v3_patch.js?v=${version()}"></script>`;
if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,`${tag}\n</body>`);
else html+=`\n${tag}\n`;
fs.writeFileSync(INDEX,html);

console.log('Applied corrected 40/60 and 50/50 construction deadline report');
