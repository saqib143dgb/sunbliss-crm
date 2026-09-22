(function(){
  'use strict';

  if (window.__sunblissNewCustomerSalesChannelInstalled) return;
  window.__sunblissNewCustomerSalesChannelInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function valueOf(id){
    var el = document.getElementById(id);
    return el ? text(el.value).trim() : '';
  }
  function numberValue(value){
    var n = Number(value);
    return isFinite(n) ? n : null;
  }
  function roundedMoney(value){ return Math.round((Number(value) || 0) * 100) / 100; }
  function formatMoney(value){
    if (typeof window.fmtAED === 'function') return window.fmtAED(Number(value) || 0);
    return 'AED ' + (Number(value) || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function normalizeSource(value){
    var source = text(value).trim().toLowerCase();
    if (source === 'broker') return 'Broker';
    if (source === 'direct') return 'Direct';
    if (source === 'individual buyer' || source === 'individual') return 'Individual Buyer';
    return '';
  }
  function input(id,label,value,type,extra,placeholder){
    return '<label class="brand-field">' + safe(label) + '<input type="' + (type || 'text') + '" id="' + id + '" value="' + safe(value == null ? '' : value) + '"' + (extra || '') + (placeholder ? ' placeholder="' + safe(placeholder) + '"' : '') + ' /></label>';
  }
  function select(id,label,value,options,extra){
    var html = '<label class="brand-field">' + safe(label) + '<select id="' + id + '"' + (extra || '') + '>';
    options.forEach(function(option){
      var optionValue = option.value;
      html += '<option value="' + safe(optionValue) + '"' + (text(value) === text(optionValue) ? ' selected' : '') + '>' + safe(option.label) + '</option>';
    });
    html += '</select></label>';
    return html;
  }
  function fieldStyles(){
    if (document.getElementById('newCustomerSalesChannelStyles')) return;
    var style = document.createElement('style');
    style.id = 'newCustomerSalesChannelStyles';
    style.textContent = [
      '#newCustomerChannelCard{margin:0 0 14px;padding:14px;border:1px solid rgba(198,151,46,.30);border-radius:12px;background:rgba(198,151,46,.06);}',
      '#newCustomerChannelCard .brand-field:last-child{margin-bottom:0;}',
      '#newCustomerChannelCard select,.new-customer-channel-fields select{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.2 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box;}',
      '.new-customer-channel-fields{margin:0 0 12px;padding:12px;border:1px solid var(--paper-line);border-radius:11px;background:var(--paper);}',
      '.new-customer-channel-fields[hidden]{display:none!important;}',
      '.new-customer-calc{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:-3px 0 10px;padding:10px 11px;border-radius:9px;background:var(--paper-dim);border:1px solid var(--paper-line);}',
      '.new-customer-calc-label{font-size:11px;color:var(--muted);}',
      '.new-customer-calc-value{font-family:IBM Plex Mono,monospace;font-size:13px;font-weight:700;color:var(--ink);text-align:right;}',
      '.new-customer-channel-help{font-size:11.5px;line-height:1.45;color:var(--muted);margin:-3px 0 12px;}',
      '#ncUnitNo{display:block;width:100%;margin-top:5px;padding:10px 36px 10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.2 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box;}',
      '#ncUnitType[readonly],#ncFloor[readonly],#ncArea[readonly]{background:rgba(220,210,182,.45);color:var(--slate);cursor:default;}',
      '.detail .brand-editor input[type="date"]{display:block;width:100%;height:44px;min-height:44px;padding:9px 11px;line-height:24px;font-size:16px;box-sizing:border-box;-webkit-appearance:auto;appearance:auto;}',
      '.detail .brand-editor input[type="date"]::-webkit-calendar-picker-indicator{opacity:1;min-width:20px;min-height:20px;cursor:pointer;}',
      '@media(max-width:480px){.new-customer-calc{align-items:flex-start;flex-direction:column;gap:4px}.new-customer-calc-value{text-align:left}}'
    ].join('');
    document.head.appendChild(style);
  }

  function storedValues(){ return (window.state && state.newCustomerFormValues) || {}; }
  function getStored(key){ var values = storedValues(); return values[key] || ''; }

  function availableUnits(){ return window.state && Array.isArray(state.__newCustomerAvailableUnits) ? state.__newCustomerAvailableUnits : []; }
  function availableUnitByNo(unitNo){
    var wanted = text(unitNo).trim();
    return availableUnits().find(function(row){ return text(row && row.unit_no).trim() === wanted; }) || null;
  }
  function unitSelectOptions(selected){
    var rows = availableUnits();
    var options = [{value:'',label:state.__newCustomerAvailableUnitsError ? 'Could not load available units' : (rows.length ? 'Select available unit' : 'Loading available units…')}];
    rows.forEach(function(row){ options.push({value:text(row.unit_no),label:text(row.unit_no)}); });
    if (selected && !rows.some(function(row){ return text(row.unit_no) === text(selected); })){
      options.push({value:text(selected),label:text(selected)});
    }
    return options;
  }
  async function loadAvailableUnits(force){
    if (!window.state || !window.sb) return [];
    if (!force && Array.isArray(state.__newCustomerAvailableUnits)) return state.__newCustomerAvailableUnits;
    if (!force && state.__newCustomerAvailableUnitsPromise) return state.__newCustomerAvailableUnitsPromise;
    state.__newCustomerAvailableUnitsError = '';
    state.__newCustomerAvailableUnitsPromise = sb.from('units')
      .select('id,unit_no,unit_type,floor,area,unit_area_sqft,status,availability_status,customer_id')
      .eq('availability_status','Available')
      .order('unit_no',{ascending:true})
      .then(function(result){
        if (result.error) throw result.error;
        var rows = (result.data || []).slice().sort(function(a,b){
          return text(a.unit_no).localeCompare(text(b.unit_no),undefined,{numeric:true,sensitivity:'base'});
        });
        state.__newCustomerAvailableUnits = rows;
        state.__newCustomerAvailableUnitsPromise = null;
        return rows;
      })
      .catch(function(err){
        state.__newCustomerAvailableUnits = [];
        state.__newCustomerAvailableUnitsError = err && err.message ? err.message : 'Could not load available units.';
        state.__newCustomerAvailableUnitsPromise = null;
        throw err;
      });
    return state.__newCustomerAvailableUnitsPromise;
  }
  function syncSelectedUnitFields(){
    var selectEl = document.getElementById('ncUnitNo');
    if (!selectEl) return;
    var row = availableUnitByNo(selectEl.value);
    var typeEl = document.getElementById('ncUnitType');
    var floorEl = document.getElementById('ncFloor');
    var areaEl = document.getElementById('ncArea');
    var area = row ? (row.area !== null && row.area !== undefined ? row.area : row.unit_area_sqft) : '';
    if (typeEl){ typeEl.value = row ? text(row.unit_type) : ''; typeEl.readOnly = true; }
    if (floorEl){ floorEl.value = row ? text(row.floor) : ''; floorEl.readOnly = true; }
    if (areaEl){
      areaEl.value = row && area !== null && area !== undefined ? text(area) : '';
      areaEl.readOnly = true;
      areaEl.dispatchEvent(new Event('input',{bubbles:true}));
    }
    state.__newCustomerSelectedUnitId = row ? row.id : null;
  }

  function captureFormValues(){
    var source = normalizeSource(valueOf('ncSource') || getStored('source'));
    var values = {
      name:valueOf('ncName'), phone:valueOf('ncPhone'), email:valueOf('ncEmail'), nationality:valueOf('ncNationality'),
      designation:valueOf('ncDesignation'), dob:valueOf('ncDob'), passport:valueOf('ncPassport'), eid:valueOf('ncEid'),
      address:valueOf('ncAddress'), permanentAddress:valueOf('ncPermanentAddress'), coApplicant:valueOf('ncCoApplicant'),
      unitNo:valueOf('ncUnitNo'), unitType:valueOf('ncUnitType'), floor:valueOf('ncFloor'), area:valueOf('ncArea'),
      pricePerSqft:valueOf('ncPricePerSqft'), totalPrice:valueOf('ncTotalPrice'), bookingDate:valueOf('ncBookingDate'),
      bookingAmount:valueOf('ncBookingAmount'), soldBy:valueOf('ncSoldBy'), source:source,
      brokerName:valueOf('ncBrokerName'), brokerCompany:valueOf('ncBrokerCompany'),
      brokeragePct:source === 'Broker' ? valueOf('ncBrokeragePct') : (source === 'Individual Buyer' ? valueOf('ncVoucherPct') : ''),
      incentiveType:source === 'Individual Buyer' ? valueOf('ncIncentiveType') : ''
    };
    if (typeof window.STAGES !== 'undefined' && Array.isArray(window.STAGES)){
      window.STAGES.forEach(function(stage){
        values['stageAmt_' + stage.code] = valueOf('ncAmt_' + stage.code);
        values['stageDate_' + stage.code] = valueOf('ncDate_' + stage.code);
      });
    }
    var total = numberValue(values.totalPrice);
    var pct = numberValue(values.brokeragePct);
    values.brokerageAmt = total !== null && pct !== null && total > 0 && pct > 0 ? String(roundedMoney(total * pct / 100)) : '';
    return values;
  }

  function calculatedAmount(source){
    var total = numberValue(valueOf('ncTotalPrice'));
    var pct = source === 'Broker' ? numberValue(valueOf('ncBrokeragePct')) : numberValue(valueOf('ncVoucherPct'));
    if (total === null || pct === null || total <= 0 || pct <= 0) return 0;
    return roundedMoney(total * pct / 100);
  }

  function refreshCalculation(){
    var source = normalizeSource(valueOf('ncSource'));
    var amount = calculatedAmount(source);
    var target = source === 'Broker' ? document.getElementById('ncBrokerageAmtDisplay') : document.getElementById('ncVoucherAmtDisplay');
    if (target) target.textContent = amount > 0 ? formatMoney(amount) : 'AED 0.00';
  }

  function syncChannelFields(){
    var source = normalizeSource(valueOf('ncSource'));
    var broker = document.getElementById('ncBrokerFields');
    var individual = document.getElementById('ncIndividualFields');
    if (broker) broker.hidden = source !== 'Broker';
    if (individual) individual.hidden = source !== 'Individual Buyer';
    refreshCalculation();
  }

  function renderNewCustomer(){
    if (!window.state || typeof mainEl === 'undefined' || !mainEl) return;
    fieldStyles();
    var n = state.newCustomerFormValues || {};
    function e(key){ return n[key] || ''; }
    var source = normalizeSource(e('source'));
    var t = '<div class="detail">';
    t += '<button class="back" id="btnNcBack" style="margin-bottom:10px;">&larr; Back to units</button>';
    t += '<h2 class="d-name" style="margin-bottom:2px;">New customer</h2>';
    t += '<p class="d-type" style="margin-bottom:18px;">Creates the customer, unit and sale record. Add a payment schedule below if you know the installment amounts — you can leave any stage blank.</p>';
    if (state.newCustomerFormError) t += '<p class="brand-error">' + safe(state.newCustomerFormError) + '</p>';
    t += '<div class="brand-editor">';
    t += '<p class="section-label" style="margin-top:0;">Customer</p>';
    t += input('ncName','Full name',e('name'),'text','','e.g. John Smith');
    t += input('ncPhone','Phone',e('phone'),'text','','e.g. +971 50 123 4567');
    t += input('ncEmail','Email',e('email'),'email','','e.g. name@example.com');
    t += input('ncNationality','Nationality',e('nationality'),'text');
    t += input('ncDesignation','Occupation',e('designation'),'text');
    t += input('ncDob','Date of birth',e('dob'),'date');
    t += input('ncPassport','Passport no.',e('passport'),'text');
    t += input('ncEid','Emirates ID',e('eid'),'text');
    t += input('ncAddress','Address',e('address'),'text');
    t += input('ncPermanentAddress','Permanent address',e('permanentAddress'),'text');
    t += input('ncCoApplicant','Co-applicant',e('coApplicant'),'text');

    t += '<p class="section-label">Unit</p>';
    t += select('ncUnitNo','Unit no.',e('unitNo'),unitSelectOptions(e('unitNo')),' required');
    t += input('ncUnitType','Unit type',e('unitType'),'text',' readonly');
    t += input('ncFloor','Floor',e('floor'),'text',' readonly');
    t += input('ncArea','Area (sqft)',e('area'),'number',' readonly min="0" step="0.01"');
    t += input('ncPricePerSqft','Price / sqft',e('pricePerSqft'),'number',' min="0" step="0.01"');
    t += input('ncTotalPrice','Total price (AED)',e('totalPrice'),'number',' min="0" step="0.01"','e.g. 1200000');

    t += '<p class="section-label">Sale details</p>';
    t += input('ncBookingDate','Booking date',e('bookingDate'),'date');
    t += input('ncBookingAmount','Booking amount (AED)',e('bookingAmount'),'number',' min="0" step="0.01"');
    t += input('ncSoldBy','Sold by',e('soldBy'),'text');
    t += '<div id="newCustomerChannelCard">';
    t += select('ncSource','Sales channel',source,[
      {value:'',label:'Choose sales channel'},
      {value:'Broker',label:'Broker'},
      {value:'Direct',label:'Direct'},
      {value:'Individual Buyer',label:'Individual Buyer'}
    ],' required');
    t += '<p class="new-customer-channel-help">Fields below change automatically based on the selected sales channel.</p>';
    t += '</div>';

    t += '<div class="new-customer-channel-fields" id="ncBrokerFields"' + (source === 'Broker' ? '' : ' hidden') + '>';
    t += '<p class="section-label" style="margin-top:0">Broker</p>';
    t += input('ncBrokerName','Broker name',e('brokerName'),'text','','Required for broker sales');
    t += input('ncBrokerCompany','Broker company',e('brokerCompany'),'text');
    t += input('ncBrokeragePct','Brokerage %',e('brokeragePct'),'number',' min="0" max="100" step="0.01"','e.g. 5');
    t += '<div class="new-customer-calc"><span class="new-customer-calc-label">Total brokerage on unit value</span><span class="new-customer-calc-value" id="ncBrokerageAmtDisplay">AED 0.00</span></div>';
    t += '</div>';

    t += '<div class="new-customer-channel-fields" id="ncIndividualFields"' + (source === 'Individual Buyer' ? '' : ' hidden') + '>';
    t += '<p class="section-label" style="margin-top:0">Individual buyer incentive</p>';
    t += select('ncIncentiveType','Voucher type',e('incentiveType'),[
      {value:'',label:'Choose voucher type'},
      {value:'Credit Voucher',label:'Credit Voucher'},
      {value:'Referral Voucher',label:'Referral Voucher'}
    ],'');
    t += input('ncVoucherPct','Voucher / referral %',e('brokeragePct'),'number',' min="0" max="100" step="0.01"','e.g. 2');
    t += '<div class="new-customer-calc"><span class="new-customer-calc-label">Voucher value on unit value</span><span class="new-customer-calc-value" id="ncVoucherAmtDisplay">AED 0.00</span></div>';
    t += '<p class="new-customer-channel-help">The calculated amount is saved with the sale as the individual buyer incentive.</p>';
    t += '</div>';

    t += '<p class="section-label">Payment schedule (optional)</p>';
    t += '<p class="stat-sub" style="margin:-6px 0 12px;">Leave a stage blank to skip it — only stages with an amount are saved.</p>';
    if (typeof window.STAGES !== 'undefined' && Array.isArray(window.STAGES)){
      window.STAGES.forEach(function(stage){
        t += '<div style="display:flex;gap:8px;align-items:flex-end;margin-bottom:11px;">' +
          '<label class="brand-field" style="flex:1.3;margin-bottom:0;">' + safe(stage.label) + '<input type="number" id="ncAmt_' + stage.code + '" min="0" step="0.01" value="' + safe(e('stageAmt_' + stage.code)) + '" placeholder="Due amount" /></label>' +
          '<label class="brand-field" style="flex:1;margin-bottom:0;">&nbsp;<input type="date" id="ncDate_' + stage.code + '" value="' + safe(e('stageDate_' + stage.code)) + '" /></label>' +
        '</div>';
      });
    }
    t += '<div class="brand-editor-actions" style="margin-top:6px;">';
    t += '<button type="button" class="btn btn-gold" id="ncSave" style="justify-content:center"' + (state.newCustomerFormSaving ? ' disabled' : '') + '>' + (state.newCustomerFormSaving ? 'Saving…' : 'Create customer') + '</button>';
    t += '<button class="btn-paper" id="ncCancel" style="justify-content:center;margin-bottom:0">Cancel</button>';
    t += '</div></div></div>';

    mainEl.innerHTML = t;
    document.getElementById('btnNcBack').addEventListener('click',function(){ state.view='list'; renderMain(); window.scrollTo(0,0); });
    document.getElementById('ncCancel').addEventListener('click',function(){ state.newCustomerFormValues=null; state.newCustomerFormError=null; state.view='list'; renderMain(); window.scrollTo(0,0); });
    document.getElementById('ncSave').addEventListener('click',function(event){ if(event) event.preventDefault(); if(typeof window.saveNewCustomer==='function') return window.saveNewCustomer(); return saveNewCustomer(); });
    var unitSelect = document.getElementById('ncUnitNo');
    if (unitSelect){
      unitSelect.addEventListener('change',function(){ syncSelectedUnitFields(); });
      syncSelectedUnitFields();
    }
    var sourceSelect = document.getElementById('ncSource');
    if (sourceSelect) sourceSelect.addEventListener('change',function(){
      var previousSource = normalizeSource(getStored('source'));
      var values = captureFormValues();
      values.source = normalizeSource(sourceSelect.value);
      if (previousSource !== values.source){ values.brokeragePct=''; values.brokerageAmt=''; }
      if (values.source !== 'Broker'){ values.brokerName=''; values.brokerCompany=''; }
      if (values.source !== 'Individual Buyer') values.incentiveType='';
      state.newCustomerFormValues = values;
      renderNewCustomer();
    });
    ['ncTotalPrice','ncBrokeragePct','ncVoucherPct'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener('input',refreshCalculation);
    });
    syncChannelFields();
  }

  async function saveNewCustomer(){
    var e = captureFormValues();
    var source = normalizeSource(e.source);
    e.source = source;
    state.newCustomerFormValues = e;

    if (!e.name){ state.newCustomerFormError='Enter the customer’s name.'; renderNewCustomer(); return; }
    if (!e.unitNo){ state.newCustomerFormError='Select an available unit.'; renderNewCustomer(); return; }
    var selectedUnit = availableUnitByNo(e.unitNo);
    if (!selectedUnit){ state.newCustomerFormError='Select an available unit from the list.'; renderNewCustomer(); return; }
    var totalPrice = numberValue(e.totalPrice);
    if (totalPrice === null || totalPrice <= 0){ state.newCustomerFormError='Enter a valid total price.'; renderNewCustomer(); return; }
    if (!source){ state.newCustomerFormError='Choose Broker, Direct or Individual Buyer as the sales channel.'; renderNewCustomer(); return; }

    var brokeragePct = null;
    var brokerageAmt = null;
    var brokerName = null;
    var brokerCompany = null;
    var incentiveType = null;

    if (source === 'Broker'){
      brokerName = e.brokerName || null;
      brokerCompany = e.brokerCompany || null;
      brokeragePct = numberValue(e.brokeragePct);
      if (!brokerName){ state.newCustomerFormError='Enter the broker name.'; renderNewCustomer(); return; }
      if (brokeragePct === null || brokeragePct <= 0 || brokeragePct > 100){ state.newCustomerFormError='Enter a valid brokerage percentage between 0 and 100.'; renderNewCustomer(); return; }
      brokerageAmt = roundedMoney(totalPrice * brokeragePct / 100);
    } else if (source === 'Individual Buyer'){
      incentiveType = e.incentiveType || null;
      brokeragePct = numberValue(e.brokeragePct);
      if (incentiveType !== 'Credit Voucher' && incentiveType !== 'Referral Voucher'){
        state.newCustomerFormError='Choose Credit Voucher or Referral Voucher for the individual buyer.';
        renderNewCustomer(); return;
      }
      if (brokeragePct === null || brokeragePct <= 0 || brokeragePct > 100){ state.newCustomerFormError='Enter a valid voucher percentage between 0 and 100.'; renderNewCustomer(); return; }
      brokerageAmt = roundedMoney(totalPrice * brokeragePct / 100);
    }

    state.newCustomerFormSaving = true;
    state.newCustomerFormError = null;
    renderNewCustomer();

    try{
      var availabilityCheck = await sb.from('units').select('id,unit_no,availability_status').eq('id',selectedUnit.id).eq('availability_status','Available').single();
      if (availabilityCheck.error || !availabilityCheck.data) throw new Error('That unit is no longer available. Refresh the form and choose another unit.');

      var customerResult = await sb.from('customers').insert({
        customer_name:e.name,
        phone:e.phone || null,
        email:e.email || null,
        nationality:e.nationality || null,
        designation:e.designation || null,
        date_of_birth:e.dob || null,
        passport_no:e.passport || null,
        eid_no:e.eid || null,
        address:e.address || null,
        permanent_address:e.permanentAddress || null,
        co_applicant:e.coApplicant || null
      }).select('id').single();
      if (customerResult.error) throw customerResult.error;
      var customerId = customerResult.data.id;

      var unitResult = await sb.from('units').update({
        customer_id:customerId,
        unit_type:e.unitType || selectedUnit.unit_type || null,
        floor:e.floor || selectedUnit.floor || null,
        area:e.area ? parseFloat(e.area) : (selectedUnit.area !== null && selectedUnit.area !== undefined ? selectedUnit.area : selectedUnit.unit_area_sqft),
        price_per_sqft:e.pricePerSqft ? parseFloat(e.pricePerSqft) : null,
        total_price:totalPrice,
        status:'Sold',
        availability_status:'Sold',
        updated_at:new Date().toISOString()
      }).eq('id',selectedUnit.id).eq('availability_status','Available').select('id').single();
      if (unitResult.error || !unitResult.data) throw (unitResult.error || new Error('That unit is no longer available.'));
      var unitId = unitResult.data.id;

      var saleResult = await sb.from('sales').insert({
        customer_id:customerId,
        unit_id:unitId,
        booking_date:e.bookingDate || null,
        booking_amount:e.bookingAmount ? parseFloat(e.bookingAmount) : null,
        sold_by:e.soldBy || null,
        source:source,
        broker_name:brokerName,
        broker_company:brokerCompany,
        brokerage_percentage:brokeragePct,
        brokerage_amount:brokerageAmt,
        incentive_type:incentiveType
      });
      if (saleResult.error) throw saleResult.error;

      var schedule = [];
      if (typeof window.STAGES !== 'undefined' && Array.isArray(window.STAGES)){
        window.STAGES.forEach(function(stage){
          var amount = parseFloat(e['stageAmt_' + stage.code]);
          if (amount && amount > 0){
            schedule.push({
              customer_id:customerId,
              unit_id:unitId,
              stage_name:window.STAGE_CODE_TO_NAME[stage.code],
              due_amount:amount,
              due_date:e['stageDate_' + stage.code] || null,
              paid_amount:0,
              status:'Outstanding'
            });
          }
        });
      }
      if (schedule.length){
        var scheduleResult = await sb.from('payment_schedule').insert(schedule);
        if (scheduleResult.error) throw scheduleResult.error;
      }

      state.newCustomerFormValues = null;
      state.newCustomerFormSaving = false;
      state.newCustomerFormError = null;
      state.__newCustomerAvailableUnits = null;
      state.__newCustomerSelectedUnitId = null;
      try { await loadAvailableUnits(true); } catch (_inventoryRefreshError) {}
      await loadFromSupabase();
      goToDetail(e.unitNo,unitId,'list');
    }catch(err){
      state.newCustomerFormSaving = false;
      state.newCustomerFormError = err && err.message ? err.message : 'Could not create that customer.';
      renderNewCustomer();
    }
  }

  function selectedCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return c && String(c.unit || '') + '::' + String(c.sno || '') === String(state.selectedUnit); }) || null;
  }

  async function enrichIncentiveTypes(){
    if (!window.sb || !window.state) return;
    var result = await sb.from('sales').select('unit_id,incentive_type');
    if (result.error) throw result.error;
    var byUnit = {};
    (result.data || []).forEach(function(row){ byUnit[String(row.unit_id)] = row.incentive_type || null; });
    [state.dues,state.cancelled].forEach(function(list){
      if (!Array.isArray(list)) return;
      list.forEach(function(c){
        if (c && c.info) c.info.incentiveType = byUnit[String(c.sno)] || null;
      });
    });
  }

  function makeDetailRow(label,value){
    var row = document.createElement('div');
    row.className = 'field-row individual-incentive-field';
    row.innerHTML = '<span class="field-label">' + safe(label) + '</span><span class="field-value">' + safe(value) + '</span>';
    return row;
  }

  function showIndividualIncentiveDetail(){
    document.querySelectorAll('.individual-incentive-field').forEach(function(row){ row.remove(); });
    if (!window.state || state.view !== 'detail') return;
    var c = selectedCustomer();
    if (!c || !c.info || normalizeSource(c.info.source) !== 'Individual Buyer') return;
    var detail = document.querySelector('.detail');
    if (!detail) return;
    var rows = Array.prototype.slice.call(detail.querySelectorAll('.field-row'));
    var sourceRow = rows.find(function(row){
      var label = row.querySelector('.field-label');
      return label && text(label.textContent).trim().toLowerCase() === 'source';
    });
    if (!sourceRow || !sourceRow.parentNode) return;
    var pct = c.info.brokeragePct === null || c.info.brokeragePct === undefined ? '—' : text(c.info.brokeragePct) + '%';
    var amount = c.info.brokerageAmt === null || c.info.brokerageAmt === undefined ? '—' : formatMoney(c.info.brokerageAmt);
    var anchor = sourceRow;
    [
      makeDetailRow('Voucher type',c.info.incentiveType || '—'),
      makeDetailRow('Voucher / referral %',pct),
      makeDetailRow('Voucher amount',amount)
    ].forEach(function(row){ anchor.parentNode.insertBefore(row,anchor.nextSibling); anchor = row; });
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderNewCustomer !== 'function' || typeof window.saveNewCustomer !== 'function' || typeof window.loadFromSupabase !== 'function'){
      setTimeout(install,50);
      return;
    }
    window.renderNewCustomer = renderNewCustomer;
    window.saveNewCustomer = saveNewCustomer;
    loadAvailableUnits().then(function(){ if (state.view === 'newCustomer') renderNewCustomer(); }).catch(function(){ if (state.view === 'newCustomer') renderNewCustomer(); });

    var originalLoad = window.loadFromSupabase;
    window.loadFromSupabase = async function(){
      var result = await originalLoad.apply(this,arguments);
      try { await enrichIncentiveTypes(); } catch (err) { console.warn('Could not load individual-buyer incentive types',err); }
      return result;
    };

    if (typeof window.renderDetail === 'function'){
      var originalRenderDetail = window.renderDetail;
      window.renderDetail = function(){
        var result = originalRenderDetail.apply(this,arguments);
        showIndividualIncentiveDetail();
        return result;
      };
    }
  }

  install();
})();
