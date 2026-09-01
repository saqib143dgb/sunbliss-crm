(function(){
'use strict';
if(window.__sunblissScheduledExtensionRowRefineInstalled)return;
window.__sunblissScheduledExtensionRowRefineInstalled=true;

if(!document.getElementById('scheduledExtensionRowTextRefineStyles')){
  var s=document.createElement('style');
  s.id='scheduledExtensionRowTextRefineStyles';
  s.textContent=[
    '.extension-reference-card .extref-label{font-size:8.8px!important}',
    '.extension-reference-card .extref-value{font-size:11.9px!important}',
    '@media(max-width:520px){.extension-reference-card .extref-label{font-size:8.25px!important}.extension-reference-card .extref-value{font-size:11.2px!important}}',
    '@media(max-width:370px){.extension-reference-card .extref-label{font-size:7.8px!important}.extension-reference-card .extref-value{font-size:10.3px!important}}'
  ].join('');
  document.head.appendChild(s);
}

var timer=null,observedHost=null,observer=null,applying=false;
function text(v){return v==null?'':String(v)}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function today(){var d=new Date();d.setHours(0,0,0,0);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function date(v){var d=new Date(text(v).slice(0,10)+'T00:00:00');return isNaN(d.getTime())?text(v):d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function customer(id){return window.state&&Array.isArray(state.dues)?state.dues.find(function(c){return Number(c&&c.sno)===Number(id)})||null:null}
function extensionRows(){var C=window.PaymentExtensionsCore&&window.PaymentExtensionsCore.cache;return C&&Array.isArray(C.t)?C.t.filter(function(t){return t&&t.status==='pending'&&t.auto_kind==='extension_active'}):[]}
function dueTodayRows(){var td=today();return extensionRows().filter(function(t){return text(t.due_date).slice(0,10)===td}).sort(function(a,b){var p={High:0,Medium:1,Low:2},x=(p[a.priority]||1)-(p[b.priority]||1);return x||Number(a.id)-Number(b.id)})}
function openUnit(id){var c=customer(id);if(!c)return;if(typeof window.goToDetail==='function')window.goToDetail(c.unit,c.sno,'overview');else{state.selectedUnit=c.unit+'::'+c.sno;state.detailFrom='overview';state.view='detail';if(typeof window.renderMain==='function')window.renderMain()}}
function rowHtml(t){var c=customer(t.unit_id),unit=c?c.unit:'Unit '+t.unit_id,name=c?c.name:'Customer';return '<div class="scheduled-overview-row scheduled-extension" data-task-id="'+safe(t.id)+'" data-extension-due-today="1"><div class="scheduled-overview-main" data-ext-today-unit="'+safe(t.unit_id)+'"><div class="scheduled-overview-unit">'+safe(unit)+' · '+safe(name)+'</div><div class="scheduled-overview-title">'+safe(t.action_label)+'<span class="ext-badge">Extension</span></div><div class="scheduled-overview-meta"><span class="scheduled-task-state ext">Extension Active</span> · '+safe(date(t.due_date))+(t.note?' · '+safe(t.note):'')+'</div></div></div>'}
function setOption(select,value,label,count){var o=select.querySelector('option[value="'+value+'"]');if(o){var v=label+' · '+count;if(o.textContent!==v)o.textContent=v}}
function bind(host){host.querySelectorAll('[data-ext-today-unit]').forEach(function(n){if(n.__extTodayBound)return;n.__extTodayBound=true;n.onclick=function(){openUnit(n.getAttribute('data-ext-today-unit'))}})}
function observe(host){if(host===observedHost)return;if(observer)observer.disconnect();observedHost=host;if(!host||!window.MutationObserver)return;observer=new MutationObserver(function(){if(!applying)queue(0)});observer.observe(host,{childList:true,subtree:false})}
function apply(){
  if(applying||!window.state||state.view!=='overview')return;
  var select=document.getElementById('scheduledOverviewFilter'),host=document.getElementById('scheduledOverviewList');
  if(!select||!host)return;
  observe(host);
  applying=true;
  try{
    var td=today(),todayRows=dueTodayRows(),allExt=extensionRows(),remainingExt=allExt.filter(function(t){return text(t.due_date).slice(0,10)!==td});
    if(select.value==='today'){
      var want={};todayRows.forEach(function(t){want[String(t.id)]=t});
      host.querySelectorAll('[data-task-id]').forEach(function(n){var id=String(n.getAttribute('data-task-id'));if(n.hasAttribute('data-extension-due-today')&&!want[id])n.remove()});
      todayRows.forEach(function(t){var id=String(t.id),existing=host.querySelector('[data-task-id="'+id.replace(/"/g,'\\"')+'"]');if(!existing)host.insertAdjacentHTML('afterbegin',rowHtml(t));else{existing.classList.add('scheduled-extension');existing.setAttribute('data-extension-due-today','1');var title=existing.querySelector('.scheduled-overview-title');if(title&&!title.querySelector('.ext-badge'))title.insertAdjacentHTML('beforeend','<span class="ext-badge">Extension</span>');existing.querySelectorAll('.scheduled-overview-done,.scheduled-mark-done').forEach(function(x){x.remove()});var st=existing.querySelector('.scheduled-task-state');if(st){st.className='scheduled-task-state ext';st.textContent='Extension Active'}}});
      if(todayRows.length)host.querySelectorAll('.scheduled-empty').forEach(function(n){n.remove()});
      bind(host);
    }else if(select.value==='extensions'){
      host.querySelectorAll('[data-task-id]').forEach(function(n){var id=String(n.getAttribute('data-task-id')),t=allExt.find(function(x){return String(x.id)===id});if(t&&text(t.due_date).slice(0,10)===td)n.remove()});
      if(!host.querySelector('.scheduled-overview-row')&&!host.querySelector('.scheduled-empty'))host.innerHTML='<div class="scheduled-empty">No active payment extensions.</div>';
      bind(host);
    }else{
      host.querySelectorAll('[data-extension-due-today]').forEach(function(n){n.remove()});
    }
    var visible=Array.prototype.slice.call(host.children).filter(function(el){return el&&el.classList&&el.classList.contains('scheduled-overview-row')}).length;
    if(select.value==='today')setOption(select,'today','Today',visible);
    setOption(select,'extensions','Extensions',remainingExt.length);
  }finally{applying=false}
}
function queue(ms){clearTimeout(timer);timer=setTimeout(apply,ms==null?25:ms)}
function install(){
  if(!window.state||!window.PaymentExtensionsCore||typeof window.renderOverview!=='function'){setTimeout(install,70);return}
  var P=window.PaymentExtensionsCore;
  if(typeof P.render==='function'&&!P.render.__extensionDueTodayRouting){var pr=P.render;P.render=function(){var out=pr.apply(this,arguments);queue(0);return out};P.render.__extensionDueTodayRouting=true}
  var ro=window.renderOverview;if(!ro.__extensionDueTodayRouting){window.renderOverview=function(){var out=ro.apply(this,arguments);queue(0);return out};window.renderOverview.__extensionDueTodayRouting=true}
  document.addEventListener('change',function(e){if(e.target&&e.target.id==='scheduledOverviewFilter')queue(0)},true);
  window.addEventListener('pageshow',function(){queue(40)});
  queue(0)
}
install();
})();
