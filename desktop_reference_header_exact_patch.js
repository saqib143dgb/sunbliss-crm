(function(){
'use strict';
if(window.__sunblissDesktopReferenceHeaderExact)return;
window.__sunblissDesktopReferenceHeaderExact=true;

var MQ='(min-width:1024px)',queued=false;
function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}
function text(v){return v==null?'':String(v)}
function esc(v){return text(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function roleLabel(v){var s=text(v).trim().toLowerCase();if(s==='crm_officer')return'CRM Officer';if(s==='manager')return'Manager';return s.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase()})||'CRM Officer'}
function syncTime(v){var d=v?new Date(v):new Date();if(isNaN(d.getTime()))d=new Date();return d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}
function svgIcon(name){var p={clock:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',signout:'<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',project:'<path d="M4 21V8l6-3v16M10 21V3l8 4v14M2 21h20M7 11h1M7 15h1M13 9h1M13 13h1M16 10h1M16 14h1"/>'};return'<svg viewBox="0 0 24 24" aria-hidden="true">'+p[name]+'</svg>'}
function skyline(){return '<div class="sb-rh-skyline" aria-hidden="true"><svg viewBox="0 0 760 230" preserveAspectRatio="none"><path class="fill" d="M0 222V188h26v34h19v-55h35v55h18v-76h38v76h17v-43h34v43h18v-70h43v70h17v-91h40v91h18v-53h37v53h16v-104l10-15 6-29 7 29 11 15v104h14v-79h36v79h15v-112h25v112h13V59h8l8-20 8-34 8 34 8 20h8v163h13v-95h29v95h16v-62h35v62h16v-82h40v82h14v-50h34v50h16v-90h40v90h19v-55h31v55z"/><path class="line" d="M0 222h760M0 188h26v34M45 222v-55h35v55M98 222v-76h38v76M153 222v-43h34v43M205 222v-70h43v70M265 222v-91h40v91M323 222v-53h37v53M376 222V118l10-15 6-29 7 29 11 15v104M424 222v-79h36v79M475 222v-112h25v112M513 222V59h8l8-20 8-34 8 34 8 20h8v163M574 222v-95h29v95M619 222v-62h35v62M670 222v-82h40v82M724 222v-50h34v50"/><path class="thin" d="M519 84h38M521 101h34M523 119h30M525 138h26M527 158h22M529 180h18M386 137h22M386 155h22M386 174h22M386 193h22M477 139h21M477 158h21M477 178h21M477 198h21M576 149h26M576 169h26M576 190h26M57 178v39M70 178v39M110 158v59M124 158v59M218 165v52M234 165v52"/></svg><span class="sb-rh-glow"></span></div>'}
function styles(){if(document.getElementById('sunblissDesktopReferenceHeaderExactStyles'))return;var s=document.createElement('style');s.id='sunblissDesktopReferenceHeaderExactStyles';s.textContent=`
#sbReferenceHeaderExact{display:none}
@media(min-width:1024px){
 body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{position:relative!important;height:214px!important;min-height:214px!important;padding:0!important;overflow:hidden!important;background:radial-gradient(700px 280px at 82% -20%,rgba(30,65,96,.62),transparent 63%),linear-gradient(108deg,#0a2138 0%,#081c30 49%,#071a2c 100%)!important}
 body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:before,body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:after{display:none!important}
 body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>*:not(#sbReferenceHeaderExact){display:none!important}
 #sbReferenceHeaderExact{display:block!important;position:absolute;inset:0;z-index:20;color:#fff;font-family:Inter,system-ui,sans-serif;overflow:hidden}
 .sb-rh-brand{position:absolute;left:45px;top:24px;width:360px;height:70px;z-index:5}
 .sb-rh-brand-name{display:inline-block;color:#d9a64c;font:700 34px/1 Georgia,'Times New Roman',serif;letter-spacing:.065em;white-space:nowrap;text-shadow:0 1px 8px rgba(198,151,46,.10);transform:scaleX(1.12);transform-origin:left center}
 .sb-rh-brand-sub{margin-top:8px;color:rgba(248,244,234,.94);font:600 8px/1 Inter,system-ui,sans-serif;letter-spacing:.26em;white-space:nowrap}
 .sb-rh-brand:after{content:'';position:absolute;left:0;top:68px;width:270px;height:1px;background:linear-gradient(90deg,#c6972e,rgba(198,151,46,.62),rgba(198,151,46,.08))}
 .sb-rh-user{position:absolute;left:45px;top:105px;z-index:5}
 .sb-rh-welcome{margin:0 0 5px;color:rgba(248,244,234,.92);font:500 12.5px/1.2 Inter,system-ui,sans-serif}
 .sb-rh-name-row{display:flex;align-items:center;gap:13px}.sb-rh-name{margin:0;color:#fff;font:700 33px/1 Inter,system-ui,sans-serif;letter-spacing:-.035em;text-shadow:0 2px 12px rgba(0,0,0,.16)}
 .sb-rh-role{height:30px;display:inline-flex;align-items:center;padding:0 13px;border:1px solid rgba(214,162,70,.92);border-radius:999px;color:#e1ad51;background:rgba(198,151,46,.045);font:650 10px/1 Inter,system-ui,sans-serif;white-space:nowrap}
 .sb-rh-project{position:absolute;left:45px;top:169px;z-index:5;display:flex;align-items:center;gap:11px;color:#f8f4ea;font:600 13px/1 Inter,system-ui,sans-serif}
 .sb-rh-project-icon{width:32px;height:32px;border:1px solid rgba(214,162,70,.46);border-radius:8px;background:rgba(198,151,46,.04);display:grid;place-items:center;color:#d9a64c}.sb-rh-project-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
 .sb-rh-controls{position:absolute;right:24px;top:20px;z-index:8;height:38px;display:flex;align-items:center;gap:15px}
 .sb-rh-sync{height:38px;display:flex;align-items:center;gap:8px;padding:0 1px;color:#fff;font:500 11px/1 Inter,system-ui,sans-serif;white-space:nowrap}.sb-rh-sync svg{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
 .sb-rh-divider{width:1px;height:27px;background:rgba(237,230,214,.42)}
 .sb-rh-signout{height:38px;min-width:137px;padding:0 16px;border:1px solid rgba(214,162,70,.78);border-radius:8px;background:rgba(6,21,35,.20);color:#fff;display:flex;align-items:center;justify-content:center;gap:10px;font:600 12px/1 Inter,system-ui,sans-serif;cursor:pointer}.sb-rh-signout svg{width:18px;height:18px;fill:none;stroke:#dca84c;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
 .sb-rh-skyline{position:absolute;z-index:2;right:-4px;bottom:-1px;width:54%;height:166px;opacity:.54;overflow:hidden;pointer-events:none;-webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.25) 12%,#000 31%,#000 100%);mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.25) 12%,#000 31%,#000 100%)}
 .sb-rh-skyline svg{display:block;width:100%;height:100%}.sb-rh-skyline .fill{fill:#d5a04a;fill-opacity:.14}.sb-rh-skyline .line{fill:none;stroke:#dca84c;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.sb-rh-skyline .thin{fill:none;stroke:#d5a04a;stroke-width:.9;stroke-opacity:.72}.sb-rh-glow{position:absolute;right:10%;bottom:-8px;width:220px;height:70px;background:radial-gradient(ellipse,rgba(214,162,70,.32),transparent 65%)}
 .sb-rh-tagline{position:absolute;right:43px;top:98px;z-index:7;width:115px;text-align:center;color:rgba(248,244,234,.83);font:italic 18px/1.07 'Segoe Script','Bradley Hand',cursive;transform:rotate(-6deg);text-shadow:0 2px 10px rgba(0,0,0,.32);pointer-events:none}
 body.sunbliss-ref-desktop main#main{min-height:calc(100vh - 214px)!important}
}
`;document.head.appendChild(s)}
function markup(){var st=window.state||{},name=text(st.userName).trim()||'CRM User',role=roleLabel(st.userRole),synced=syncTime(st.syncedAt);return '<div id="sbReferenceHeaderExact">'+
 '<div class="sb-rh-brand"><div class="sb-rh-brand-name">PURVANCHAL</div><div class="sb-rh-brand-sub">REAL ESTATE DEVELOPERS LLC</div></div>'+
 '<div class="sb-rh-user"><p class="sb-rh-welcome">Welcome back,</p><div class="sb-rh-name-row"><h1 class="sb-rh-name">'+esc(name)+'</h1><span class="sb-rh-role">'+esc(role)+'</span></div></div>'+
 '<div class="sb-rh-project"><span class="sb-rh-project-icon">'+svgIcon('project')+'</span><span>Sunbliss Residences</span></div>'+
 '<div class="sb-rh-controls"><div class="sb-rh-sync">'+svgIcon('clock')+'<span>Synced '+esc(synced)+'</span></div><span class="sb-rh-divider"></span><button type="button" class="sb-rh-signout" id="sbReferenceSignout">'+svgIcon('signout')+'<span>Sign out</span></button></div>'+
 skyline()+'<div class="sb-rh-tagline">Building<br>Better<br>Tomorrows</div></div>'}
function bind(root){var b=root&&root.querySelector('#sbReferenceSignout');if(!b||b.dataset.bound==='1')return;b.dataset.bound='1';b.onclick=async function(){b.disabled=true;try{if(window.sb&&sb.auth)await sb.auth.signOut();}finally{location.reload()}}}
function apply(){styles();if(!desktop())return;var h=document.querySelector('.topbar.sunbliss-professional-header');if(!h)return;var st=window.state||{},sig=[st.userName||'',st.userRole||'',st.syncedAt||''].join('|'),old=h.querySelector('#sbReferenceHeaderExact');if(old&&old.dataset.sig===sig){bind(old);return}if(old)old.remove();h.insertAdjacentHTML('beforeend',markup());var root=h.querySelector('#sbReferenceHeaderExact');if(root){root.dataset.sig=sig;bind(root)}}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply()})}
styles();apply();setTimeout(apply,80);setTimeout(apply,300);
var app=document.getElementById('app');if(app&&window.MutationObserver)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);
})();