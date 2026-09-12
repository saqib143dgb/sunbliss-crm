(function(){
  'use strict';
  if(window.__sunblissDubaiSkylinePatchInstalled)return;
  window.__sunblissDubaiSkylinePatchInstalled=true;

  var DESKTOP_MQ='(min-width:1024px)';
  var APPROVED_DESKTOP_BG='https://raw.githubusercontent.com/saqib143dgb/sunbliss-crm/3bd49b6efe227932e1f5db3968b4e8582b588232/assets/sunbliss-desktop-header-night.webp';

  function desktop(){return window.matchMedia?window.matchMedia(DESKTOP_MQ).matches:window.innerWidth>=1024;}

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

      /* Desktop has one source of truth only: the approved night header artwork.
         The legacy line-art skyline is never allowed to paint or reinsert here. */
      @media(min-width:1024px){
        html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.topbar.sunbliss-professional-header.sunbliss-professional-header{
          --sb-desktop-header-h:166px!important;
          position:relative!important;
          height:166px!important;
          min-height:166px!important;
          max-height:166px!important;
          overflow:hidden!important;
          isolation:isolate!important;
          background-color:#06131f!important;
          background-image:
            linear-gradient(90deg,rgba(2,12,22,.80) 0%,rgba(2,12,22,.55) 25%,rgba(2,12,22,.14) 53%,rgba(2,12,22,.20) 77%,rgba(2,12,22,.36) 100%),
            url('${APPROVED_DESKTOP_BG}')!important;
          background-repeat:no-repeat,no-repeat!important;
          background-size:100% 100%,100% 100%!important;
          background-position:center center,center center!important;
          border-bottom:1px solid rgba(214,162,70,.50)!important;
        }
        html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline,
        html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-desktop-project-visual{
          display:none!important;
          visibility:hidden!important;
          opacity:0!important;
          pointer-events:none!important;
        }
        html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.topbar.sunbliss-professional-header.sunbliss-professional-header::before,
        html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.topbar.sunbliss-professional-header.sunbliss-professional-header::after,
        html body.sunbliss-ref-desktop.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main.sb-pro-main::after{
          content:none!important;
          display:none!important;
          visibility:hidden!important;
          opacity:0!important;
          background:none!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header>.sb-pro-top,
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header>.sb-pro-main,
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header>.sb-pro-sync{
          position:relative!important;
          z-index:5!important;
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
    var skyline=header.querySelector('.sb-dubai-skyline');
    if(desktop()){
      if(skyline)skyline.remove();
      return;
    }
    if(!skyline)header.insertAdjacentHTML('afterbegin',skylineMarkup());
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
  window.addEventListener('resize',schedule,{passive:true});

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
