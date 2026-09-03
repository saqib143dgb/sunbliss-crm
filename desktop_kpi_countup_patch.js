(function(){
'use strict';
if(window.__sunblissDesktopKpiCountupInstalled)return;
window.__sunblissDesktopKpiCountupInstalled=true;

var MQ='(min-width:1024px)';
var DURATION=525;
var STARTUP_SETTLE_MS=650;
var installedAt=Date.now();
var hasAnimatedThisPage=false;
var animationToken=0;
var attemptTimer=null;
var reduceMotion=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);

function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}
function normalise(v){return String(v==null?'':v).replace(/\s+/g,' ').trim().toLowerCase()}

function parseValue(text){
  var finalText=String(text||'').replace(/\u00a0/g,' ').trim();
  var match=finalText.match(/^([^0-9+\-]*)([+\-]?(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?)(\s*[KMBT]?)$/i);
  if(!match)return null;
  var numberText=match[2],dot=numberText.indexOf('.');
  return{
    finalText:finalText,
    prefix:match[1],
    value:Number(numberText.replace(/,/g,'')),
    suffix:match[3],
    decimals:dot<0?0:numberText.length-dot-1,
    grouped:numberText.indexOf(',')>=0
  };
}

function formatValue(parsed,value){
  var factor=Math.pow(10,parsed.decimals);
  var rounded=Math.round(value*factor)/factor;
  var number=rounded.toLocaleString('en-US',{
    useGrouping:parsed.grouped,
    minimumFractionDigits:parsed.decimals,
    maximumFractionDigits:parsed.decimals
  });
  return parsed.prefix+number+parsed.suffix;
}

function parsePercent(text){
  var finalText=String(text||'').trim();
  var match=finalText.match(/^([+\-]?\d+(?:\.\d+)?)%$/);
  if(!match)return null;
  var numberText=match[1],dot=numberText.indexOf('.');
  return{finalText:finalText,value:Number(numberText),decimals:dot<0?0:numberText.length-dot-1};
}

function formatPercent(parsed,value){
  var factor=Math.pow(10,parsed.decimals);
  var rounded=Math.round(value*factor)/factor;
  return rounded.toFixed(parsed.decimals)+'%';
}

function rootNode(){return document.getElementById('sbRefOverviewV2')}

function finalPortfolioReady(root){
  if(!desktop()||!root||!window.state||state.view!=='overview')return false;
  if(window.__sunblissOverviewFinancialReady===false)return false;
  var dues=Array.isArray(state.dues)?state.dues:null;
  if(!dues)return false;
  if(window.__sunblissOverviewFinancialReady!==true){
    for(var i=0;i<dues.length;i++){
      var c=dues[i];
      if(!c||c.customerId===null||c.customerId===undefined||String(c.customerId).trim()==='')return false;
    }
  }
  var units=root.querySelector('.sb-v2-kpi.units .sb-v2-kpi-value');
  var parsed=units?parseValue(units.getAttribute('data-sbx-desktop-kpi-final')||units.textContent):null;
  return !!parsed&&parsed.value===dues.length;
}

function prepareRoot(root){
  if(!root||hasAnimatedThisPage||root.dataset.sbxDesktopKpiPrepared==='1')return;
  var nodes=root.querySelectorAll('.sb-v2-kpi-value');
  if(nodes.length<4)return;
  var valid=true;
  Array.prototype.forEach.call(nodes,function(node){
    var parsed=parseValue(node.textContent);
    if(!parsed){valid=false;return}
    node.setAttribute('data-sbx-desktop-kpi-final',parsed.finalText);
    node.textContent=formatValue(parsed,0);
  });
  if(!valid)return;

  var fill=root.querySelector('.sb-v2-bar i');
  if(fill){
    var targetWidth=parseFloat(fill.style.width||'');
    if(Number.isFinite(targetWidth)){
      fill.setAttribute('data-sbx-desktop-bar-final',String(Math.max(0,Math.min(100,targetWidth))));
      fill.style.width='0%';
    }
  }
  Array.prototype.forEach.call(root.querySelectorAll('.sb-v2-bar-cap b'),function(node){
    var parsed=parsePercent(node.textContent);
    if(!parsed)return;
    node.setAttribute('data-sbx-desktop-percent-final',parsed.finalText);
    node.textContent=formatPercent(parsed,0);
  });

  root.dataset.sbxDesktopKpiPrepared='1';
  document.documentElement.classList.remove('sbx-desktop-kpi-awaiting-prepare');
}

function restoreFinal(root){
  if(!root)return;
  Array.prototype.forEach.call(root.querySelectorAll('.sb-v2-kpi-value[data-sbx-desktop-kpi-final]'),function(node){
    node.textContent=node.getAttribute('data-sbx-desktop-kpi-final')||node.textContent;
    node.removeAttribute('data-sbx-desktop-kpi-counting');
  });
  var fill=root.querySelector('.sb-v2-bar i[data-sbx-desktop-bar-final]');
  if(fill){fill.style.width=fill.getAttribute('data-sbx-desktop-bar-final')+'%';fill.removeAttribute('data-sbx-desktop-kpi-counting')}
  Array.prototype.forEach.call(root.querySelectorAll('.sb-v2-bar-cap b[data-sbx-desktop-percent-final]'),function(node){
    node.textContent=node.getAttribute('data-sbx-desktop-percent-final')||node.textContent;
    node.removeAttribute('data-sbx-desktop-kpi-counting');
  });
}

function animate(root){
  if(hasAnimatedThisPage||!root||!root.isConnected)return;
  if(reduceMotion){restoreFinal(root);hasAnimatedThisPage=true;document.documentElement.classList.remove('sbx-desktop-kpi-awaiting-prepare');return}

  var items=[];
  Array.prototype.forEach.call(root.querySelectorAll('.sb-v2-kpi-value[data-sbx-desktop-kpi-final]'),function(node){
    var parsed=parseValue(node.getAttribute('data-sbx-desktop-kpi-final'));
    if(parsed)items.push({node:node,parsed:parsed});
  });
  if(items.length<4)return;

  var fill=root.querySelector('.sb-v2-bar i[data-sbx-desktop-bar-final]');
  var targetWidth=fill?Number(fill.getAttribute('data-sbx-desktop-bar-final')):NaN;
  var percents=[];
  Array.prototype.forEach.call(root.querySelectorAll('.sb-v2-bar-cap b[data-sbx-desktop-percent-final]'),function(node){
    var parsed=parsePercent(node.getAttribute('data-sbx-desktop-percent-final'));
    if(parsed)percents.push({node:node,parsed:parsed});
  });

  var token=++animationToken;
  var started=null;
  items.forEach(function(item){item.node.setAttribute('data-sbx-desktop-kpi-counting','')});
  if(fill)fill.setAttribute('data-sbx-desktop-kpi-counting','');
  percents.forEach(function(item){item.node.setAttribute('data-sbx-desktop-kpi-counting','')});

  function frame(timestamp){
    if(token!==animationToken||!root.isConnected)return;
    if(started===null)started=timestamp;
    var progress=Math.min(1,(timestamp-started)/DURATION);
    var eased=1-Math.pow(1-progress,4);
    items.forEach(function(item){
      item.node.textContent=progress===1?item.parsed.finalText:formatValue(item.parsed,item.parsed.value*eased);
    });
    if(fill&&Number.isFinite(targetWidth))fill.style.width=(targetWidth*eased)+'%';
    percents.forEach(function(item){
      item.node.textContent=progress===1?item.parsed.finalText:formatPercent(item.parsed,item.parsed.value*eased);
    });
    if(progress<1){
      window.requestAnimationFrame(frame);
    }else{
      restoreFinal(root);
      hasAnimatedThisPage=true;
      document.documentElement.classList.remove('sbx-desktop-kpi-awaiting-prepare');
    }
  }
  window.requestAnimationFrame(frame);
}

function scheduleAttempt(delay){
  window.clearTimeout(attemptTimer);
  var remaining=Math.max(0,STARTUP_SETTLE_MS-(Date.now()-installedAt));
  attemptTimer=window.setTimeout(function(){
    var root=rootNode();
    if(!desktop()||hasAnimatedThisPage||!root)return;
    prepareRoot(root);
    if(!finalPortfolioReady(root)){
      scheduleAttempt(40);
      return;
    }
    animate(root);
  },Math.max(delay==null?80:delay,remaining));
}

function scan(){
  if(!desktop()||hasAnimatedThisPage)return;
  var root=rootNode();
  if(!root)return;
  animationToken++;
  prepareRoot(root);
  scheduleAttempt(80);
}

var style=document.createElement('style');
style.id='sunblissDesktopKpiCountupStyle';
style.textContent='@media(min-width:1024px){html.sbx-desktop-kpi-awaiting-prepare #sbRefOverviewV2 .sb-v2-kpi-value{visibility:hidden!important}#sbRefOverviewV2[data-sbx-desktop-kpi-prepared="1"] .sb-v2-kpi-value{visibility:visible!important}[data-sbx-desktop-kpi-counting]{font-variant-numeric:tabular-nums}}';
document.head.appendChild(style);
if(desktop())document.documentElement.classList.add('sbx-desktop-kpi-awaiting-prepare');

if(window.MutationObserver){
  new MutationObserver(function(mutations){
    if(hasAnimatedThisPage||!desktop())return;
    for(var i=0;i<mutations.length;i++){
      for(var j=0;j<mutations[i].addedNodes.length;j++){
        var node=mutations[i].addedNodes[j];
        if(!node||node.nodeType!==1)continue;
        if(node.id==='sbRefOverviewV2'||(node.querySelector&&node.querySelector('#sbRefOverviewV2'))){scan();return}
      }
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
}

document.addEventListener('sunbliss:overview-financial-ready',function(){scheduleAttempt(40)});
window.addEventListener('pageshow',function(){scheduleAttempt(80)});
window.addEventListener('resize',function(){if(desktop())scheduleAttempt(100)} ,{passive:true});
setTimeout(scan,0);
setTimeout(scan,160);
setTimeout(scan,680);
})();
