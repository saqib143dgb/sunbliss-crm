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
      padding:20px 18px 14px;
      border-bottom:1px solid rgba(198,151,46,.10);
      background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(255,255,255,0));
    }

    .brand-row{gap:8px;}

    .eyebrow{
      display:block;
      margin:0 0 4px;
      font-size:10.5px;
      letter-spacing:.14em;
      line-height:1.25;
    }

    .title{
      margin:0 0 3px;
      font-size:26px;
      line-height:1.08;
      letter-spacing:-.012em;
    }

    .subtitle{
      max-width:500px;
      margin:0 0 12px;
      font-size:12.25px;
      line-height:1.4;
    }

    .brand-tagline{
      margin:-4px 0 10px;
      font-size:11.25px;
      line-height:1.35;
    }

    .brand-edit-btn{
      width:30px;
      height:30px;
      border-radius:9px;
      background:rgba(237,230,214,.055);
      border-color:rgba(237,230,214,.16);
    }

    .sync-row{
      gap:8px;
      flex-wrap:nowrap;
    }

    .sync-row .btn{
      flex:none;
      gap:6px;
      padding:8px 12px;
      font-size:12.25px;
      box-shadow:0 4px 14px rgba(0,0,0,.08);
    }

    .sync-row .btn svg{
      width:14px;
      height:14px;
    }

    .sync-status{
      flex:1;
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      font-size:10.5px;
      line-height:1.35;
    }

    .header-sync-mini{
      flex:none;
      margin-left:auto;
      font-family:'IBM Plex Mono',monospace;
      font-size:9px;
      line-height:1;
      letter-spacing:.02em;
      color:rgba(237,230,214,.55);
      white-space:nowrap;
    }

    @media (max-width:480px){
      .topbar{
        padding:16px 15px 11px;
      }

      .brand-row{gap:7px;}

      .eyebrow{
        margin-bottom:3px;
        font-size:9.5px;
        letter-spacing:.13em;
      }

      .title{
        font-size:23px;
        line-height:1.07;
      }

      .subtitle{
        margin-bottom:9px;
        font-size:11.5px;
        line-height:1.38;
      }

      .brand-tagline{
        margin:-2px 0 8px;
        font-size:10.75px;
      }

      .brand-edit-btn{
        width:28px;
        height:28px;
        border-radius:8px;
      }

      .sync-row{gap:7px;}

      .sync-row .btn{
        padding:7px 10px;
        font-size:11.75px;
      }

      .sync-status{font-size:10px;}
      .header-sync-mini{font-size:8.5px;}
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
