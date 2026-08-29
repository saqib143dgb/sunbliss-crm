(function(){
  'use strict';

  var style=document.createElement('style');style.id='transactionUiRefineStyle';style.textContent=[
    '.tx-list .tx-actions-btn{width:22px!important;height:22px!important;border-radius:6px!important;font-size:16px!important;line-height:16px!important;}',
    '.tx-list .tx-actions-menu{top:26px!important;}','.tx-list .tx-row>.tx-date,.tx-list .tx-row>.tx-amt{align-self:center!important;}',
    '.tx-list .tx-row>.tx-main{align-self:center!important;}','.tx-list .tx-row>.tx-main>br{display:none!important;}','.tx-list .tx-row>.tx-main>.tx-status:empty{display:none!important;}'
  ].join('');document.head.appendChild(style);

  function refineTransactionActions(){document.querySelectorAll('.tx-list .tx-actions-btn').forEach(function(btn){var wrap=btn.parentElement;if(wrap)wrap.style.setProperty('align-self','center','important');});}
  function removeRecordPaymentHeading(){document.querySelectorAll('.detail .section-label').forEach(function(label){if(label.textContent.trim().toLowerCase()==='record a payment')label.remove();});}
  function refineDetail(){if(!window.state||state.view!=='detail')return;refineTransactionActions();removeRecordPaymentHeading();}
  var queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;refineDetail();});}
  function wrap(name){var original=window[name];if(typeof original!=='function'||original.__sunblissTxRefineWrapped)return;function wrapped(){var out=original.apply(this,arguments);queue();return out;}wrapped.__sunblissTxRefineWrapped=true;wrapped.__sunblissOriginal=original;window[name]=wrapped;}
  wrap('renderDetail');wrap('renderMain');window.addEventListener('pageshow',queue);queue();
})();
