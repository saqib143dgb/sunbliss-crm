(function(){
'use strict';
if(window.__sunblissBinaryComplianceStatusInstalled)return;
window.__sunblissBinaryComplianceStatusInstalled=true;

function text(v){return v==null?'':String(v)}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase()}
function spa(v){return norm(v)==='signed'?'Signed':'Pending'}
function oqood(v){return norm(v)==='completed'?'Completed':'Pending'}

function normalizeCustomer(c){
  if(!c)return c;
  c.spa=spa(c.spa);
  c.oqood=oqood(c.oqood);
  return c;
}
function normalizeState(){
  if(!window.state)return;
  [state.dues,state.cancelled].forEach(function(list){
    if(Array.isArray(list))list.forEach(normalizeCustomer);
  });
  var f=state.filters||{};
  if(f.spa==='drafted'||f.spa==='notstarted')f.spa='pending';
  if(f.oqood==='notstarted')f.oqood='pending';
}

function installStyles(){
  if(document.getElementById('binaryComplianceStatusStyles'))return;
  var s=document.createElement('style');
  s.id='binaryComplianceStatusStyles';
  s.textContent=[
    '.pipeline.binary-status{grid-template-columns:repeat(2,minmax(0,1fr))!important}',
    '.sb-ref-status-body.two{grid-template-columns:auto repeat(2,minmax(0,1fr))!important}',
    '.sb-v2-status-body.two{grid-template-columns:auto repeat(2,minmax(0,1fr))!important}'
  ].join('');
  document.head.appendChild(s);
}

function cleanupOverview(){
  installStyles();
  document.querySelectorAll('.section-label').forEach(function(label){
    var title=norm(label.textContent);
    if(title!=='spa status'&&title!=='oqood status')return;
    var pipe=label.nextElementSibling;
    if(!pipe||!pipe.classList||!pipe.classList.contains('pipeline'))return;
    pipe.classList.add('binary-status');
    Array.prototype.slice.call(pipe.children).forEach(function(item){
      var t=norm(item.textContent);
      if(title==='spa status'){
        if(t.indexOf('drafted')>=0){
          var nodes=item.querySelectorAll('span');
          if(nodes.length)nodes[nodes.length-1].textContent='Pending';
          item.id='btnSpaPending';
        }else if(t.indexOf('not started')>=0)item.remove();
      }else if(t.indexOf('not started')>=0)item.remove();
    });
  });

  document.querySelectorAll('.sb-ref-status,.sb-v2-status').forEach(function(card){
    var title=norm((card.querySelector('.sb-ref-title,.sb-v2-title')||{}).textContent);
    if(title!=='spa status'&&title!=='oqood status')return;
    var body=card.querySelector('.sb-ref-status-body,.sb-v2-status-body');
    if(body)body.classList.add('two');
    card.querySelectorAll('[data-proxy]').forEach(function(cell){
      var t=norm(cell.textContent),proxy=cell.getAttribute('data-proxy')||'';
      if(title==='spa status'){
        if(t.indexOf('drafted')>=0||proxy==='btnSpaDrafted'){
          var spans=cell.querySelectorAll('span');
          if(spans.length)spans[spans.length-1].textContent='Pending';
          cell.setAttribute('data-proxy','btnSpaPending');
        }
        if(t.indexOf('not started')>=0||proxy==='btnSpaNotStarted')cell.remove();
      }else{
        if(t.indexOf('not started')>=0||proxy==='btnOqoodNotStarted')cell.remove();
      }
    });
  });
}


function cleanupFilters(){
  normalizeState();
  if(!window.state)return;
  document.querySelectorAll('.filter-panel .filter-group').forEach(function(group){
    var label=group.querySelector('.filter-group-label');
    var kind=label?norm(label.textContent):'';
    if(kind!=='spa'&&kind!=='oqood')return;
    var chips=group.querySelector('.chips');
    if(!chips)return;

    var keepA=kind==='spa'?'signed':'completed';
    var keepB='pending';
    var pendingChip=null;

    Array.prototype.slice.call(chips.querySelectorAll('.chip[data-group]')).forEach(function(chip){
      var value=norm(chip.getAttribute('data-value'));
      if(value===keepA){
        chip.textContent=kind==='spa'?'Signed':'Completed';
        chip.setAttribute('aria-pressed',state.filters&&state.filters[kind]===keepA?'true':'false');
        return;
      }
      if(value===keepB){
        if(pendingChip){chip.remove();return;}
        pendingChip=chip;
        chip.textContent='Pending';
        chip.setAttribute('aria-pressed',state.filters&&state.filters[kind]==='pending'?'true':'false');
        return;
      }
      if(kind==='spa'&&(value==='drafted'||value==='notstarted')){
        if(!pendingChip){
          pendingChip=chip;
          chip.setAttribute('data-value','pending');
          chip.textContent='Pending';
          chip.setAttribute('aria-pressed',state.filters&&state.filters.spa==='pending'?'true':'false');
        }else chip.remove();
        return;
      }
      if(kind==='oqood'&&value==='notstarted'){chip.remove();return;}
      chip.remove();
    });
  });
}

function cleanupUi(){
  cleanupOverview();
  cleanupFilters();
}

function wrap(name,after){
  var base=window[name];
  if(typeof base!=='function'||base.__binaryComplianceStatus)return;
  var wrapped=function(){
    normalizeState();
    var out=base.apply(this,arguments);
    if(out&&typeof out.then==='function'){
      return out.then(function(value){normalizeState();if(after)setTimeout(cleanupUi,0);return value});
    }
    normalizeState();
    if(after)setTimeout(cleanupUi,0);
    return out;
  };
  wrapped.__binaryComplianceStatus=true;
  window[name]=wrapped;
}

function wrapPortfolioStats(){
  var base=window.portfolioStats;
  if(typeof base!=='function'||base.__binaryComplianceStatus)return;
  var wrapped=function(){
    normalizeState();
    var result=base.apply(this,arguments);
    var list=(window.state&&Array.isArray(state.dues))?state.dues:[];
    var signed=0,completed=0;
    list.forEach(function(c){
      if(norm(c.spa)==='signed')signed++;
      if(norm(c.oqood)==='completed')completed++;
    });
    if(result){
      result.spaCounts={signed:signed,drafted:list.length-signed,none:0};
      result.oqoodCounts={completed:completed,pending:list.length-completed,other:0,none:0};
    }
    return result;
  };
  wrapped.__binaryComplianceStatus=true;
  window.portfolioStats=wrapped;
}

function install(){
  installStyles();
  normalizeState();
  wrapPortfolioStats();
  ['loadFromSupabase','render','renderMain','renderOverview','renderList','renderDetail'].forEach(function(name){wrap(name,true)});
  cleanupUi();
  if(window.MutationObserver&&document.body){
    var queued=false;
    new MutationObserver(function(){
      if(queued)return;queued=true;
      requestAnimationFrame(function(){queued=false;normalizeState();cleanupUi()});
    }).observe(document.body,{subtree:true,childList:true});
  }
  window.__sunblissComplianceStatus={
    spa:spa,
    oqood:oqood,
    normalizeState:normalizeState
  };
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();