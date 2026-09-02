(function(){
  'use strict';
  if(window.__sunblissCreditNotesDetailInstalled)return;window.__sunblissCreditNotesDetailInstalled=true;
  function install(){
    var A=window.__sunblissCreditNoteApi;
    if(!A||typeof window.renderDetail!=='function'){setTimeout(install,50);return;}
    function ensureHistoryStyle(){
      if(document.getElementById('sunblissCreditNoteHistoryStyle'))return;
      var s=document.createElement('style');s.id='sunblissCreditNoteHistoryStyle';s.textContent='.detail .tx-list .credit-note-tx-row{background:transparent!important}.detail .tx-list .credit-note-tx-row .tx-amt{color:inherit!important}.detail .tx-list .credit-note-tx-row .tx-status{color:var(--muted)!important}';document.head.appendChild(s);
    }
    function wirePaymentForm(){var t=document.getElementById('pfCreditToggle'),b=document.getElementById('pfCreditFields'),s=document.getElementById('pfStage');if(!t||!b||!s||t.dataset.creditReady==='1')return;t.dataset.creditReady='1';function sync(){var c=A.selectedCustomer(),stage=c&&(c.stages||[]).find(function(x){return A.text(x.code)===A.text(s.value)}),blocked=A.isDldStage&&A.isDldStage(stage);t.hidden=!!blocked;if(blocked){b.hidden=true;t.setAttribute('aria-expanded','false');t.textContent='+ Add credit note (optional)';Array.prototype.forEach.call(b.querySelectorAll('input'),function(x){x.value=''});}}t.addEventListener('click',function(){var open=b.hidden;b.hidden=!open;t.setAttribute('aria-expanded',String(open));t.textContent=open?'− Remove credit note':'+ Add credit note (optional)';if(open){var a=document.getElementById('pfCreditAmount');if(a)setTimeout(function(){a.focus();},0);}});s.addEventListener('change',sync);sync();}
    function customerSummary(c){
      if(!c||!(Number(c.creditNoteTotal)>0))return;var grid=document.querySelector('.detail .money-grid');if(!grid)return;
      Array.prototype.forEach.call(grid.querySelectorAll('.money-label'),function(l){if(A.text(l.textContent).trim().toLowerCase()==='received')l.textContent='Cash received';});
      if(!document.getElementById('creditNoteCustomerTotal')){var row=document.createElement('div');row.id='creditNoteCustomerTotal';row.className='credit-note-customer-total';row.innerHTML='<span>Total credit notes issued</span><strong>'+A.safe(A.money(c.creditNoteTotal))+'</strong>';grid.insertAdjacentElement('afterend',row);}
      var settled=(Number(c.cashReceived)||0)+(Number(c.creditNoteTotal)||0),total=Number(c.total)||0;if(total>0){var pct=Math.max(0,Math.min(100,Math.round(settled/total*1000)/10)),p=document.querySelector('.detail .cust-progress');if(p){var fill=p.querySelector('.bar-fill');if(fill)fill.style.width=pct+'%';var caps=p.querySelectorAll('.bar-caption span'),left=pct+'% settled',right=(Math.round((100-pct)*10)/10)+'% remaining';if(caps[0]&&A.text(caps[0].textContent).trim()!==left)caps[0].innerHTML='<b>'+pct+'%</b> settled';if(caps[1]&&A.text(caps[1].textContent).trim()!==right)caps[1].innerHTML='<b>'+Math.round((100-pct)*10)/10+'%</b> remaining';}}
    }
    function stageCards(c){
      if(!c||!Array.isArray(c.stages))return;document.querySelectorAll('.detail .ledger-scroll .stage-card').forEach(function(card,i){var s=c.stages[i];if(!s||!(Number(s.creditNoteTotal)>0))return;var rows=Array.prototype.slice.call(card.querySelectorAll('.stage-row')),paid=rows.find(function(r){var x=r.querySelector('span:first-child');return x&&A.text(x.textContent).trim().toLowerCase()==='paid';});if(paid){var spans=paid.querySelectorAll('span');if(spans[0])spans[0].textContent='Cash';if(spans[1])spans[1].textContent=A.money(s.cashPaid||0);}if(!card.querySelector('.credit-note-stage-row')){var cr=document.createElement('div');cr.className='stage-row credit-note-stage-row';cr.innerHTML='<span>Credit note'+((s.creditNotes||[]).length>1?'s':'')+'</span><span>'+A.safe(A.money(s.creditNoteTotal))+'</span>';if(paid)paid.insertAdjacentElement('afterend',cr);else card.appendChild(cr);}if(!card.querySelector('.credit-note-stage-count')){var badge=document.createElement('span');badge.className='credit-note-stage-count';badge.textContent=(s.creditNotes||[]).length+' credit note'+((s.creditNotes||[]).length===1?'':'s');card.appendChild(badge);}});
    }
    function stageKeys(v){
      var s=A.text(v).trim().toLowerCase(),out=[];
      function add(k){if(out.indexOf(k)===-1)out.push(k);}
      if(s.indexOf('down')!==-1||/\bdp\b/.test(s))add('DP');
      if(s.indexOf('dld')!==-1||s.indexOf('admin fee')!==-1||s.indexOf('admin fees')!==-1)add('DLD');
      if(s.indexOf('1st')!==-1||s.indexOf('first')!==-1)add('1ST');
      if(s.indexOf('2nd')!==-1||s.indexOf('second')!==-1)add('2ND');
      if(s.indexOf('3rd')!==-1||s.indexOf('third')!==-1)add('3RD');
      if(s.indexOf('4th')!==-1||s.indexOf('fourth')!==-1)add('4TH');
      if(s.indexOf('5th')!==-1||s.indexOf('fifth')!==-1)add('5TH');
      if(s.indexOf('6th')!==-1||s.indexOf('sixth')!==-1)add('6TH');
      if(s.indexOf('7th')!==-1||s.indexOf('seventh')!==-1)add('7TH');
      if(s.indexOf('final')!==-1||s.indexOf('handover')!==-1||s.indexOf('possession')!==-1)add('FIN');
      return out;
    }
    function noteKey(n){var keys=stageKeys(n&&n.stageLabel);return keys[0]||('SCHEDULE:'+A.text(n&&n.scheduleId));}
    function noteRow(n){
      var r=document.createElement('div');r.className='tx-row credit-note-tx-row';r.setAttribute('data-credit-note-id',A.text(n.id));
      var meta='Credit note';if(n.reason)meta+=' · '+A.safe(n.reason);if(n.reference)meta+=' · Ref '+A.safe(n.reference);
      r.innerHTML='<span class="tx-date">'+A.safe(A.dateLabel(n.issueDate))+'</span><span class="tx-main"><span class="tx-towards">'+A.safe(n.stageLabel||'Installment')+'</span><br/><span class="tx-status">'+meta+'</span></span><span class="tx-amt">'+A.safe(A.money(n.amount))+'</span>';
      return r;
    }
    function placeAfter(anchor,row){if(!anchor||!row)return;if(anchor.nextElementSibling===row)return;anchor.insertAdjacentElement('afterend',row);}
    function history(c){
      if(!c)return;var list=document.querySelector('.detail .tx-list');if(!list)return;ensureHistoryStyle();
      var notes=(c.creditNotes||[]).slice(),valid={};notes.forEach(function(n){valid[A.text(n.id)]=true;});
      list.querySelectorAll('.credit-note-tx-row[data-credit-note-id]').forEach(function(row){if(!valid[A.text(row.getAttribute('data-credit-note-id'))])row.remove();});
      if(!notes.length)return;
      var empty=list.querySelector('.tx-empty');if(empty)empty.remove();
      var rowsById={};notes.forEach(function(n){var id=A.text(n.id),row=list.querySelector('.credit-note-tx-row[data-credit-note-id="'+id+'"]');if(!row){row=noteRow(n);list.appendChild(row);}rowsById[id]=row;});
      var baseRows=Array.prototype.slice.call(list.querySelectorAll('.tx-row:not(.credit-note-tx-row)'));
      var groups={};notes.forEach(function(n){var k=noteKey(n);(groups[k]||(groups[k]=[])).push(n);});
      Object.keys(groups).forEach(function(k){
        var group=groups[k].slice().sort(function(a,b){return A.text(b.issueDate).localeCompare(A.text(a.issueDate))||Number(b.id||0)-Number(a.id||0);});
        var matches=baseRows.filter(function(row){var towards=row.querySelector('.tx-towards'),keys=stageKeys(towards?A.text(towards.textContent):'');return keys.indexOf(k)!==-1;});
        var anchor=matches.length?matches[matches.length-1]:null;
        if(anchor){group.forEach(function(n){var row=rowsById[A.text(n.id)];placeAfter(anchor,row);anchor=row;});}
      });
      var unmatched=notes.filter(function(n){var row=rowsById[A.text(n.id)];return row&&(!row.previousElementSibling||(!row.previousElementSibling.classList.contains('credit-note-tx-row')&&stageKeys((row.previousElementSibling.querySelector('.tx-towards')||{}).textContent||'').indexOf(noteKey(n))===-1));}).sort(function(a,b){return A.text(b.issueDate).localeCompare(A.text(a.issueDate))||Number(b.id||0)-Number(a.id||0);});
      unmatched.forEach(function(n){var row=rowsById[A.text(n.id)];if(row&&row.parentNode===list)list.appendChild(row);});
      var label=Array.prototype.slice.call(document.querySelectorAll('.detail .section-label')).find(function(el){return A.text(el.textContent).trim().toLowerCase().indexOf('transaction history')===0;});if(label){var next='Transaction history · '+list.querySelectorAll('.tx-row').length;if(A.text(label.textContent)!==next)label.textContent=next;}
    }
    function decorate(){if(!window.state||state.view!=='detail')return;var c=A.selectedCustomer();if(!c)return;customerSummary(c);stageCards(c);history(c);wirePaymentForm();}
    function installmentEditor(){var d=document.getElementById('installmentEditDialog');if(!d||d.dataset.creditReady==='1')return;var c=A.selectedCustomer(),title=d.querySelector('h3');if(!c||!title)return;var s=(c.stages||[]).find(function(x){return A.text(x.label)===A.text(title.textContent).trim();});if(!s||!(Number(s.creditNoteTotal)>0))return;var due=document.getElementById('ieDueAmount'),paid=document.getElementById('iePaidAmount'),status=document.getElementById('ieStatus');if(!due||!paid||!status)return;d.dataset.creditReady='1';var metas=d.querySelectorAll('.installment-edit-meta');if(metas[0]&&!d.querySelector('.credit-note-edit-meta')){var m=document.createElement('div');m.className='installment-edit-meta credit-note-edit-meta';m.innerHTML='<span>Credit notes</span><strong>'+A.safe(A.money(s.creditNoteTotal))+' · '+(s.creditNotes||[]).length+' note'+((s.creditNotes||[]).length===1?'':'s')+'</strong>';metas[0].insertAdjacentElement('afterend',m);}function refresh(){var dv=Number(due.value)||0,cash=Number(paid.value)||0,settled=cash+(Number(s.creditNoteTotal)||0);status.textContent=settled<=0?'Outstanding':(dv>0&&settled>=dv-0.01?'Paid':'Partial');}due.addEventListener('input',refresh);paid.addEventListener('input',refresh);refresh();}
    function paymentDetail(){var d=document.getElementById('paymentDetailDialog'),c=A.selectedCustomer();if(!d||!c)return;d.querySelectorAll('.payment-detail-row').forEach(function(row){if(row.dataset.creditReady==='1')return;var title=row.querySelector('.payment-detail-row-title'),s=(c.stages||[]).find(function(x){return title&&A.text(x.label)===A.text(title.textContent).trim();});if(!s||!(Number(s.creditNoteTotal)>0))return;row.dataset.creditReady='1';var meta=row.querySelector('.payment-detail-row-meta');if(!meta)return;Array.prototype.forEach.call(meta.querySelectorAll('span'),function(span){if(A.text(span.textContent).indexOf('Paid:')===0)span.textContent='Cash: '+A.money(s.cashPaid||0);});var credit=document.createElement('span');credit.textContent='Credit notes: '+A.money(s.creditNoteTotal);meta.appendChild(credit);var settled=document.createElement('span');settled.textContent='Settled: '+A.money(s.settledAmount||0);meta.appendChild(settled);});}
    var base=window.renderDetail;window.renderDetail=function(){var out=base.apply(this,arguments);decorate();return out;};
    new MutationObserver(function(){installmentEditor();paymentDetail();if(state.view==='detail')decorate();}).observe(document.body,{childList:true,subtree:true});decorate();
  }
  install();
})();
