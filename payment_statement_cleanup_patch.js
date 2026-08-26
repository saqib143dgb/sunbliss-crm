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
    if(!statement||statement.dataset.statementCleanupDone==='1')return;
    statement.dataset.statementCleanupDone='1';

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
      if(!visibleInstallments){
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
  }

  function ensureStyles(){
    if(document.getElementById('sunblissPaymentStatementCleanupStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissPaymentStatementCleanupStyles';
    style.textContent=[
      '@media print{',
      '  #printArea{min-height:0!important;height:auto!important;}',
      '  #printArea .professional-payment-statement.ps-one-page{min-height:296mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page>.ps-body{padding-top:5.4mm!important;padding-bottom:11.5mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-customer{height:15mm!important;min-height:15mm!important;margin-bottom:4mm!important;padding-top:3mm!important;padding-bottom:3mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-summary{margin-bottom:3mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-card{height:18.5mm!important;padding-top:3mm!important;padding-bottom:2.4mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-card-label{margin-bottom:1.6mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-progress{margin-top:2mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-section{margin-top:2.4mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-heading-rule{margin:1mm 0 2mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-table th{padding-top:1.55mm!important;padding-bottom:1.55mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-table td{padding-top:1.15mm!important;padding-bottom:1.15mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-footer{bottom:4.8mm!important;padding-top:1.8mm!important;}',
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
