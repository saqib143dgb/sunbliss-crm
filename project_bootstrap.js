/* Triana uses the shared application with an isolated data namespace. */
(function(){
'use strict';
var liveSchema='crm_triana',testSchema='crm_triana_test';
// Authentication remains shared; only operational caches are project-specific.
['getItem','setItem','removeItem'].forEach(function(method){
 var original=Storage.prototype[method];
 Storage.prototype[method]=function(key){var args=Array.prototype.slice.call(arguments);args[0]=String(key).replace(/^sunbliss/i,'triana');return original.apply(this,args);};
});
var active=false;
try{active=sessionStorage.getItem('sunbliss-test-mode-v1')==='on';}catch(_e){}
var schema=active?testSchema:liveSchema;
var nativeFetch=window.fetch.bind(window);
function projectFetch(input,init){
 var url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);
 if(url.hostname==='aeaakgndnihmuicyierp.supabase.co'){
  if(url.pathname.indexOf('/rest/v1/')===0){
   var request=new Request(input,init),headers=new Headers(request.headers);
   var target=url.pathname.endsWith('/rpc/prepare_test_workspace')?testSchema:schema;
   headers.set('Accept-Profile',target);headers.set('Content-Profile',target);
   return nativeFetch(new Request(request,{headers:headers}));
  }
  // Existing Edge Functions and storage paths have not been provisioned for
  // Triana. Do not route them to Sunbliss while templates await configuration.
  if(url.pathname.indexOf('/functions/v1/')===0||url.pathname.indexOf('/storage/v1/')===0){
   return Promise.resolve(new Response(JSON.stringify({message:'Triana stored templates are awaiting configuration. Local receipts and statements remain available.',code:'PROJECT_RESOURCE_NOT_CONFIGURED'}),{status:403,headers:{'Content-Type':'application/json'}}));
  }
 }
 return nativeFetch(input,init);
}
window.fetch=projectFetch;
var original=window.supabase.createClient;
window.supabase=Object.assign({},window.supabase,{createClient:function(url,key,options){
 var opts=Object.assign({},options||{});
 opts.db=Object.assign({},opts.db||{},{schema:schema});
 opts.global=Object.assign({},opts.global||{},{fetch:window.fetch});
 return original(url,key,opts);
}});
window.__crmProject={id:'triana',name:'Triana Residences',settings:{developer:'Purvanchal Real Estate Developers LLC',developerRegistration:'1496',plot:'334-2940',location:'Jumeirah Garden City (Al Satwa), Dubai, UAE',masterDeveloper:'MERAAS ESTATES (L.L.C)',ownership:'Freehold',office:'105, Opal Tower, Business Bay, Dubai',poBox:'64567',crmEmail:'crm@purvanchaluae.ae',landline:'+971 4 397 7033'},schema:schema,prepare:async function(sb){
 if(active)return;
 var result=await sb.rpc('prepare_project_workspace');
 if(result.error)throw result.error;
}};
})();
