(function(){
  'use strict';

  function currentCustomer(){
    if (!window.state || !state.selectedUnit) return null;
    return state.dues.find(function(c){ return (c.unit + '::' + c.sno) === state.selectedUnit; }) || null;
  }

  function text(v){
    return v === null || v === undefined ? '' : String(v);
  }

  function safe(v){
    return typeof esc === 'function' ? esc(text(v)) : text(v).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function valueOf(id){
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function field(id,label,value,type,extra){
    return '<label class="brand-field">' + safe(label) + '<input type="' + (type || 'text') + '" id="' + id + '" value="' + safe(text(value)) + '"' + (extra || '') + ' /></label>';
  }

  function selectField(id,label,value,options){
    var html = '<label class="brand-field">' + safe(label) + '<select id="' + id + '">';
    options.forEach(function(option){
      html += '<option value="' + safe(option) + '"' + (text(value).toLowerCase() === option.toLowerCase() ? ' selected' : '') + '>' + safe(option) + '</option>';
    });
    return html + '</select></label>';
  }

  function numberOrNull(id,label,maximum){
    var raw = valueOf(id);
    if (!raw) return null;
    var n = Number(raw);
    if (!isFinite(n) || n < 0) throw new Error(label + ' must be a valid non-negative number.');
    if (maximum !== undefined && n > maximum) throw new Error(label + ' cannot be more than ' + maximum + '.');
    return n;
  }

  function closeActionMenu(){
    var menu = document.getElementById('customerActionMenu');
    if (menu) menu.style.display = 'none';
  }

  function menuItem(id,label){
    return '<button type="button" id="' + id + '" style="display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;">' + safe(label) + '</button>';
  }

  function insertPanel(panel){
    var detail = document.querySelector('.detail');
    if (!detail) return;
    var badges = detail.querySelector('.badges');
    if (badges && badges.parentNode){
      badges.parentNode.insertBefore(panel,badges.nextSibling);
      return;
    }
    var name = detail.querySelector('.d-name');
    if (name && name.parentNode) name.parentNode.insertBefore(panel,name.nextSibling);
    else detail.insertBefore(panel,detail.firstChild);
  }

  async function showSaleComplianceEditor(c){
    var existing = document.getElementById('saleComplianceEditPanel');
    if (existing){ existing.remove(); return; }

    var customerPanel = document.getElementById('customerEditPanel');
    if (customerPanel) customerPanel.remove();

    var panel = document.createElement('div');
    panel.id = 'saleComplianceEditPanel';
    panel.className = 'brand-editor';
    panel.style.marginBottom = '16px';
    panel.innerHTML = '<p class="section-label" style="margin-top:0">Edit Sale &amp; compliance</p><p class="stat-sub">Loading current sale record…</p>';
    insertPanel(panel);

    try{
      var q = await sb.from('sales').select('*').eq('unit_id',c.sno).single();
      if (q.error) throw q.error;
      var sale = q.data;
      if (!sale || !sale.id) throw new Error('No sale record is linked to this unit.');

      panel.innerHTML =
        '<p class="section-label" style="margin-top:0">Edit Sale &amp; compliance</p>' +
        '<p class="stat-sub" style="margin:-5px 0 12px">Updates the sale record only. Payment schedules and transaction history are not changed.</p>' +
        '<p class="brand-error" id="saleComplianceError" style="display:none"></p>' +
        '<p class="section-label" style="margin-top:4px">Sale details</p>' +
        field('scBookingDate','Booking form signed date',sale.booking_date || '','date') +
        field('scBookingAmount','Booking amount (AED)',sale.booking_amount === null ? '' : sale.booking_amount,'number',' min="0" step="0.01"') +
        field('scSoldBy','Sold by',sale.sold_by || '') +
        field('scSource','Source',sale.source || '') +
        field('scBrokerName','Broker name',sale.broker_name || '') +
        field('scBrokerCompany','Broker company',sale.broker_company || '') +
        field('scBrokeragePct','Brokerage %',sale.brokerage_percentage === null ? '' : sale.brokerage_percentage,'number',' min="0" max="100" step="0.01"') +
        field('scBrokerageAmount','Brokerage amount (AED)',sale.brokerage_amount === null ? '' : sale.brokerage_amount,'number',' min="0" step="0.01"') +
        '<p class="section-label" style="margin-top:14px">Compliance</p>' +
        selectField('scSpaStatus','SPA status',sale.spa_status || 'Not Started',['Not Started','Drafted','Signed']) +
        field('scSpaDate','SPA signed date',sale.spa_date || '','date') +
        selectField('scOqoodStatus','OQOOD status',sale.oqood_status || 'Not Started',['Not Started','Pending','Completed']) +
        field('scOqoodDate','OQOOD completed date',sale.oqood_date || '','date') +
        selectField('scFurnitureStatus','Furniture status',sale.furniture_status || 'Unfurnished',['Unfurnished','Furnished']) +
        selectField('scDldStatus','DLD status',sale.dld_status || 'Not Started',['Not Started','Partial','Completed']) +
        '<label class="brand-field">Sales / compliance remarks<textarea id="scRemarks" rows="3" style="resize:vertical">' + safe(sale.remarks || '') + '</textarea></label>' +
        '<div class="brand-editor-actions">' +
          '<button class="btn btn-gold" id="scSave" style="justify-content:center">Save changes</button>' +
          '<button class="btn-paper" id="scCancel" style="justify-content:center;margin-bottom:0">Cancel</button>' +
        '</div>';

      document.getElementById('scCancel').onclick = function(){ panel.remove(); };
      document.getElementById('scSave').onclick = function(){ saveSaleCompliance(c,sale); };
    }catch(e){
      panel.innerHTML = '<p class="section-label" style="margin-top:0">Edit Sale &amp; compliance</p><p class="brand-error">' + safe(e && e.message ? e.message : 'Could not load the sale record.') + '</p><button class="btn-paper" id="scCloseLoadError">Close</button>';
      var close = document.getElementById('scCloseLoadError');
      if (close) close.onclick = function(){ panel.remove(); };
    }
  }

  async function saveSaleCompliance(c,sale){
    var err = document.getElementById('saleComplianceError');
    var save = document.getElementById('scSave');
    try{
      var payload = {
        booking_date:valueOf('scBookingDate') || null,
        booking_amount:numberOrNull('scBookingAmount','Booking amount'),
        sold_by:valueOf('scSoldBy') || null,
        source:valueOf('scSource') || null,
        broker_name:valueOf('scBrokerName') || null,
        broker_company:valueOf('scBrokerCompany') || null,
        brokerage_percentage:numberOrNull('scBrokeragePct','Brokerage percentage',100),
        brokerage_amount:numberOrNull('scBrokerageAmount','Brokerage amount'),
        spa_status:valueOf('scSpaStatus') || 'Not Started',
        spa_date:valueOf('scSpaDate') || null,
        oqood_status:valueOf('scOqoodStatus') || 'Not Started',
        oqood_date:valueOf('scOqoodDate') || null,
        furniture_status:valueOf('scFurnitureStatus') || 'Unfurnished',
        dld_status:valueOf('scDldStatus') || 'Not Started',
        remarks:valueOf('scRemarks') || null,
        updated_at:new Date().toISOString()
      };

      save.disabled = true;
      save.textContent = 'Saving…';
      if (err) err.style.display = 'none';

      var r = await sb.from('sales').update(payload).eq('id',sale.id);
      if (r.error) throw r.error;

      var unit = c.unit, sno = c.sno, from = state.detailFrom || 'list';
      await loadFromSupabase();
      goToDetail(unit,sno,from);
    }catch(e){
      if (err){
        err.textContent = e && e.message ? e.message : 'Could not save Sale & compliance details.';
        err.style.display = 'block';
      }else{
        alert(e && e.message ? e.message : 'Could not save Sale & compliance details.');
      }
      if (save){
        save.disabled = false;
        save.textContent = 'Save changes';
      }
    }
  }

  function installActionMenu(){
    if (!window.state || state.userRole !== 'crm_officer') return;
    var c = currentCustomer();
    if (!c) return;

    var detail = document.querySelector('.detail');
    var name = detail && detail.querySelector('.d-name');
    if (!detail || !name || document.getElementById('customerActionMenuButton')) return;

    var oldEdit = document.getElementById('btnEditCustomer');
    if (oldEdit) oldEdit.style.display = 'none';
    var oldStatus = document.getElementById('btnOpenStatusForm');
    if (oldStatus) oldStatus.style.display = 'none';

    var title = document.createElement('span');
    title.textContent = name.textContent;
    var actionWrap = document.createElement('span');
    actionWrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;flex:none;';
    actionWrap.innerHTML =
      '<button type="button" id="customerActionMenuButton" aria-label="Customer actions" aria-haspopup="menu" aria-expanded="false" style="width:34px;height:34px;border:1px solid rgba(0,0,0,.14);border-radius:9px;background:transparent;color:inherit;font-size:23px;line-height:28px;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;">&#8942;</button>' +
      '<div id="customerActionMenu" role="menu" style="display:none;position:absolute;right:0;top:40px;z-index:60;min-width:230px;padding:6px;background:var(--paper,#fff);border:1px solid rgba(0,0,0,.13);border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.16);">' +
        menuItem('actionEditCustomer','Edit customer details') +
        menuItem('actionEditSaleCompliance','Edit Sale & compliance') +
        menuItem('actionUpdateStatus','Update SPA / OQOOD status') +
        menuItem('actionRecordPayment','Record payment') +
      '</div>';

    name.textContent = '';
    name.style.display = 'flex';
    name.style.alignItems = 'center';
    name.style.justifyContent = 'space-between';
    name.style.gap = '12px';
    name.appendChild(title);
    name.appendChild(actionWrap);

    var button = document.getElementById('customerActionMenuButton');
    var menu = document.getElementById('customerActionMenu');
    button.onclick = function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      var open = menu.style.display !== 'none';
      menu.style.display = open ? 'none' : 'block';
      button.setAttribute('aria-expanded',open ? 'false' : 'true');
      if (!open){
        setTimeout(function(){
          document.addEventListener('click',function(){
            closeActionMenu();
            button.setAttribute('aria-expanded','false');
          },{once:true});
        },0);
      }
    };

    document.getElementById('actionEditCustomer').onclick = function(){
      closeActionMenu();
      var salePanel = document.getElementById('saleComplianceEditPanel');
      if (salePanel) salePanel.remove();
      var target = document.getElementById('btnEditCustomer');
      if (target) target.click();
    };

    document.getElementById('actionEditSaleCompliance').onclick = function(){
      closeActionMenu();
      showSaleComplianceEditor(c);
    };

    document.getElementById('actionUpdateStatus').onclick = function(){
      closeActionMenu();
      var salePanel = document.getElementById('saleComplianceEditPanel');
      if (salePanel) salePanel.remove();
      var target = document.getElementById('btnOpenStatusForm');
      if (target) target.click();
    };

    document.getElementById('actionRecordPayment').onclick = function(){
      closeActionMenu();
      var target = document.getElementById('btnOpenPaymentForm');
      if (target) target.click();
    };
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail !== 'function' || !window.__sunblissEditDeleteInstalled){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissCustomerActionMenuInstalled) return;
    window.__sunblissCustomerActionMenuInstalled = true;

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      installActionMenu();
      return out;
    };

    if (state.view === 'detail') installActionMenu();
  }

  install();
})();
