(function(){
  'use strict';
  if(document.getElementById('sunblissDesktopSkylineStabilityPreload'))return;

  var style=document.createElement('style');
  style.id='sunblissDesktopSkylineStabilityPreload';
  style.textContent=`
    @media(min-width:1024px){
      /* One desktop skyline source only. The deferred skyline patch still owns
         mobile, but its DOM layer must never paint on desktop because that late
         insertion was the visible flicker/jump during refresh. */
      html body #app .topbar.sunbliss-professional-header .sb-dubai-skyline{
        display:none!important;
        visibility:hidden!important;
        opacity:0!important;
      }

      /* Paint the desktop skyline from the header's own pseudo-element so it is
         present on the first frame of the professional header and survives all
         header re-renders without any skyline MutationObserver or DOM insert. */
      html body #app .topbar.topbar.sunbliss-professional-header .sb-pro-main.sb-pro-main::after{
        content:''!important;
        display:block!important;
        position:absolute!important;
        z-index:0!important;
        left:33.5%!important;
        right:auto!important;
        top:50%!important;
        bottom:auto!important;
        width:min(46vw,650px)!important;
        height:118px!important;
        transform:translateY(-50%)!important;
        pointer-events:none!important;
        opacity:.29!important;
        background-image:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5MDAgMTYwIiBmaWxsPSJub25lIj4KPGcgc3Ryb2tlPSIjZDhhYTU4IiBzdHJva2Utd2lkdGg9IjEuNTUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgb3BhY2l0eT0iLjcyIj4KICA8cGF0aCBkPSJNMTIgMTM4SDg4OCIvPgogIDxwYXRoIGQ9Ik0yOCAxMzhWMTEySDU1VjEzOE02NiAxMzhWOTZIOTJWMTM4TTEwNCAxMzhWMTE4SDEyOFYxMzgiLz4KICA8cGF0aCBkPSJNMTQyIDEzOFY4NEgxNzBWMTM4TTE4MiAxMzhWMTA2SDIwNlYxMzgiLz4KICA8cGF0aCBkPSJNMjIwIDEzOFY3MEgyNDlWMTM4TTI2MiAxMzhWOThIMjg2VjEzOCIvPgogIDxwYXRoIGQ9Ik0zMDAgMTM4Vjg4SDMyNlYxMzgiLz4KICA8cGF0aCBkPSJNMzQ0IDEzOFYxMjZIMzUxVjExM0gzNThWOThIMzY1VjgySDM3MlY2NEgzNzlWNDVIMzg2VjI1SDM5MlYxMEgzOTdWMjVINDAzVjQ0SDQxMFY2NEg0MTdWODJINDI0Vjk4SDQzMVYxMTNINDM4VjEyNkg0NDVWMTM4Ii8+CiAgPHBhdGggZD0iTTQ2MiAxMzhWOTJINDkwVjEzOE01MDIgMTM4VjEwOEg1MjZWMTM4Ii8+CiAgPHBhdGggZD0iTTU0MiAxMzhWNzRINTcyVjEzOE01ODQgMTM4VjEwMUg2MTBWMTM4Ii8+CiAgPHBhdGggZD0iTTYyOCAxMzhWODZINjU0VjEzOCIvPgogIDxwYXRoIGQ9Ik02NzYgMTM4Vjc2QzY5NiA4MiA3MTMgOTkgNzIxIDExOUM3MjQgMTI2IDcyNSAxMzIgNzI1IDEzOE02NzYgNzZDNjk4IDkxIDcxMiAxMDcgNzIxIDEyNU02ODEgOTJMNzEyIDEwMU02ODEgMTA4TDcxOCAxMTgiLz4KICA8cGF0aCBkPSJNNzQyIDEzOFY5NEg3NzBWMTM4TTc4MiAxMzhWMTE0SDgwNlYxMzhNODIwIDEzOFY4Mkg4NTBWMTM4TTg2MiAxMzhWMTA3SDg4NFYxMzgiLz4KPC9nPgo8ZyBzdHJva2U9IiM3Zjk4YTgiIHN0cm9rZS13aWR0aD0iLjg1IiBvcGFjaXR5PSIuMjgiPgogIDxwYXRoIGQ9Ik03MyAxMDRWMTMyTTg0IDEwNFYxMzJNMTUwIDkyVjEzMk0xNjEgOTJWMTMyTTIyOSA3OVYxMzJNMjQwIDc5VjEzMiIvPgogIDxwYXRoIGQ9Ik00NzAgMTAxVjEzMk00ODEgMTAxVjEzMk01NTAgODRWMTMyTTU2MSA4NFYxMzJNNzQ5IDEwM1YxMzJNNzYwIDEwM1YxMzJNODI5IDkxVjEzMk04NDAgOTFWMTMyIi8+CiAgPHBhdGggZD0iTTM2NiAxMTlINDMwTTM3MSAxMDNINDI1TTM3NyA4Nkg0MTlNMzgzIDY3SDQxM00zODkgNDdINDA3Ii8+CjwvZz4KPC9zdmc+")!important;
        background-repeat:no-repeat!important;
        background-size:contain!important;
        background-position:center!important;
        -webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 8%,#000 91%,transparent 100%)!important;
        mask-image:linear-gradient(90deg,transparent 0%,#000 8%,#000 91%,transparent 100%)!important;
        filter:drop-shadow(0 0 9px rgba(198,151,46,.055))!important;
      }

      html body #app .topbar.sunbliss-professional-header .sb-pro-main>*{
        position:relative!important;
        z-index:1!important;
      }
    }

    @media(min-width:1600px){
      html body #app .topbar.topbar.sunbliss-professional-header .sb-pro-main.sb-pro-main::after{
        left:32%!important;
        width:720px!important;
        height:126px!important;
        opacity:.30!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
