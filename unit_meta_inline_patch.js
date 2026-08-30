(function(){
  'use strict';
  if(window.__sunblissUnitMetaInlineInstalled)return;
  window.__sunblissUnitMetaInlineInstalled=true;

  function text(v){return v==null?'':String(v);}
  function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
  function currentCustomer(){
    if(!window.state||!state.selectedUnit)return null;
    var lists=[state.dues,state.cancelled];
    for(var i=0;i<lists.length;i++){
      var list=lists[i];if(!Array.isArray(list))continue;
      var found=list.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit);});if(found)return found;
    }
    return null;
  }
  function furnishingOf(c){if(c&&c.info&&c.info.furnishingType)return text(c.info.furnishingType).trim();var v=text(c&&c.furniture).trim();if(!v)return '';if(v.toLowerCase()==='signed'||v.toLowerCase()==='furnished')return 'Fully Furnished';if(v.toLowerCase()==='unfurnished')return 'Semi Furnished';return v;}
  function ensureStyles(){
    if(document.getElementById('sunblissUnitMetaInlineStyle'))return;
    var style=document.createElement('style');style.id='sunblissUnitMetaInlineStyle';style.textContent=[
      '.detail>.d-unit,.detail>.d-type{display:none!important}',
      '#unitMetaInline{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:7px 0 14px;color:var(--muted);font-size:12.5px;line-height:1.35}',
      '#unitMetaInline .unit-meta-number{font-family:"IBM Plex Mono",monospace;font-weight:700;color:var(--gold-deep)}',
      '#unitMetaInline .unit-meta-type{font-weight:500;color:var(--muted)}','#unitMetaInline .unit-meta-furnishing{font-weight:500;color:var(--muted)}','#unitMetaInline .unit-meta-sep{opacity:.45}',
      '@media(max-width:390px){#unitMetaInline{gap:5px;font-size:11.5px}}'
    ].join('');document.head.appendChild(style);
  }
  function removeFurnishingBadge(c){var furnishing=furnishingOf(c).toLowerCase(),badges=document.querySelector('.detail .badges');if(!badges)return;Array.prototype.slice.call(badges.querySelectorAll('.badge')).forEach(function(badge){var label=text(badge.textContent).trim().toLowerCase();if(label===furnishing||label==='fully furnished'||label==='semi furnished'||label==='furnished'||label==='unfurnished')badge.remove();});if(!badges.querySelector('.badge'))badges.style.display='none';}
  function decorate(){
    if(!window.state||state.view!=='detail')return;ensureStyles();
    var c=currentCustomer(),detail=document.querySelector('.detail'),name=detail&&detail.querySelector('.d-name');if(!c||!detail||!name)return;
    var unit=text(c.unit).trim()||'Unit',type=text(c.type).replace(/\s+/g,' ').trim()||'Unit type not specified',furnishing=furnishingOf(c)||'Furnishing not specified';
    var signature=unit+'|'+type+'|'+furnishing;
    var row=document.getElementById('unitMetaInline');
    if(!row){row=document.createElement('div');row.id='unitMetaInline';row.setAttribute('aria-label','Unit details');name.insertAdjacentElement('afterend',row);}
    if(row.dataset.signature!==signature){row.dataset.signature=signature;row.innerHTML='<span class="unit-meta-number">'+safe(unit)+'</span><span class="unit-meta-sep">—</span><span class="unit-meta-type">'+safe(type)+'</span><span class="unit-meta-sep">—</span><span class="unit-meta-furnishing">'+safe(furnishing)+'</span>';}
    removeFurnishingBadge(c);
  }
  function install(){
    if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,50);return;}
    var base=window.renderDetail;window.renderDetail=function(){var out=base.apply(this,arguments);decorate();return out;};
    if(typeof window.renderMain==='function'){var rm=window.renderMain;window.renderMain=function(){var out=rm.apply(this,arguments);if(window.state&&state.view==='detail')decorate();return out;};}
    window.addEventListener('pageshow',decorate);decorate();
  }
  install();
})();
