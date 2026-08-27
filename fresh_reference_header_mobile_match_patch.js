(function(){
  'use strict';
  if(window.__sunblissFreshReferenceMobileMatchInstalled)return;
  window.__sunblissFreshReferenceMobileMatchInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissFreshReferenceMobileMatchStyles';
  style.textContent=`
    @media(max-width:720px){
      .topbar.sunbliss-fresh-reference-header{height:63.87vw!important;min-height:0!important;max-height:none!important;}

      .sb-ref-brand{left:6.1%!important;top:7.3%!important;width:46.8%!important;height:20.3%!important;overflow:hidden!important;}
      .sb-ref-brand img{width:178%!important;height:178%!important;max-width:none!important;object-fit:contain!important;object-position:left center!important;transform:translate(-1.5%,-1%)!important;transform-origin:left center!important;mix-blend-mode:screen!important;filter:brightness(1.06) saturate(1.06)!important;}

      .sb-ref-vline{left:56.4%!important;top:8.8%!important;height:16.7%!important;}
      .sb-ref-hline{top:31%!important;}

      .sb-ref-tools{right:5.7%!important;top:13.45%!important;gap:1.9vw!important;}
      .sb-ref-sync,.sb-ref-signout{height:5.18vw!important;min-height:0!important;border-radius:2.7vw!important;}
      .sb-ref-sync{width:19.8vw!important;min-width:0!important;padding:0 1.25vw!important;gap:.82vw!important;font-size:1.55vw!important;}
      .sb-ref-sync svg{width:2.35vw!important;height:2.35vw!important;}
      .sb-ref-signout{width:13.5vw!important;min-width:0!important;padding:0 1.05vw!important;gap:.82vw!important;font-size:1.55vw!important;border-width:.11vw!important;}
      .sb-ref-signout svg{width:2.45vw!important;height:2.45vw!important;}

      .sb-ref-welcome{left:6.15%!important;top:40.2%!important;font-size:2.3vw!important;line-height:1.12!important;}
      .sb-ref-name-row{left:6.15%!important;top:47.6%!important;max-width:57%!important;gap:2vw!important;}
      .sb-ref-name{font-size:5.15vw!important;line-height:1!important;}
      .sb-ref-role{height:4.55vw!important;min-height:0!important;padding:0 1.8vw!important;font-size:1.52vw!important;border-width:.1vw!important;}

      .sb-ref-project{left:5.75%!important;top:61.1%!important;width:38.2%!important;height:13.05%!important;border-radius:2.65vw!important;}
      .sb-ref-project-icon{width:20.7%!important;}
      .sb-ref-project-icon svg{width:42%!important;height:42%!important;}
      .sb-ref-project-name{padding-left:4.6%!important;font-size:2.05vw!important;}
      .sb-ref-project-arrow{margin-right:5.4%!important;font-size:3.4vw!important;}

      .sb-ref-skyline{right:-2.4%!important;bottom:-1.5%!important;width:61.8%!important;height:84%!important;transform:scale(1.04,1.1)!important;transform-origin:right bottom!important;}
      .sb-ref-skyline .city{stroke-width:1.05!important;opacity:.82!important;}
      .sb-ref-skyline .burj{stroke-width:1.45!important;}
      .sb-ref-skyline::after{content:'';position:absolute;right:5%;bottom:1.2%;width:72%;height:9%;background:radial-gradient(ellipse at 58% 62%,rgba(240,179,74,.65),rgba(200,132,39,.18) 28%,transparent 65%);filter:blur(3px);opacity:.78;pointer-events:none;}

      .sb-ref-curves{left:-6%!important;bottom:-4%!important;width:59%!important;height:33%!important;opacity:.22!important;}
    }
  `;
  document.head.appendChild(style);
})();
