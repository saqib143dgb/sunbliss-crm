/* Runs before the CRM client is constructed. Mode is fixed for this page's life;
   switching always reloads, so cached live and test objects never coexist. */
(function(){
'use strict';
var KEY='sunbliss-test-mode-v1',active=false;
try{active=sessionStorage.getItem(KEY)==='on';}catch(_e){}
var nativeFetch=window.fetch.bind(window);
function testFetch(input,init){
 if(!active)return nativeFetch(input,init);
 var url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);
 if(url.hostname==='aeaakgndnihmuicyierp.supabase.co'){
  if(url.pathname.indexOf('/rest/v1/')===0){
   var request=new Request(input,init),headers=new Headers(request.headers);
   headers.set('Accept-Profile','crm_test');headers.set('Content-Profile','crm_test');
   return nativeFetch(new Request(request,{headers:headers}));
  }
  if(url.pathname.indexOf('/functions/v1/')===0||url.pathname.indexOf('/storage/v1/')===0){
   return Promise.resolve(new Response(JSON.stringify({message:'External services and stored file access are disabled in Test Mode. Use local test document previews.',code:'TEST_MODE_ISOLATION'}),{status:403,headers:{'Content-Type':'application/json'}}));
  }
 }
 return nativeFetch(input,init);
}
window.fetch=testFetch;
var original=window.supabase.createClient;
window.supabase=Object.assign({},window.supabase,{createClient:function(url,key,options){
 var opts=Object.assign({},options||{});
 if(active){opts.db=Object.assign({},opts.db||{},{schema:'crm_test'});opts.global=Object.assign({},opts.global||{},{fetch:testFetch});}
 return original(url,key,opts);
}});
window.__crmTestMode={active:active,key:KEY,switchTo:function(on){
 // Clear only CRM operational caches. Authentication is retained.
 try{sessionStorage.removeItem('sunblissEffectiveActionCacheV8');sessionStorage.removeItem('sunblissEffectiveActionCacheV8:test');sessionStorage.removeItem('sunbliss-crm-visit-session-key');
 if(on)sessionStorage.setItem(KEY,'on');else sessionStorage.removeItem(KEY);
 }catch(e){throw Error('Browser storage is unavailable. Enable website storage to switch mode.');}
 location.reload();
}};
if(active){document.documentElement.dataset.crmMode='test';document.title='TEST MODE — Sunbliss CRM';
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href]');if(a&&/^(mailto:|tel:|https?:\/\/(?:wa\.me|api\.whatsapp\.com))/i.test(a.getAttribute('href')||'')){e.preventDefault();e.stopImmediatePropagation();alert('Contact actions are disabled in Test Mode.');}},true);
}
})();
