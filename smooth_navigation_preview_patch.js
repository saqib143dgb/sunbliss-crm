(function(){
'use strict';
if(window.__sunblissExecutiveMotionInstalled)return;
window.__sunblissExecutiveMotionInstalled=true;

var root=document.documentElement;
var activeToken=0;
var busyAt=0;
var finishTimer=null;
var progressTimer=null;
var installTimer=null;
var bootLabelTimer=null;
var lastSignature='';
var bootStarted=Date.now();

root.classList.add('sbx-booting','sbx-loading','sbx-motion');

function installPreload(){
  if(document.querySelector('link[data-sbx-logo-preload]'))return;
  var preload=document.createElement('link');
  preload.rel='preload';
  preload.as='image';
  preload.href='assets/purvanchal-p-thin-ring.png';
  preload.setAttribute('data-sbx-logo-preload','');
  document.head.appendChild(preload);
}

function installStyles(){
  if(document.getElementById('sunblissExecutiveMotionStyles'))return;
  var style=document.createElement('style');
  style.id='sunblissExecutiveMotionStyles';
  style.textContent=[
    ':root{--sbx-navy:#061724;--sbx-navy-deep:#03101a;--sbx-gold:#e2ad4d;--sbx-gold-soft:#f4d285;--sbx-cream:#fffaf0}',
    'html.sbx-booting body{background:var(--sbx-navy-deep)!important;overflow:hidden!important}',
    'html.sbx-booting #app{opacity:0!important;visibility:hidden!important}',
    'html.sbx-motion #app #main{transition:opacity .24s cubic-bezier(.22,1,.36,1),transform .34s cubic-bezier(.22,1,.36,1),filter .24s ease!important;will-change:opacity,transform}',
    'html.sbx-loading:not(.sbx-booting) #app #main{opacity:.30!important;transform:translateY(7px) scale(.997)!important;filter:saturate(.82)!important;pointer-events:none!important}',
    '#sbxLoader{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;box-sizing:border-box;padding:max(24px,env(safe-area-inset-top)) max(22px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(22px,env(safe-area-inset-left));opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}',
    'html.sbx-loading #sbxLoader{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .18s ease}',
    '#sbxBootScene{position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 50% 40%,#173348 0,#0a2131 29%,#061724 58%,#03101a 100%);opacity:0;transition:opacity .28s ease}',
    'html.sbx-booting #sbxBootScene{opacity:1}',
    '#sbxBootScene:before,#sbxBootScene:after{content:"";position:absolute;left:50%;top:50%;border:1px solid rgba(226,173,77,.14);border-radius:50%;transform:translate(-50%,-50%);animation:sbxOrbit 5s ease-in-out infinite alternate!important}',
    '#sbxBootScene:before{width:min(76vw,620px);aspect-ratio:1}',
    '#sbxBootScene:after{width:min(112vw,900px);aspect-ratio:1;border-color:rgba(226,173,77,.07);animation-delay:-2.5s!important}',
    '#sbxBootCard{position:relative;z-index:2;grid-area:1/1;display:none;width:120px;box-sizing:border-box;text-align:center;color:white}',
    'html.sbx-booting #sbxBootCard{display:block;animation:sbxCardArrive .64s cubic-bezier(.22,1,.36,1) both!important}',
    '#sbxLogoStage{position:relative;width:104px;height:104px;margin:0 auto;display:grid;place-items:center}',
    '#sbxLogoStage:before{content:"";position:absolute;inset:0;border-radius:50%;border:1px solid rgba(226,173,77,.28);box-shadow:0 0 42px rgba(226,173,77,.12);animation:sbxHalo 2.2s ease-in-out infinite!important}',
    '#sbxLogoStage:after{content:"";position:absolute;inset:-8px;border-radius:50%;border-top:1px solid var(--sbx-gold-soft);border-right:1px solid transparent;animation:sbxSpin 2.4s linear infinite!important}',
    '#sbxBootLogo{display:block;width:82px;height:82px;object-fit:contain;filter:drop-shadow(0 8px 22px rgba(0,0,0,.34))}',
    '#sbxRoutePill{position:relative;z-index:3;grid-area:1/1;display:grid;place-items:center;width:62px;height:62px;box-sizing:border-box;padding:8px;border:1px solid rgba(226,173,77,.52);border-radius:50%;background:linear-gradient(135deg,rgba(4,19,30,.96),rgba(10,34,49,.94));box-shadow:0 20px 50px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.07);color:white;opacity:0;transform:translateY(10px) scale(.94);transition:opacity .18s ease,transform .28s cubic-bezier(.22,1,.36,1);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}',
    'html.sbx-loading:not(.sbx-booting) #sbxRoutePill{opacity:1;transform:none}',
    '#sbxRouteMark{position:relative;display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:rgba(226,173,77,.09);box-shadow:inset 0 0 0 1px rgba(226,173,77,.20)}',
    '#sbxRouteMark img{display:block;width:31px;height:31px;object-fit:contain}',
    '#sbxRouteMark:after{content:"";position:absolute;inset:-3px;border-radius:50%;border-top:1px solid var(--sbx-gold);border-right:1px solid transparent;animation:sbxSpin 1.05s linear infinite!important}',
    '#sbxTopProgress{position:fixed;z-index:2147483001;left:0;right:0;top:0;height:3px;overflow:hidden;opacity:0;background:rgba(226,173,77,.10);transition:opacity .14s ease}',
    'html.sbx-loading:not(.sbx-booting) #sbxTopProgress{opacity:1}',
    '#sbxTopProgressFill{display:block;width:100%;height:100%;transform:scaleX(.04);transform-origin:left center;background:linear-gradient(90deg,#8e5c13,var(--sbx-gold),#ffe3a2);box-shadow:0 0 14px rgba(226,173,77,.82);transition:transform .34s cubic-bezier(.22,1,.36,1)!important}',
    '@keyframes sbxSpin{to{transform:rotate(360deg)}}',
    '@keyframes sbxHalo{0%,100%{transform:scale(.98);opacity:.62}50%{transform:scale(1.05);opacity:1}}',
    '@keyframes sbxOrbit{from{transform:translate(-50%,-50%) scale(.98)}to{transform:translate(-50%,-50%) scale(1.035)}}',
    '@keyframes sbxCardArrive{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}',
    '@media(max-width:520px){#sbxBootCard{width:102px}#sbxLogoStage{width:88px;height:88px}#sbxBootLogo{width:69px;height:69px}#sbxRoutePill{width:58px;height:58px;padding:8px}#sbxRouteMark{width:39px;height:39px}#sbxRouteMark img{width:29px;height:29px}}',
    '@media(min-width:900px){#sbxBootScene:before{width:min(52vw,700px)}#sbxBootScene:after{width:min(76vw,980px)}#sbxBootCard{width:154px}#sbxLogoStage{width:126px;height:126px}#sbxLogoStage:after{inset:-11px}#sbxBootLogo{width:98px;height:98px}#sbxRoutePill{width:68px;height:68px;padding:9px}#sbxRouteMark{width:46px;height:46px}#sbxRouteMark img{width:34px;height:34px}html.sbx-loading:not(.sbx-booting) #app #main{transform:translateY(5px) scale(.995)!important}}',
    '@media(prefers-reduced-motion:reduce){html.sbx-motion #app #main,#sbxLoader,#sbxBootScene,#sbxRoutePill,#sbxBootProgressFill,#sbxTopProgressFill{transition:none!important}#sbxBootCard,#sbxBootScene:before,#sbxBootScene:after,#sbxLogoStage:before,#sbxLogoStage:after,#sbxRouteMark:after{animation:none!important}}'
  ].join('');
  document.head.appendChild(style);
}

function ensureUi(){
  if(!document.body)return false;
  if(!document.getElementById('sbxLoader')){
    var layer=document.createElement('div');
    layer.id='sbxLoader';
    layer.setAttribute('role','status');
    layer.setAttribute('aria-live','polite');
    layer.setAttribute('aria-label','Loading CRM');
    layer.innerHTML='<div id="sbxBootScene"></div><div id="sbxBootCard"><div id="sbxLogoStage"><img id="sbxBootLogo" src="assets/purvanchal-p-thin-ring.png" alt="" width="82" height="82" decoding="sync"></div></div><div id="sbxRoutePill"><span id="sbxRouteMark"><img src="assets/purvanchal-p-thin-ring.png" alt="" width="31" height="31" decoding="async"></span></div>';
    document.body.appendChild(layer);
  }
  if(!document.getElementById('sbxTopProgress')){
    var progress=document.createElement('div');
    progress.id='sbxTopProgress';
    progress.setAttribute('aria-hidden','true');
    progress.innerHTML='<span id="sbxTopProgressFill"></span>';
    document.body.appendChild(progress);
  }
  return true;
}

function mount(){
  installStyles();
  if(ensureUi())return;
  window.setTimeout(mount,0);
}

function setLabel(label,isBoot){
  ensureUi();
  var layer=document.getElementById('sbxLoader');
  if(layer)layer.setAttribute('aria-label',label||'Loading CRM');
}

function setProgress(value,isBoot){
  ensureUi();
  var node=document.getElementById(isBoot?'sbxBootProgressFill':'sbxTopProgressFill');
  if(node)node.style.transform='scaleX('+Math.max(.04,Math.min(1,value))+')';
}

function signature(){
  var s=window.state||{};
  return [s.view||'',s.selectedUnit||'',s.insightsMode||'',s.listMode||''].join('|');
}

function viewLabel(){
  var s=window.state||{};
  var view=String(s.view||'').toLowerCase();
  if(view==='detail')return'Opening customer profile';
  if(view==='overview')return'Opening executive overview';
  if(view==='insights')return'Preparing portfolio insights';
  if(view==='list'||view==='units')return'Opening unit portfolio';
  return'Opening workspace';
}

function begin(label,isBoot){
  activeToken+=1;
  var token=activeToken;
  window.clearTimeout(finishTimer);
  window.clearTimeout(progressTimer);
  window.clearTimeout(bootLabelTimer);
  busyAt=Date.now();
  if(isBoot)root.classList.add('sbx-booting');
  root.classList.add('sbx-motion','sbx-loading');
  setLabel(label||viewLabel(),isBoot);
  setProgress(.06,isBoot);
  progressTimer=window.setTimeout(function(){if(token===activeToken)setProgress(.72,isBoot)},90);
  if(isBoot){
    bootLabelTimer=window.setTimeout(function(){
      if(token===activeToken)setLabel('Synchronising portfolio',true);
    },330);
  }
  return token;
}

function finish(token,minimum,isBoot){
  if(token!==activeToken)return;
  var wait=Math.max(0,(minimum||230)-(Date.now()-busyAt));
  window.clearTimeout(finishTimer);
  finishTimer=window.setTimeout(function(){
    if(token!==activeToken)return;
    setProgress(1,isBoot);
    if(isBoot)setLabel('Workspace ready',true);
    window.setTimeout(function(){
      if(token!==activeToken)return;
      root.classList.remove('sbx-loading','sbx-booting');
      window.setTimeout(function(){
        if(token!==activeToken)return;
        root.classList.remove('sbx-motion');
        setProgress(.04,isBoot);
      },260);
    },isBoot?190:80);
  },wait);
}

function settle(token,minimum,isBoot){
  window.requestAnimationFrame(function(){
    window.requestAnimationFrame(function(){
      window.setTimeout(function(){finish(token,minimum,isBoot)},isBoot?100:72);
    });
  });
}

function finalOverviewReady(){
  var s=window.state;
  if(!s||!s.userRole||s.view!=='overview')return true;
  if(!Array.isArray(s.dues))return false;
  for(var i=0;i<s.dues.length;i++){
    var customer=s.dues[i];
    if(!customer||customer.customerId===null||customer.customerId===undefined||String(customer.customerId).trim()==='')return false;
  }
  var hero=document.querySelector('.overview > .stat-hero');
  if(!hero)return false;
  var cells=hero.querySelectorAll('.stat-cell:not(.wide)');
  for(var j=0;j<cells.length;j++){
    var label=cells[j].querySelector('.stat-label');
    var value=cells[j].querySelector('.stat-value');
    if(label&&value&&String(label.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()==='units sold'){
      var displayed=Number(String(value.textContent||'').replace(/[^0-9.\-]/g,''));
      return isFinite(displayed)&&displayed===s.dues.length;
    }
  }
  return false;
}

function bootReady(){
  var app=document.getElementById('app');
  if(!app||!app.children.length)return false;
  if(window.state&&window.state.userRole&&document.getElementById('main'))return finalOverviewReady();
  return !!app.querySelector('form,input,button');
}

function completeBoot(token){
  if(bootReady()){
    var logo=document.getElementById('sbxBootLogo');
    var decoded=logo&&typeof logo.decode==='function'?logo.decode().catch(function(){}):Promise.resolve();
    decoded.then(function(){settle(token,880,true)});
    return;
  }
  if(Date.now()-bootStarted>3800){finish(token,0,true);return}
  window.setTimeout(function(){completeBoot(token)},70);
}

function wrap(name,always){
  var original=window[name];
  if(typeof original!=='function'||original.__sunblissExecutiveMotionWrapped)return false;
  function wrapped(){
    var before=signature();
    var should=always||before!==lastSignature;
    var token=should?begin(viewLabel(),false):0;
    var output;
    try{output=original.apply(this,arguments)}
    catch(error){if(token)finish(token,0,false);throw error}
    lastSignature=signature();
    if(token){
      if(output&&typeof output.then==='function')output.then(function(){settle(token,245,false)},function(){finish(token,0,false)});
      else settle(token,245,false);
    }
    return output;
  }
  wrapped.__sunblissExecutiveMotionWrapped=true;
  wrapped.__sunblissOriginal=original;
  window[name]=wrapped;
  return true;
}

function install(){
  lastSignature=signature();
  wrap('goToDetail',true);
  wrap('renderMain',false);
  wrap('render',false);
  if(typeof window.renderMain!=='function'){
    window.clearTimeout(installTimer);
    installTimer=window.setTimeout(install,80);
  }
}

function rawLabel(element){
  return String((element.getAttribute&&element.getAttribute('aria-label'))||element.textContent||'').replace(/\s+/g,' ').trim();
}

function actionLabel(element){
  var raw=rawLabel(element);
  var lower=raw.toLowerCase();
  if(lower.indexOf('overview')===0)return'Opening executive overview';
  if(lower.indexOf('insights')===0)return'Preparing portfolio insights';
  if(lower.indexOf('unit')===0||lower.indexOf('customer')===0)return'Opening unit portfolio';
  if(lower.indexOf('back')===0)return'Returning to previous view';
  if(lower.indexOf('payment statement')>=0)return'Preparing payment statement';
  if(lower.indexOf('record payment')>=0)return'Opening payment workspace';
  if(lower.indexOf('schedule action')>=0)return'Opening action scheduler';
  if(lower.indexOf('view notes')>=0)return'Opening customer notes';
  if(lower.indexOf('add customer')>=0)return'Opening customer setup';
  if(lower.indexOf('edit')===0)return'Opening editor';
  return raw?'Opening '+(raw.length>30?raw.slice(0,30)+'…':raw):'Opening workspace';
}

function shouldAnimate(element){
  if(!element||element.disabled)return false;
  if(element.closest&&element.closest('form')&&/^(input|select|textarea)$/i.test(element.tagName))return false;
  if(element.matches&&element.matches('#btnSignOut,.dock-search,[type="submit"]'))return false;
  if(element.matches&&element.matches('.tabs .tab[data-view],[data-open-unit],[data-ext-unit],#persistentBackButton,#btnAddCustomer,.dock-add,.scheduled-edit,.scheduled-mark-done'))return true;
  if(element.closest&&element.closest('#customerActionMenu,[data-task-id]'))return true;
  return /^(back|overview|insights|units|customers|schedule action|view notes|edit |record payment|add customer|payment statement|update status|mark done)/i.test(rawLabel(element));
}

document.addEventListener('click',function(event){
  var element=event.target&&event.target.closest?event.target.closest('button,a,[role="button"]'):null;
  if(!shouldAnimate(element)||root.classList.contains('sbx-loading'))return;
  var token=begin(actionLabel(element),false);
  settle(token,225,false);
},true);

window.addEventListener('pageshow',function(event){
  if(event.persisted){
    var token=begin('Restoring secure workspace',false);
    settle(token,245,false);
  }
});

installPreload();
installStyles();
mount();
var bootToken=begin('Securing workspace',true);
completeBoot(bootToken);
install();
})();
