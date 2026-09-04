(function(){
  'use strict';
  if(window.__sunblissDesktopHeaderBrandRefineInstalled)return;
  window.__sunblissDesktopHeaderBrandRefineInstalled=true;

  var MQ='(min-width:1024px)',queued=false;
  function desktop(){return window.matchMedia?window.matchMedia(MQ).matches:window.innerWidth>=1024}

  function installStyle(){
    if(document.getElementById('sunblissDesktopHeaderBrandRemoveStyle'))return;
    var style=document.createElement('style');
    style.id='sunblissDesktopHeaderBrandRemoveStyle';
    style.textContent=`
      @media(min-width:1024px){
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
          --sb-desktop-header-h:clamp(330px,calc((100vw - 216px - 36px)/3),430px);
          position:relative!important;
          width:calc(100% - 36px)!important;
          height:var(--sb-desktop-header-h)!important;
          min-height:var(--sb-desktop-header-h)!important;
          max-height:430px!important;
          margin:18px 18px 0!important;
          padding:30px 36px 30px!important;
          overflow:hidden!important;
          border:1px solid rgba(224,170,78,.62)!important;
          border-radius:22px!important;
          background:linear-gradient(118deg,#061521 0%,#091b2a 56%,#0a1c2c 100%)!important;
          box-shadow:0 16px 38px rgba(2,9,15,.16),inset 0 1px 0 rgba(255,231,184,.045)!important;
          color:#f8f4ea!important;
          isolation:isolate!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:before{
          content:''!important;
          position:absolute!important;
          inset:0!important;
          z-index:1!important;
          width:auto!important;
          height:auto!important;
          border:0!important;
          border-radius:inherit!important;
          box-shadow:none!important;
          background:
            linear-gradient(90deg,rgba(4,14,23,.99) 0%,rgba(4,14,23,.96) 31%,rgba(4,14,23,.83) 42%,rgba(4,14,23,.34) 58%,rgba(4,14,23,.08) 78%,rgba(4,14,23,.02) 100%),
            radial-gradient(ellipse 43% 60% at 70% 52%,rgba(198,151,46,.10),transparent 74%)!important;
          pointer-events:none!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header:after{
          content:''!important;
          position:absolute!important;
          left:41%!important;
          right:-4%!important;
          bottom:-18%!important;
          top:auto!important;
          z-index:2!important;
          width:auto!important;
          height:48%!important;
          border:0!important;
          background:repeating-radial-gradient(ellipse at 100% 100%,transparent 0 27px,rgba(214,162,70,.13) 28px 29px,transparent 30px 53px)!important;
          opacity:.72!important;
          pointer-events:none!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-visual{
          display:block!important;
          position:absolute!important;
          z-index:0!important;
          top:0!important;
          right:0!important;
          bottom:0!important;
          left:44%!important;
          background-image:url('assets/sunbliss-mobile-header-background.webp')!important;
          background-repeat:no-repeat!important;
          background-size:cover!important;
          background-position:center 61%!important;
          pointer-events:none!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-visual:after{
          content:'';
          position:absolute;
          inset:0;
          background:linear-gradient(90deg,#071723 0%,rgba(7,23,35,.72) 14%,rgba(7,23,35,.18) 43%,rgba(7,23,35,.02) 72%),linear-gradient(180deg,rgba(3,12,20,.08),transparent 47%,rgba(3,12,20,.26));
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-top,
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-main{
          position:relative!important;
          z-index:4!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-top{
          display:flex!important;
          align-items:flex-start!important;
          justify-content:space-between!important;
          min-height:76px!important;
          gap:24px!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand{
          display:flex!important;
          flex-direction:row!important;
          align-items:flex-start!important;
          justify-content:flex-start!important;
          width:auto!important;
          max-width:52%!important;
          min-width:0!important;
          gap:0!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-logo-frame{
          display:none!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-copy{
          display:flex!important;
          flex-direction:column!important;
          justify-content:flex-start!important;
          width:auto!important;
          max-width:none!important;
          min-width:0!important;
          height:auto!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-name{
          display:block!important;
          margin:0!important;
          color:#e0aa4e!important;
          font:600 clamp(29px,2.1vw,38px)/1 Fraunces,Georgia,'Times New Roman',serif!important;
          letter-spacing:.085em!important;
          white-space:nowrap!important;
          text-shadow:0 2px 16px rgba(214,162,70,.13)!important;
          transform:none!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub{
          display:block!important;
          width:100%!important;
          margin-top:9px!important;
          padding:0!important;
          color:rgba(228,180,92,.93)!important;
          font:600 8px/1.25 Inter,system-ui,sans-serif!important;
          letter-spacing:.10em!important;
          white-space:nowrap!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-brand-sub-inner{
          display:flex!important;
          width:100%!important;
          align-items:center!important;
          justify-content:space-between!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-actions{
          position:relative!important;
          top:auto!important;
          right:auto!important;
          display:flex!important;
          align-items:flex-start!important;
          justify-content:flex-end!important;
          flex:none!important;
          overflow:visible!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout{
          height:44px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:9px!important;
          padding:0 18px!important;
          border:1px solid rgba(224,170,78,.72)!important;
          border-radius:13px!important;
          background:rgba(3,13,22,.34)!important;
          color:#f6ddb0!important;
          font:600 12px/1 Inter,system-ui,sans-serif!important;
          box-shadow:inset 0 1px 0 rgba(255,231,184,.10),0 10px 28px rgba(1,8,14,.17)!important;
          -webkit-backdrop-filter:blur(7px)!important;
          backdrop-filter:blur(7px)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-signout svg{
          width:18px!important;
          height:18px!important;
          stroke:#e0aa4e!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main{
          display:flex!important;
          align-items:flex-start!important;
          margin-top:clamp(17px,1.55vw,28px)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-main:before{display:none!important}
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{
          width:min(650px,47%)!important;
          min-width:470px!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-welcome{
          margin:0 0 8px!important;
          color:#e1b35e!important;
          font:500 clamp(13px,1.05vw,17px)/1.3 Inter,system-ui,sans-serif!important;
          letter-spacing:.01em!important;
          text-shadow:0 2px 9px rgba(0,0,0,.64)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name-row{
          display:flex!important;
          align-items:center!important;
          gap:18px!important;
          flex-wrap:nowrap!important;
          white-space:nowrap!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name{
          margin:0!important;
          color:#fff7e8!important;
          font:500 clamp(40px,3.7vw,62px)/.98 Fraunces,Georgia,'Times New Roman',serif!important;
          letter-spacing:-.028em!important;
          white-space:nowrap!important;
          text-shadow:0 3px 14px rgba(0,0,0,.52)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-role{
          min-height:38px!important;
          display:inline-flex!important;
          align-items:center!important;
          padding:0 16px!important;
          border:1px solid rgba(224,170,78,.86)!important;
          border-radius:999px!important;
          background:rgba(5,18,29,.34)!important;
          color:#e5b45a!important;
          font:650 11px/1 Inter,system-ui,sans-serif!important;
          box-shadow:inset 0 1px 0 rgba(255,231,184,.07)!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row{
          position:relative!important;
          isolation:isolate!important;
          display:flex!important;
          align-items:center!important;
          justify-content:flex-start!important;
          width:min(610px,100%)!important;
          min-width:0!important;
          min-height:94px!important;
          margin-top:clamp(24px,2.3vw,38px)!important;
          padding:13px 18px!important;
          gap:0!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row:before{
          content:''!important;
          position:absolute!important;
          inset:0!important;
          z-index:-1!important;
          border:1px solid rgba(224,170,78,.54)!important;
          border-radius:16px!important;
          background:linear-gradient(90deg,rgba(5,18,29,.72),rgba(5,18,29,.38))!important;
          box-shadow:inset 0 1px 0 rgba(255,231,184,.05),0 12px 30px rgba(1,8,14,.14)!important;
          -webkit-backdrop-filter:blur(6px)!important;
          backdrop-filter:blur(6px)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project{
          display:flex!important;
          align-items:center!important;
          gap:16px!important;
          min-width:0!important;
          width:100%!important;
          color:#f5f0e6!important;
          text-shadow:0 2px 9px rgba(0,0,0,.66)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon{
          width:62px!important;
          height:62px!important;
          flex:0 0 62px!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          border:1px solid rgba(214,162,70,.46)!important;
          border-radius:50%!important;
          background:radial-gradient(circle,rgba(214,162,70,.12),rgba(7,21,32,.20) 72%)!important;
          box-shadow:inset 0 1px 0 rgba(255,231,184,.07),0 9px 22px rgba(1,8,14,.17)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon svg{
          width:29px!important;
          height:29px!important;
          stroke:#e0aa4e!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-copy{
          display:flex!important;
          flex-direction:column!important;
          min-width:0!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-name{
          display:block!important;
          color:#fff7e8!important;
          font:600 clamp(18px,1.55vw,25px)/1.1 Fraunces,Georgia,'Times New Roman',serif!important;
          white-space:nowrap!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-desktop-project-sub{
          display:block!important;
          margin-top:7px!important;
          color:rgba(224,170,78,.79)!important;
          font:500 11px/1 Inter,system-ui,sans-serif!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-sep{display:none!important}

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync{
          position:absolute!important;
          z-index:5!important;
          right:30px!important;
          bottom:28px!important;
          top:auto!important;
          left:auto!important;
          transform:none!important;
          height:42px!important;
          display:flex!important;
          align-items:center!important;
          gap:9px!important;
          padding:0 16px!important;
          border:1px solid rgba(103,174,91,.72)!important;
          border-radius:999px!important;
          background:rgba(3,13,22,.66)!important;
          color:#fff7e8!important;
          font:550 11px/1 Inter,system-ui,sans-serif!important;
          white-space:nowrap!important;
          box-shadow:inset 0 1px 0 rgba(255,231,184,.05),0 10px 28px rgba(1,8,14,.17)!important;
          -webkit-backdrop-filter:blur(7px)!important;
          backdrop-filter:blur(7px)!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync svg{
          width:17px!important;
          height:17px!important;
          stroke:#6ec563!important;
        }

        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-v2-sync,
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-v2-tagline,
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-dubai-skyline{
          display:none!important;
        }

        body.sunbliss-ref-desktop main#main{
          min-height:calc(100vh - var(--sb-desktop-header-h) - 18px)!important;
        }
      }

      @media(min-width:1024px) and (max-width:1180px){
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header{
          --sb-desktop-header-h:350px;
          padding-left:28px!important;
          padding-right:28px!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-copy{
          min-width:430px!important;
          width:50%!important;
        }
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-name{font-size:42px!important}
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-row{width:500px!important;min-height:84px!important;margin-top:24px!important}
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header .sb-pro-project-icon{width:54px!important;height:54px!important;flex-basis:54px!important}
        body.sunbliss-ref-desktop .topbar.sunbliss-professional-header>.sb-pro-sync{right:24px!important;bottom:24px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureProjectVisual(header){
    if(!header)return;
    var visual=header.querySelector('.sb-desktop-project-visual');
    if(!visual){
      visual=document.createElement('div');
      visual.className='sb-desktop-project-visual';
      visual.setAttribute('aria-hidden','true');
      header.insertBefore(visual,header.firstChild);
    }
  }

  function ensureProjectCopy(header){
    if(!header)return;
    var project=header.querySelector('.sb-pro-project');
    if(!project||project.querySelector('.sb-desktop-project-copy'))return;
    var label=null;
    Array.prototype.some.call(project.children,function(node){
      if(node.tagName==='SPAN'&&!node.classList.contains('sb-pro-project-icon')&&!node.classList.contains('sb-pro-project-sep')){label=node;return true}
      return false;
    });
    if(!label)return;
    var wrap=document.createElement('span');
    wrap.className='sb-desktop-project-copy';
    label.className='sb-desktop-project-name';
    label.parentNode.insertBefore(wrap,label);
    wrap.appendChild(label);
    var sub=document.createElement('span');
    sub.className='sb-desktop-project-sub';
    sub.textContent='Active Project';
    wrap.appendChild(sub);
  }

  function placeSync(header){
    if(!header)return;
    var sync=header.querySelector('.sb-pro-sync');
    var projectRow=header.querySelector('.sb-pro-project-row');
    if(desktop()){
      if(sync&&sync.parentNode!==header)header.appendChild(sync);
    }else if(sync&&projectRow&&sync.parentNode!==projectRow){
      sync.style.removeProperty('top');
      sync.style.removeProperty('left');
      sync.style.removeProperty('right');
      sync.style.removeProperty('bottom');
      sync.style.removeProperty('transform');
      projectRow.appendChild(sync);
    }
  }

  function apply(){
    installStyle();
    var header=document.querySelector('.topbar.sunbliss-professional-header');
    if(!header)return;
    if(desktop()){
      ensureProjectVisual(header);
      ensureProjectCopy(header);
      placeSync(header);
    }else{
      var visual=header.querySelector('.sb-desktop-project-visual');
      if(visual)visual.remove();
      placeSync(header);
    }
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;apply()});
  }

  function wrap(name){
    var fn=window[name];
    if(typeof fn!=='function'||fn.__sbApprovedDesktopHeader)return;
    function wrapped(){var result=fn.apply(this,arguments);schedule();return result}
    wrapped.__sbApprovedDesktopHeader=true;
    window[name]=wrapped;
  }

  function install(){
    installStyle();
    apply();
    wrap('renderMain');
    wrap('render');
    wrap('renderOverview');
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('pageshow',schedule);
    setTimeout(function(){apply();wrap('renderMain');wrap('render');wrap('renderOverview')},120);
    setTimeout(function(){apply();wrap('renderMain');wrap('render');wrap('renderOverview')},500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
