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

(function(){
  'use strict';
  if(window.__sunblissDesktopLedgerHistorySplitInstalled)return;
  window.__sunblissDesktopLedgerHistorySplitInstalled=true;

  var MQ=window.matchMedia?window.matchMedia('(min-width:1024px)'):null;
  var raf=0;
  var applying=false;

  function isDesktop(){return MQ?MQ.matches:window.innerWidth>=1024;}
  function norm(v){return String(v==null?'':v).replace(/\s+/g,' ').trim().toLowerCase();}
  function findLabel(detail,prefix){
    var labels=detail.querySelectorAll('.section-label');
    prefix=String(prefix||'').toLowerCase();
    for(var i=0;i<labels.length;i++){
      if(norm(labels[i].textContent).indexOf(prefix)===0)return labels[i];
    }
    return null;
  }
  function icon(type){
    if(type==='ledger'){
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="6" rx="6" ry="2.7"></ellipse><path d="M6 6v4c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7V6M6 10v4c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7v-4M6 14v4c0 1.5 2.7 2.7 6 2.7s6-1.2 6-2.7v-4"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h8l3 3V20.5H7z"></path><path d="M15 3.5v4h3M10 11h5M10 14h5M10 17h3"></path></svg>';
  }
  function header(type){
    var el=document.createElement('div');
    el.className='sb-ledger-history-header';
    var title=type==='ledger'?'INSTALLMENT LEDGER':'TRANSACTION HISTORY';
    var sub=type==='ledger'?'PAYMENT STAGES & STATUS':'PAYMENTS & RECEIPTS';
    el.innerHTML='<span class="sb-ledger-history-icon">'+icon(type)+'</span><span class="sb-ledger-history-divider" aria-hidden="true"></span><span class="sb-ledger-history-copy"><strong>'+title+'</strong><small>'+sub+'</small></span>';
    return el;
  }
  function body(nodes){
    var el=document.createElement('div');
    el.className='sb-ledger-history-body';
    nodes.forEach(function(node){el.appendChild(node);});
    return el;
  }
  function restore(){
    var row=document.getElementById('sbLedgerHistoryRow');
    if(!row)return;
    var ledgerNodes=row.__sbLedgerNodes||[];
    var historyNodes=row.__sbHistoryNodes||[];
    var ledgerAnchor=row.__sbLedgerAnchor;
    var historyAnchor=row.__sbHistoryAnchor;
    var paymentAnchor=row.__sbPaymentAnchor;
    var paymentButton=row.__sbPaymentButton;
    var paymentRow=document.getElementById('sbLedgerHistoryPaymentRow');

    if(ledgerAnchor&&ledgerAnchor.parentNode){
      var ref=ledgerAnchor.nextSibling;
      ledgerNodes.forEach(function(node){ledgerAnchor.parentNode.insertBefore(node,ref);});
    }
    if(historyAnchor&&historyAnchor.parentNode){
      var href=historyAnchor.nextSibling;
      historyNodes.forEach(function(node){historyAnchor.parentNode.insertBefore(node,href);});
    }
    if(paymentAnchor&&paymentAnchor.parentNode&&paymentButton){
      paymentAnchor.parentNode.insertBefore(paymentButton,paymentAnchor.nextSibling);
    }
    if(paymentRow&&paymentRow.parentNode)paymentRow.parentNode.removeChild(paymentRow);
    if(row.parentNode)row.parentNode.removeChild(row);
    [ledgerAnchor,historyAnchor,paymentAnchor].forEach(function(anchor){if(anchor&&anchor.parentNode)anchor.parentNode.removeChild(anchor);});
  }
  function apply(){
    if(applying)return;
    applying=true;
    try{
      if(!isDesktop()){restore();return;}
      if(document.getElementById('sbLedgerHistoryRow'))return;
      var detail=document.querySelector('#main .detail');
      if(!detail)return;
      var ledgerLabel=findLabel(detail,'installment ledger');
      var historyLabel=findLabel(detail,'transaction history');
      var ledger=ledgerLabel&&ledgerLabel.nextElementSibling;
      var history=historyLabel&&historyLabel.nextElementSibling;
      if(!ledgerLabel||!historyLabel||!ledger||!history)return;
      if(!ledger.classList.contains('ledger-scroll')||!history.classList.contains('tx-list'))return;

      var paymentButton=detail.querySelector('#btnOpenPaymentForm');
      var ledgerAnchor=document.createComment('sb-ledger-original-position');
      var historyAnchor=document.createComment('sb-history-original-position');
      var paymentAnchor=paymentButton?document.createComment('sb-payment-original-position'):null;
      ledgerLabel.parentNode.insertBefore(ledgerAnchor,ledgerLabel);
      historyLabel.parentNode.insertBefore(historyAnchor,historyLabel);
      if(paymentButton&&paymentButton.parentNode)paymentButton.parentNode.insertBefore(paymentAnchor,paymentButton);

      var row=document.createElement('div');
      row.id='sbLedgerHistoryRow';
      row.className='sb-ledger-history-row';

      var left=document.createElement('section');
      left.className='sb-ledger-history-panel sb-ledger-panel';
      left.appendChild(header('ledger'));
      left.appendChild(body([ledgerLabel,ledger]));

      var right=document.createElement('section');
      right.className='sb-ledger-history-panel sb-history-panel';
      right.appendChild(header('history'));
      right.appendChild(body([historyLabel,history]));

      row.appendChild(left);
      row.appendChild(right);
      row.__sbLedgerNodes=[ledgerLabel,ledger];
      row.__sbHistoryNodes=[historyLabel,history];
      row.__sbLedgerAnchor=ledgerAnchor;
      row.__sbHistoryAnchor=historyAnchor;
      row.__sbPaymentAnchor=paymentAnchor;
      row.__sbPaymentButton=paymentButton||null;
      ledgerAnchor.parentNode.insertBefore(row,ledgerAnchor.nextSibling);

      if(paymentButton){
        var paymentRow=document.createElement('div');
        paymentRow.id='sbLedgerHistoryPaymentRow';
        paymentRow.className='sb-ledger-history-payment-row';
        paymentRow.appendChild(paymentButton);
        row.parentNode.insertBefore(paymentRow,row.nextSibling);
      }
    }finally{
      applying=false;
    }
  }
  function schedule(){
    if(raf)cancelAnimationFrame(raf);
    raf=requestAnimationFrame(function(){raf=0;apply();});
  }
  function styles(){
    if(document.getElementById('sbLedgerHistorySplitStyles'))return;
    var s=document.createElement('style');
    s.id='sbLedgerHistorySplitStyles';
    s.textContent=`
@media (min-width:1024px){
  #sbLedgerHistoryRow{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:20px!important;
    align-items:stretch!important;
    width:100%!important;
    min-width:0!important;
    margin:0 0 16px!important;
    box-sizing:border-box!important;
  }
  #sbLedgerHistoryRow>.sb-ledger-history-panel{
    width:100%!important;
    min-width:0!important;
    height:100%!important;
    box-sizing:border-box!important;
    background:var(--paper)!important;
    border:1px solid var(--paper-line)!important;
    border-radius:14px!important;
    padding:0!important;
    overflow:hidden!important;
    box-shadow:0 2px 7px rgba(15,26,38,.055)!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-header{
    min-height:86px!important;
    display:flex!important;
    align-items:center!important;
    gap:16px!important;
    box-sizing:border-box!important;
    padding:16px 20px!important;
    background:linear-gradient(180deg,rgba(198,151,46,.085) 0%,rgba(198,151,46,.035) 100%)!important;
    border-bottom:1px solid var(--paper-line)!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-icon{
    width:48px!important;
    height:48px!important;
    min-width:48px!important;
    display:grid!important;
    place-items:center!important;
    border-radius:50%!important;
    color:#fff!important;
    background:linear-gradient(145deg,#b58a2b,#8d681f)!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 2px 5px rgba(96,70,20,.14)!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-icon svg{
    width:25px!important;
    height:25px!important;
    fill:none!important;
    stroke:currentColor!important;
    stroke-width:1.8!important;
    stroke-linecap:round!important;
    stroke-linejoin:round!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-divider{
    width:1px!important;
    height:39px!important;
    background:rgba(142,103,31,.60)!important;
    flex:0 0 1px!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-copy{
    display:flex!important;
    flex-direction:column!important;
    justify-content:center!important;
    gap:7px!important;
    min-width:0!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-copy strong{
    color:var(--ink)!important;
    font-family:Inter,Arial,sans-serif!important;
    font-size:15px!important;
    font-weight:750!important;
    line-height:1!important;
    letter-spacing:.08em!important;
    white-space:nowrap!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-copy small{
    color:var(--muted)!important;
    font-family:'IBM Plex Mono',monospace!important;
    font-size:8.5px!important;
    font-weight:600!important;
    line-height:1!important;
    letter-spacing:.18em!important;
    white-space:nowrap!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-body{
    padding:16px 18px 18px!important;
    box-sizing:border-box!important;
    min-width:0!important;
  }
  #sbLedgerHistoryRow .sb-ledger-history-body>.section-label{
    display:none!important;
  }
  #sbLedgerHistoryRow .sb-ledger-panel .ledger-scroll{
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    gap:10px!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    overflow:visible!important;
    padding:0!important;
    scroll-snap-type:none!important;
  }
  #sbLedgerHistoryRow .sb-ledger-panel .stage-card{
    width:auto!important;
    min-width:0!important;
    max-width:none!important;
    flex:none!important;
    box-sizing:border-box!important;
  }
  #sbLedgerHistoryRow .sb-history-panel .tx-list{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    border-top:0!important;
  }
  #sbLedgerHistoryRow .sb-history-panel .tx-row:first-child{
    border-top:1px solid var(--paper-line)!important;
  }
  #sbLedgerHistoryPaymentRow{
    width:100%!important;
    min-width:0!important;
    margin:0 0 22px!important;
    box-sizing:border-box!important;
  }
  #sbLedgerHistoryPaymentRow #btnOpenPaymentForm{
    width:100%!important;
    max-width:none!important;
    min-height:48px!important;
    margin:0!important;
    justify-content:center!important;
  }
}
@media (min-width:1024px) and (max-width:1279px){
  #sbLedgerHistoryRow .sb-ledger-panel .ledger-scroll{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
}
`;
    document.head.appendChild(s);
  }

  styles();
  var original=window.renderDetail;
  if(typeof original==='function'&&!original.__sunblissLedgerHistoryWrapped){
    function wrapped(){var out=original.apply(this,arguments);schedule();return out;}
    wrapped.__sunblissLedgerHistoryWrapped=true;
    wrapped.__sunblissOriginal=original;
    window.renderDetail=wrapped;
  }
  var main=document.getElementById('main');
  if(main&&window.MutationObserver){
    new MutationObserver(function(){if(!applying)schedule();}).observe(main,{childList:true,subtree:true});
  }
  function breakpoint(){if(isDesktop())schedule();else restore();}
  if(MQ){if(MQ.addEventListener)MQ.addEventListener('change',breakpoint);else if(MQ.addListener)MQ.addListener(breakpoint);}
  window.addEventListener('pageshow',schedule,{passive:true});
  schedule();
})();
