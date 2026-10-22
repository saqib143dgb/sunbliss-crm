const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('project_bootstrap.js','utf8');
function setup(testMode){
 const calls=[];class Storage{constructor(){this.data={}}getItem(k){return this.data[k]||null}setItem(k,v){this.data[k]=v}removeItem(k){delete this.data[k]}}
 const sessionStorage=new Storage();if(testMode)sessionStorage.setItem('triana-test-mode-v1','on');
 let options;const window={fetch:async(i,o)=>{calls.push(new Request(i,o));return new Response('[]')},supabase:{createClient:(u,k,o)=>{options=o;return {}}}};
 vm.runInNewContext(source,{window,Storage,sessionStorage,URL,Request,Response,Headers,location:{href:'https://crm.example/triana.html'}});
 return {window,calls,sessionStorage,get options(){return options}};
}
for(const mode of [false,true])test('Triana '+(mode?'test':'live')+' isolates raw reads, writes and explicit schema requests',async()=>{
 const c=setup(mode),schema=mode?'crm_triana_test':'crm_triana';
 for(const method of ['GET','POST','PATCH','DELETE']){
  await c.window.fetch('https://aeaakgndnihmuicyierp.supabase.co/rest/v1/units',{method,headers:{'Accept-Profile':'public','Content-Profile':'public'}});
  const r=c.calls.at(-1);assert.equal(r.headers.get('Accept-Profile'),schema);assert.equal(r.headers.get('Content-Profile'),schema);
 }
 await c.window.fetch('https://aeaakgndnihmuicyierp.supabase.co/rest/v1/rpc/prepare_test_workspace',{method:'POST'});
 assert.equal(c.calls.at(-1).headers.get('Content-Profile'),'crm_triana_test');
 c.window.supabase.createClient('url','publishable',{db:{schema:'public'}});assert.equal(c.options.db.schema,schema);
 assert.equal((await c.window.fetch('https://aeaakgndnihmuicyierp.supabase.co/functions/v1/legacy')).status,403);
 c.sessionStorage.setItem('sunblissEffectiveActionCacheV8','triana-only');assert.equal(c.sessionStorage.data.sunblissEffectiveActionCacheV8,undefined);assert.equal(c.sessionStorage.data.trianaEffectiveActionCacheV8,'triana-only');
 c.sessionStorage.setItem('sb-project-auth-token','shared-auth');assert.equal(c.sessionStorage.data['sb-project-auth-token'],'shared-auth');
});
test('shared build preserves screen structure and includes isolated boot before client construction',()=>{
 const root=fs.readFileSync('dist/index.html','utf8'),triana=fs.readFileSync('dist/triana.html','utf8');
 assert(triana.includes('triana-core.bundle.js'));assert(triana.includes('triana-ui.bundle.js'));assert(triana.includes('project_workspace.js'));
 assert(triana.indexOf('project_bootstrap.js')<triana.indexOf('triana-core.bundle.js'));assert(!triana.includes('Setup in progress'));
 const normalize=s=>s.replace(/<script[^>]+src="project_bootstrap[^>]+><\/script>\s*/,'').replaceAll('triana-','').replaceAll('Triana CRM','Sunbliss CRM').replaceAll('Triana Residences','Sunbliss Residences').replaceAll('TRIANA RESIDENCES','SUNBLISS RESIDENCES');
 assert.equal(normalize(triana),root);
 const docs=fs.readFileSync('dist/triana-welcome-letter.html','utf8');assert(docs.includes('TPRED:'));assert(!docs.includes('Sunbliss Residences'));assert(!docs.includes('AFRA014'));
});
