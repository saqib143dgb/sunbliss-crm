(function(){
  'use strict';
  if(window.__sunblissInstallmentReferenceCardInstalled)return;
  window.__sunblissInstallmentReferenceCardInstalled=true;

  function ensureStyle(){
    if(document.getElementById('installmentReferenceCardStyle'))return;
    var style=document.createElement('style');
    style.id='installmentReferenceCardStyle';
    style.textContent=[
      '.ledger-scroll .stage-card{position:relative!important;overflow:visible!important;background:var(--paper)!important;border:1px solid rgba(198,151,46,.34)!important;border-radius:18px!important;padding:78px 14px 16px!important;min-height:230px!important;box-sizing:border-box!important;}',
      '@media(max-width:1023px){.ledger-scroll .stage-card{flex:0 0 190px!important;}}',
      '.ledger-scroll .stage-card .installment-menu-btn{top:8px!important;left:50%!important;right:auto!important;transform:translateX(-50%)!important;margin:0!important;z-index:12!important;background:transparent!important;}',
      '.ledger-scroll .stage-card .stage-name{margin:0 0 16px!important;padding:0!important;text-align:center!important;white-space:nowrap!important;width:100%!important;}',
      '.ledger-scroll .stage-card .stamp.is-paid,.ledger-scroll .stage-card .stamp.is-upcoming,.ledger-scroll .stage-card .stamp.is-overdue,.ledger-scroll .stage-card .stamp.is-partial,.ledger-scroll .stage-card .stamp.is-pending{position:absolute!important;left:50%!important;top:36px!important;bottom:auto!important;display:block!important;margin:0!important;padding:4px 11px!important;border:1.5px solid currentColor!important;border-radius:7px!important;background:transparent!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.34)!important;outline:1.5px solid currentColor!important;outline-offset:3px!important;opacity:.92!important;transform:translateX(-50%) rotate(0deg)!important;z-index:4!important;pointer-events:none!important;}',
      '.ledger-scroll .stage-card .stamp.is-paid::before,.ledger-scroll .stage-card .stamp.is-upcoming::before,.ledger-scroll .stage-card .stamp.is-overdue::before,.ledger-scroll .stage-card .stamp.is-partial::before,.ledger-scroll .stage-card .stamp.is-pending::before{content:"";position:absolute;inset:-3px;border:1px solid currentColor;border-radius:9px;opacity:.34;transform:translate(.5px,-.5px);pointer-events:none;}',
      '.ledger-scroll .stage-card .stamp.is-paid::after,.ledger-scroll .stage-card .stamp.is-upcoming::after,.ledger-scroll .stage-card .stamp.is-overdue::after,.ledger-scroll .stage-card .stamp.is-partial::after,.ledger-scroll .stage-card .stamp.is-pending::after{content:"";position:absolute;inset:-1px;border-radius:7px;background-image:radial-gradient(circle,currentColor .45px,transparent .65px);background-size:4px 4px;opacity:.08;pointer-events:none;}',
      '.ledger-scroll .stage-card .stage-row{align-items:baseline!important;margin-bottom:9px!important;gap:8px!important;}',
      '.ledger-scroll .stage-card .stage-row span:first-child{min-width:44px;}',
      '.ledger-scroll .stage-card .stage-row span:last-child{margin-left:auto;}',
      '.ledger-scroll .stage-card .stage-late{margin-top:11px!important;}'
    ].join('');
    document.head.appendChild(style);
  }

  function normalizeTitle(card){
    var title=card.querySelector('.stage-name');
    if(!title)return;
    var tag=title.querySelector('.stage-percent-tag');
    if(tag){
      var value=String(tag.textContent||'').replace(/^\s*[•·-]?\s*/,'').trim();
      if(value)tag.textContent=' - '+value;
      return;
    }
    var raw=String(title.textContent||'');
    var replaced=raw.replace(/\s*[•·]\s*(\d+(?:\.\d+)?%)\s*$/,' - $1');
    if(replaced!==raw)title.textContent=replaced;
  }

  function normalizeRows(card){
    var labels=card.querySelectorAll('.stage-row span:first-child');
    labels.forEach(function(label){
      var raw=String(label.textContent||'').replace(/:\s*$/,'').trim().toLowerCase();
      if(raw==='due')label.textContent='Due:';
      else if(raw==='by')label.textContent='By:';
      else if(raw==='paid'||raw==='cash')label.textContent='Cash:';
      else if(raw==='on')label.textContent='On:';
    });
  }

  function apply(){
    ensureStyle();
    document.querySelectorAll('.ledger-scroll .stage-card').forEach(function(card){
      normalizeTitle(card);
      normalizeRows(card);
    });
  }

  var scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;apply();});
  }

  apply();
  var observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});
  window.addEventListener('pageshow',schedule);
})();
