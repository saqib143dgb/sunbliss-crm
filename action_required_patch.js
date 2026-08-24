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

  function getAction(c){
    var amount = Number(c && c.upAmt);
    var stage = c && c.upStage ? String(c.upStage) : '';
    var dueDate = localDay(c && c.upDate);
    var hasPayment = isFinite(amount) && amount > 1;

    if (!hasPayment){
      return {
        status:'Up to date',
        tone:'good',
        message:'No installment payment action is currently required.',
        detail:'The active payment schedule is fully paid.'
      };
    }

    var amountText = money(amount);
    var today = new Date();
    today.setHours(0,0,0,0);

    if (!dueDate){
      return {
        status:'Date needed',
        tone:'warn',
        message:'Next installment is ' + amountText + '.',
        detail:(stage ? 'Stage: ' + stage + ' · ' : '') + 'Due date is not set.'
      };
    }

    var days = Math.round((dueDate.getTime() - today.getTime()) / 86400000);
    var dueText = displayDate(dueDate);

    if (days < 0){
      var overdueDays = Math.abs(days);
      return {
        status:'Overdue',
        tone:'danger',
        message:amountText + ' for ' + (stage || 'the next installment') + ' was due on ' + dueText + '. Follow up for payment now.',
        detail:overdueDays + ' day' + (overdueDays === 1 ? '' : 's') + ' overdue.'
      };
    }

    if (days === 0){
      return {
        status:'Due today',
        tone:'danger',
        message:'Next installment is ' + amountText + ' due today.',
        detail:stage ? 'Stage: ' + stage : ''
      };
    }

    if (days <= 7){
      return {
        status:'Due soon',
        tone:'warn',
        message:'Next installment is ' + amountText + ' due on ' + dueText + '.',
        detail:(stage ? 'Stage: ' + stage + ' · ' : '') + 'Due in ' + days + ' day' + (days === 1 ? '' : 's') + '.'
      };
    }

    return {
      status:'Upcoming',
      tone:'neutral',
      message:'Next installment is ' + amountText + ' due on ' + dueText + '.',
      detail:(stage ? 'Stage: ' + stage + ' · ' : '') + 'Due in ' + days + ' days.'
    };
  }

  function ensureStyles(){
    if (document.getElementById('actionRequiredStyles')) return;
    var style = document.createElement('style');
    style.id = 'actionRequiredStyles';
    style.textContent =
      '.action-required-card{border:1px solid var(--paper-line);border-left:4px solid var(--slate);border-radius:12px;padding:13px 14px;margin:0 0 16px;background:var(--paper-dim);}' +
      '.action-required-card[data-tone="danger"]{border-left-color:var(--rust);background:rgba(174,59,43,.07);}' +
      '.action-required-card[data-tone="warn"]{border-left-color:var(--amber);background:rgba(156,90,18,.07);}' +
      '.action-required-card[data-tone="good"]{border-left-color:var(--sage);background:rgba(63,122,87,.07);}' +
      '.action-required-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;}' +
      '.action-required-title{font-family:IBM Plex Mono,monospace;font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);font-weight:600;}' +
      '.action-required-status{font-size:10px;font-weight:700;border:1px solid currentColor;border-radius:999px;padding:3px 8px;white-space:nowrap;color:var(--slate);}' +
      '.action-required-card[data-tone="danger"] .action-required-status{color:var(--rust);}' +
      '.action-required-card[data-tone="warn"] .action-required-status{color:var(--amber);}' +
      '.action-required-card[data-tone="good"] .action-required-status{color:var(--sage);}' +
      '.action-required-message{font-size:13px;line-height:1.5;font-weight:600;color:var(--ink);margin:0;}' +
      '.action-required-detail{font-size:11.5px;line-height:1.45;color:var(--muted);margin:5px 0 0;}';
    document.head.appendChild(style);
  }

  function removeLegacyNextDueLine(){
    document.querySelectorAll('.detail .notice .notice-body').forEach(function(node){
      var text = String(node.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
      if (text.indexOf('next due:') === 0) node.remove();
    });
  }

  function renderActionCard(){
    if (!window.state || state.view !== 'detail') return;
    var c = currentCustomer();
    var detail = document.querySelector('.detail');
    if (!c || !detail) return;

    ensureStyles();
    var action = getAction(c);
    var card = document.getElementById('actionRequiredCard');
    if (!card){
      card = document.createElement('section');
      card.id = 'actionRequiredCard';
      card.className = 'action-required-card';
      var badges = detail.querySelector('.badges');
      if (badges && badges.parentNode) badges.parentNode.insertBefore(card,badges.nextSibling);
      else detail.insertBefore(card,detail.firstChild);
    }

    card.setAttribute('data-tone',action.tone);
    card.innerHTML =
      '<div class="action-required-head">' +
        '<span class="action-required-title">Action Required</span>' +
        '<span class="action-required-status">' + safe(action.status) + '</span>' +
      '</div>' +
      '<p class="action-required-message">' + safe(action.message) + '</p>' +
      (action.detail ? '<p class="action-required-detail">' + safe(action.detail) + '</p>' : '');

    removeLegacyNextDueLine();
  }

  function install(){
    if (!window.state || typeof window.renderDetail !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissActionRequiredInstalled) return;
    window.__sunblissActionRequiredInstalled = true;

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      renderActionCard();
      return out;
    };

    if (state.view === 'detail') renderActionCard();
  }

  install();
})();
