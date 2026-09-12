const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const OUT=path.join(ROOT,'dist');
const SOURCE=path.join(ROOT,'payment_milestone_filter_export_v2_patch.js');
const TARGET=path.join(OUT,'payment_milestone_filter_export_v2_patch.js');
const INDEX=path.join(OUT,'index.html');

function required(file,label){
  if(!fs.existsSync(file))throw new Error(`${label} is missing: ${path.relative(ROOT,file)}`);
}
function version(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||Date.now())
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,16);
}

required(SOURCE,'Payment milestone filter patch');
required(INDEX,'Built index');
fs.copyFileSync(SOURCE,TARGET);

let html=fs.readFileSync(INDEX,'utf8');
html=html.replace(/<script[^>]+src=["']payment_milestone_filter_export_patch\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi,'');
html=html.replace(/<script[^>]+src=["']payment_milestone_filter_export_v2_patch\.js(?:\?[^"']*)?["'][^>]*><\/script>\s*/gi,'');
const tag=`<script defer src="payment_milestone_filter_export_v2_patch.js?v=${version()}"></script>`;
if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,`${tag}\n</body>`);
else html+=`\n${tag}\n`;
fs.writeFileSync(INDEX,html);

console.log('Applied refined payment milestone filter and export patch');
