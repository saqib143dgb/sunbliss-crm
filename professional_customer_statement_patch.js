(function(){
  'use strict';

  if (window.__sunblissProfessionalStatementInstalled) return;
  window.__sunblissProfessionalStatementInstalled = true;

  var COMPANY = 'PURVANCHAL REAL ESTATE DEVELOPERS LLC';

  function text(v){ return v === null || v === undefined ? '' : String(v); }
  function esc(v){
    return text(v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function title(v){
    var s=text(v).trim();
    if (!s) return '';
    if (typeof window.titleCase === 'function') return window.titleCase(s);
    return s.toLowerCase().replace(/\b\w/g,function(ch){ return ch.toUpperCase(); });
  }
  function money(v){
    var n=Number(v);
    if (!isFinite(n)) n=0;
    return 'AED ' + n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function dateValue(v){
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    var raw=text(v);
    var d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw+'T00:00:00' : raw);
    return isNaN(d.getTime()) ? null : d;
  }
  function dateLabel(v){
    var d=dateValue(v);
    if (!d) return '-';
    return d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  }
  function normName(v){ return text(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function normUnit(v){ return text(v).toLowerCase().replace(/[^a-z0-9]+/g,''); }
  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){
      return c && (text(c.unit)+'::'+text(c.sno)) === text(state.selectedUnit);
    }) || null;
  }
  function transactionsFor(c){
    var rows=[];
    if (window.state && Array.isArray(state.recent)){
      var cn=normName(c.name), cu=normUnit(c.unit);
      var sameNameCount=Array.isArray(state.dues) ? state.dues.filter(function(d){ return normName(d && d.name)===cn; }).length : 1;
      rows=state.recent.filter(function(t){
        var tn=normName(t && t.name);
        if (!tn || tn.length<3) return false;
        var match=tn===cn || cn.indexOf(tn)!==-1 || tn.indexOf(cn)!==-1;
        if (!match) return false;
        if (sameNameCount>1){
          var tu=normUnit(t && t.unit);
          return !!tu && !!cu && tu===cu;
        }
        return true;
      }).map(function(t){
        return {date:t && t.date,towards:t && t.towards || 'Payment',amount:t && t.amount,isCreditNote:false};
      });
    }
    (Array.isArray(c && c.creditNotes) ? c.creditNotes : []).forEach(function(n){
      var towards='Credit note — '+text(n.stageLabel||'Installment');
      if (n.reason) towards+=' — '+text(n.reason);
      if (n.reference) towards+=' (Ref '+text(n.reference)+')';
      rows.push({date:n.issueDate,towards:towards,amount:n.amount,isCreditNote:true});
    });
    return rows.sort(function(a,b){
      var da=dateValue(a && a.date), db=dateValue(b && b.date);
      var diff=(da?da.getTime():0)-(db?db.getTime():0);
      if (diff) return diff;
      return a.isCreditNote===b.isCreditNote?0:(a.isCreditNote?1:-1);
    });
  }
  function hasCreditNotes(c){ return Number(c && c.creditNoteTotal)>0; }
  function cashReceived(c){ return hasCreditNotes(c) && c.cashReceived!==undefined ? Number(c.cashReceived)||0 : Number(c && c.received)||0; }
  function settledReceived(c){ return hasCreditNotes(c) && c.settledReceived!==undefined ? Number(c.settledReceived)||0 : Number(c && c.received)||0; }
  function paidPct(c){
    var total=Number(c && c.total)||0, received=settledReceived(c);
    if (total<=0) return 0;
    return Math.max(0,Math.min(100,Math.round((received/total)*1000)/10));
  }
  function summaryCard(label,value,kind,extra){
    return '<div class="ps-card ps-card-'+kind+'">'+
      '<div class="ps-card-label">'+esc(label)+'</div>'+
      '<div class="ps-card-value">'+esc(value)+'</div>'+(extra||'')+
    '</div>';
  }
  function buildStatement(c){
    var today=new Date();
    var pct=paidPct(c);
    var type=text(c.type).trim();
    var credit=hasCreditNotes(c);
    var creditTotal=Number(c.creditNoteTotal)||0;
    var unitLine='UNIT '+text(c.unit).toUpperCase()+(type?' | '+type.toUpperCase():'');
    var customerMeta='Unit '+text(c.unit)+(type?' | '+type:'')+(credit?' | Credit notes '+money(creditTotal):'');
    var stages=Array.isArray(c.stages) ? c.stages : [];
    var txs=transactionsFor(c);

    var html='<div class="professional-payment-statement">';
    html+='<div class="ps-gold-rail"></div>';
    html+='<header class="ps-header">'+
      '<div class="ps-header-left"><div class="ps-company">'+COMPANY+'</div><div class="ps-company-rule"></div><div class="ps-title">Payment Statement</div></div>'+
      '<div class="ps-header-right"><div>Statement date: '+esc(dateLabel(today))+'</div><strong>'+esc(unitLine)+'</strong></div>'+
    '</header>';

    html+='<main class="ps-body">';
    html+='<section class="ps-customer"><div><div class="ps-mini-label">CUSTOMER</div><div class="ps-customer-name">'+esc(title(c.name))+'</div></div><div class="ps-customer-meta">'+esc(customerMeta)+'</div></section>';

    html+='<section class="ps-summary">'+
      summaryCard('TOTAL',money(c.total),'total')+
      summaryCard(credit?'CASH RECEIVED':'RECEIVED',money(cashReceived(c)),'received')+
      summaryCard('OUTSTANDING',money(c.outstanding),'outstanding')+
      summaryCard(credit?'SETTLED':'PAID',pct.toFixed(pct%1?1:0)+'%','paid','<div class="ps-progress"><span style="width:'+pct+'%"></span></div>')+
    '</section>';

    html+='<section class="ps-section"><h2>Installment Schedule</h2><div class="ps-heading-rule"></div>';
    html+='<table class="ps-table ps-installments"><thead><tr><th>STAGE</th><th>DUE</th><th>DUE DATE</th><th>'+(credit?'CASH / CREDIT':'PAID')+'</th><th>PAID DATE</th></tr></thead><tbody>';
    if (stages.length){
      stages.forEach(function(s){
        var stageCredit=Number(s && s.creditNoteTotal)||0;
        var stageCash=stageCredit>0 && s.cashPaid!==undefined ? Number(s.cashPaid)||0 : Number(s && s.paid)||0;
        var paymentCell=stageCredit>0 ? 'Cash '+money(stageCash)+' / CN '+money(stageCredit) : money(stageCash);
        html+='<tr'+(stageCredit>0?' class="ps-credit-note-stage"':'')+'><td>'+esc(s && s.label || 'Installment')+'</td><td>'+esc(money(s && s.due))+'</td><td>'+esc(dateLabel(s && s.dueDate))+'</td><td>'+esc(paymentCell)+'</td><td>'+esc(stageCash>0 ? dateLabel(s.paidDate) : '-')+'</td></tr>';
      });
    }else{
      html+='<tr><td colspan="5" class="ps-empty">No installment schedule on record.</td></tr>';
    }
    html+='</tbody></table></section>';

    html+='<section class="ps-section ps-transactions-section"><h2>Transaction History</h2><div class="ps-heading-rule"></div>';
    html+='<table class="ps-table ps-transactions"><thead><tr><th>DATE</th><th>TOWARDS</th><th>AMOUNT</th></tr></thead><tbody>';
    if (txs.length){
      txs.forEach(function(t){
        html+='<tr'+(t.isCreditNote?' class="ps-credit-note-transaction"':'')+'><td>'+esc(dateLabel(t && t.date))+'</td><td>'+(t.isCreditNote?'<span class="ps-credit-note-label">CREDIT NOTE</span> ':'')+esc(t && t.towards || 'Payment')+'</td><td>'+esc(money(t && t.amount))+'</td></tr>';
      });
    }else{
      html+='<tr><td colspan="3" class="ps-empty">No transactions on record.</td></tr>';
    }
    html+='</tbody></table></section>';
    html+='</main>';

    html+='<footer class="ps-footer"><span>CONFIDENTIAL - INTERNAL USE ONLY</span><span>Generated '+esc(dateLabel(today))+' | Values preserved from CRM records</span></footer>';
    html+='</div>';
    return html;
  }

  function ensureStyles(){
    if (document.getElementById('professionalPaymentStatementStyles')) return;
    var style=document.createElement('style');
    style.id='professionalPaymentStatementStyles';
    style.textContent=[
      '@media print{',
      '@page{size:A4 portrait;margin:0!important;}',
      'html,body{background:#fff!important;}',
      '#printArea{display:block!important;width:210mm!important;min-height:297mm!important;margin:0!important;padding:0!important;background:#fff!important;}',
      '#printArea .professional-payment-statement{display:block!important;}',
      '}',
      '.professional-payment-statement{position:relative;width:210mm;min-height:297mm;background:#fff;color:#172230;font-family:Inter,Arial,sans-serif;box-sizing:border-box;overflow:hidden;}',
      '.professional-payment-statement *{box-sizing:border-box;}',
      '.professional-payment-statement .ps-gold-rail{position:absolute;left:0;top:26mm;bottom:0;width:1.25mm;background:#b58b33;}',
      '.professional-payment-statement .ps-header{height:26mm;background:#102a40;color:#fff;padding:5.6mm 11.5mm 4.6mm 11.5mm;display:flex;justify-content:space-between;gap:12mm;align-items:flex-start;}',
      '.ps-header-left{min-width:0}.ps-company{font-size:3.2mm;font-weight:700;letter-spacing:.02em;white-space:nowrap}.ps-company-rule{width:38mm;height:.7mm;background:#c79a37;margin:1.2mm 0 1.4mm}.ps-title{font-size:7.1mm;font-weight:700;line-height:1;letter-spacing:-.02em}',
      '.ps-header-right{text-align:right;font-size:2.65mm;line-height:1.45;color:#dce4ea;padding-top:.4mm;white-space:nowrap}.ps-header-right strong{display:block;color:#fff;margin-top:2.1mm;font-size:2.95mm;letter-spacing:.02em}',
      '.ps-body{padding:6.5mm 11.5mm 20mm 11.5mm;}',
      '.ps-customer{min-height:17mm;border-radius:2.7mm;background:#f4f5f7;padding:3.8mm 5mm;display:flex;align-items:center;justify-content:space-between;gap:7mm;margin-bottom:5.2mm;}',
      '.ps-mini-label{font-size:2.15mm;font-weight:700;color:#66707d;letter-spacing:.04em;margin-bottom:1.2mm}.ps-customer-name{font-size:4.6mm;font-weight:700;color:#202b38}.ps-customer-meta{font-size:2.55mm;color:#7a8490;text-align:right;white-space:nowrap}',
      '.ps-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:2.4mm;margin-bottom:4.3mm;}',
      '.ps-card{position:relative;height:21.5mm;border:1px solid #d8dde2;border-radius:2.3mm;background:#fff;padding:4mm 3.8mm 3.2mm 4.8mm;overflow:hidden;}',
      '.ps-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:1.25mm;border-radius:2.3mm 0 0 2.3mm}.ps-card-total:before{background:#0f3d5b}.ps-card-received:before{background:#25885e}.ps-card-outstanding:before{background:#b64b4f}.ps-card-paid:before{background:#b78a2d}',
      '.ps-card-label{font-size:2.05mm;font-weight:700;color:#69737e;letter-spacing:.04em;margin-bottom:2.4mm}.ps-card-value{font-size:4.3mm;font-weight:700;color:#26313e;white-space:nowrap}.ps-progress{height:1.25mm;background:#e5e8eb;border-radius:2mm;margin-top:3.2mm;overflow:hidden}.ps-progress span{display:block;height:100%;background:#b78a2d;border-radius:2mm}',
      '.ps-section{margin-top:3.5mm;break-inside:avoid;page-break-inside:avoid}.ps-section h2{font-size:4.45mm;line-height:1.1;margin:0;color:#1c2734;font-weight:700}.ps-heading-rule{width:12mm;height:.75mm;background:#b78a2d;margin:1.25mm 0 3.2mm}',
      '.ps-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #d9dde2;border-radius:1.6mm;overflow:hidden;font-size:2.45mm;line-height:1.18;table-layout:fixed}.ps-table thead{display:table-header-group}.ps-table tr{break-inside:avoid;page-break-inside:avoid}.ps-table th{background:#12344f;color:#fff;text-align:left;padding:2.1mm 2.8mm;font-size:2.1mm;font-weight:700;letter-spacing:.025em}.ps-table td{padding:1.75mm 2.8mm;border-bottom:1px solid #e6e8eb;color:#303a45;vertical-align:middle}.ps-table tbody tr:nth-child(even) td{background:#f7f8f9}.ps-table tbody tr:last-child td{border-bottom:none}.ps-table .ps-empty{text-align:center;color:#7a8490;padding:4mm}',
      '.ps-installments th:nth-child(1){width:29%}.ps-installments th:nth-child(2){width:19%}.ps-installments th:nth-child(3){width:18%}.ps-installments th:nth-child(4){width:18%}.ps-installments th:nth-child(5){width:16%}',
      '.ps-transactions th:nth-child(1){width:23%}.ps-transactions th:nth-child(2){width:57%}.ps-transactions th:nth-child(3){width:20%}.ps-transactions td:last-child,.ps-transactions th:last-child{text-align:right}',
      '.ps-credit-note-stage td{background:#fbf7ed!important}.ps-credit-note-transaction td{background:#fbf7ed!important;color:#5e4a1b!important}.ps-credit-note-label{display:inline-block;font-weight:700;font-size:1.85mm;letter-spacing:.04em;color:#8f6a1e;margin-right:1mm}',
      '.ps-footer{position:absolute;left:11.5mm;right:11.5mm;bottom:7.2mm;border-top:1px solid #d7dade;padding-top:3.1mm;display:flex;justify-content:space-between;gap:8mm;font-size:1.95mm;color:#7b858e;letter-spacing:.01em;}',
      '@media screen{#printArea .professional-payment-statement{margin:0 auto;box-shadow:0 16px 50px rgba(0,0,0,.15)}}'
    ].join('');
    document.head.appendChild(style);
  }

  function printStatement(c){
    ensureStyles();
    var area=document.getElementById('printArea');
    if (!area) return;
    area.innerHTML=buildStatement(c);
    var previous=document.title;
    document.title='Payment Statement - '+title(c.name)+' - Unit '+text(c.unit);
    var restore=function(){
      document.title=previous;
      window.removeEventListener('afterprint',restore);
    };
    window.addEventListener('afterprint',restore);
    window.setTimeout(function(){ window.print(); },40);
  }

  document.addEventListener('click',function(ev){
    var btn=ev.target && ev.target.closest ? ev.target.closest('#btnPrintStatement') : null;
    if (!btn) return;
    var c=currentCustomer();
    if (!c) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    printStatement(c);
  },true);

  ensureStyles();
})();
