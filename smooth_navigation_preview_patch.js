(function(){
'use strict';
if(window.__sunblissExecutiveMotionInstalled)return;
window.__sunblissExecutiveMotionInstalled=true;

var root=document.documentElement;
var activeToken=0;
var busyAt=0;
var finishTimer=null;
var bootLabelTimer=null;
var bootStarted=Date.now();

/*
  This preload owns only the genuine CRM boot state. Customer/detail/list/tab
  navigation is in-memory and synchronous, so it must never enter sbx-loading.
  Keeping route changes out of the loader removes the branded spinner flash while
  preserving the secure startup/auth/data-loading experience.
*/
root.classList.add('sbx-booting','sbx-loading');

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
    ':root{--sbx-navy:#061724;--sbx-navy-deep:#03101a;--sbx-gold:#e2ad4d;--sbx-gold-soft:#f4d285}',
    'html.sbx-booting body{background:var(--sbx-navy-deep)!important;overflow:hidden!important}',
    'html.sbx-booting #app{opacity:0!important;visibility:hidden!important}',
    '#sbxLoader{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;box-sizing:border-box;padding:max(24px,env(safe-area-inset-top)) max(22px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(22px,env(safe-area-inset-left));opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,visibility 0s linear .18s}',
    'html.sbx-booting #sbxLoader{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .18s ease}',
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
    '@keyframes sbxSpin{to{transform:rotate(360deg)}}',
    '@keyframes sbxHalo{0%,100%{transform:scale(.98);opacity:.62}50%{transform:scale(1.05);opacity:1}}',
    '@keyframes sbxOrbit{from{transform:translate(-50%,-50%) scale(.98)}to{transform:translate(-50%,-50%) scale(1.035)}}',
    '@keyframes sbxCardArrive{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}',
    '@media(max-width:520px){#sbxBootCard{width:102px}#sbxLogoStage{width:88px;height:88px}#sbxBootLogo{width:69px;height:69px}}',
    '@media(min-width:900px){#sbxBootScene:before{width:min(52vw,700px)}#sbxBootScene:after{width:min(76vw,980px)}#sbxBootCard{width:154px}#sbxLogoStage{width:126px;height:126px}#sbxLogoStage:after{inset:-11px}#sbxBootLogo{width:98px;height:98px}}',
    '@media(prefers-reduced-motion:reduce){#sbxLoader,#sbxBootScene{transition:none!important}#sbxBootCard,#sbxBootScene:before,#sbxBootScene:after,#sbxLogoStage:before,#sbxLogoStage:after{animation:none!important}}'
  ].join('');
  document.head.appendChild(style);
}

function ensureUi(){
  if(!document.body)return false;
  if(document.getElementById('sbxLoader'))return true;
  var layer=document.createElement('div');
  layer.id='sbxLoader';
  layer.setAttribute('role','status');
  layer.setAttribute('aria-live','polite');
  layer.setAttribute('aria-label','Loading CRM');
  layer.innerHTML='<div id="sbxBootScene"></div><div id="sbxBootCard"><div id="sbxLogoStage"><img id="sbxBootLogo" src="assets/purvanchal-p-thin-ring.png" alt="" width="82" height="82" decoding="sync"></div></div>';
  document.body.appendChild(layer);
  return true;
}

function mount(){
  installStyles();
  if(ensureUi())return;
  window.setTimeout(mount,0);
}

function setLabel(label){
  ensureUi();
  var layer=document.getElementById('sbxLoader');
  if(layer)layer.setAttribute('aria-label',label||'Loading CRM');
}

function beginBoot(label){
  activeToken+=1;
  var token=activeToken;
  window.clearTimeout(finishTimer);
  window.clearTimeout(bootLabelTimer);
  busyAt=Date.now();
  root.classList.add('sbx-booting','sbx-loading');
  setLabel(label||'Securing workspace');
  bootLabelTimer=window.setTimeout(function(){
    if(token===activeToken)setLabel('Synchronising portfolio');
  },330);
  return token;
}

function finishBoot(token,minimum){
  if(token!==activeToken)return;
  var wait=Math.max(0,(minimum||620)-(Date.now()-busyAt));
  window.clearTimeout(finishTimer);
  finishTimer=window.setTimeout(function(){
    if(token!==activeToken)return;
    setLabel('Workspace ready');
    window.setTimeout(function(){
      if(token!==activeToken)return;
      root.classList.remove('sbx-loading','sbx-booting');
    },190);
  },wait);
}

function bootReady(){
  var app=document.getElementById('app');
  if(!app||!app.children.length)return false;
  if(window.state&&window.state.userRole&&document.getElementById('main'))return true;
  return !!app.querySelector('form,input,button');
}

function completeBoot(token){
  if(bootReady()){
    var logo=document.getElementById('sbxBootLogo');
    var decoded=logo&&typeof logo.decode==='function'?logo.decode().catch(function(){}):Promise.resolve();
    decoded.then(function(){finishBoot(token,620)});
    return;
  }
  if(Date.now()-bootStarted>3800){finishBoot(token,0);return;}
  window.setTimeout(function(){completeBoot(token);},70);
}

installPreload();
installStyles();
mount();
var bootToken=beginBoot('Securing workspace');
completeBoot(bootToken);
window.setTimeout(function(){
  if(root.classList.contains('sbx-booting')){
    root.classList.remove('sbx-loading','sbx-booting');
  }
},4500);
})();
