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
      .sb-dubai-skyline .sb-sky-fill{fill:#d5a04a;fill-opacity:.28;}
      .sb-dubai-skyline .sb-sky-line{fill:none;stroke:#e1b15d;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}
      .sb-dubai-skyline .sb-sky-thin{fill:none;stroke:#d5a04a;stroke-width:1.15;stroke-opacity:.8;}

      /* Desktop-only skyline redesign. Keep the skyline large and architectural,
         but line-only and low contrast so it fills the empty middle without
         competing with the user information or the Sunbliss building visual. */
      @media(min-width:1024px){
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main.sb-pro-main::after{
          content:none!important;
          display:none!important;
          background:none!important;
          opacity:0!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline{
          display:block!important;
          left:35%!important;
          right:25%!important;
          bottom:-12px!important;
          width:auto!important;
          max-width:none!important;
          height:112%!important;
          opacity:.22!important;
          z-index:1!important;
          overflow:visible!important;
          -webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.9) 10%,#000 24%,#000 84%,transparent 100%)!important;
          mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.9) 10%,#000 24%,#000 84%,transparent 100%)!important;
          filter:drop-shadow(0 0 10px rgba(198,151,46,.055))!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline .sb-sky-fill{
          fill:none!important;
          fill-opacity:0!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline .sb-sky-line{
          stroke:#ddb05a!important;
          stroke-width:1.35!important;
          stroke-opacity:.62!important;
        }
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline .sb-sky-thin{
          stroke:#8199aa!important;
          stroke-width:.9!important;
          stroke-opacity:.32!important;
        }
      }

      @media(min-width:1440px){
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline{
          left:32%!important;
          right:22%!important;
          bottom:-15px!important;
          height:120%!important;
          opacity:.23!important;
        }
      }

      @media(min-width:1800px){
        html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-dubai-skyline.sb-dubai-skyline{
          left:31%!important;
          right:21%!important;
          height:124%!important;
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
      '<svg viewBox="0 0 760 260" preserveAspectRatio="none" role="presentation">'+
        '<path class="sb-sky-fill" d="M22 238V181h38v57h18v-84h49v84h18v-112h49v112h19v-68h44v68h17v-98h54v98h17v-54h39v54h18v-136l13-17 7-34 7 34 13 17v136h17V121h42v117h17V89h28v149h14V53h10l10-24 9-29 9 29 10 24h10v185h14V109h31v129h18v-74h44v74h18v-104h48v104h18v-58h45v58z"/>'+
        '<path class="sb-sky-line" d="M22 238h716M22 181h38v57M78 238v-84h49v84M145 238V126h49v112M213 238v-68h44v68M274 238v-98h54v98M345 238v-54h39v54M402 238V102l13-17 7-34 7 34 13 17v136M459 238V121h42v117M518 238V89h28v149M560 238V53h10l10-24 9-29 9 29 10 24h10v185M632 238V109h31v129M681 238v-74h44v74"/>'+
        '<path class="sb-sky-thin" d="M566 78h46M568 96h42M571 115h36M573 135h32M575 156h28M578 178h22M580 200h18M413 127h27M413 146h27M413 166h27M413 187h27M413 208h27M520 119h24M520 141h24M520 163h24M520 185h24M632 137h31M632 159h31M632 181h31M632 203h31M95 172v58M112 172v58M163 146v84M179 146v84M291 159v71M309 159v71"/>'+
        '<path class="sb-sky-line" d="M705 238v-34c0-22 10-41 25-54l8-7 8 7c15 13 25 32 25 54v34" transform="translate(-16 0) scale(.92 1)"/>'+
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

  apply();
  schedule();
  setTimeout(apply,80);
  setTimeout(apply,300);

  var app=document.getElementById('app');
  if(app&&window.MutationObserver){
    new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
  }
})();
