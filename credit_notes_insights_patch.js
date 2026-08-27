(function(){
  'use strict';
  if(window.__sunblissCreditNotesInsightsInstalled)return;
  window.__sunblissCreditNotesInsightsInstalled=true;

  function install(){
    var A=window.__sunblissCreditNoteApi;
    if(!A||typeof window.renderInsights!=='function'){setTimeout(install,50);return;}

    function owner(note){
      return A.allCustomers().find(function(c){return A.text(c.unitId)===A.text(note.unitId);})||{name:'',unit:''};
    }

    function ensureStyles(){
      if(document.getElementById('sunblissMinimalCreditNoteInsightsStyle'))return;
      var style=document.createElement('style');
      style.id='sunblissMinimalCreditNoteInsightsStyle';
      style.textContent=[
        '.credit-note-mini{margin:0 0 18px;border:1px solid var(--paper-line);border-radius:14px;background:var(--paper);overflow:hidden}',
        '.credit-note-mini-toggle{width:100%;border:0;background:transparent;color:var(--ink);display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 17px;text-align:left;cursor:pointer}',
        '.credit-note-mini-label{font:700 10.5px/1.25 IBM Plex Mono,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}',
        '.credit-note-mini-total{font-family:Fraunces,serif;font-size:22px;line-height:1.15;font-weight:700;color:var(--ink)}',
        '.credit-note-mini-arrow{font-size:20px;line-height:1;color:var(--muted);transition:transform .15s ease}',
        '.credit-note-mini[data-open="true"] .credit-note-mini-arrow{transform:rotate(180deg)}',
        '.credit-note-mini-detail{border-top:1px solid var(--paper-line);padding:0 17px}',
        '.credit-note-mini-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;padding:13px 0;border-bottom:1px solid var(--paper-line)}',
        '.credit-note-mini-row:last-child{border-bottom:0}',
        '.credit-note-mini-main{font-size:13px;line-height:1.4;color:var(--ink);font-weight:600}',
        '.credit-note-mini-meta{font-size:11.5px;line-height:1.45;color:var(--muted);margin-top:3px}',
        '.credit-note-mini-amount{font:700 12px/1.4 IBM Plex Mono,monospace;color:var(--gold-deep);white-space:nowrap}',
        '@media(max-width:430px){.credit-note-mini-toggle{padding:15px}.credit-note-mini-detail{padding:0 15px}.credit-note-mini-row{grid-template-columns:1fr}.credit-note-mini-amount{justify-self:start}}'
      ].join('');
      document.head.appendChild(style);
    }

    function section(){
      var notes=(state.creditNotes||[]).slice();
      if(!notes.length)return null;
      var total=notes.reduce(function(sum,n){return sum+(Number(n.amount)||0);},0);
      var open=state.creditNoteInsightsOpen===true;
      var el=document.createElement('section');
      el.className='credit-note-mini';
      el.id='creditNotePortfolio';
      el.setAttribute('data-open',open?'true':'false');

      var toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='credit-note-mini-toggle';
      toggle.id='creditNoteMiniToggle';
      toggle.setAttribute('aria-expanded',open?'true':'false');
      toggle.innerHTML='<div><div class="credit-note-mini-label">Credit notes issued</div><div class="credit-note-mini-total">'+A.safe(A.money(total))+'</div></div><span class="credit-note-mini-arrow" aria-hidden="true">⌄</span>';
      el.appendChild(toggle);

      if(open){
        var detail=document.createElement('div');
        detail.className='credit-note-mini-detail';
        notes.sort(function(a,b){return A.text(b.issueDate).localeCompare(A.text(a.issueDate))||Number(b.id||0)-Number(a.id||0);}).forEach(function(n){
          var c=owner(n),item=document.createElement('div');
          item.className='credit-note-mini-row';
          var who=(c.name||'Customer')+(c.unit?' · '+c.unit:'');
          var why=n.reason||'No reason recorded';
          var meta=A.dateLabel(n.issueDate)+' · '+why;
          if(n.stageLabel)meta+=' · '+n.stageLabel;
          if(n.reference)meta+=' · Ref '+n.reference;
          item.innerHTML='<div><div class="credit-note-mini-main">'+A.safe(who)+'</div><div class="credit-note-mini-meta">'+A.safe(meta)+'</div></div><div class="credit-note-mini-amount">'+A.safe(A.money(n.amount))+'</div>';
          detail.appendChild(item);
        });
        el.appendChild(detail);
      }
      return el;
    }

    function decorate(){
      if(!window.state||state.view!=='insights'||!(state.creditNotes||[]).length)return;
      var overview=document.querySelector('.overview');
      if(!overview||document.getElementById('creditNotePortfolio'))return;
      ensureStyles();
      var s=section();
      if(!s)return;
      overview.insertBefore(s,overview.firstChild);
      var toggle=document.getElementById('creditNoteMiniToggle');
      if(toggle)toggle.addEventListener('click',function(){
        state.creditNoteInsightsOpen=!state.creditNoteInsightsOpen;
        renderInsights();
      });
    }

    var base=window.renderInsights;
    window.renderInsights=function(){var out=base.apply(this,arguments);decorate();return out;};
    decorate();
  }
  install();
})();
