(function(){
'use strict';
if(window.__sunblissExactDesktopPreviewInstalled)return;
window.__sunblissExactDesktopPreviewInstalled=true;

var MQ='(min-width:1024px)',timer=null,observer=null,busy=false;
function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){v=Number(v);return isFinite(v)?v:0}
function money(v){
  v=Math.abs(num(v));
  if(v>=1000000)return 'AED '+(Math.round(v/100000)/10).toFixed(v>=10000000?1:1)+'M';
  if(v>=1000)return 'AED '+(Math.round(v/100)/10).toFixed(1)+'K';
  return 'AED '+Math.round(v).toLocaleString();
}
function pct(v){return (Math.round(num(v)*10)/10).toFixed(1)+'%'}
function icon(name){
 var p={
 overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 units:'<path d="M4 21V8l8-4 8 4v13M9 21v-5h6v5M8 10h1M12 10h1M16 10h1"/>',
 insights:'<path d="M4 19V5M4 19h16M7 15l4-5 3 3 5-7"/>',
 tasks:'<path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 add:'<path d="M12 5v14M5 12h14"/>',
 project:'<path d="M4 21V8l6-3v16M10 21V3l8 4v14M2 21h20M7 11h1M7 15h1M13 9h1M13 13h1M16 10h1M16 14h1"/>',
 print:'<path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>',
 building:'<path d="M5 21V7l7-3v17M12 21V9l7 2v10M2 21h20M8 10h1M8 14h1M15 13h1M15 17h1"/>',
 wallet:'<path d="M4 7h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12M15 12h7v4h-7a2 2 0 0 1 0-4z"/>',
 doc:'<path d="M6 2h9l4 4v16H6zM14 2v5h5M9 12h7M9 16h7"/>',
 sign:'<path d="M4 19c5-1 8-4 10-10M4 19c3 0 6 0 9 2M14 9l3-3 2 2-3 3z"/>',
 award:'<circle cx="12" cy="9" r="5"/><path d="M8.5 13L7 22l5-3 5 3-1.5-9"/>',
 sofa:'<path d="M5 12V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M4 12h16a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2zM5 19v2M19 19v2"/>',
 bulb:'<path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3z"/>'
 };
 return '<svg viewBox="0 0 24 24" aria-hidden="true">'+(p[name]||p.overview)+'</svg>';
}
function sunLogo(){
 var rays='';for(var i=0;i<15;i++){var a=-70+i*10;rays+='<span style="transform:rotate('+a+'deg)"></span>'}
 return '<div class="sb-ref-sun">'+rays+'<i></i></div>';
}
function installStyles(){
  var old=document.getElementById('sunblissDesktopResponsiveCRMStyles');if(old)old.remove();
  if(document.getElementById('sunblissExactDesktopPreviewStyles'))return;
  var s=document.createElement('style');s.id='sunblissExactDesktopPreviewStyles';s.textContent=`
#sbRefSidebar{display:none}
@media(min-width:1024px){
 html,body{min-width:1024px}
 body.sunbliss-ref-desktop{background:var(--paper)!important;background-image:none!important;overflow-x:hidden}
 body.sunbliss-ref-desktop #app{width:100%!important;max-width:none!important;margin:0!important;padding:0 0 0 228px!important;contain:none!important;min-height:100vh}
 body.sunbliss-ref-desktop .tabs{display:none!important}
 #sbRefSidebar{display:flex;position:fixed;z-index:3000;left:0;top:0;bottom:0;width:228px;flex-direction:column;background:var(--ink-2);color:var(--cream-text);border-right:1px solid rgba(198,151,46,.28);box-shadow:none}
 .sb-ref-brand{height:138px;padding:24px 18px 18px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;border-bottom:1px solid rgba(237,230,214,.12)}
 .sb-ref-sun{position:relative;width:68px;height:38px;margin:0 auto 3px;overflow:hidden}.sb-ref-sun span{position:absolute;left:33px;bottom:-1px;width:1px;height:31px;background:var(--gold);transform-origin:0 31px;opacity:.9}.sb-ref-sun i{position:absolute;left:22px;bottom:-10px;width:24px;height:24px;border:2px solid var(--gold);border-radius:50%;box-shadow:0 0 0 5px rgba(198,151,46,.08)}
 .sb-ref-brand strong{font:600 25px/1 Georgia,'Times New Roman',serif;color:var(--cream-text);letter-spacing:-.015em}.sb-ref-brand small{margin-top:7px;font:700 8px/1 Inter,sans-serif;letter-spacing:.20em;text-transform:uppercase;color:var(--gold)}
 .sb-ref-nav{padding:21px 18px 0;display:flex;flex-direction:column;gap:5px}.sb-ref-nav button{position:relative;width:100%;height:52px;border:0;border-radius:10px;background:transparent;color:var(--cream-text);display:flex;align-items:center;gap:13px;padding:0 14px;font:500 13px/1 Inter,sans-serif;text-align:left;cursor:pointer}.sb-ref-nav button svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}.sb-ref-nav button:hover{background:rgba(237,230,214,.045)}.sb-ref-nav button.active{background:rgba(237,230,214,.095);color:var(--gold);font-weight:650}.sb-ref-nav button.active:before{content:'';position:absolute;left:-18px;top:0;bottom:0;width:5px;background:var(--gold)}
 .sb-ref-nav .sb-ref-add{margin-top:13px;border:1px solid var(--gold);color:var(--gold);background:transparent;height:47px}.sb-ref-nav .sb-ref-add:hover{background:rgba(198,151,46,.07)}
 .sb-ref-side-bottom{margin:auto 18px 0;padding:17px 0 24px;border-top:1px solid rgba(237,230,214,.12)}.sb-ref-project-card{display:grid;grid-template-columns:30px 1fr 28px;gap:9px;align-items:center;color:var(--cream-text);font:500 10px/1.35 Inter,sans-serif}.sb-ref-project-card>svg{width:26px;height:26px;fill:none;stroke:var(--cream-text);stroke-width:1.7}.sb-ref-project-card b{display:block;font-size:10px;margin-bottom:3px}.sb-ref-project-card em{font-style:normal;color:var(--cream-text-dim);font-size:9px}.sb-ref-project-card .arr{width:28px;height:28px;border:1px solid rgba(237,230,214,.18);border-radius:50%;display:grid;place-items:center;font-size:18px;color:var(--cream-text-dim)}
 body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{height:238px!important;min-height:238px!important;padding:28px 34px 22px 44px!important;border-radius:0!important;background:var(--ink-2)!important;overflow:hidden!important;box-shadow:none!important}
 body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:before{display:none!important}.topbar.sunbliss-professional-header:after{left:44px!important;right:55%!important;top:96px!important;background:linear-gradient(90deg,var(--gold),rgba(198,151,46,.35),transparent)!important}
 body.sunbliss-ref-desktop .sb-pro-top{min-height:58px!important;align-items:flex-start!important}.sb-pro-brand-name{font-size:29px!important;line-height:1!important}.sb-pro-brand-sub{margin-top:8px!important;font-size:8px!important;letter-spacing:.24em!important;color:var(--cream-text)!important}.sb-pro-actions{position:absolute!important;right:0!important;top:-6px!important;gap:12px!important}.sb-pro-signout{height:38px!important;border-radius:9px!important;padding:0 16px!important}.sb-pro-main{margin-top:23px!important}.sb-pro-welcome{font-size:12.5px!important;margin-bottom:4px!important;color:var(--cream-text)!important}.sb-pro-name{font-size:34px!important}.sb-pro-role{min-height:32px!important;padding:0 13px!important;font-size:10px!important}.sb-pro-project-row{margin-top:14px!important;display:block!important}.sb-pro-project{font-size:13px!important}.sb-pro-project-icon{width:34px!important;height:34px!important;border-radius:8px!important}.sb-pro-project-sep{display:none!important}.sb-pro-sync{height:34px!important;padding:0 9px!important;border:0!important;background:transparent!important;font-size:10px!important;color:var(--cream-text)!important}.sb-dubai-skyline{right:0!important;bottom:-1px!important;width:58%!important;height:87%!important;opacity:.32!important;mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.4) 16%,#000 37%,#000 100%)!important;-webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.4) 16%,#000 37%,#000 100%)!important}
 body.sunbliss-ref-desktop main#main{position:relative!important;width:100%!important;max-width:none!important;margin:0!important;min-height:calc(100vh - 238px)!important;border-radius:0!important;background:var(--paper)!important;box-shadow:none!important;overflow:visible!important}
 body.sunbliss-ref-desktop main#main:before{content:'';position:absolute;z-index:0;right:0;top:-38px;width:500px;height:48px;background:var(--paper);border-radius:70px 0 0 0;pointer-events:none}
 body.sunbliss-ref-desktop .overview{position:relative;z-index:1;padding:0 34px 34px!important;max-width:none!important}.overview>:not(#sbRefOverview){display:none!important}
 #sbRefOverview{display:block;padding-top:0}.sb-ref-toolbar{height:31px;display:flex;justify-content:flex-end;align-items:flex-start;position:relative}.sb-ref-print{transform:translateY(-23px);height:37px;border:0;border-radius:7px;background:var(--ink-2);color:var(--cream-text);display:flex;align-items:center;gap:10px;padding:0 17px;font:600 11px/1 Inter,sans-serif;box-shadow:0 5px 18px rgba(15,26,38,.12)}.sb-ref-print svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8}
 .sb-ref-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.sb-ref-card{background:var(--paper);border:1px solid var(--paper-line);border-radius:11px;box-shadow:0 3px 14px rgba(15,26,38,.055)}.sb-ref-kpi{height:113px;display:grid;grid-template-columns:56px 1fr;gap:14px;align-items:center;padding:17px 18px;cursor:pointer}.sb-ref-icon{width:52px;height:52px;border-radius:50%;display:grid;place-items:center}.sb-ref-icon svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.sb-ref-icon.gold{background:rgba(198,151,46,.13);color:var(--gold-deep)}.sb-ref-icon.green{background:rgba(63,122,87,.12);color:var(--sage)}.sb-ref-icon.blue{background:rgba(69,86,107,.12);color:var(--slate)}.sb-ref-icon.red{background:rgba(174,59,43,.10);color:var(--rust)}.sb-ref-icon.purple{background:rgba(69,86,107,.10);color:var(--slate)}
 .sb-ref-kpi-lbl{font:700 10px/1.2 Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--ink);margin-bottom:8px}.sb-ref-kpi-val{font:650 26px/1 Inter,sans-serif;letter-spacing:-.035em;color:var(--ink);white-space:nowrap}.sb-ref-kpi-sub{margin-top:7px;font:500 10.5px/1 Inter,sans-serif;color:var(--muted)}.sb-ref-kpi-sub.good{color:var(--sage);font-weight:700}.sb-ref-kpi-sub.bad{color:var(--rust);font-weight:700}
 .sb-ref-collection{margin-top:15px;height:97px;padding:14px 21px}.sb-ref-title{display:flex;align-items:center;gap:9px;font:700 10.5px/1 Inter,sans-serif;letter-spacing:.035em;text-transform:uppercase;color:var(--ink);margin-bottom:12px}.sb-ref-title svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7}.sb-ref-progress{height:8px;border-radius:99px;background:rgba(198,151,46,.23);overflow:hidden}.sb-ref-progress i{display:block;height:100%;background:var(--sage);border-radius:99px}.sb-ref-progress-caption{display:flex;justify-content:space-between;margin-top:11px;font:500 11px/1 Inter,sans-serif;color:var(--muted)}.sb-ref-progress-caption b{font-size:13px}.sb-ref-progress-caption .left b{color:var(--sage)}.sb-ref-progress-caption .right b{color:var(--rust)}
 .sb-ref-grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.sb-ref-status{height:105px;padding:13px 18px}.sb-ref-status-body{display:grid;grid-template-columns:62px repeat(3,1fr);height:58px;align-items:center}.sb-ref-status-body.two{grid-template-columns:62px repeat(2,1fr)}.sb-ref-status-body .sb-ref-icon{width:48px;height:48px}.sb-ref-status-cell{position:relative;padding:0 20px;min-height:48px;display:flex;flex-direction:column;justify-content:center;border-left:1px solid var(--paper-line);cursor:pointer}.sb-ref-status-cell:first-of-type{border-left:0}.sb-ref-status-cell strong{font:650 20px/1 Inter,sans-serif;color:var(--ink)}.sb-ref-status-cell span{margin-top:7px;font:500 9.5px/1 Inter,sans-serif;color:var(--muted)}.sb-ref-dot{width:7px;height:7px;border-radius:50%;display:inline-block;margin-right:7px}.sb-ref-dot.good{background:var(--sage)}.sb-ref-dot.warn{background:var(--amber)}.sb-ref-dot.muted{background:var(--muted)}
 .sb-ref-quick{height:105px;padding:13px 18px}.sb-ref-quick-body{display:grid;grid-template-columns:62px 1fr;align-items:center}.sb-ref-quick-list{display:grid;gap:4px}.sb-ref-quick-row{display:grid;grid-template-columns:1fr 58px;gap:8px;align-items:center;font:500 9.5px/1 Inter,sans-serif;color:var(--ink)}.sb-ref-quick-text{display:flex;align-items:center;gap:8px}.sb-ref-check{width:13px;height:13px;border:1px solid var(--slate);border-radius:50%;display:grid;place-items:center;font-size:8px;color:var(--slate)}.sb-ref-view{height:19px;border:1px solid var(--paper-line);border-radius:6px;background:transparent;color:var(--ink);font:650 8.5px/1 Inter,sans-serif}
 .sb-ref-recent{margin-top:12px;padding:12px 18px 8px;min-height:127px}.sb-ref-recent-head{display:flex;align-items:center;justify-content:space-between}.sb-ref-recent-head .sb-ref-title{margin-bottom:8px}.sb-ref-all{height:23px;border:1px solid var(--paper-line);border-radius:7px;background:transparent;color:var(--ink);padding:0 11px;font:650 8.5px/1 Inter,sans-serif}.sb-ref-recent-row{display:grid;grid-template-columns:22px 1fr 130px;gap:8px;align-items:center;min-height:30px;border-top:1px solid var(--paper-line);font:500 9.5px/1 Inter,sans-serif;color:var(--ink);cursor:pointer}.sb-ref-recent-row:first-of-type{border-top:0}.sb-ref-act-icon{width:17px;height:17px;border-radius:5px;display:grid;place-items:center;background:rgba(63,122,87,.10);color:var(--sage);font-size:10px}.sb-ref-recent-row time{text-align:right;color:var(--muted);font-size:9px}
 body.sunbliss-ref-desktop .controls{padding:26px 34px 12px!important}.list{padding-left:34px!important;padding-right:34px!important}.detail,.insights{max-width:none!important;padding-left:34px!important;padding-right:34px!important}.ledger-scroll{grid-template-columns:repeat(4,minmax(0,1fr))!important}.row-btn{border-radius:10px!important}.auth-wrap{margin-left:auto!important;margin-right:auto!important}
}
@media(min-width:1350px){.ledger-scroll{grid-template-columns:repeat(5,minmax(0,1fr))!important}}
@media(min-width:1600px){.ledger-scroll{grid-template-columns:repeat(6,minmax(0,1fr))!important}}
`;
 document.head.appendChild(s);
}
function original(selector){return document.querySelector('.tabs '+selector)||document.querySelector(selector)}
function route(view){var b=original('.tab[data-view="'+view+'"]');if(b){b.click();return}if(window.state&&typeof window.renderMain==='function'){state.view=view;renderMain();window.scrollTo(0,0)}}
function dock(sel){var b=original(sel);if(b)b.click()}
function goTasks(){if(window.state&&state.view!=='overview'){route('overview');setTimeout(goTasks,80);return}var t=document.getElementById('scheduledActionsOverview');if(t)t.scrollIntoView({behavior:'smooth',block:'start'});else route('overview')}
function ensureSidebar(){
 if(!desktop())return;var n=document.getElementById('sbRefSidebar');if(n)return;
 n=document.createElement('aside');n.id='sbRefSidebar';n.innerHTML='<div class="sb-ref-brand">'+sunLogo()+'<strong>Sunbliss CRM</strong><small>Desktop Workspace</small></div><nav class="sb-ref-nav"><button data-route="overview">'+icon('overview')+'<span>Overview</span></button><button data-route="list">'+icon('units')+'<span>Units &amp; Customers</span></button><button data-route="insights">'+icon('insights')+'<span>Insights</span></button><button data-action="tasks">'+icon('tasks')+'<span>Scheduled Actions</span></button><button data-action="search">'+icon('search')+'<span>Search</span></button><button class="sb-ref-add" data-action="add">'+icon('add')+'<span>Add Customer</span></button></nav><div class="sb-ref-side-bottom"><div class="sb-ref-project-card">'+icon('project')+'<div><b>Sunbliss Residences</b><em>Real Estate Project</em></div><span class="arr">›</span></div></div>';
 document.body.appendChild(n);
 n.querySelectorAll('[data-route]').forEach(function(b){b.onclick=function(){route(b.getAttribute('data-route'))}});
 n.querySelector('[data-action="tasks"]').onclick=goTasks;n.querySelector('[data-action="search"]').onclick=function(){dock('.dock-search')};n.querySelector('[data-action="add"]').onclick=function(){dock('.dock-add')};
}
function syncSidebar(){var n=document.getElementById('sbRefSidebar');if(!n)return;var v=(window.state&&state.view)||'overview';n.querySelectorAll('[data-route]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-route')===v)});var a=n.querySelector('[data-action="add"]');if(a)a.style.display=original('.dock-add')?'flex':'none'}
function alignHeader(){
 var h=document.querySelector('.topbar.sunbliss-professional-header');if(!h)return;var acts=h.querySelector('.sb-pro-actions'),sync=h.querySelector('.sb-pro-sync');if(acts&&sync&&sync.parentNode!==acts)acts.insertBefore(sync,acts.firstChild);
}
function quick(k){
 var today=new Date();today.setHours(0,0,0,0);var d7=0,over=0;
 ((window.state&&state.dues)||[]).forEach(function(c){(c.stages||[]).forEach(function(st){var rem=st.outAmt!=null?num(st.outAmt):num(st.due)-num(st.paid);if(rem<=1||!st.dueDate)return;var dt=new Date(st.dueDate);if(isNaN(dt))return;dt.setHours(0,0,0,0);var days=Math.floor((dt-today)/86400000);if(days<0)over++;else if(days<=7)d7++;})});
 return {due:d7,overdue:over,spa:(k.spaCounts?k.spaCounts.drafted+k.spaCounts.none:0)};
}
function when(v){var d=new Date(v);if(isNaN(d))return '';var now=new Date(),same=d.toDateString()===now.toDateString();var y=new Date(now);y.setDate(y.getDate()-1);var pre=same?'Today':(d.toDateString()===y.toDateString()?'Yesterday':d.toLocaleDateString([], {month:'short',day:'numeric'}));return pre+' '+d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
function proxy(id){var b=document.getElementById(id);if(b)b.click()}
function recentRows(){
 var arr=((window.state&&state.recent)||[]).slice().sort(function(a,b){return new Date(b.date)-new Date(a.date)}).slice(0,3);if(!arr.length)return '<div class="sb-ref-recent-row"><span class="sb-ref-act-icon">✓</span><span>No recent payment activity</span><time></time></div>';
 return arr.map(function(t){return '<div class="sb-ref-recent-row" data-unit="'+esc(t.unit||'')+'"><span class="sb-ref-act-icon">✓</span><span>Payment received from Unit '+esc(t.unit||'—')+' · '+esc(t.name||'Customer')+'</span><time>'+esc(when(t.date))+'</time></div>'}).join('');
}
function renderReferenceOverview(){
 if(busy||!desktop()||!window.state||state.view!=='overview')return;var host=document.querySelector('.overview');if(!host)return;var k=typeof window.portfolioStats==='function'?window.portfolioStats():null;if(!k)return;busy=true;
 var q=quick(k),spa=k.spaCounts||{signed:0,drafted:0,none:0},oq=k.oqoodCounts||{completed:0,pending:0,none:0,other:0},f=k.furnitureCounts||{furnished:0,unfurnished:0};
 var html='<div id="sbRefOverview"><div class="sb-ref-toolbar"><button class="sb-ref-print" id="sbRefPrint">'+icon('print')+'<span>Print executive summary report</span></button></div>'+
 '<div class="sb-ref-kpis">'+
 '<div class="sb-ref-card sb-ref-kpi" data-proxy="btnUnitsSold"><span class="sb-ref-icon gold">'+icon('building')+'</span><div><div class="sb-ref-kpi-lbl">Units Sold</div><div class="sb-ref-kpi-val">'+esc(k.units)+'</div><div class="sb-ref-kpi-sub">Total units sold</div></div></div>'+
 '<div class="sb-ref-card sb-ref-kpi" data-proxy="btnSalesValue"><span class="sb-ref-icon green">'+icon('building')+'</span><div><div class="sb-ref-kpi-lbl">Sales Value</div><div class="sb-ref-kpi-val">'+esc(money(k.totalSales))+'</div><div class="sb-ref-kpi-sub">Total sales value</div></div></div>'+
 '<div class="sb-ref-card sb-ref-kpi" data-proxy="btnCollected"><span class="sb-ref-icon blue">'+icon('wallet')+'</span><div><div class="sb-ref-kpi-lbl">Collected</div><div class="sb-ref-kpi-val">'+esc(money(k.totalReceived))+'</div><div class="sb-ref-kpi-sub good">'+esc(pct(k.collectedPct))+' of sales</div></div></div>'+
 '<div class="sb-ref-card sb-ref-kpi" data-proxy="btnOutstanding"><span class="sb-ref-icon red">'+icon('doc')+'</span><div><div class="sb-ref-kpi-lbl">Outstanding</div><div class="sb-ref-kpi-val">'+esc(money(k.totalOutstanding))+'</div><div class="sb-ref-kpi-sub bad">'+esc(pct(k.outstandingPct))+' of sales</div></div></div></div>'+
 '<section class="sb-ref-card sb-ref-collection"><div class="sb-ref-title">'+icon('insights')+'<span>Collection Overview</span></div><div class="sb-ref-progress"><i style="width:'+Math.min(num(k.collectedPct),100)+'%"></i></div><div class="sb-ref-progress-caption"><span class="left"><b>'+esc(pct(k.collectedPct))+'</b> Collected</span><span class="right"><b>'+esc(pct(k.outstandingPct))+'</b> Outstanding</span></div></section>'+
 '<div class="sb-ref-grid2"><section class="sb-ref-card sb-ref-status"><div class="sb-ref-title">'+icon('sign')+'<span>SPA Status</span></div><div class="sb-ref-status-body"><span class="sb-ref-icon green">'+icon('sign')+'</span><div class="sb-ref-status-cell" data-proxy="btnSpaSigned"><strong><i class="sb-ref-dot good"></i>'+spa.signed+'</strong><span>Signed</span></div><div class="sb-ref-status-cell" data-proxy="btnSpaDrafted"><strong><i class="sb-ref-dot warn"></i>'+spa.drafted+'</strong><span>Drafted</span></div><div class="sb-ref-status-cell" data-proxy="btnSpaNotStarted"><strong><i class="sb-ref-dot muted"></i>'+spa.none+'</strong><span>Not started</span></div></div></section>'+
 '<section class="sb-ref-card sb-ref-status"><div class="sb-ref-title">'+icon('award')+'<span>OQOOD Status</span></div><div class="sb-ref-status-body"><span class="sb-ref-icon green">'+icon('award')+'</span><div class="sb-ref-status-cell" data-proxy="btnOqoodCompleted"><strong><i class="sb-ref-dot good"></i>'+oq.completed+'</strong><span>Completed</span></div><div class="sb-ref-status-cell" data-proxy="btnOqoodPending"><strong><i class="sb-ref-dot warn"></i>'+oq.pending+'</strong><span>Pending</span></div><div class="sb-ref-status-cell" data-proxy="btnOqoodNotStarted"><strong><i class="sb-ref-dot muted"></i>'+num(oq.none+oq.other)+'</strong><span>Not started</span></div></div></section></div>'+
 '<div class="sb-ref-grid2"><section class="sb-ref-card sb-ref-status"><div class="sb-ref-title">'+icon('sofa')+'<span>Furnishing Type</span></div><div class="sb-ref-status-body two"><span class="sb-ref-icon purple">'+icon('sofa')+'</span><div class="sb-ref-status-cell" data-proxy="btnFurnished"><strong>'+f.furnished+'</strong><span>Furnished</span></div><div class="sb-ref-status-cell" data-proxy="btnUnfurnished"><strong>'+f.unfurnished+'</strong><span>Unfurnished</span></div></div></section>'+
 '<section class="sb-ref-card sb-ref-quick"><div class="sb-ref-title">'+icon('bulb')+'<span>Quick Insights</span></div><div class="sb-ref-quick-body"><span class="sb-ref-icon gold">'+icon('bulb')+'</span><div class="sb-ref-quick-list"><div class="sb-ref-quick-row"><span class="sb-ref-quick-text"><i class="sb-ref-check">✓</i>'+q.due+' payments due within the next 7 days</span><button class="sb-ref-view" data-quick="due">View</button></div><div class="sb-ref-quick-row"><span class="sb-ref-quick-text"><i class="sb-ref-check">✓</i>'+q.overdue+' overdue payments require attention</span><button class="sb-ref-view" data-quick="overdue">View</button></div><div class="sb-ref-quick-row"><span class="sb-ref-quick-text"><i class="sb-ref-check">✓</i>'+q.spa+' customers pending SPA completion</span><button class="sb-ref-view" data-quick="spa">View</button></div></div></div></section></div>'+
 '<section class="sb-ref-card sb-ref-recent"><div class="sb-ref-recent-head"><div class="sb-ref-title">'+icon('insights')+'<span>Recent Activity</span></div><button class="sb-ref-all" id="sbRefAllActivity">View all activity</button></div>'+recentRows()+'</section></div>';
 var old=document.getElementById('sbRefOverview');if(old)old.remove();host.insertAdjacentHTML('afterbegin',html);
 var root=document.getElementById('sbRefOverview');root.querySelectorAll('[data-proxy]').forEach(function(el){el.onclick=function(){proxy(el.getAttribute('data-proxy'))}});
 root.querySelector('#sbRefPrint').onclick=function(){var b=document.getElementById('btnPrintReport');if(b){b.click();setTimeout(function(){var c=document.getElementById('btnConfirmPrint');if(c)c.click()},80)}else window.print()};
 root.querySelectorAll('[data-quick]').forEach(function(b){b.onclick=function(){var t=b.getAttribute('data-quick');if(typeof window.goToUnitsList==='function'){if(t==='overdue')goToUnitsList({payment:'overdue'},'outstanding');else if(t==='due')goToUnitsList({payment:'upcoming'},'outstanding');else goToUnitsList({spa:'drafted'},'outstanding')}else route('list')}});
 root.querySelector('#sbRefAllActivity').onclick=function(){route('list')};
 root.querySelectorAll('.sb-ref-recent-row[data-unit]').forEach(function(r){r.onclick=function(){var u=r.getAttribute('data-unit');var c=((state.dues||[]).filter(function(x){return String(x.unit)===String(u)})[0]);if(c&&typeof window.goToDetail==='function')goToDetail(c.unit,c.sno,'overview');else route('list')}});
 busy=false;
}
function apply(){
 installStyles();var on=desktop();document.body.classList.toggle('sunbliss-ref-desktop',on);if(!on){var n=document.getElementById('sbRefSidebar');if(n)n.remove();return}ensureSidebar();alignHeader();syncSidebar();renderReferenceOverview();
}
function schedule(){if(busy)return;clearTimeout(timer);timer=setTimeout(apply,55)}
function attach(){installStyles();apply();var app=document.getElementById('app');if(app&&window.MutationObserver&&!observer){observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']})}window.addEventListener('resize',schedule,{passive:true});setTimeout(apply,180);setTimeout(apply,550)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();