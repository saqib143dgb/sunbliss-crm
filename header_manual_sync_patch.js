(function(){
  'use strict';
  if(window.__sunblissHeaderManualSyncInstalled)return;
  window.__sunblissHeaderManualSyncInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissHeaderManualSyncStyles';
  style.textContent=[
    '.sb-pro-sync{cursor:pointer!important;touch-action:manipulation!important;user-select:none!important;-webkit-user-select:none!important;transition:background .16s ease,border-color .16s ease,transform .12s ease,opacity .16s ease!important;}',
    '.sb-pro-sync:hover{background:rgba(198,151,46,.07)!important;border-color:rgba(214,162,70,.4)!important;}',
    '.sb-pro-sync:active{transform:scale(.97)!important;}',
    '.sb-pro-sync:focus-visible{outline:2px solid #d5a04a!important;outline-offset:3px!important;}',
    '.sb-pro-sync.is-syncing{opacity:.72!important;pointer-events:none!important;}',
    '.sb-pro-sync.is-syncing svg{animation:sbManualSyncPulse .8s ease-in-out infinite alternate;}',
    '@keyframes sbManualSyncPulse{from{opacity:.45}to{opacity:1}}',
    '@media(min-width:1024px){html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-project-row{display:none!important;width:0!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important}html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-copy{grid-template-columns:minmax(250px,1fr)!important;grid-template-areas:"welcome" "name"!important;column-gap:0!important;width:min(520px,52%)!important;min-width:0!important}}',
    '@media(min-width:1280px){html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main::after{content:""!important;display:block!important;position:absolute!important;z-index:1!important;left:52.5%!important;top:50%!important;width:190px!important;height:66px!important;transform:translate(-50%,-50%)!important;pointer-events:none!important;opacity:.62!important;background:linear-gradient(90deg,transparent 0%,rgba(226,176,82,.28) 18%,rgba(226,176,82,.48) 50%,rgba(226,176,82,.28) 82%,transparent 100%) 50% 78%/100% 1px no-repeat,linear-gradient(rgba(226,176,82,.22),rgba(226,176,82,.22)) 12% 78%/1px 17px no-repeat,linear-gradient(rgba(226,176,82,.28),rgba(226,176,82,.28)) 27% 78%/1px 29px no-repeat,linear-gradient(rgba(226,176,82,.34),rgba(226,176,82,.34)) 42% 78%/1px 42px no-repeat,linear-gradient(rgba(226,176,82,.24),rgba(226,176,82,.24)) 57% 78%/1px 24px no-repeat,linear-gradient(rgba(226,176,82,.30),rgba(226,176,82,.30)) 72% 78%/1px 35px no-repeat,linear-gradient(rgba(226,176,82,.20),rgba(226,176,82,.20)) 87% 78%/1px 20px no-repeat,radial-gradient(circle at 50% 78%,rgba(226,176,82,.70) 0 2px,transparent 2.5px)!important;filter:drop-shadow(0 0 8px rgba(198,151,46,.08))!important}}'
  ].join('');
  document.head.appendChild(style);

  function desktop(){
    return window.matchMedia?window.matchMedia('(min-width:1024px)').matches:window.innerWidth>=1024;
  }

  function directChild(parent,className){
    if(!parent)return null;
    for(var i=0;i<parent.children.length;i++){
      var child=parent.children[i];
      if(child.classList&&child.classList.contains(className))return child;
    }
    return null;
  }

  function syncTime(){
    var value=window.state&&state.syncedAt;
    if(!value)return 'Just now';
    var d=new Date(value);
    if(isNaN(d.getTime()))return 'Just now';
    return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
  }

  function syncMarkup(){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M8.5 12.2l2.3 2.3 4.8-5"/></svg><span>Synced '+syncTime()+'</span>';
  }

  function makeInteractive(root){
    (root||document).querySelectorAll('.sb-pro-sync').forEach(function(el){
      if(!el.hasAttribute('role'))el.setAttribute('role','button');
      if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0');
      el.setAttribute('aria-label','Sync CRM data now');
      el.setAttribute('title','Tap to sync latest CRM data');
    });
  }

  /*
    Header persistence guard.

    The CRM can replace the entire .topbar node after asynchronous data/auth
    refreshes. Older fixes observed only the old header node, so once that node
    was replaced the Sunbliss building layer and desktop sync pill disappeared
    until a hard refresh. This guard watches the stable #app root but reacts
    only to mutations that actually touch the header. It never re-renders the
    dashboard, so there is no observer feedback loop.
  */
  var repairQueued=false;
  var appObserver=null;

  function ensureHeaderDecorations(){
    var header=document.querySelector('.topbar.sunbliss-professional-header');
    if(!header)return;
    var projectRow=header.querySelector('.sb-pro-project-row');
    var directSync=directChild(header,'sb-pro-sync');
    var nestedSync=projectRow?directChild(projectRow,'sb-pro-sync'):null;
    var visual=directChild(header,'sb-desktop-project-visual');

    if(desktop()){
      if(!visual){
        visual=document.createElement('div');
        visual.className='sb-desktop-project-visual';
        visual.setAttribute('aria-hidden','true');
        header.insertBefore(visual,header.firstChild);
      }

      /* Prefer the renderer-created sync node. Moving it, rather than cloning,
         keeps the manual-sync interaction and accessibility state intact. */
      if(nestedSync){
        if(directSync&&directSync!==nestedSync)directSync.remove();
        header.appendChild(nestedSync);
        directSync=nestedSync;
      }else if(!directSync){
        directSync=document.createElement('div');
        directSync.className='sb-pro-sync';
        directSync.innerHTML=syncMarkup();
        header.appendChild(directSync);
      }

      if(directSync){
        var label=directSync.querySelector('span');
        var expected='Synced '+syncTime();
        if(label&&label.textContent!==expected)label.textContent=expected;
      }
    }else{
      if(visual)visual.remove();
      if(directSync&&projectRow&&!nestedSync){
        projectRow.appendChild(directSync);
        nestedSync=directSync;
      }
    }

    makeInteractive(header);
  }

  function queueRepair(){
    if(repairQueued)return;
    repairQueued=true;
    requestAnimationFrame(function(){
      repairQueued=false;
      ensureHeaderDecorations();
    });
  }

  function nodeTouchesHeader(node){
    if(!node||node.nodeType!==1)return false;
    if(node.matches&&node.matches('.topbar.sunbliss-professional-header'))return true;
    if(node.closest&&node.closest('.topbar.sunbliss-professional-header'))return true;
    return !!(node.querySelector&&node.querySelector('.topbar.sunbliss-professional-header'));
  }

  function installHeaderObserver(){
    if(appObserver||!window.MutationObserver)return;
    var app=document.getElementById('app');
    if(!app)return;
    appObserver=new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var r=records[i];
        if(nodeTouchesHeader(r.target)){queueRepair();return;}
        for(var a=0;a<r.addedNodes.length;a++)if(nodeTouchesHeader(r.addedNodes[a])){queueRepair();return;}
        for(var d=0;d<r.removedNodes.length;d++)if(nodeTouchesHeader(r.removedNodes[d])){queueRepair();return;}
      }
    });
    appObserver.observe(app,{childList:true,subtree:true});
  }

  async function runSync(el){
    if(!el||el.classList.contains('is-syncing'))return;
    var label=el.querySelector('span');
    var oldText=label?label.textContent:'Synced';
    el.classList.add('is-syncing');
    el.setAttribute('aria-busy','true');
    if(label)label.textContent='Syncing…';
    try{
      if(typeof window.loadFromSupabase!=='function')throw new Error('CRM sync is unavailable.');
      await window.loadFromSupabase();
      if(window.state)window.state.syncedAt=new Date().toISOString();
      if(typeof window.render==='function')window.render();
      else if(label)label.textContent='Synced just now';
      queueRepair();
    }catch(err){
      el.classList.remove('is-syncing');el.removeAttribute('aria-busy');if(label)label.textContent='Sync failed';
      setTimeout(function(){if(label&&document.body.contains(label))label.textContent=oldText;},1400);return;
    }
    el.classList.remove('is-syncing');el.removeAttribute('aria-busy');
  }

  document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('.sb-pro-sync'):null;if(!el)return;e.preventDefault();runSync(el);});
  document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var el=e.target&&e.target.closest?e.target.closest('.sb-pro-sync'):null;if(!el)return;e.preventDefault();runSync(el);});

  function wrap(name){
    var original=window[name];
    if(typeof original!=='function'||original.__sunblissHeaderSyncWrapped)return;
    function wrapped(){
      var result;
      try{result=original.apply(this,arguments)}finally{queueRepair();}
      if(result&&typeof result.then==='function')result.then(queueRepair,queueRepair);
      return result;
    }
    wrapped.__sunblissHeaderSyncWrapped=true;
    wrapped.__sunblissOriginal=original;
    window[name]=wrapped;
  }

  function install(){
    installHeaderObserver();
    wrap('render');wrap('renderMain');wrap('renderOverview');wrap('renderDetail');
    queueRepair();
  }

  install();
  document.addEventListener('DOMContentLoaded',install,{once:true});
  window.addEventListener('pageshow',queueRepair);
  window.addEventListener('resize',queueRepair,{passive:true});
  /* Re-wrap only during startup because several deferred CRM patches replace
     render functions while the UI bundle is initializing. */
  setTimeout(install,120);
  setTimeout(install,500);
  setTimeout(install,1200);
})();
