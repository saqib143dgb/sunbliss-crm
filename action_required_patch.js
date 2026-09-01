(function(){
  'use strict';

  function safe(value){
    var text = value === null || value === undefined ? '' : String(value);
    if (typeof window.esc === 'function') return window.esc(text);
    return text.replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return (c.unit + '::' + c.sno) === state.selectedUnit; }) || null;
  }

  function money(value){
    if (typeof window.fmtAED === 'function') return window.fmtAED(value);
    var n = Number(value || 0);
    return 'AED ' + n.toLocaleString('en-AE',{maximumFractionDigits:0});
  }

  function displayDate(value){
    if (!value) return '';
    if (typeof window.fmtDate === 'function') return window.fmtDate(value);
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  }

  function localDay(value){
    if (!value) return null;
    var d = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(0,0,0,0);
    return d;
  }

  function overdueStages(c,today){
    var rows=[];
    if(!c||!Array.isArray(c.stages)) return rows;
    c.stages.forEach(function(stage){
      if(!stage || stage.carryForwardManaged===true) return;
      var due=Number(stage.due),paid=Number(stage.paid)||0,dueDate=localDay(stage.dueDate),remaining=due-paid;
      if(!isFinite(due)||remaining<=1||!dueDate||dueDate.getTime()>=today.getTime()) return;
      rows.push({label:String(stage.label||'Installment'),remaining:remaining,dueDate:dueDate,daysOverdue:Math.max(1,Math.floor((today.getTime()-dueDate.getTime())/86400000))});
    });
    rows.sort(function(a,b){return a.dueDate.getTime()-b.dueDate.getTime();});
    return rows;
  }

  function getAction(c){
    var today = new Date();today.setHours(0,0,0,0);
    var overdue=overdueStages(c,today);
    if(overdue.length){
      var total=overdue.reduce(function(sum,row){return sum+row.remaining;},0),labels=overdue.map(function(row){return row.label;}),oldest=overdue[0];
      if(overdue.length===1)return{status:'Overdue',tone:'danger',message:money(total)+' for '+labels[0]+' was due on '+displayDate(oldest.dueDate)+'. Follow up for payment now.',detail:oldest.daysOverdue+' day'+(oldest.daysOverdue===1?'':'s')+' overdue.'};
      return{status:'Overdue',tone:'danger',message:money(total)+' total overdue for '+labels.join(' + ')+'. Follow up for payment now.',detail:overdue.length+' installments overdue · oldest due '+displayDate(oldest.dueDate)+' · '+oldest.daysOverdue+' day'+(oldest.daysOverdue===1?'':'s')+' overdue.'};
    }
    var amount=Number(c&&c.upAmt),stage=c&&c.upStage?String(c.upStage):'',dueDate=localDay(c&&c.upDate),hasPayment=isFinite(amount)&&amount>1;
    if(!hasPayment)return{status:'Up to date',tone:'good',message:'No installment payment action is currently required.',detail:'The active payment schedule is fully paid.'};
    var amountText=money(amount);
    if(!dueDate)return{status:'Date needed',tone:'warn',message:'Next installment is '+amountText+'.',detail:(stage?'Stage: '+stage+' · ':'')+'Due date is not set.'};
    var days=Math.round((dueDate.getTime()-today.getTime())/86400000),dueText=displayDate(dueDate);
    if(days<0){var overdueDays=Math.abs(days);return{status:'Overdue',tone:'danger',message:amountText+' for '+(stage||'the next installment')+' was due on '+dueText+'. Follow up for payment now.',detail:overdueDays+' day'+(overdueDays===1?'':'s')+' overdue.'};}
    if(days===0)return{status:'Due today',tone:'danger',message:'Next installment is '+amountText+' due today.',detail:(stage?'Stage: '+stage+' · ':'')+'By '+dueText+'.'};
    if(days<=7)return{status:'Due soon',tone:'warn',message:'Next installment is '+amountText+' due on '+dueText+'.',detail:(stage?'Stage: '+stage+' · ':'')+'By '+dueText+' · Due in '+days+' day'+(days===1?'':'s')+'.'};
    return{status:'Upcoming',tone:'neutral',message:'Next installment is '+amountText+' due on '+dueText+'.',detail:(stage?'Stage: '+stage+' · ':'')+'By '+dueText+' · Due in '+days+' days.'};
  }

  function icon(kind){
    var common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    if(kind==='layers')return '<svg '+common+'><path d="m12 2 9 5-9 5-9-5 9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>';
    if(kind==='hourglass')return '<svg '+common+'><path d="M6 2h12M6 22h12M8 2v5c0 2 1.5 3.5 4 5-2.5 1.5-4 3-4 5v5M16 2v5c0 2-1.5 3.5-4 5 2.5 1.5 4 3 4 5v5"/></svg>';
    return '<svg '+common+'><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>';
  }

  function metaFromAction(action){
    var status=String(action&&action.status||''),message=String(action&&action.message||''),detail=String(action&&action.detail||''),stage='',by='',due='',m;
    m=detail.match(/Stage:\s*([^·.]+)/i);if(m)stage=m[1].trim();
    if(!stage){m=message.match(/\bfor\s+(.+?)\s+(?:was due|is due)\b/i);if(m)stage=m[1].trim();}
    if(!stage){m=message.match(/total overdue for\s+(.+?)\.\s*Follow/i);if(m)stage=m[1].trim();}
    if(!stage&&/installments overdue/i.test(detail))stage='Multiple installments';
    if(!stage&&/up to date/i.test(status))stage='No pending stage';
    if(!stage)stage='Next installment';
    m=message.match(/\bdue on\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/i);if(m)by=m[1];
    if(!by){m=message.match(/\bwas due on\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/i);if(m)by=m[1];}
    if(!by){var all=[],re=/(?:Extended to|Revised to|By)\s+([0-9]{1,2}\s+[A-Za-z]{3}\s+[0-9]{4})/gi,x;while((x=re.exec(detail)))all.push(x[1]);if(all.length)by=all[all.length-1];}
    if(!by&&/due today/i.test(status))by='Today';
    if(!by&&/date needed/i.test(status))by='Not set';
    if(!by)by='—';
    m=detail.match(/Due in\s+([0-9]+\s+day(?:s)?)/i);if(m)due=m[1];
    if(!due){m=detail.match(/([0-9]+\s+day(?:s)?\s+overdue)/i);if(m)due=m[1];}
    if(!due&&/due today/i.test(status))due='Today';
    if(!due&&/overdue/i.test(status))due='Overdue';
    if(!due)due='—';
    return{stage:stage,by:by,due:due};
  }

  function ensureStyles(){
    if(document.getElementById('actionRequiredStyles'))return;
    var style=document.createElement('style');style.id='actionRequiredStyles';style.textContent=[
      '.action-required-card{position:relative;border:1px solid var(--paper-line);border-left:6px solid var(--slate,#45566B);border-radius:16px;margin:0 0 16px;background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(69,86,107,.01)),var(--paper);overflow:hidden;box-shadow:0 2px 8px rgba(15,26,38,.045)}',
      '.action-required-card[data-tone="danger"]{border-left-color:var(--rust)}.action-required-card[data-tone="warn"]{border-left-color:var(--amber)}.action-required-card[data-tone="good"]{border-left-color:var(--sage)}',
      '.action-required-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px 8px}',
      '.action-required-title{font:700 10px/1.1 "IBM Plex Mono",monospace;letter-spacing:.095em;text-transform:uppercase;color:var(--amber,#9C5A12)}',
      '.action-required-status-wrap{display:inline-flex;align-items:center;gap:7px;border:1.3px solid currentColor;border-radius:999px;padding:6px 10px;color:var(--slate,#45566B);white-space:nowrap}',
      '.action-required-card[data-tone="danger"] .action-required-status-wrap{color:var(--rust)}.action-required-card[data-tone="warn"] .action-required-status-wrap{color:var(--amber)}.action-required-card[data-tone="good"] .action-required-status-wrap{color:var(--sage)}',
      '.action-required-status-icon{display:flex;align-items:center;justify-content:center}.action-required-status-icon svg{width:15px;height:15px}',
      '.action-required-status{font:700 11px/1 Inter,sans-serif;color:inherit;border:0!important;padding:0!important}',
      '.action-required-message{margin:0!important;padding:13px 18px 18px;font:700 18px/1.28 Inter,sans-serif;letter-spacing:-.012em;color:var(--ink)}',
      '.action-required-detail{display:none!important}',
      '.action-required-divider{height:1px;background:var(--paper-line);margin:0 18px}',
      '.action-required-meta{display:grid;grid-template-columns:1.22fr 1fr .82fr;padding:0 18px}',
      '.action-required-meta-block{display:flex;align-items:center;gap:11px;min-width:0;min-height:74px;padding:12px 13px 12px 0}',
      '.action-required-meta-block+.action-required-meta-block{border-left:1px solid var(--paper-line);padding-left:15px}',
      '.action-required-meta-icon{width:36px;height:36px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex:none;color:var(--slate,#45566B);background:rgba(69,86,107,.065)}',
      '.action-required-meta-icon svg{width:22px;height:22px}',
      '.action-required-card[data-tone="danger"] .action-required-meta-icon{color:var(--rust);background:rgba(174,59,43,.06)}.action-required-card[data-tone="warn"] .action-required-meta-icon{color:var(--amber);background:rgba(156,90,18,.06)}.action-required-card[data-tone="good"] .action-required-meta-icon{color:var(--sage);background:rgba(63,122,87,.06)}',
      '.action-required-meta-copy{min-width:0}.action-required-meta-label{font:700 10.4px/1.18 Inter,sans-serif;color:var(--ink);margin-bottom:5px}.action-required-meta-value{font:500 10.8px/1.18 Inter,sans-serif;color:var(--ink);overflow-wrap:anywhere}',
      '@media(max-width:520px){.action-required-card{border-left-width:5px;border-radius:14px}.action-required-head{padding:12px 14px 6px}.action-required-title{font-size:9px}.action-required-status-wrap{gap:5px;padding:5px 8px}.action-required-status-icon svg{width:13px;height:13px}.action-required-status{font-size:9.5px}.action-required-message{padding:10px 14px 14px;font-size:15px;line-height:1.26}.action-required-divider{margin:0 14px}.action-required-meta{padding:0 14px;grid-template-columns:1.25fr 1fr .8fr}.action-required-meta-block{gap:8px;min-height:62px;padding:9px 8px 9px 0}.action-required-meta-block+.action-required-meta-block{padding-left:9px}.action-required-meta-icon{width:30px;height:30px;border-radius:9px}.action-required-meta-icon svg{width:18px;height:18px}.action-required-meta-label{font-size:9.7px;margin-bottom:3px}.action-required-meta-value{font-size:10.1px}}',
      '@media(max-width:380px){.action-required-head{padding:10px 11px 5px}.action-required-message{padding:9px 11px 12px;font-size:13.5px}.action-required-divider{margin:0 11px}.action-required-meta{padding:0 11px;grid-template-columns:1.18fr 1fr .82fr}.action-required-meta-block{gap:6px;min-height:58px;padding-right:6px}.action-required-meta-block+.action-required-meta-block{padding-left:7px}.action-required-meta-icon{width:26px;height:26px}.action-required-meta-icon svg{width:16px;height:16px}.action-required-meta-label{font-size:9.1px}.action-required-meta-value{font-size:9.5px}}'
    ].join('');document.head.appendChild(style);
  }

  function renderLayout(card,action){
    if(!card||!action)return;
    ensureStyles();
    var meta=metaFromAction(action),sig=[action.status,action.tone,action.message,action.detail,meta.stage,meta.by,meta.due].join('|');
    if(card.dataset.actionLayoutSig===sig&&card.querySelector('.action-required-meta'))return;
    card.dataset.actionLayoutSig=sig;
    card.setAttribute('data-tone',action.tone||'neutral');
    card.classList.add('action-reference-card-v2');
    card.innerHTML='<div class="action-required-head"><span class="action-required-title">Action Required</span><span class="action-required-status-wrap"><span class="action-required-status-icon">'+icon('calendar')+'</span><span class="action-required-status">'+safe(action.status)+'</span></span></div><p class="action-required-message">'+safe(action.message)+'</p><p class="action-required-detail">'+safe(action.detail||'')+'</p><div class="action-required-divider"></div><div class="action-required-meta"><div class="action-required-meta-block"><span class="action-required-meta-icon">'+icon('layers')+'</span><span class="action-required-meta-copy"><div class="action-required-meta-label">Stage</div><div class="action-required-meta-value">'+safe(meta.stage)+'</div></span></div><div class="action-required-meta-block"><span class="action-required-meta-icon">'+icon('calendar')+'</span><span class="action-required-meta-copy"><div class="action-required-meta-label">By</div><div class="action-required-meta-value">'+safe(meta.by)+'</div></span></div><div class="action-required-meta-block"><span class="action-required-meta-icon">'+icon('hourglass')+'</span><span class="action-required-meta-copy"><div class="action-required-meta-label">Due In</div><div class="action-required-meta-value">'+safe(meta.due)+'</div></span></div></div>';
  }
  window.sunblissRenderActionRequiredCard=renderLayout;

  function removeLegacyNextDueLine(){
    document.querySelectorAll('.detail .notice .notice-body').forEach(function(node){var value=String(node.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(value.indexOf('next due:')===0)node.remove();});
  }

  function renderActionCard(){
    if(!window.state||state.view!=='detail')return;
    var c=currentCustomer(),detail=document.querySelector('.detail');if(!c||!detail)return;
    ensureStyles();var action=getAction(c),card=document.getElementById('actionRequiredCard');
    if(!card){card=document.createElement('section');card.id='actionRequiredCard';card.className='action-required-card';var badges=detail.querySelector('.badges');if(badges&&badges.parentNode)badges.parentNode.insertBefore(card,badges.nextSibling);else detail.insertBefore(card,detail.firstChild);}
    renderLayout(card,action);removeLegacyNextDueLine();
  }

  function install(){
    if(!window.state||typeof window.renderDetail!=='function'){setTimeout(install,50);return;}
    if(window.__sunblissActionRequiredInstalled)return;window.__sunblissActionRequiredInstalled=true;
    var originalRenderDetail=window.renderDetail;window.renderDetail=function(){var out=originalRenderDetail.apply(this,arguments);renderActionCard();return out;};
    if(state.view==='detail')renderActionCard();
  }
  install();
})();