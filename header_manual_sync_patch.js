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
    '@keyframes sbManualSyncPulse{from{opacity:.45}to{opacity:1}}'
  ].join('');
  document.head.appendChild(style);

  function makeInteractive(){
    document.querySelectorAll('.sb-pro-sync').forEach(function(el){
      if(!el.hasAttribute('role'))el.setAttribute('role','button');
      if(!el.hasAttribute('tabindex'))el.setAttribute('tabindex','0');
      el.setAttribute('aria-label','Sync CRM data now');
      el.setAttribute('title','Tap to sync latest CRM data');
    });
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
      makeInteractive();
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
    function wrapped(){var result=original.apply(this,arguments);makeInteractive();return result;}
    wrapped.__sunblissHeaderSyncWrapped=true;
    wrapped.__sunblissOriginal=original;
    window[name]=wrapped;
  }
  ['render','renderMain','renderOverview','renderList','renderInsights','renderDetail'].forEach(wrap);
  window.addEventListener('pageshow',makeInteractive);
  makeInteractive();
})();
