(function(){
  'use strict';
  if(window.__sunblissDesktopHeaderSkylineInstalled)return;
  window.__sunblissDesktopHeaderSkylineInstalled=true;

  var style=document.createElement('style');
  style.id='sunblissDesktopHeaderSkylineStyle';
  style.textContent=`
    @media(min-width:1180px){
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main::after{
        content:''!important;
        display:block!important;
        position:absolute!important;
        z-index:0!important;
        left:40%!important;
        top:51%!important;
        width:clamp(520px,40vw,700px)!important;
        height:clamp(102px,7.8vw,132px)!important;
        transform:translateY(-50%)!important;
        pointer-events:none!important;
        opacity:.32!important;
        background-image:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3NjAgMTUwIiBmaWxsPSJub25lIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAiIHkxPSIwIiB4Mj0iNzYwIiB5Mj0iMCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM3Zjk4YTgiIHN0b3Atb3BhY2l0eT0iLjE4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iLjE4IiBzdG9wLWNvbG9yPSIjY2RhMDRlIiBzdG9wLW9wYWNpdHk9Ii41MiIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii41NSIgc3RvcC1jb2xvcj0iI2UyYjc2MSIgc3RvcC1vcGFjaXR5PSIuNzIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIuODIiIHN0b3AtY29sb3I9IiNjZGEwNGUiIHN0b3Atb3BhY2l0eT0iLjQyIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzdmOThhOCIgc3RvcC1vcGFjaXR5PSIuMTIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImIiIHgxPSIwIiB5MT0iMCIgeDI9Ijc2MCIgeTI9IjAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjN2Y5OGE4IiBzdG9wLW9wYWNpdHk9IjAiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIuMzUiIHN0b3AtY29sb3I9IiM3Zjk4YTgiIHN0b3Atb3BhY2l0eT0iLjMwIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iLjciIHN0b3AtY29sb3I9IiNkN2FhNTUiIHN0b3Atb3BhY2l0eT0iLjI4Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2Q3YWE1NSIgc3RvcC1vcGFjaXR5PSIwIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KCiAgPGcgc3Ryb2tlPSJ1cmwoI2cpIiBzdHJva2Utd2lkdGg9IjEuNjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+CiAgICA8cGF0aCBkPSJNOCAxMjhINzUyIi8+CiAgICA8cGF0aCBkPSJNMjYgMTI4VjEwNEg0N1YxMjhNNTcgMTI4VjkxSDc3VjEyOE04NyAxMjhWMTA4SDEwM1YxMjgiLz4KICAgIDxwYXRoIGQ9Ik0xMTQgMTI4Vjc4SDE0MFYxMjhNMTQ4IDEyOFY5OEgxNjZWMTI4Ii8+CiAgICA8cGF0aCBkPSJNMTc4IDEyOFY4OEwxOTEgNzZMMjA0IDg4VjEyOCIvPgogICAgPHBhdGggZD0iTTIxOCAxMjhWNjNIMjM5VjEyOE0yNDcgMTI4Vjk3SDI2NFYxMjgiLz4KICAgIDxwYXRoIGQ9Ik0yNzggMTI4VjgzSDI5OFYxMjgiLz4KICAgIDxwYXRoIGQ9Ik0zMDkgMTI4VjEwMUgzMjBWODVIMzI5VjY3SDMzN1Y1MEgzNDRWMzRIMzUxVjE4SDM1NlY1SDM2MFYxOEgzNjVWMzRIMzcyVjUwSDM3OVY2N0gzODdWODVIMzk2VjEwMUg0MDdWMTI4Ii8+CiAgICA8cGF0aCBkPSJNNDIxIDEyOFY3N0g0NDJWMTI4TTQ1MSAxMjhWOTRINDY2VjEyOCIvPgogICAgPHBhdGggZD0iTTQ3OSAxMjhWNjhMNDk0IDU4TDUwOSA2OFYxMjgiLz4KICAgIDxwYXRoIGQ9Ik01MjMgMTI4Vjg0SDU0MFYxMjhNNTUwIDEyOFYxMDJINTY1VjEyOCIvPgogICAgPHBhdGggZD0iTTU3NSAxMjhWNzNINjAwVjEyOCIvPgogICAgPHBhdGggZD0iTTYxMSAxMjhWOTJDNjE2IDgwIDYyNCA3MSA2MzQgNjZDNjQ0IDcyIDY1MiA4MiA2NTcgOTRWMTI4Ii8+CiAgICA8cGF0aCBkPSJNNjIzIDkxQzYzMSA4NCA2MzkgODAgNjQ3IDc4Ii8+CiAgICA8cGF0aCBkPSJNNjY5IDEyOFY5NUg2ODZWMTI4TTY5NiAxMjhWODBINzE4VjEyOE03MjggMTI4VjEwOEg3NDZWMTI4Ii8+CiAgPC9nPgoKICA8ZyBzdHJva2U9InVybCgjYikiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iLjY1Ij4KICAgIDxwYXRoIGQ9Ik03MCAxMzZDMTA5IDEzMCAzMDAgMTE3IDM5MCAxMjRDNDgwIDEzMSA2MDAgMTQ1IDcxNCAxMzIiLz4KICAgIDxwYXRoIGQ9Ik0xMTggMTQyQzIzOCAxMjkgMzM3IDEzMCA0MzAgMTM2QzUyNSAxNDIgNjE0IDE0NSA2OTIgMTM5Ii8+CiAgPC9nPgo8L3N2Zz4=")!important;
        background-repeat:no-repeat!important;
        background-size:100% 100%!important;
        background-position:center!important;
        -webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 10%,#000 88%,transparent 100%)!important;
        mask-image:linear-gradient(90deg,transparent 0%,#000 10%,#000 88%,transparent 100%)!important;
        filter:drop-shadow(0 0 10px rgba(198,151,46,.07))!important;
      }
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main>*{
        position:relative!important;
        z-index:1!important;
      }
    }

    @media(min-width:1600px){
      html body.sunbliss-ref-desktop #app .topbar.sunbliss-professional-header .sb-pro-main::after{
        left:38%!important;
        width:720px!important;
        height:136px!important;
        opacity:.34!important;
      }
    }
  `;
  document.head.appendChild(style);
})();
