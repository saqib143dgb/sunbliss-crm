(function(){
'use strict';
if(window.__sunblissCeoCleanExecutiveInstalled)return;
window.__sunblissCeoCleanExecutiveInstalled=true;

var PARAM='ceo-preview',observer=null,timer=null,busy=false,pulseCache=null,pulseAt=0;
function text(v){return v==null?'':String(v)}
function num(v){var n=Number(v);return isFinite(n)?n:0}
function safe(v){return text(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function mode(){try{return new URLSearchParams(location.search).get(PARAM)==='1'||(window.state&&state.userRole==='ceo')}catch(_e){return false}}
function isoToday(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function money(v){var n=num(v),a=Math.abs(n);if(a>=1000000)return'AED '+(n/1000000).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:2})+'M';if(a>=100000)return'AED '+(n/1000).toLocaleString('en-US',{maximumFractionDigits:0})+'K';return'AED '+n.toLocaleString('en-US',{maximumFractionDigits:0})}
function greeting(){var h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'}
function icon(name){var p={decision:'<path d="M12 3a9 9 0 1 0 9 9"/><path d="M12 7v5l3 2"/><path d="M17 3h4v4"/>',cash:'<path d="M4 7h16v10H4z"/><path d="M8 12h8"/><path d="M12 9v6"/>',portfolio:'<path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/><path d="M3 20h18"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'};return'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p[name]+'</svg>'}
function styles(){if(document.getElementById('ceoCleanStyles'))return;var s=document.createElement('style');s.id='ceoCleanStyles';s.textContent=[
'body.ceo-mode.ceo-clean{--cx-bg:#f5f7f8;--cx-card:#fff;--cx-ink:#172630;--cx-muted:#74818a;--cx-line:#e2e7ea;--cx-navy:#102a3a;--cx-navy2:#16394d;--cx-gold:#b78a32;--cx-red:#a7473f;--cx-green:#2e7456;background:#0b1f2c!important}',
'body.ceo-mode.ceo-clean #app{max-width:900px!important;background:var(--cx-bg)!important;box-shadow:none!important}',
'body.ceo-mode.ceo-clean .ceo-shell{background:var(--cx-bg)!important}',
'body.ceo-mode.ceo-clean .ceo-top{padding:24px 20px 52px!important;background:linear-gradient(135deg,var(--cx-navy),var(--cx-navy2))!important;border-bottom:0!important}',
'body.ceo-mode.ceo-clean .ceo-top:after{display:none!important}',
'body.ceo-mode.ceo-clean .ceo-kicker{color:#d3b978!important;font-size:9px!important;letter-spacing:.16em!important}',
'body.ceo-mode.ceo-clean .ceo-greeting{font-size:28px!important;letter-spacing:-.02em!important}',
'body.ceo-mode.ceo-clean .ceo-role{font-size:10.5px!important;color:rgba(255,255,255,.62)!important}',
'body.ceo-mode.ceo-clean .ceo-preview-pill{margin-top:12px!important;padding:6px 9px!important;background:rgba(255,255,255,.06)!important;border-color:rgba(255,255,255,.13)!important;color:rgba(255,255,255,.68)!important;font-size:9px!important}',
'body.ceo-mode.ceo-clean .ceo-icon-btn{background:transparent!important;border-color:rgba(255,255,255,.18)!important;border-radius:9px!important;font-size:9.5px!important;padding:7px 9px!important}',
'body.ceo-mode.ceo-clean .ceo-content{margin-top:-28px!important;padding:0 14px 30px!important}',
'body.ceo-mode.ceo-clean .ceo-card{background:#fff!important;border:1px solid var(--cx-line)!important;border-radius:13px!important;box-shadow:0 2px 8px rgba(20,39,51,.035)!important}',
'body.ceo-mode.ceo-clean .ceo-kpi-grid{gap:8px!important;margin-bottom:10px!important}',
'body.ceo-mode.ceo-clean .ceo-kpi{min-height:96px!important;padding:13px 13px 12px!important;position:relative!important;cursor:pointer!important;transition:border-color .15s ease,transform .15s ease,box-shadow .15s ease!important}',
'body.ceo-mode.ceo-clean .ceo-kpi:hover{border-color:#cdd6dc!important;box-shadow:0 5px 16px rgba(20,39,51,.07)!important;transform:translateY(-1px)}',
'body.ceo-mode.ceo-clean .ceo-kpi:active{transform:translateY(0) scale(.995)}',
'body.ceo-mode.ceo-clean .ceo-kpi-label{font-size:8.5px!important;letter-spacing:.09em!important}',
'body.ceo-mode.ceo-clean .ceo-kpi-value{font-size:20px!important}',
'body.ceo-mode.ceo-clean .ceo-kpi-sub{font-size:9px!important;line-height:1.35!important;padding-right:18px!important}',
'.ceo-clean-arrow{position:absolute;right:11px;bottom:11px;color:#a0abb2;font-size:14px;font-weight:600}',
'.ceo-clean-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 10px}',
'.ceo-clean-action{appearance:none;border:1px solid var(--cx-line);background:#fff;border-radius:13px;padding:12px 12px;text-align:left;display:grid;grid-template-columns:34px 1fr 16px;gap:9px;align-items:center;min-width:0;cursor:pointer;box-shadow:0 2px 8px rgba(20,39,51,.025);transition:.15s ease}',
'.ceo-clean-action:hover{border-color:#ccd5da;box-shadow:0 6px 18px rgba(20,39,51,.06);transform:translateY(-1px)}.ceo-clean-action:active{transform:none}',
'.ceo-clean-action .ic{width:34px;height:34px;border-radius:10px;background:#f1f4f5;color:#29495c;display:grid;place-items:center}.ceo-clean-action .ic svg{width:17px;height:17px}',
'.ceo-clean-action strong{display:block;font-size:10.5px;color:var(--cx-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ceo-clean-action span{display:block;font-size:8.7px;color:var(--cx-muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ceo-clean-action .go{color:#9aa5ac;font-size:15px;text-align:right}',
'.ceo-clean-pulse{display:grid;grid-template-columns:1.2fr 1fr 1fr;background:#fff;border:1px solid var(--cx-line);border-radius:13px;margin:0 0 10px;overflow:hidden;box-shadow:0 2px 8px rgba(20,39,51,.025)}',
'.ceo-clean-pulse button{border:0;border-left:1px solid var(--cx-line);background:#fff;padding:11px 12px;text-align:left;cursor:pointer;min-width:0}.ceo-clean-pulse button:first-child{border-left:0}.ceo-clean-pulse button:hover{background:#fafbfc}.ceo-clean-pulse small{display:block;font-size:7.8px;text-transform:uppercase;letter-spacing:.07em;color:var(--cx-muted)}.ceo-clean-pulse strong{display:block;font:700 12px "IBM Plex Mono",monospace;color:var(--cx-ink);margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ceo-clean-pulse em{display:block;font-style:normal;font-size:8.2px;color:#909aa1;margin-top:3px}',
'body.ceo-mode.ceo-clean .ceo-section{margin-top:9px!important}',
'body.ceo-mode.ceo-clean .ceo-section-head{padding:13px 14px 9px!important}',
'body.ceo-mode.ceo-clean .ceo-section-title{font-size:15px!important}',
'body.ceo-mode.ceo-clean .ceo-section-sub{font-size:9px!important;line-height:1.4!important}',
'body.ceo-mode.ceo-clean .ceo-section-link{font-size:9px!important;color:#76581d!important;padding:6px 8px!important;border-radius:8px!important;background:#faf7ef!important;border:1px solid #eadfc8!important}',
'body.ceo-mode.ceo-clean .ceo-decision-row{padding:12px 34px 12px 14px!important;position:relative!important;cursor:pointer!important;transition:background .12s ease!important}',
'body.ceo-mode.ceo-clean .ceo-decision-row:hover{background:#fafbfc!important}',
'body.ceo-mode.ceo-clean .ceo-decision-row:after{content:"›";position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:20px;color:#aab3b9}',
'body.ceo-mode.ceo-clean .ceo-decision-name{font-size:10.5px!important}',
'body.ceo-mode.ceo-clean .ceo-decision-note{font-size:9.5px!important;line-height:1.42!important;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
'body.ceo-mode.ceo-clean .ceo-decision-meta{font-size:8.7px!important}',
'body.ceo-mode.ceo-clean .ceo-tag{font-size:7.7px!important;padding:4px 6px!important}',
'body.ceo-mode.ceo-clean .ceo-metric-block{padding:8px 14px 13px!important}',
'body.ceo-mode.ceo-clean .ceo-metric-row{padding:7px 0!important}',
'body.ceo-mode.ceo-clean .ceo-metric-label{font-size:9.5px!important}',
'body.ceo-mode.ceo-clean .ceo-metric-value{font-size:10px!important}',
'body.ceo-mode.ceo-clean .ceo-progress{height:5px!important;background:#edf0f2!important}',
'body.ceo-mode.ceo-clean .ceo-progress>span{background:#b78a32!important}',
'body.ceo-mode.ceo-clean .ceo-cash-grid{gap:6px!important;padding:0 14px 13px!important}',
'body.ceo-mode.ceo-clean .ceo-cash-box{border-radius:9px!important;padding:9px 10px!important;background:#fafbfb!important;cursor:pointer!important}',
'body.ceo-mode.ceo-clean .ceo-cash-label{font-size:8.3px!important}',
'body.ceo-mode.ceo-clean .ceo-cash-value{font-size:10.7px!important}',
'body.ceo-mode.ceo-clean .ceo-attention>div{padding:10px 8px!important}',
'body.ceo-mode.ceo-clean .ceo-attention strong{font-size:11px!important}',
'body.ceo-mode.ceo-clean .ceo-attention span{font-size:8px!important}',
'body.ceo-mode.ceo-clean .ceo-bottom{width:min(760px,calc(100% - 18px))!important;bottom:8px!important;border-radius:14px!important;background:rgba(15,39,54,.97)!important;box-shadow:0 8px 24px rgba(8,25,35,.25)!important}',
'body.ceo-mode.ceo-clean .ceo-nav-btn{padding:9px 4px 8px!important;font-size:8px!important}',
'body.ceo-mode.ceo-clean .ceo-nav-btn svg{width:16px!important;height:16px!important}',
'body.ceo-mode.ceo-clean .ceo-nav-btn.active{color:#e5ca88!important;background:rgba(255,255,255,.035)!important}',
'body.ceo-mode.ceo-clean .ceo-page-title{padding:3px 2px 9px!important}body.ceo-mode.ceo-clean .ceo-page-title h2{font-size:19px!important}body.ceo-mode.ceo-clean .ceo-page-title p{font-size:9.5px!important}',
'body.ceo-mode.ceo-clean .ceo-search{border-radius:11px!important;padding:10px 12px!important;box-shadow:none!important}',
'body.ceo-mode.ceo-clean .ceo-search-card{border-radius:11px!important;padding:11px 12px!important;margin-bottom:7px!important;position:relative;padding-right:28px!important}',
'body.ceo-mode.ceo-clean .ceo-search-card:after{content:"›";position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:19px;color:#aab3b9}',
'.ceo-clean-hide{display:none!important}',
'@media(max-width:560px){.ceo-clean-actions{grid-template-columns:1fr}.ceo-clean-action{grid-template-columns:32px 1fr 16px;padding:10px 11px}.ceo-clean-action .ic{width:32px;height:32px}.ceo-clean-pulse{grid-template-columns:1fr 1fr}.ceo-clean-pulse button:nth-child(3){grid-column:1/-1;border-left:0;border-top:1px solid var(--cx-line)}body.ceo-mode.ceo-clean .ceo-top{padding:21px 16px 49px!important}body.ceo-mode.ceo-clean .ceo-greeting{font-size:25px!important}}'
].join('');document.head.appendChild(s)}
function go(view){var btn=document.querySelector('.ceo-nav-btn[data-ceo-view="'+view+'"], [data-ceo-view="'+view+'"]');if(btn){btn.click();return true}return false}
function findSection(title){var heads=Array.prototype.slice.call(document.querySelectorAll('.ceo-section'));return heads.find(function(s){var h=s.querySelector('.ceo-section-title');return h&&text(h.textContent).trim().toLowerCase()===title.toLowerCase()})||null}
function scrollCollections(){var s=findSection('Collections');if(s){s.scrollIntoView({behavior:'smooth',block:'start'});return true}if(go('overview'))setTimeout(scrollCollections,120);return false}
function kpiRoutes(){var map={'total sales value':'portfolio','cash collected':'collections','outstanding':'collections','overdue':'decisions'};document.querySelectorAll('.ceo-kpi').forEach(function(card){var l=card.querySelector('.ceo-kpi-label'),key=l?text(l.textContent).trim().toLowerCase():'';if(!map[key])return;card.setAttribute('role','button');card.setAttribute('tabindex','0');if(!card.querySelector('.ceo-clean-arrow')){var a=document.createElement('span');a.className='ceo-clean-arrow';a.textContent='›';card.appendChild(a)}var action=function(){map[key]==='collections'?scrollCollections():go(map[key])};card.onclick=action;card.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();action()}}})}
function decisionCount(){var h=Array.prototype.slice.call(document.querySelectorAll('.ceo-section-title')).find(function(x){return /Decision/.test(text(x.textContent))}),m=h&&text(h.textContent).match(/(\d+)\s+Decision/i);return m?Number(m[1]):0}
function actionNav(){var page=document.querySelector('.ceo-overview'),grid=page&&page.querySelector('.ceo-kpi-grid');if(!grid||document.getElementById('ceoCleanActions'))return;var d=decisionCount(),box=document.createElement('div');box.id='ceoCleanActions';box.className='ceo-clean-actions';box.innerHTML='<button class="ceo-clean-action" data-route="decisions"><span class="ic">'+icon('decision')+'</span><span><strong>Decision Centre</strong><span>'+d+' item'+(d===1?'':'s')+' requiring management review</span></span><span class="go">›</span></button><button class="ceo-clean-action" data-route="collections"><span class="ic">'+icon('cash')+'</span><span><strong>Collections & Cash Flow</strong><span>Current month and forward collection position</span></span><span class="go">›</span></button><button class="ceo-clean-action" data-route="portfolio"><span class="ic">'+icon('portfolio')+'</span><span><strong>Portfolio</strong><span>Sales, inventory and commercial exposure</span></span><span class="go">›</span></button>';grid.parentNode.insertBefore(box,grid.nextSibling);box.querySelectorAll('button').forEach(function(b){b.onclick=function(){var r=this.getAttribute('data-route');r==='collections'?scrollCollections():go(r)}})}
async function loadPulse(){if(!window.sb)return null;if(pulseCache&&Date.now()-pulseAt<60000)return pulseCache;var today=isoToday(),r=await Promise.all([sb.from('payment_transactions').select('id,unit_id,payment_date,amount').eq('payment_date',today),sb.from('sales').select('id,unit_id,booking_date').eq('booking_date',today),sb.from('units').select('id,total_price,status,availability_status')]);r.forEach(function(x){if(x.error)throw x.error});var by={};(r[2].data||[]).forEach(function(u){by[String(u.id)]=u});function active(id){var u=by[String(id)];return !!(u&&String(u.availability_status).toLowerCase()==='sold'&&String(u.status).toLowerCase()!=='cancelled')}var tx=(r[0].data||[]).filter(function(x){return active(x.unit_id)}),sales=(r[1].data||[]).filter(function(x){return active(x.unit_id)});pulseCache={cash:tx.reduce(function(s,x){return s+num(x.amount)},0),payments:tx.length,bookings:sales.length,bookingValue:sales.reduce(function(s,x){return s+num((by[String(x.unit_id)]||{}).total_price)},0),decisions:decisionCount()};pulseAt=Date.now();return pulseCache}
function pulse(p){var actions=document.getElementById('ceoCleanActions');if(!actions||!p||document.getElementById('ceoCleanPulse'))return;var box=document.createElement('div');box.id='ceoCleanPulse';box.className='ceo-clean-pulse';box.innerHTML='<button data-route="collections"><small>Cash received today</small><strong>'+safe(money(p.cash))+'</strong><em>'+p.payments+' payment'+(p.payments===1?'':'s')+' recorded</em></button><button data-route="portfolio"><small>New bookings today</small><strong>'+p.bookings+'</strong><em>'+safe(money(p.bookingValue))+' sale value</em></button><button data-route="decisions"><small>Management decisions</small><strong>'+p.decisions+'</strong><em>Tap to review</em></button>';actions.parentNode.insertBefore(box,actions.nextSibling);box.querySelectorAll('button').forEach(function(b){b.onclick=function(){var r=this.getAttribute('data-route');r==='collections'?scrollCollections():go(r)}})}
function simplify(){var page=document.querySelector('.ceo-overview');if(!page)return;Array.prototype.slice.call(page.querySelectorAll('.ceo-section')).forEach(function(s){var h=s.querySelector('.ceo-section-title'),t=h?text(h.textContent).trim():'';if(t==='Management Snapshot')s.classList.add('ceo-clean-hide');else s.classList.remove('ceo-clean-hide')});var portfolio=findSection('Portfolio');if(portfolio){portfolio.style.cursor='pointer';portfolio.onclick=function(e){if(e.target.closest('button'))return;go('portfolio')}}var collection=findSection('Collections');if(collection)collection.id='ceoCollectionsSection'}
function polishRows(){document.querySelectorAll('.ceo-decision-row,.ceo-search-card').forEach(function(el){el.setAttribute('role','button');el.setAttribute('tabindex','0')});document.querySelectorAll('.ceo-cash-box').forEach(function(el){el.setAttribute('role','button');el.setAttribute('tabindex','0');el.onclick=function(){scrollCollections()}})}
function header(){var g=document.querySelector('.ceo-greeting');if(g&&/^Good /i.test(text(g.textContent)))g.textContent=greeting()+', Shah Alam';var board=document.getElementById('ceoBoardBrief');if(board)board.remove()}
async function enhance(){if(!mode()||busy)return;var shell=document.querySelector('.ceo-shell');if(!shell)return;busy=true;try{styles();document.body.classList.remove('ceo-v2');document.body.classList.add('ceo-clean');header();kpiRoutes();actionNav();simplify();polishRows();if(document.querySelector('.ceo-overview')){try{pulse(await loadPulse())}catch(_e){}}}finally{busy=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(enhance,45)}
function attach(){var app=document.getElementById('app');if(!app||observer)return;observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true});schedule();setTimeout(enhance,250);setTimeout(enhance,700)}
var prior=window.render;if(typeof prior==='function')window.render=function(){var r=prior.apply(this,arguments);if(mode())schedule();return r};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();
