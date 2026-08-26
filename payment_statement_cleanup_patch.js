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
  function mmInPixels(){
    var ruler=document.createElement('div');
    ruler.style.cssText='position:absolute;visibility:hidden;pointer-events:none;left:-10000px;top:0;width:100mm;height:1px;padding:0;border:0;margin:0;';
    document.body.appendChild(ruler);
    var px=ruler.getBoundingClientRect().width/100;
    ruler.remove();
    return px||3.7795275591;
  }
  function fitsOnePage(statement){
    if(!statement||!document.body)return false;
    var probe=statement.cloneNode(true);
    probe.classList.remove('ps-one-page');
    probe.classList.add('ps-fit-probe');
    probe.removeAttribute('id');
    Array.prototype.forEach.call(probe.querySelectorAll('[id]'),function(el){el.removeAttribute('id');});
    probe.style.cssText='position:absolute!important;visibility:hidden!important;pointer-events:none!important;left:-10000px!important;top:0!important;display:block!important;width:210mm!important;max-width:210mm!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;';
    document.body.appendChild(probe);
    var measured=Math.max(probe.scrollHeight,probe.getBoundingClientRect().height);
    probe.remove();
    var maxHeight=281*mmInPixels();
    statement.dataset.statementMeasuredHeight=Math.round(measured);
    statement.dataset.statementFitLimit=Math.round(maxHeight);
    return measured>0&&measured<=maxHeight;
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

    statement.classList.remove('ps-one-page');
    statement.classList.toggle('ps-one-page',fitsOnePage(statement));
    statement.dataset.statementCleanupDone='1';
  }

  function ensureStyles(){
    if(document.getElementById('sunblissPaymentStatementCleanupStyles'))return;
    var style=document.createElement('style');
    style.id='sunblissPaymentStatementCleanupStyles';
    style.textContent=[
      '.professional-payment-statement.ps-fit-probe{font-size:10pt!important;box-sizing:border-box!important;position:relative!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-body{font-size:10pt!important;line-height:1.25!important;padding-top:4.8mm!important;padding-bottom:15mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-section h2{font-size:12pt!important;line-height:1.15!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-table{font-size:10pt!important;line-height:1.2!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-table th{font-size:8.5pt!important;line-height:1.15!important;padding-top:1.25mm!important;padding-bottom:1.25mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-table td{padding-top:1.05mm!important;padding-bottom:1.05mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-customer-name{font-size:14pt!important;line-height:1.1!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-customer-meta{font-size:9pt!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-mini-label{font-size:8pt!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-card-label{font-size:10pt!important;line-height:1.05!important;margin-bottom:.8mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-card-value{font-size:14pt!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-header-right{font-size:9pt!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-customer{height:auto!important;min-height:15mm!important;margin-bottom:3.2mm!important;padding:2.7mm 4.5mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-summary{margin-bottom:2.5mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-card{height:18.5mm!important;padding-top:2.7mm!important;padding-bottom:2.1mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-progress{margin-top:1.6mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-section{margin-top:2mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-heading-rule{margin:.8mm 0 1.6mm!important;}',
      '.professional-payment-statement.ps-fit-probe .ps-footer{position:absolute!important;left:11.5mm!important;right:11.5mm!important;bottom:4.5mm!important;margin:0!important;padding-top:2mm!important;min-height:7mm!important;font-size:8.5pt!important;}',
      '@media print{',
      '  #printArea{min-height:0!important;height:auto!important;overflow:visible!important;}',
      '  #printArea .professional-payment-statement{font-size:10pt!important;}',
      '  #printArea .professional-payment-statement .ps-body{font-size:10pt!important;line-height:1.25!important;}',
      '  #printArea .professional-payment-statement .ps-section h2{font-size:12pt!important;line-height:1.15!important;}',
      '  #printArea .professional-payment-statement .ps-table{font-size:10pt!important;line-height:1.2!important;}',
      '  #printArea .professional-payment-statement .ps-table th{font-size:8.5pt!important;line-height:1.15!important;}',
      '  #printArea .professional-payment-statement .ps-customer-name{font-size:14pt!important;line-height:1.1!important;}',
      '  #printArea .professional-payment-statement .ps-customer-meta{font-size:9pt!important;}',
      '  #printArea .professional-payment-statement .ps-mini-label{font-size:8pt!important;}',
      '  #printArea .professional-payment-statement .ps-card-label{font-size:10pt!important;line-height:1.05!important;}',
      '  #printArea .professional-payment-statement .ps-card-value{font-size:14pt!important;}',
      '  #printArea .professional-payment-statement .ps-header-right{font-size:9pt!important;}',
      '  #printArea .professional-payment-statement .ps-footer{font-size:8.5pt!important;}',
      '  #printArea .professional-payment-statement.ps-one-page{position:relative!important;height:286mm!important;min-height:286mm!important;max-height:286mm!important;overflow:hidden!important;break-inside:avoid!important;page-break-inside:avoid!important;}',
      '  #printArea .professional-payment-statement.ps-one-page>.ps-body{padding-top:4.8mm!important;padding-bottom:15mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-customer{height:auto!important;min-height:15mm!important;margin-bottom:3.2mm!important;padding:2.7mm 4.5mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-summary{margin-bottom:2.5mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-card{height:18.5mm!important;padding-top:2.7mm!important;padding-bottom:2.1mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-card-label{margin-bottom:.8mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-progress{margin-top:1.6mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-section{margin-top:2mm!important;break-inside:auto!important;page-break-inside:auto!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-transactions-section{break-before:auto!important;page-break-before:auto!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-heading-rule{margin:.8mm 0 1.6mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-table th{padding-top:1.25mm!important;padding-bottom:1.25mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-table td{padding-top:1.05mm!important;padding-bottom:1.05mm!important;}',
      '  #printArea .professional-payment-statement.ps-one-page .ps-footer{position:absolute!important;left:11.5mm!important;right:11.5mm!important;bottom:4.5mm!important;margin:0!important;padding-top:2mm!important;min-height:7mm!important;justify-content:flex-start!important;break-inside:avoid!important;page-break-inside:avoid!important;}',
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
