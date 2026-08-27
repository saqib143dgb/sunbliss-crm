(function(){
  'use strict';
  if(window.__sunblissUnitMetaInlineInstalled)return;
  window.__sunblissUnitMetaInlineInstalled=true;

  function text(v){return v==null?'':String(v);}
  function safe(v){
    if(typeof window.esc==='function')return window.esc(text(v));
    return text(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
  }
  function currentCustomer(){
    if(!window.state||!state.selectedUnit)return null;
    var lists=[state.dues,state.cancelled];
    for(var i=0;i<lists.length;i++){
      var list=lists[i];
      if(!Array.isArray(list))continue;
      var found=list.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit);});
      if(found)return found;
    }
    return null;
  }
  function furnishingOf(c){
    if(c&&c.info&&c.info.furnishingType)return text(c.info.furnishingType).trim();
    var v=text(c&&c.furniture).trim();
    if(!v)return '';
    if(v.toLowerCase()==='signed'||v.toLowerCase()==='furnished')return 'Fully Furnished';
    if(v.toLowerCase()==='unfurnished')return 'Semi Furnished';
    return v;
  }
  function ensureStyles(){
    if(document.getElementById('sunblissUnitMetaInlineStyle'))return;
    var style=document.createElement('style');
    style.id='sunblissUnitMetaInlineStyle';
    style.textContent=[
      '.detail>.d-unit,.detail>.d-type{display:none!important}',
      '#unitMetaInline{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:7px 0 14px;color:var(--muted);font-size:12.5px;line-height:1.35}',
      '#unitMetaInline .unit-meta-number{font-family:"IBM Plex Mono",monospace;font-weight:700;color:var(--gold-deep)}',
      '#unitMetaInline .unit-meta-type{font-weight:500;color:var(--muted)}',
      '#unitMetaInline .unit-meta-furnishing{font-weight:500;color:var(--muted)}',
      '#unitMetaInline .unit-meta-sep{opacity:.45}',
      '@media(max-width:390px){#unitMetaInline{gap:5px;font-size:11.5px}}'
    ].join('');
    document.head.appendChild(style);
  }
  function removeFurnishingBadge(c){
    var furnishing=furnishingOf(c).toLowerCase();
    var badges=document.querySelector('.detail .badges');
    if(!badges)return;
    Array.prototype.slice.call(badges.querySelectorAll('.badge')).forEach(function(badge){
      var label=text(badge.textContent).trim().toLowerCase();
      if(label===furnishing||label==='fully furnished'||label==='semi furnished'||label==='furnished'||label==='unfurnished')badge.remove();
    });
    if(!badges.querySelector('.badge'))badges.style.display='none';
  }
  function decorate(){
    if(!window.state||state.view!=='detail')return;
    ensureStyles();
    var c=currentCustomer();
    var detail=document.querySelector('.detail');
    var name=detail&&detail.querySelector('.d-name');
    if(!c||!detail||!name)return;

    var old=document.getElementById('unitMetaInline');
    if(old)old.remove();

    var unit=text(c.unit).trim()||'Unit';
    var type=text(c.type).replace(/\s+/g,' ').trim()||'Unit type not specified';
    var furnishing=furnishingOf(c)||'Furnishing not specified';

    var row=document.createElement('div');
    row.id='unitMetaInline';
    row.setAttribute('aria-label','Unit details');
    row.innerHTML='<span class="unit-meta-number">'+safe(unit)+'</span><span class="unit-meta-sep">—</span><span class="unit-meta-type">'+safe(type)+'</span><span class="unit-meta-sep">—</span><span class="unit-meta-furnishing">'+safe(furnishing)+'</span>';
    name.insertAdjacentElement('afterend',row);
    removeFurnishingBadge(c);
  }

  function install(){
    if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,50);return;}
    var base=window.renderDetail;
    window.renderDetail=function(){var out=base.apply(this,arguments);decorate();return out;};
    var app=document.getElementById('app');
    if(app&&window.MutationObserver){
      var queued=false;
      new MutationObserver(function(){
        if(queued||!window.state||state.view!=='detail')return;
        queued=true;
        requestAnimationFrame(function(){queued=false;decorate();});
      }).observe(app,{childList:true,subtree:true});
    }
    decorate();
  }
  install();
})();
