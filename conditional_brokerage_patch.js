(function(){
  'use strict';

  if (window.__sunblissConditionalBrokerageInstalled) return;
  window.__sunblissConditionalBrokerageInstalled = true;

  function esc(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function money(value){
    var num = Number(value);
    if (!isFinite(num)) return '—';
    if (typeof window.fmtAED === 'function') return window.fmtAED(num);
    return 'AED ' + Math.round(num).toLocaleString('en-US');
  }

  function isBrokerSale(info){
    info = info || {};
    var source = String(info.source || '').trim().toLowerCase();
    if (source.indexOf('direct') === 0) return false;
    if (source.indexOf('broker') !== -1) return true;
    return !!(String(info.brokerName || '').trim() || String(info.brokerCompany || '').trim());
  }

  function customerForCard(card){
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
    var sno = String(card.getAttribute('data-sno') || '');
    var unit = String(card.getAttribute('data-unit') || '');
    return dues.find(function(customer){
      if (!customer) return false;
      if (sno && String(customer.sno || '') === sno) return true;
      return unit && String(customer.unit || '') === unit;
    }) || null;
  }

  function selectedCustomer(){
    var dues = window.state && Array.isArray(window.state.dues) ? window.state.dues : [];
    var selected = window.state ? String(window.state.selectedUnit || '') : '';
    if (!selected) return null;
    return dues.find(function(customer){
      return customer && String(customer.unit || '') + '::' + String(customer.sno || '') === selected;
    }) || null;
  }

  function labelsIn(grid){
    var result = {};
    grid.querySelectorAll('.rm-unit-field,.broker-unit-field').forEach(function(row){
      var label = row.querySelector('.rm-unit-field-label,.broker-unit-field-label');
      if (label) result[String(label.textContent || '').trim().toLowerCase()] = row;
    });
    return result;
  }

  function makeField(kind,label,value){
    var rowClass = kind === 'broker' ? 'broker-unit-field' : 'rm-unit-field';
    var labelClass = kind === 'broker' ? 'broker-unit-field-label' : 'rm-unit-field-label';
    var valueClass = kind === 'broker' ? 'broker-unit-field-value' : 'rm-unit-field-value';
    var row = document.createElement('div');
    row.className = rowClass + ' conditional-brokerage-field';
    row.innerHTML = '<span class="'+labelClass+'">'+esc(label)+'</span><span class="'+valueClass+'">'+esc(value)+'</span>';
    return row;
  }

  function setFieldValue(row,kind,value){
    if (!row) return;
    var selector = kind === 'broker' ? '.broker-unit-field-value' : '.rm-unit-field-value';
    var valueEl = row.querySelector(selector);
    if (valueEl && valueEl.textContent !== String(value)) valueEl.textContent = value;
  }

  function brokerageValues(info){
    var pctRaw = info ? info.brokeragePct : null;
    var amtRaw = info ? info.brokerageAmt : null;
    var pct = pctRaw === null || pctRaw === undefined || String(pctRaw).trim() === '' ? '—' : String(pctRaw) + '%';
    var amt = amtRaw === null || amtRaw === undefined || String(amtRaw).trim() === '' ? '—' : money(amtRaw);
    return {pct:pct,amount:amt};
  }

  function addAfter(reference,node){
    if (!reference || !reference.parentNode) return;
    reference.parentNode.insertBefore(node,reference.nextSibling);
  }

  function refineRmCard(card){
    var customer = customerForCard(card);
    if (!customer) return;
    var info = customer.info || {};
    var grid = card.querySelector('.rm-unit-grid');
    if (!grid) return;

    if (!isBrokerSale(info)){
      grid.querySelectorAll('.conditional-brokerage-field').forEach(function(row){ row.remove(); });
      return;
    }

    var existing = labelsIn(grid);
    var values = brokerageValues(info);
    var anchor = existing.broker || existing.source || null;

    if (!existing['brokerage %']){
      var pctRow = makeField('rm','Brokerage %',values.pct);
      if (anchor){ addAfter(anchor,pctRow); anchor = pctRow; }
      else { grid.appendChild(pctRow); anchor = pctRow; }
      existing['brokerage %'] = pctRow;
    } else {
      anchor = existing['brokerage %'];
      setFieldValue(anchor,'rm',values.pct);
    }

    if (!existing['brokerage amount']){
      var amountRow = makeField('rm','Brokerage amount',values.amount);
      if (anchor) addAfter(anchor,amountRow);
      else grid.appendChild(amountRow);
      existing['brokerage amount'] = amountRow;
    } else {
      setFieldValue(existing['brokerage amount'],'rm',values.amount);
    }
  }

  function refineBrokerCard(card){
    var customer = customerForCard(card);
    if (!customer) return;
    var info = customer.info || {};
    var grid = card.querySelector('.broker-unit-grid');
    if (!grid) return;

    var existing = labelsIn(grid);
    var values = brokerageValues(info);
    var anchor = existing.oqood || existing.spa || null;

    if (!existing['brokerage %']){
      var pctRow = makeField('broker','Brokerage %',values.pct);
      if (anchor){ addAfter(anchor,pctRow); anchor = pctRow; }
      else { grid.appendChild(pctRow); anchor = pctRow; }
      existing['brokerage %'] = pctRow;
    } else {
      anchor = existing['brokerage %'];
      setFieldValue(anchor,'broker',values.pct);
    }

    if (!existing['brokerage amount']){
      var amountRow = makeField('broker','Brokerage amount',values.amount);
      if (anchor) addAfter(anchor,amountRow);
      else grid.appendChild(amountRow);
      existing['brokerage amount'] = amountRow;
    } else {
      setFieldValue(existing['brokerage amount'],'broker',values.amount);
    }
  }

  function refineCustomerDetail(){
    var detail = document.querySelector('.detail');
    if (!detail) return;
    var customer = selectedCustomer();
    if (!customer) return;
    var showBrokerage = isBrokerSale(customer.info || {});
    var saleLabel = null;

    detail.querySelectorAll('.section-label').forEach(function(label){
      if (String(label.textContent || '').trim().toLowerCase() === 'sale & compliance') saleLabel = label;
    });
    if (!saleLabel) return;

    var node = saleLabel.nextElementSibling;
    while (node && !(node.classList && node.classList.contains('section-label'))){
      var next = node.nextElementSibling;
      if (node.classList && node.classList.contains('field-row')){
        var labelEl = node.querySelector('.field-label');
        var text = labelEl ? String(labelEl.textContent || '').trim().toLowerCase() : '';
        if (text === 'brokerage %' || text === 'brokerage amount'){
          node.style.display = showBrokerage ? '' : 'none';
        }
      }
      node = next;
    }
  }

  function refine(){
    document.querySelectorAll('.rm-unit-card').forEach(refineRmCard);
    document.querySelectorAll('.broker-unit-card').forEach(refineBrokerCard);
    refineCustomerDetail();
  }

  refine();
  var app = document.getElementById('app');
  if (app && window.MutationObserver){
    var observer = new MutationObserver(function(){
      // Brokerage refinement can add/remove rows. Pause this observer while
      // doing that work so those same row changes cannot recursively trigger
      // another refinement/repaint cycle.
      observer.disconnect();
      try {
        refine();
      } finally {
        observer.observe(app,{childList:true,subtree:true});
      }
    });
    observer.observe(app,{childList:true,subtree:true});
  }
})();
