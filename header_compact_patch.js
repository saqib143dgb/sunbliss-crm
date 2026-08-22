(function(){
  'use strict';

  var style = document.getElementById('sunblissCompactHeaderStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'sunblissCompactHeaderStyle';
    document.head.appendChild(style);
  }

  style.textContent = `
    .topbar{
      position:relative;
      padding:19px 18px 15px;
      color:var(--cream-text);
      border-bottom:1px solid rgba(198,151,46,.16);
      background:
        radial-gradient(380px 120px at 0% 0%,rgba(198,151,46,.075),transparent 72%),
        linear-gradient(180deg,rgba(255,255,255,.022),rgba(255,255,255,0));
    }

    .topbar::after{
      content:"";
      position:absolute;
      left:18px;
      bottom:-1px;
      width:42px;
      height:2px;
      border-radius:999px;
      background:var(--gold);
      opacity:.78;
      pointer-events:none;
    }

    .brand-row{
      gap:8px;
      align-items:center;
      margin-bottom:7px;
    }

    .eyebrow{
      display:inline-flex;
      align-items:center;
      width:max-content;
      margin:0;
      padding:4px 8px;
      border:1px solid rgba(198,151,46,.25);
      border-radius:999px;
      background:rgba(198,151,46,.07);
      color:#D8B55D;
      font-size:9px;
      font-weight:600;
      letter-spacing:.12em;
      line-height:1.1;
    }

    .title{
      margin:0 0 4px;
      max-width:540px;
      font-size:27px;
      font-weight:600;
      line-height:1.06;
      letter-spacing:-.018em;
      text-wrap:balance;
    }

    .subtitle{
      max-width:520px;
      margin:0 0 8px;
      color:rgba(237,230,214,.68);
      font-size:12px;
      line-height:1.42;
    }

    .brand-tagline{
      max-width:520px;
      margin:0 0 10px;
      color:rgba(237,230,214,.52);
      font-size:10.5px;
      font-style:normal;
      line-height:1.35;
      letter-spacing:.01em;
    }

    .brand-edit-btn{
      width:29px;
      height:29px;
      border-radius:9px;
      background:rgba(237,230,214,.045);
      border-color:rgba(237,230,214,.13);
      color:rgba(237,230,214,.62);
      transition:background .15s ease,border-color .15s ease,color .15s ease;
    }

    .brand-edit-btn:hover{
      background:rgba(237,230,214,.09);
      border-color:rgba(237,230,214,.24);
      color:var(--cream-text);
    }

    .sync-row{
      display:flex;
      align-items:center;
      gap:8px;
      min-height:36px;
      padding-top:10px;
      border-top:1px solid rgba(237,230,214,.08);
      flex-wrap:nowrap;
    }

    .sync-row .btn{
      flex:none;
      min-height:34px;
      gap:6px;
      padding:7px 11px;
      border-radius:10px;
      border-color:rgba(237,230,214,.16);
      background:rgba(237,230,214,.055);
      box-shadow:none;
      font-size:11.5px;
      font-weight:600;
      transition:background .15s ease,border-color .15s ease,transform .12s ease;
    }

    .sync-row .btn:hover{
      background:rgba(237,230,214,.10);
      border-color:rgba(237,230,214,.28);
    }

    .sync-row .btn:active{transform:translateY(1px);}

    .sync-row .btn svg{
      width:14px;
      height:14px;
    }

    .sync-status{
      position:relative;
      flex:1;
      min-width:0;
      padding-left:11px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      color:rgba(237,230,214,.56);
      font-size:9.5px;
      line-height:1.35;
    }

    .sync-status::before{
      content:"";
      position:absolute;
      left:0;
      top:50%;
      width:5px;
      height:5px;
      margin-top:-2.5px;
      border-radius:50%;
      background:var(--gold);
      box-shadow:0 0 0 3px rgba(198,151,46,.08);
    }

    .sync-status b{
      color:rgba(237,230,214,.86);
      font-weight:500;
    }

    .header-sync-mini{
      flex:none;
      margin-left:auto;
      padding:5px 7px;
      border:1px solid rgba(237,230,214,.10);
      border-radius:999px;
      background:rgba(237,230,214,.035);
      font-family:'IBM Plex Mono',monospace;
      font-size:8px;
      line-height:1;
      letter-spacing:.015em;
      color:rgba(237,230,214,.48);
      white-space:nowrap;
    }

    @media (max-width:480px){
      .topbar{
        padding:15px 14px 12px;
      }

      .topbar::after{
        left:14px;
        width:36px;
      }

      .brand-row{
        gap:7px;
        margin-bottom:6px;
      }

      .eyebrow{
        padding:4px 7px;
        font-size:8px;
        letter-spacing:.11em;
      }

      .title{
        margin-bottom:4px;
        font-size:24px;
        line-height:1.06;
      }

      .subtitle{
        margin-bottom:7px;
        font-size:11px;
        line-height:1.38;
      }

      .brand-tagline{
        margin-bottom:8px;
        font-size:9.75px;
      }

      .brand-edit-btn{
        width:28px;
        height:28px;
        border-radius:8px;
      }

      .sync-row{
        gap:6px;
        min-height:34px;
        padding-top:9px;
      }

      .sync-row .btn{
        min-height:32px;
        padding:6px 9px;
        border-radius:9px;
        font-size:10.75px;
      }

      .sync-status{
        padding-left:10px;
        font-size:8.75px;
      }

      .header-sync-mini{
        padding:4px 6px;
        font-size:7.5px;
      }
    }
  `;

  function formatSyncTime(value){
    if (!value) return '';
    var date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function refineHeader(){
    var eyebrow = document.querySelector('.topbar .eyebrow');
    if (eyebrow) {
      eyebrow.textContent = eyebrow.textContent.replace(/(\bLLC)\s*[-–—]\s*$/i, '$1');
    }

    var row = document.querySelector('.topbar .sync-row');
    if (!row) return;

    var old = row.querySelector('.header-sync-mini');
    var syncValue = window.state && window.state.syncedAt;
    var timeText = formatSyncTime(syncValue);

    if (!timeText) {
      if (old) old.remove();
      return;
    }

    var label = old || document.createElement('span');
    label.className = 'header-sync-mini';
    label.textContent = 'Synced ' + timeText;
    label.title = 'CRM data last synced at ' + new Date(syncValue).toLocaleString();

    if (!old) row.appendChild(label);
  }

  if (typeof window.render === 'function' && !window.__sunblissCompactHeaderRenderWrapped) {
    var originalRender = window.render;
    window.render = function(){
      var result = originalRender.apply(this, arguments);
      refineHeader();
      return result;
    };
    window.__sunblissCompactHeaderRenderWrapped = true;
  }

  refineHeader();
})();
