const fs=require('fs');
const path=require('path');

const ROOT=process.cwd();
const OUT=path.join(ROOT,'dist');
const SOURCES=[
  'payment_plan_construction_deadline_v3_patch.js',
  'construction_payment_completion_filter_patch.js'
];
const INDEX=path.join(OUT,'index.html');

function required(file,label){
  if(!fs.existsSync(file))throw new Error(`${label} is missing: ${path.relative(ROOT,file)}`);
}
function version(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||Date.now())
    .replace(/[^a-zA-Z0-9_-]/g,'')
    .slice(0,16);
}

required(INDEX,'Built index');
SOURCES.forEach(function(file){
  const source=path.join(ROOT,file),target=path.join(OUT,file);
  required(source,`Payment filter patch ${file}`);
  fs.copyFileSync(source,target);
});

let html=fs.readFileSync(INDEX,'utf8');
[
  'payment_milestone_filter_export_patch.js',
  'payment_milestone_filter_export_v2_patch.js',
  'payment_plan_construction_deadline_v3_patch.js',
  'construction_payment_completion_filter_patch.js'
].forEach(function(file){
  const escaped=file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  html=html.replace(new RegExp(`<script[^>]+src=["']${escaped}(?:\\?[^"']*)?["'][^>]*><\\/script>\\s*`,'gi'),'');
});
const v=version();
const tags=SOURCES.map(function(file){return `<script defer src="${file}?v=${v}"></script>`;}).join('\n');
if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,`${tags}\n</body>`);
else html+=`\n${tags}\n`;
fs.writeFileSync(INDEX,html);

console.log('Applied Payment Plan Progress filters');
