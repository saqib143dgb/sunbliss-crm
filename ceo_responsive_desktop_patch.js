(function(){
'use strict';
if(window.__sunblissCeoResponsiveDesktopInstalled)return;
window.__sunblissCeoResponsiveDesktopInstalled=true;
var timer=null,observer=null;
function text(v){return v==null?'':String(v)}
function mode(){try{return new URLSearchParams(location.search).get('ceo-preview')==='1'||(window.state&&state.userRole==='ceo')}catch(_e){return false}}
function styles(){if(document.getElementById('ceoResponsiveDesktopStyles'))return;var s=document.createElement('style');s.id='ceoResponsiveDesktopStyles';s.textContent=`
.ceo-desktop-nav{display:none}
@media(min-width:900px){
  body.ceo-mode.ceo-pro3{background:var(--paper)!important}
  body.ceo-mode.ceo-pro3 #app{max-width:none!important;width:100%!important;margin:0!important;padding:0!important;background:var(--paper)!important}
  body.ceo-mode.ceo-pro3 .ceo-shell{width:100%!important;min-height:100vh!important;background:var(--paper)!important}
  body.ceo-mode.ceo-pro3 .topbar.sunbliss-professional-header{width:100%!important;min-height:236px!important;padding:20px 40px 24px!important}
  body.ceo-mode.ceo-pro3 .topbar.sunbliss-professional-header::after{left:40px!important;right:40px!important;top:112px!important}
  body.ceo-mode.ceo-pro3 .sb-pro-top,body.ceo-mode.ceo-pro3 .sb-pro-main{width:100%!important;max-width:1440px!important;margin-left:auto!important;margin-right:auto!important}
  body.ceo-mode.ceo-pro3 .sb-pro-main{margin-top:26px!important}
  body.ceo-mode.ceo-pro3 .sb-pro-brand-name{font-size:31px!important}
  body.ceo-mode.ceo-pro3 .sb-pro-name{font-size:36px!important}
  body.ceo-mode.ceo-pro3 .sb-pro-role{font-size:10.5px!important;min-height:31px!important}
  .ceo-desktop-nav{display:flex;position:sticky;top:0;z-index:80;height:58px;align-items:stretch;justify-content:center;gap:2px;background:rgba(246,241,228,.98);border-bottom:1px solid var(--paper-line);backdrop-filter:blur(12px);padding:0 32px}
  .ceo-desktop-nav-inner{width:100%;max-width:1440px;display:flex;align-items:stretch;gap:2px}
  .ceo-desktop-nav button{appearance:none;border:0;background:transparent;color:var(--muted);padding:0 22px;min-width:128px;font:600 11px/1 Inter,system-ui,sans-serif;position:relative;cursor:pointer;transition:color .14s ease,background .14s ease}
  .ceo-desktop-nav button:hover{color:var(--ink);background:rgba(198,151,46,.055)}
  .ceo-desktop-nav button.active{color:var(--ink)}
  .ceo-desktop-nav button.active:after{content:'';position:absolute;left:20px;right:20px;bottom:0;height:3px;border-radius:3px 3px 0 0;background:var(--gold)}
  body.ceo-mode.ceo-pro3 .ceo-bottom{display:none!important}
  body.ceo-mode.ceo-pro3 .ceo-content{width:100%!important;max-width:none!important;margin:0!important;padding:30px 40px 72px!important;border-radius:0!important;background:var(--paper)!important;min-height:calc(100vh - 294px)!important}
  body.ceo-mode.ceo-pro3 .ceo-overview,body.ceo-mode.ceo-pro3 .ceo-decisions,body.ceo-mode.ceo-pro3 .ceo-portfolio,body.ceo-mode.ceo-pro3 .ceo-search-page{width:100%!important;max-width:1440px!important;margin:0 auto!important}
  body.ceo-mode.ceo-pro3 .ceo-overview{display:grid!important;grid-template-columns:repeat(12,minmax(0,1fr))!important;gap:16px!important;align-items:start!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-pro3-intro{grid-column:1/-1!important;margin:0 0 2px!important;padding:0 1px 4px!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-kpi-grid{grid-column:1/-1!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important;margin:0!important}
  body.ceo-mode.ceo-pro3 .ceo-kpi{min-height:118px!important;padding:18px 40px 16px 17px!important}
  body.ceo-mode.ceo-pro3 .ceo-kpi-label{font-size:9px!important;margin-bottom:10px!important}
  body.ceo-mode.ceo-pro3 .ceo-kpi-value{font-size:24px!important}
  body.ceo-mode.ceo-pro3 .ceo-kpi-sub{font-size:9.5px!important;max-width:240px!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-clean-actions{grid-column:1/-1!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;border:1px solid var(--paper-line)!important;border-radius:13px!important;overflow:hidden!important;margin:0!important}
  body.ceo-mode.ceo-pro3 .ceo-clean-action{border-top:0!important;border-left:1px solid var(--paper-line)!important;min-height:68px!important;padding:13px 14px!important;grid-template-columns:36px 1fr 18px!important}
  body.ceo-mode.ceo-pro3 .ceo-clean-action:first-child{border-left:0!important}
  body.ceo-mode.ceo-pro3 .ceo-clean-action .ic{width:36px!important;height:36px!important}
  body.ceo-mode.ceo-pro3 .ceo-clean-action strong{font-size:11.5px!important}
  body.ceo-mode.ceo-pro3 .ceo-clean-action span{font-size:9.3px!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-section{margin-top:0!important;min-width:0!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-section.ceo-desk-primary{grid-column:span 7!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-section.ceo-desk-secondary{grid-column:span 5!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-section.ceo-desk-half{grid-column:span 6!important}
  body.ceo-mode.ceo-pro3 .ceo-overview>.ceo-section.ceo-desk-full{grid-column:1/-1!important}
  body.ceo-mode.ceo-pro3 .ceo-card{border-radius:13px!important}
  body.ceo-mode.ceo-pro3 .ceo-section-head{padding:15px 16px 11px!important}
  body.ceo-mode.ceo-pro3 .ceo-section-title{font-size:17px!important}
  body.ceo-mode.ceo-pro3 .ceo-section-sub{font-size:9.5px!important}
  body.ceo-mode.ceo-pro3 .ceo-decision-row{padding:13px 36px 13px 15px!important}
  body.ceo-mode.ceo-pro3 .ceo-decision-note{font-size:9.5px!important;-webkit-line-clamp:2!important}
  body.ceo-mode.ceo-pro3 .ceo-metric-block{padding:9px 15px 14px!important}
  body.ceo-mode.ceo-pro3 .ceo-metric-row{padding:8px 0!important}
  body.ceo-mode.ceo-pro3 .ceo-cash-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;padding:0 15px 14px!important}
  body.ceo-mode.ceo-pro3 .ceo-aging{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:8px!important;padding:0 15px 14px!important}
  body.ceo-mode.ceo-pro3 .ceo-page-title{padding:0 0 16px!important}
  body.ceo-mode.ceo-pro3 .ceo-page-title h2{font-size:27px!important}
  body.ceo-mode.ceo-pro3 .ceo-page-title p{font-size:10.5px!important;max-width:720px!important}
  body.ceo-mode.ceo-pro3 .ceo-search{max-width:760px!important;padding:12px 14px!important}
  body.ceo-mode.ceo-pro3 .ceo-overlay{align-items:center!important;padding:28px!important}
  body.ceo-mode.ceo-pro3 .ceo-detail{width:min(960px,92vw)!important;max-height:88vh!important;border-radius:18px!important;margin:auto!important}
}
@media(min-width:1400px){
  body.ceo-mode.ceo-pro3 .topbar.sunbliss-professional-header{padding-left:56px!important;padding-right:56px!important}
  body.ceo-mode.ceo-pro3 .ceo-content{padding-left:56px!important;padding-right:56px!important}
}
`;
document.head.appendChild(s)}
function route(view){var original=document.querySelector('.ceo-nav-btn[data-ceo-view="'+view+'"]');if(original){original.click();return true}return false}
function desktopNav(){var shell=document.querySelector('.ceo-shell'),content=shell&&shell.querySelector('.ceo-content');if(!shell||!content)return;var nav=document.getElementById('ceoDesktopNav');if(!nav){nav=document.createElement('nav');nav.id='ceoDesktopNav';nav.className='ceo-desktop-nav';nav.setAttribute('aria-label','Executive navigation');nav.innerHTML='<div class="ceo-desktop-nav-inner"><button data-route="overview">Overview</button><button data-route="decisions">Decision Centre</button><button data-route="portfolio">Portfolio</button><button data-route="search">Search</button></div>';shell.insertBefore(nav,content);nav.querySelectorAll('button').forEach(function(b){b.addEventListener('click',function(){route(this.getAttribute('data-route'))})})}syncNav()}
function syncNav(){var nav=document.getElementById('ceoDesktopNav');if(!nav)return;var active=document.querySelector('.ceo-nav-btn.active'),view=active&&active.getAttribute('data-ceo-view');if(!view){if(document.querySelector('.ceo-overview'))view='overview';else if(document.querySelector('.ceo-decisions'))view='decisions';else if(document.querySelector('.ceo-portfolio'))view='portfolio';else if(document.querySelector('.ceo-search-page'))view='search'}nav.querySelectorAll('button').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-route')===view)})}
function classify(){document.querySelectorAll('.ceo-overview>.ceo-section').forEach(function(sec){sec.classList.remove('ceo-desk-primary','ceo-desk-secondary','ceo-desk-half','ceo-desk-full');var h=sec.querySelector('.ceo-section-title'),t=h?text(h.textContent).trim().toLowerCase():'';if(/decision/.test(t))sec.classList.add('ceo-desk-primary');else if(/collection/.test(t))sec.classList.add('ceo-desk-secondary');else if(/portfolio|overdue|extension|commercial|health|attention/.test(t))sec.classList.add('ceo-desk-half');else sec.classList.add('ceo-desk-half')})}
function enhance(){if(!mode())return;styles();desktopNav();classify();syncNav()}
function schedule(){clearTimeout(timer);timer=setTimeout(enhance,45)}
function attach(){var app=document.getElementById('app');if(!app||observer)return;observer=new MutationObserver(schedule);observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('resize',schedule,{passive:true});schedule();setTimeout(enhance,250);setTimeout(enhance,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach);else attach();
})();
