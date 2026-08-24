(function(){
  'use strict';

  if (window.__sunblissHeaderImageEdgeFixInstalled) return;
  window.__sunblissHeaderImageEdgeFixInstalled = true;

  var style=document.createElement('style');
  style.id='sunblissHeaderImageEdgeFixStyles';
  style.textContent=`
    .sunbliss-hero-art{
      -webkit-mask-image:
        linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.18) 5%,#000 20%,#000 100%),
        linear-gradient(to right,transparent 0%,rgba(0,0,0,.28) 11%,#000 30%,#000 100%)!important;
      -webkit-mask-composite:source-in!important;
      mask-image:
        linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.18) 5%,#000 20%,#000 100%),
        linear-gradient(to right,transparent 0%,rgba(0,0,0,.28) 11%,#000 30%,#000 100%)!important;
      mask-composite:intersect!important;
    }

    @media(max-width:720px){
      .sunbliss-hero-art{
        -webkit-mask-image:
          linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.12) 5%,rgba(0,0,0,.58) 13%,#000 24%,#000 100%),
          linear-gradient(to right,transparent 0%,rgba(0,0,0,.25) 10%,#000 29%,#000 100%)!important;
        -webkit-mask-composite:source-in!important;
        mask-image:
          linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.12) 5%,rgba(0,0,0,.58) 13%,#000 24%,#000 100%),
          linear-gradient(to right,transparent 0%,rgba(0,0,0,.25) 10%,#000 29%,#000 100%)!important;
        mask-composite:intersect!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
