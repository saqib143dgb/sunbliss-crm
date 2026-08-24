(function(){
  'use strict';
  if (window.__sunblissHeader30PctAlignInstalled) return;
  window.__sunblissHeader30PctAlignInstalled = true;

  var style=document.createElement('style');
  style.id='sunblissHeader30PctAlignStyles';
  style.textContent=`
    .topbar.sunbliss-premium-header{
      height:213px!important;
      min-height:213px!important;
      max-height:213px!important;
      padding:10px 20px 12px!important;
    }
    .sunbliss-header-top{
      gap:8px!important;
    }
    .sunbliss-original-brand-logo{
      width:66px!important;
      max-height:76px!important;
    }
    .sunbliss-header-tools{
      padding-top:0!important;
    }
    .sunbliss-hero-copy{
      max-width:calc(100% - 150px)!important;
      margin-top:9px!important;
    }
    .sunbliss-welcome{
      margin-bottom:3px!important;
      font-size:13px!important;
    }
    .sunbliss-name-line{
      gap:7px 10px!important;
    }
    .sunbliss-name-line h1{
      font-size:31px!important;
    }
    .sunbliss-role-pill{
      min-height:28px!important;
      padding:0 11px!important;
      font-size:10px!important;
    }
    .sunbliss-project-line{
      margin-top:8px!important;
      font-size:14px!important;
    }
    .sunbliss-project-line svg{
      width:17px!important;
      height:17px!important;
    }
    .sunbliss-hero-art{
      top:36px!important;
      bottom:auto!important;
      height:177px!important;
    }
    .sunbliss-hero-line{
      top:105px!important;
    }
    .sunbliss-hero-signout{
      bottom:auto!important;
      height:36px!important;
      min-width:104px!important;
      padding:0 12px!important;
    }

    @media(max-width:720px){
      .topbar.sunbliss-premium-header{
        height:185px!important;
        min-height:185px!important;
        max-height:185px!important;
        padding:8px 10px 9px!important;
      }
      .sunbliss-original-brand-logo{
        width:50px!important;
        max-height:58px!important;
      }
      .sunbliss-sync-pill{
        height:31px!important;
        min-width:98px!important;
        padding:0 7px!important;
        border-radius:11px!important;
        font-size:9px!important;
      }
      .sunbliss-sync-pill svg{
        width:14px!important;
        height:14px!important;
      }
      .sunbliss-bell{
        width:31px!important;
        height:31px!important;
        border-radius:11px!important;
      }
      .sunbliss-bell svg{
        width:16px!important;
        height:16px!important;
      }
      .sunbliss-bell-dot{
        right:4px!important;
        top:4px!important;
        width:6px!important;
        height:6px!important;
      }
      .sunbliss-hero-copy{
        max-width:calc(100% - 108px)!important;
        margin-top:7px!important;
      }
      .sunbliss-welcome{
        margin-bottom:2px!important;
        font-size:10.5px!important;
      }
      .sunbliss-name-line{
        flex-wrap:nowrap!important;
        gap:6px!important;
      }
      .sunbliss-name-line h1{
        font-size:22px!important;
        white-space:nowrap!important;
      }
      .sunbliss-role-pill{
        min-height:23px!important;
        padding:0 7px!important;
        font-size:8px!important;
      }
      .sunbliss-project-line{
        margin-top:6px!important;
        gap:6px!important;
        font-size:11.5px!important;
      }
      .sunbliss-project-line svg{
        width:14px!important;
        height:14px!important;
      }
      .sunbliss-hero-art{
        top:33px!important;
        right:-96px!important;
        width:315px!important;
        height:152px!important;
      }
      .sunbliss-hero-shade::after{
        top:48px!important;
      }
      .sunbliss-hero-line{
        top:96px!important;
      }
      .sunbliss-hero-signout{
        right:10px!important;
        height:32px!important;
        min-width:91px!important;
        padding:0 9px!important;
        gap:6px!important;
        border-radius:11px!important;
        font-size:10px!important;
      }
      .sunbliss-hero-signout svg{
        width:15px!important;
        height:15px!important;
      }
    }

    @media(max-width:385px){
      .topbar.sunbliss-premium-header{
        height:181px!important;
        min-height:181px!important;
        max-height:181px!important;
      }
      .sunbliss-original-brand-logo{
        width:47px!important;
        max-height:55px!important;
      }
      .sunbliss-sync-pill{
        min-width:94px!important;
        font-size:8.6px!important;
      }
      .sunbliss-hero-copy{
        max-width:calc(100% - 103px)!important;
        margin-top:6px!important;
      }
      .sunbliss-name-line h1{
        font-size:20.5px!important;
      }
      .sunbliss-role-pill{
        font-size:7.6px!important;
      }
      .sunbliss-project-line{
        font-size:11px!important;
      }
      .sunbliss-hero-art{
        right:-102px!important;
        height:148px!important;
      }
      .sunbliss-hero-signout{
        right:8px!important;
        min-width:88px!important;
        font-size:9.6px!important;
      }
    }
  `;
  document.head.appendChild(style);

  function alignSignout(){
    var header=document.querySelector('.topbar.sunbliss-premium-header');
    var nameLine=header&&header.querySelector('.sunbliss-name-line');
    var signout=header&&header.querySelector('.sunbliss-hero-signout');
    if(!header||!nameLine||!signout) return;
    var hr=header.getBoundingClientRect();
    var nr=nameLine.getBoundingClientRect();
    var buttonHeight=signout.offsetHeight||32;
    var top=(nr.top-hr.top)+((nr.height-buttonHeight)/2);
    var maxTop=Math.max(0,hr.height-buttonHeight-8);
    signout.style.top=Math.max(0,Math.min(maxTop,top))+'px';
    signout.style.bottom='auto';
  }

  function scheduleAlign(){
    requestAnimationFrame(function(){
      alignSignout();
      requestAnimationFrame(alignSignout);
    });
  }

  if(typeof window.render==='function'&&!window.__sunblissHeader30PctRenderWrapped){
    var previousRender=window.render;
    window.render=function(){
      var result=previousRender.apply(this,arguments);
      scheduleAlign();
      return result;
    };
    window.__sunblissHeader30PctRenderWrapped=true;
  }

  window.addEventListener('resize',scheduleAlign,{passive:true});
  scheduleAlign();
  setTimeout(scheduleAlign,50);
})();
