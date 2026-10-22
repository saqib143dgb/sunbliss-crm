// Both projects are built from exactly the same current screens and workflows.
// This last build stage substitutes project identity, never business logic.
const fs=require('fs');const path=require('path');
const out=path.join(process.cwd(),'dist');
function brand(s){return s.replaceAll('Sunbliss Residences','Triana Residences').replaceAll('SUNBLISS RESIDENCES','TRIANA RESIDENCES').replaceAll('Sunbliss CRM','Triana CRM').replaceAll('Plot No. AFRA014, Al Furjan, Jebel Ali First','Plot No. 334-2940, Jumeirah Garden City (Al Satwa)').replaceAll('SPRED','TPRED');}
let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
const shared=new Set(['project_workspace.js','test_mode_bootstrap.js']);
html=html.replace(/((?:src|href)=["'])([^"'?]+\.(?:js|css))([^"']*)(["'])/g,(all,start,file,query,end)=>{
 if(/^(https?:|\/\/)/.test(file)||file.startsWith('vendor/')||shared.has(file))return all;
 const source=path.join(out,file);if(!fs.existsSync(source))throw Error('Missing shared project asset '+file);
 const target='triana-'+file;let content=brand(fs.readFileSync(source,'utf8'));
 if(file==='core.bundle.js'){
  const anchor="var profileResult=await authRetryOperation";
  if(!content.includes(anchor))throw Error('Shared authentication hook changed');
  content=content.replace(anchor,"await window.__crmProject.prepare(sb);\n      "+anchor);
 }
 content=content.replaceAll("'welcome-letter.html'","'triana-welcome-letter.html'").replaceAll("'spa-generator.html'","'triana-spa-generator.html'");
 fs.writeFileSync(path.join(out,target),content);
 return start+target+query+end;
});
html=brand(html).replace(/(<script[^>]+src="test_mode_bootstrap\.js)/,'<script src="project_bootstrap.js?v='+String(process.env.VERCEL_GIT_COMMIT_SHA||Date.now())+'"></script>\n$1');
fs.writeFileSync(path.join(out,'triana.html'),html);
for(const file of ['welcome-letter.html','spa-generator.html']){
 let content=brand(fs.readFileSync(path.join(out,file),'utf8'));
 if(file==='spa-generator.html'){
  // Do not silently substitute Sunbliss's legal agreement when Triana has no
  // approved blank template yet. Preserve the same editor and explicit error.
  content=content.replace('async function loadReferenceTemplateBytes(){',"async function loadReferenceTemplateBytes(){\n  throw Error('Configure the approved Triana SPA template before generating an agreement.');");
 }
 fs.writeFileSync(path.join(out,'triana-'+file),content);
}
console.log('Built Triana from the shared Sunbliss UI and workflow sources.');
