(function(){
  'use strict';

  if (window.__sunblissCancelledForfeitRuleInstalled) return;
  window.__sunblissCancelledForfeitRuleInstalled = true;

  var style = document.createElement('style');
  style.id = 'sunblissCancelledForfeitRuleStyles';
  style.textContent = [
    '#unitCancellationPanel .sunbliss-forfeit-rule{margin:12px 0 14px;padding:12px 13px;border:1px solid rgba(174,59,43,.24);border-radius:11px;background:linear-gradient(180deg,rgba(174,59,43,.07),rgba(174,59,43,.025));}',
    '#unitCancellationPanel .sunbliss-forfeit-rule-title{margin:0 0 8px;font-family:IBM Plex Mono,monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--rust);}',
    '#unitCancellationPanel .sunbliss-forfeit-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',
    '#unitCancellationPanel .sunbliss-forfeit-rule-cell{padding:9px 10px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper);}',
    '#unitCancellationPanel .sunbliss-forfeit-rule-label{margin:0 0 3px;font-size:9px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);}',
    '#unitCancellationPanel .sunbliss-forfeit-rule-value{margin:0;font-family:Fraunces,serif;font-size:15px;font-weight:650;color:var(--ink);}',
    '#unitCancellationPanel .sunbliss-forfeit-rule-value.is-forfeited{color:var(--rust);}',
    '#unitCancellationPanel .sunbliss-forfeit-rule-note{margin:9px 0 0;font-size:11.5px;line-height:1.45;color:var(--muted);}',
    '@media(max-width:420px){#unitCancellationPanel .sunbliss-forfeit-rule-grid{grid-template-columns:1fr 1fr;gap:6px}#unitCancellationPanel .sunbliss-forfeit-rule-cell{padding:8px}#unitCancellationPanel .sunbliss-forfeit-rule-value{font-size:14px}}'
  ].join('');
  document.head.appendChild(style);

  function money(n){
    var value = Number(n) || 0;
    if (typeof window.fmtAED === 'function') return window.fmtAED(value);
    return 'AED ' + value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function parseAmount(value){
    var cleaned = String(value == null ? '' : value).replace(/[^0-9.-]/g,'');
    var n = Number(cleaned);
    return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
  }

  function paidFromPanel(panel, refund, forfeited){
    var stored = Number(panel.getAttribute('data-sunbliss-forfeit-paid'));
    if (isFinite(stored) && stored >= 0) return stored;

    var paid = Math.max(parseAmount(refund && refund.value), parseAmount(forfeited && forfeited.value));
    if (!paid){
      var values = panel.querySelectorAll('.cancel-summary-value');
      if (values.length > 1) paid = parseAmount(values[1].textContent);
    }
    panel.setAttribute('data-sunbliss-forfeit-paid',String(paid));
    return paid;
  }

  function hideOriginalSettlementControls(settlement, refund, forfeited){
    var settlementLabel = settlement && settlement.closest ? settlement.closest('label.brand-field') : null;
    if (settlementLabel) settlementLabel.style.display = 'none';

    var refundLabel = refund && refund.closest ? refund.closest('label.brand-field') : null;
    var forfeitedLabel = forfeited && forfeited.closest ? forfeited.closest('label.brand-field') : null;
    if (refundLabel && forfeitedLabel && refundLabel.parentElement === forfeitedLabel.parentElement){
      refundLabel.parentElement.style.display = 'none';
    }else{
      if (refundLabel) refundLabel.style.display = 'none';
      if (forfeitedLabel) forfeitedLabel.style.display = 'none';
    }
  }

  function renderRuleCard(panel, paid){
    var card = panel.querySelector('.sunbliss-forfeit-rule');
    if (!card){
      card = document.createElement('div');
      card.className = 'sunbliss-forfeit-rule';
      var remarks = document.getElementById('cuRemarks');
      var remarksLabel = remarks && remarks.closest ? remarks.closest('label.brand-field') : null;
      if (remarksLabel && remarksLabel.parentNode === panel) panel.insertBefore(card,remarksLabel);
      else panel.appendChild(card);
    }
    card.innerHTML =
      '<p class="sunbliss-forfeit-rule-title">Cancellation settlement</p>' +
      '<div class="sunbliss-forfeit-rule-grid">' +
        '<div class="sunbliss-forfeit-rule-cell"><p class="sunbliss-forfeit-rule-label">Refunded</p><p class="sunbliss-forfeit-rule-value">' + money(0) + '</p></div>' +
        '<div class="sunbliss-forfeit-rule-cell"><p class="sunbliss-forfeit-rule-label">Forfeited</p><p class="sunbliss-forfeit-rule-value is-forfeited">' + money(paid) + '</p></div>' +
      '</div>' +
      '<p class="sunbliss-forfeit-rule-note">All amounts paid to date are forfeited when the unit is cancelled. No refund is recorded.</p>';
  }

  function enforce(panel){
    if (!panel) return;
    var settlement = panel.querySelector('#cuSettlement');
    var refund = panel.querySelector('#cuRefundAmount');
    var forfeited = panel.querySelector('#cuForfeitedAmount');
    if (!settlement || !refund || !forfeited) return;

    var paid = paidFromPanel(panel,refund,forfeited);
    settlement.value = 'Forfeited';
    refund.value = '0.00';
    forfeited.value = paid.toFixed(2);
    refund.dataset.touched = '1';
    forfeited.dataset.touched = '1';
    settlement.disabled = true;
    refund.disabled = true;
    forfeited.disabled = true;

    hideOriginalSettlementControls(settlement,refund,forfeited);
    renderRuleCard(panel,paid);
  }

  function scan(){
    enforce(document.getElementById('unitCancellationPanel'));
  }

  document.addEventListener('click',function(event){
    var target = event.target && event.target.closest ? event.target.closest('#cuConfirm') : null;
    if (!target) return;
    enforce(document.getElementById('unitCancellationPanel'));
  },true);

  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(scan);
    observer.observe(app,{childList:true,subtree:true});
  }

  if (typeof window.render === 'function' && !window.__sunblissCancelledForfeitRenderWrapped){
    var previousRender = window.render;
    window.render = function(){
      var result = previousRender.apply(this,arguments);
      window.requestAnimationFrame(scan);
      return result;
    };
    window.__sunblissCancelledForfeitRenderWrapped = true;
  }

  scan();
})();
