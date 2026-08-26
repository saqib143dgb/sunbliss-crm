(function(){
  'use strict';

  if(window.__sunblissPaymentStatementCleanupInstalled)return;
  window.__sunblissPaymentStatementCleanupInstalled=true;

  function text(v){return v==null?'':String(v).trim();}
  function hasPositiveAmount(v){
    var matches=text(v).replace(/,/g,'').match(/-?\d+(?:\.\d+)?/g)||[];
    return matches.some(function(n){return Math.abs(Number(n)||0)>0.005;});
  }
  function blankDate(v){
    var s=text(v);
    return !s||s==='-'||s==='—';
  }
  function emptyInstallmentRow(row){
    var cells=row&&row.cells?Array.prototype.slice.call(row.cells):[];
    if(cells.length<5)return false;
    var hasDue=hasPositiveAmount(cells[1].textContent);
    var hasPaid=hasPositiveAmount(cells[3].textContent);
    var hasPaidDate=!blankDate(cells[4].textContent);
    return !hasDue&&!hasPaid&&!hasPaidDate;
  }
  function visibleBodyRows(table){
    if(!table||!table.tBodies||!table.tBodies[0])return 0;
    return Array.prototype.filter.call(table.tBodies[0].rows,function(row){
      return row.style.display!=='none'&&!row.classList.contains('ps-empty');
    }).length;
  }
  function cleanStatement(){
    var statement=document.querySelector('#printArea .professional-payment-statement');
    if(!statement)return;

    var unitLine=statement.querySelector('.ps-header-right strong');
    if(unitLine)unitLine.remove();

    var footer=statement.querySelector('.ps-footer');
    if(footer){
      var spans=footer.querySelectorAll('span');
      for(var i=1;i<spans.length;i++)spans[i].remove();
    }

    var installmentTable=statement.querySelector('.ps-installments');
    if(installmentTable&&installmentTable.tBodies&&installmentTable.tBodies[0]){
      Array.prototype.forEach.call(installmentTable.tBodies[0].rows,function(row){
        if(emptyInstallmentRow(row)){
          row.style.display='none';
          row.setAttribute('aria-hidden','true');
        }
      });
      var visibleInstallments=visibleBodyRows(installmentTable);
      if(!visibleInstallments&&!installmentTable.tBodies[0].querySelector('.ps-empty')){
        var body=installmentTable.tBodies[0];
        var row=body.insertRow();
        row.className='ps-empty';
        var cell=row.insertCell();
        cell.colSpan=5;
        cell.textContent='No installment schedule on record.';
      }
    }

    var transactionTable=statement.querySelector('.ps-transactions');
    var rowCount=visibleBodyRows(installmentTable)+visibleBodyRows(transactionTable);
    statement.classList.toggle('ps-one-page',rowCount<=18);
    statement.dataset.statementCleanupDone='1';
  }

  function ensureStyles(){
    if(document.getElementById('sunblissPaymentStatementCleanupStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissPaymentStatementCleanupStyles';
    style.textContent=[
      '@media print{',
      '  #printArea{min-height:0!important;height:auto!important;overflow:visible!important;}',
      '  #printArea .professional-payment-statement.ps-one-page{min-height:0!important;height:auto!important;max-height:none!important;overflow:visible!important;break-inside:avoid!important;page-break-inside:avoid!important;}',
      '  #printArea .professional-payment-statement.ps-one-page>.ps-body{padding-top:5.2mm!important;padding-bottom:2.8mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-customer{height:14.5mm!important;min-height:14.5mm!important;margin-bottom:3.4mm!important;padding-top:2.8mm!important;padding-bottom:2.8mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-summary{margin-bottom:2.6mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-card{height:18mm!important;padding-top:2.8mm!important;padding-bottom:2.2mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-card-label{margin-bottom:1.4mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-progress{margin-top:1.8mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-section{margin-top:2.1mm!important;break-inside:auto!important;page-break-inside:auto!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-transactions-section{break-before:auto!important;page-break-before:auto!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-heading-rule{margin:.9mm 0 1.8mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-table th{padding-top:1.4mm!important;padding-bottom:1.4mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-table td{padding-top:1mm!important;padding-bottom:1mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-footer{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;margin:3mm 11.5mm 0!important;padding-top:1.8mm!important;min-height:7mm!important;break-inside:avoid!important;page-break-inside:avoid!important;}',
      '  #printArea .ps-footer{justify-content:flex-start!important;}',
      '}',
      '@media screen{#printArea .ps-footer{justify-content:flex-start!important;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function install(){
    ensureStyles();
    var printArea=document.getElementById('printArea');
    if(printArea){
      new MutationObserver(function(){cleanStatement();}).observe(printArea,{childList:true,subtree:true});
    }
    window.addEventListener('beforeprint',cleanStatement);
    document.addEventListener('click',function(e){
      var btn=e.target&&e.target.closest?e.target.closest('#btnPrintStatement'):null;
      if(btn)setTimeout(cleanStatement,0);
    },true);
    cleanStatement();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);
  else install();
})();
