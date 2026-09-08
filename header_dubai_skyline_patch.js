(function(){
  'use strict';
  if(window.__sunblissDubaiSkylinePatchInstalled)return;
  window.__sunblissDubaiSkylinePatchInstalled=true;

  function ensureStyles(){
    if(document.getElementById('sunblissDubaiSkylineStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissDubaiSkylineStyles';
    style.textContent=`
      .topbar.sunbliss-professional-header{isolation:isolate!important;}
      .sb-dubai-skyline{
        position:absolute!important;
        right:-8px!important;
        bottom:-2px!important;
        width:min(54%,620px)!important;
        height:82%!important;
        z-index:1!important;
        opacity:.18!important;
        pointer-events:none!important;
        overflow:hidden!important;
        -webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.35) 18%,#000 38%,#000 100%);
        mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.35) 18%,#000 38%,#000 100%);
      }
      .sb-dubai-skyline svg{display:block;width:100%;height:100%;}
      .sb-dubai-skyline .sb-sky-main{fill:none;stroke:#dfad50;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;}
      .sb-dubai-skyline .sb-sky-detail{fill:none;stroke:#7f9aaa;stroke-width:1.05;stroke-linecap:round;stroke-linejoin:round;}
      .sb-dubai-skyline .sb-sky-ground{fill:none;stroke:#c99740;stroke-width:1.2;stroke-linecap:round;}

      /* Desktop skyline: deliberately large and recognisable. The previous
         version was stretched too thin, which made it read as random vertical
         lines instead of a skyline. Keep the native SVG proportions and let
         Burj Khalifa / Burj Al Arab anchor the empty center of the header. */
      @media(min-width:1024px){
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main.sb-pro-main::after{
          content:none!important;
          display:none!important;
          background:none!important;
          opacity:0!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline{
          display:block!important;
          left:27%!important;
          right:20%!important;
          bottom:-24px!important;
          width:auto!important;
          max-width:none!important;
          height:148%!important;
          opacity:.34!important;
          z-index:1!important;
          overflow:visible!important;
          -webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.92) 8%,#000 18%,#000 88%,transparent 100%)!important;
          mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.92) 8%,#000 18%,#000 88%,transparent 100%)!important;
          filter:drop-shadow(0 0 11px rgba(198,151,46,.07))!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline .sb-sky-main{
          stroke:#dfad50!important;
          stroke-width:2.15!important;
          stroke-opacity:.78!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline .sb-sky-detail{
          stroke:#839dab!important;
          stroke-width:1.05!important;
          stroke-opacity:.42!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline .sb-sky-ground{
          stroke:#c99a43!important;
          stroke-opacity:.44!important;
        }
      }

      @media(min-width:1440px){
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline{
          left:25%!important;
          right:18%!important;
          bottom:-29px!important;
          height:158%!important;
          opacity:.35!important;
        }
      }

      @media(min-width:1800px){
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline{
          left:24%!important;
          right:17%!important;
          height:164%!important;
        }
      }

      @media(max-width:720px){
        .sb-dubai-skyline{right:-22px!important;width:61%!important;height:72%!important;opacity:.14!important;}
      }
      @media(max-width:390px){
        .sb-dubai-skyline{right:-28px!important;width:64%!important;height:68%!important;opacity:.12!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function skylineMarkup(){
    return '<div class="sb-dubai-skyline" aria-hidden="true">'+
      '<svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMax meet" role="presentation">'+
        '<g class="sb-sky-main">'+
          '<path d="M18 252H882"/>'+
          '<path d="M38 252V208h34v44M84 252v-70h38v70M136 252v-49h28v49"/>'+
          '<path d="M178 252v-105l22-25 22 25v105M187 147h26M190 165h20M193 183h14"/>'+
          '<path d="M238 252v-83h36v83M286 252v-118h42v118M339 252v-63h30v63"/>'+
          '<path d="M390 252v-26h10v-25h10v-28h10v-31h9v-35h9V71h8V34h5V12h4v22h5v37h8v36h9v35h9v31h10v28h10v25h10v26"/>'+
          '<path d="M404 226h102M414 201h82M424 173h62M433 142h44M442 107h26M449 71h12"/>'+
          '<path d="M532 252v-93h38v93M584 252v-66h31v66"/>'+
          '<path d="M636 252v-117c26 8 47 30 58 61 8 21 9 39 8 56M636 135c27 20 45 43 55 72M640 151l48 18M640 178l56 17M640 207l61 14"/>'+
          '<path d="M718 252v-88h35v88M766 252v-58h30v58M810 252v-103h42v103M862 252v-48h20"/>'+
        '</g>'+
        '<g class="sb-sky-detail">'+
          '<path d="M53 217v25M65 217v25M96 193v48M110 193v48M253 180v62M266 180v62M302 146v96M315 146v96"/>'+
          '<path d="M548 171v70M558 171v70M735 176v65M746 176v65M827 161v80M839 161v80"/>'+
          '<path d="M376 264c83-16 183-16 279 0M284 274c149-21 311-20 470 1"/>'+
        '</g>'+
        '<g class="sb-sky-ground"><path d="M64 260c145 8 243 8 358 0s242-8 414 1"/></g>'+
      '</svg>'+
    '</div>';
  }

  function apply(){
    ensureStyles();
    var header=document.querySelector('.topbar.sunbliss-professional-header');
    if(!header)return;
    if(header.querySelector('.sb-dubai-skyline'))return;
    header.insertAdjacentHTML('afterbegin',skylineMarkup());
  }

  var queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(function(){queued=false;apply();});
  }

  function nodeTouchesHeader(node){
    if(!node||node.nodeType!==1)return false;
    if(node.matches&&node.matches('.topbar.sunbliss-professional-header'))return true;
    if(node.closest&&node.closest('.topbar.sunbliss-professional-header'))return true;
    return !!(node.querySelector&&node.querySelector('.topbar.sunbliss-professional-header'));
  }

  apply();
  schedule();
  setTimeout(apply,80);
  setTimeout(apply,300);

  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var r=records[i];
        if(nodeTouchesHeader(r.target)){schedule();return;}
        for(var a=0;a<r.addedNodes.length;a++)if(nodeTouchesHeader(r.addedNodes[a])){schedule();return;}
      }
    }).observe(app,{childList:true,subtree:true});
  }
})();
