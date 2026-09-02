(function(){
'use strict';
if(window.__sunblissSmoothNavigationPreviewInstalled)return;
window.__sunblissSmoothNavigationPreviewInstalled=true;

var root=document.documentElement;
var activeToken=0,busyAt=0,finishTimer=null,progressTimer=null,installTimer=null,lastSignature='',bootStarted=Date.now();
root.classList.add('sb-page-booting','sb-route-loading','sb-route-animating');

function ensureStyle(){
  if(document.getElementById('sunblissSmoothNavigationPreviewStyles'))return;
  var style=document.createElement('style');
  style.id='sunblissSmoothNavigationPreviewStyles';
  style.textContent=[
    'html.sb-page-booting body{background:#061521!important}',
    'html.sb-page-booting #app{opacity:0!important;visibility:hidden!important}',
    'html.sb-route-animating #app #main{transition:opacity .22s ease,transform .22s ease!important;will-change:opacity,transform}',
    'html.sb-route-loading:not(.sb-page-booting) #app #main{opacity:.42!important;transform:translateY(2px)!important;pointer-events:none!important}',
    '#sbWebLoadingLayer{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;box-sizing:border-box;background:rgba(6,21,33,.18);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease,visibility 0s linear .16s}',
    'html.sb-route-loading #sbWebLoadingLayer{opacity:1;visibility:visible;pointer-events:auto;transition:opacity .16s ease}',
    'html.sb-page-booting #sbWebLoadingLayer{background:radial-gradient(circle at 50% 42%,rgba(30,55,70,.96),#061521 62%);-webkit-backdrop-filter:none;backdrop-filter:none}',
    '#sbWebLoadingPanel{display:flex;align-items:center;gap:12px;min-width:178px;max-width:min(82vw,320px);padding:12px 16px 12px 12px;border:1px solid rgba(218,169,76,.5);border-radius:18px;background:rgba(5,20,31,.94);box-shadow:0 18px 48px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.04);color:#f7f1e5;transform:translateY(5px) scale(.985);transition:transform .18s ease,opacity .18s ease}',
    'html.sb-route-loading #sbWebLoadingPanel{transform:none}',
    '#sbWebLoadingLogo{display:block;width:38px;height:38px;flex:0 0 38px;object-fit:contain}',
    '#sbWebLoadingCopy{min-width:0;display:flex;flex-direction:column;gap:2px}',
    '#sbWebLoadingBrand{font:700 11px/1.2 Inter,system-ui,sans-serif;letter-spacing:.16em;color:#e3ad4d;white-space:nowrap}',
    '#sbWebLoadingLabel{font:500 12px/1.25 Inter,system-ui,sans-serif;color:rgba(255,255,255,.82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#sbWebLoadingSpinner{width:16px;height:16px;flex:0 0 16px;margin-left:auto;border:2px solid rgba(225,173,77,.24);border-top-color:#e1ad4d;border-radius:50%;animation:sbWebLoaderSpin .72s linear infinite!important}',
    '#sbWebProgress{position:fixed;z-index:2147483001;left:0;right:0;top:0;height:3px;overflow:hidden;opacity:0;transition:opacity .14s ease;background:rgba(225,173,77,.12)}',
    'html.sb-route-loading #sbWebProgress{opacity:1}',
    '#sbWebProgressBar{display:block;width:100%;height:100%;transform:scaleX(.04);transform-origin:left center;background:linear-gradient(90deg,#9b6719,#e5b453,#f6d990);box-shadow:0 0 12px rgba(225,173,77,.8);transition:transform .32s cubic-bezier(.2,.8,.2,1)!important}',
    '@keyframes sbWebLoaderSpin{to{transform:rotate(360deg)}}',
    '@media(max-width:520px){#sbWebLoadingPanel{min-width:168px;padding:11px 14px 11px 11px;border-radius:16px}#sbWebLoadingLogo{width:34px;height:34px;flex-basis:34px}#sbWebLoadingBrand{font-size:10px}#sbWebLoadingLabel{font-size:11.5px}}',
    '@media(prefers-reduced-motion:reduce){html.sb-route-animating #app #main,#sbWebLoadingLayer,#sbWebLoadingPanel,#sbWebProgress,#sbWebProgressBar{transition:none!important}#sbWebLoadingSpinner{animation:none!important;border-color:#e1ad4d!important}}'
  ].join('');
  document.head.appendChild(style);
}

function ensureUi(){
  if(!document.body)return false;
  if(!document.getElementById('sbWebLoadingLayer')){
    var layer=document.createElement('div');
    layer.id='sbWebLoadingLayer';
    layer.setAttribute('role','status');
    layer.setAttribute('aria-live','polite');
    layer.setAttribute('aria-label','Loading');
    layer.innerHTML='<div id="sbWebLoadingPanel"><img id="sbWebLoadingLogo" src="assets/purvanchal-p-thin-ring.png" alt="" width="38" height="38" loading="eager" decoding="sync"><span id="sbWebLoadingCopy"><strong id="sbWebLoadingBrand">PURVANCHAL</strong><span id="sbWebLoadingLabel">Preparing CRM</span></span><span id="sbWebLoadingSpinner" aria-hidden="true"></span></div>';
    document.body.appendChild(layer);
  }
  if(!document.getElementById('sbWebProgress')){
    var progress=document.createElement('div');
    progress.id='sbWebProgress';
    progress.setAttribute('aria-hidden','true');
    progress.innerHTML='<span id="sbWebProgressBar"></span>';
    document.body.appendChild(progress);
  }
  return true;
}

function mount(){
  ensureStyle();
  if(ensureUi())return;
  window.setTimeout(mount,0);
}

function setLabel(label){
  ensureUi();
  var node=document.getElementById('sbWebLoadingLabel');
  if(node)node.textContent=label||'Loading';
}

function setProgress(value){
  ensureUi();
  var bar=document.getElementById('sbWebProgressBar');
  if(bar)bar.style.transform='scaleX('+Math.max(.04,Math.min(1,value))+')';
}

function signature(){
  var s=window.state||{};
  return [s.view||'',s.selectedUnit||'',s.insightsMode||'',s.listMode||''].join('|');
}

function viewLabel(){
  var s=window.state||{},view=String(s.view||'').toLowerCase();
  if(view==='detail')return'Opening customer';
  if(view==='overview')return'Loading overview';
  if(view==='insights')return'Loading insights';
  if(view==='list'||view==='units')return'Loading units';
  return'Opening page';
}

function begin(label,isBoot){
  activeToken+=1;
  var token=activeToken;
  window.clearTimeout(finishTimer);
  window.clearTimeout(progressTimer);
  busyAt=Date.now();
  if(isBoot)root.classList.add('sb-page-booting');
  root.classList.add('sb-route-animating','sb-route-loading');
  setLabel(label||viewLabel());
  setProgress(.07);
  progressTimer=window.setTimeout(function(){if(token===activeToken)setProgress(.68)},70);
  return token;
}

function finish(token,minimum){
  if(token!==activeToken)return;
  var wait=Math.max(0,(minimum||260)-(Date.now()-busyAt));
  window.clearTimeout(finishTimer);
  finishTimer=window.setTimeout(function(){
    if(token!==activeToken)return;
    setProgress(1);
    window.setTimeout(function(){
      if(token!==activeToken)return;
      root.classList.remove('sb-route-loading','sb-page-booting');
      window.setTimeout(function(){
        if(token!==activeToken)return;
        root.classList.remove('sb-route-animating');
        setProgress(.04);
      },230);
    },85);
  },wait);
}

function settle(token,minimum){
  window.requestAnimationFrame(function(){
    window.requestAnimationFrame(function(){
      window.setTimeout(function(){finish(token,minimum)},110);
    });
  });
}

function bootReady(){
  var app=document.getElementById('app');
  if(!app||!app.children.length)return false;
  if(window.state&&state.userRole&&document.getElementById('main'))return true;
  return !!app.querySelector('form,input,button');
}

function completeBoot(token){
  if(bootReady()){settle(token,620);return}
  if(Date.now()-bootStarted>3200){finish(token,0);return}
  window.setTimeout(function(){completeBoot(token)},80);
}

function wrap(name,always){
  var original=window[name];
  if(typeof original!=='function'||original.__sunblissSmoothPreviewWrapped)return false;
  function wrapped(){
    var before=signature(),should=always||before!==lastSignature,token=should?begin(viewLabel(),false):0,out;
    try{out=original.apply(this,arguments)}
    catch(error){if(token)finish(token,0);throw error}
    lastSignature=signature();
    if(token){
      if(out&&typeof out.then==='function')out.then(function(){settle(token,300)},function(){finish(token,0)});
      else settle(token,300);
    }
    return out;
  }
  wrapped.__sunblissSmoothPreviewWrapped=true;
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

function actionableLabel(element){
  var raw=String((element.getAttribute&&element.getAttribute('aria-label'))||element.textContent||'').replace(/\s+/g,' ').trim();
  if(!raw)return'Opening';
  return raw.length>34?raw.slice(0,34)+'…':raw;
}

function shouldPreview(element){
  if(!element||element.disabled)return false;
  if(element.closest&&element.closest('form')&&/^(input|select|textarea)$/i.test(element.tagName))return false;
  if(element.matches&&element.matches('#btnSignOut,.dock-search,[type="submit"]'))return false;
  if(element.matches&&element.matches('.tabs .tab[data-view],[data-open-unit],[data-ext-unit],#persistentBackButton,#btnAddCustomer,.dock-add,.scheduled-edit,.scheduled-mark-done'))return true;
  if(element.closest&&element.closest('#customerActionMenu,[data-task-id]'))return true;
  var label=actionableLabel(element).toLowerCase();
  if(/^(back|overview|insights|units|customers|schedule action|view notes|edit |record payment|add customer|payment statement|update status|mark done)/.test(label))return true;
  return false;
}

document.addEventListener('click',function(event){
  var element=event.target&&event.target.closest?event.target.closest('button,a,[role="button"]'):null;
  if(!shouldPreview(element)||root.classList.contains('sb-route-loading'))return;
  var token=begin('Opening '+actionableLabel(element),false);
  settle(token,280);
},true);

window.addEventListener('pageshow',function(event){
  if(event.persisted){
    var token=begin('Restoring CRM',false);
    settle(token,300);
  }
});

ensureStyle();
mount();
var bootToken=begin('Preparing CRM',true);
completeBoot(bootToken);
install();
})();
