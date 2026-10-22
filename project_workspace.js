/* Project catalogue: only verified settings belong here. */
(function () {
  'use strict';
  var projects = [
    {id:'sunbliss',name:'Sunbliss Residences',status:'active'},
    {id:'triana',name:'Triana Residences',status:'setup',inventoryReady:false,paymentPlan:null,bankDetails:null,documentSettings:null}
  ];
  window.CRMProjects = projects;
  function mount() {
    var header = document.querySelector('#app .topbar');
    if (!header || document.getElementById('crm-project-selector')) return;
    var label = document.createElement('label');
    label.id='crm-project-switcher';
    label.style.cssText='display:flex;align-items:center;gap:10px;margin:0;padding:12px 20px;font:inherit;position:relative;z-index:2;background:var(--paper,#f7f8fa);color:var(--ink,#183547);width:100%;box-sizing:border-box';
    label.textContent='Project';
    var select=document.createElement('select');
    select.id='crm-project-selector';select.setAttribute('aria-label','Select project');
    select.style.cssText='font:inherit;color:var(--ink,#183547);background:var(--paper,#fff);border:1px solid var(--paper-line,#dce2e5);border-radius:12px;padding:9px 12px;max-width:75%';
    projects.forEach(function(project){var option=document.createElement('option');option.value=project.id;option.textContent=project.name;select.appendChild(option);});
    select.addEventListener('change',function(){if(select.value==='triana')location.assign('triana.html');});
    label.appendChild(select);header.insertAdjacentElement('afterend',label);
  }
  if(typeof window.render==='function'){
    var render=window.render;
    window.render=function(){var result=render.apply(this,arguments);mount();return result;};
  }
  // Header decorators asynchronously replace its contents. Keep the selector
  // outside that header and restore it if the application root is rebuilt.
  var app=document.getElementById('app');
  if(app && window.MutationObserver){
    new MutationObserver(function(){
      if(!document.getElementById('crm-project-selector'))mount();
    }).observe(app,{childList:true});
  }
  mount();
  document.addEventListener('DOMContentLoaded',mount,{once:true});
})();
