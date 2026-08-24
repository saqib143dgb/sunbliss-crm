(function(){
  'use strict';

  if (window.__sunblissConsolidatedUnitEditorInstalled) return;
  window.__sunblissConsolidatedUnitEditorInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch];
    });
  }
  function cleanUnitType(value){
    return text(value)
      .replace(/\s*\(\s*(?:fully\s*-?\s*furnished|semi\s*-?\s*furnished|unfurnished|furnished)\s*\)\s*$/i,'')
      .replace(/\s+/g,' ')
      .trim();
  }
  function normalizeFurnishing(value){
    var v = text(value).replace(/\s+/g,' ').trim().toLowerCase();
    return v.indexOf('fully') !== -1 || v === 'furnished' || v === 'signed' ? 'Fully Furnished' : 'Semi Furnished';
  }
  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){
      return c && (text(c.unit) + '::' + text(c.sno)) === text(state.selectedUnit);
    }) || null;
  }
  function valueOf(id){
    var el = document.getElementById(id);
    return el ? text(el.value).trim() : '';
  }
  function numberOrNull(id,label){
    var raw = valueOf(id);
    if (raw === '') return null;
    var n = Number(raw);
    if (!isFinite(n) || n < 0) throw new Error(label + ' must be a valid non-negative number.');
    return Math.round(n * 100) / 100;
  }
  function option(value,current){
    return '<option value="' + safe(value) + '"' + (text(value).toLowerCase() === text(current).toLowerCase() ? ' selected' : '') + '>' + safe(value) + '</option>';
  }
  function field(id,label,value,type,extra){
    return '<label class="brand-field">' + safe(label) + '<input type="' + (type || 'text') + '" id="' + id + '" value="' + safe(value) + '"' + (extra || '') + ' /></label>';
  }

  function ensureStyles(){
    if (document.getElementById('sunblissConsolidatedUnitEditorStyles')) return;
    var style = document.createElement('style');
    style.id = 'sunblissConsolidatedUnitEditorStyles';
    style.textContent = [
      '#btnEditUnitDetails,#unitDetailsEditPanel{display:none!important;}',
      '#unitEditPanel{margin:0 0 16px;box-shadow:none;border:1px solid rgba(198,151,46,.34);}',
      '#unitEditPanel .unit-editor-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 12px;}',
      '#unitEditPanel input,#unitEditPanel select{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.2 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box;}',
      '#unitEditPanel .unit-editor-note{margin:-2px 0 13px;padding:10px 11px;border-radius:9px;background:rgba(198,151,46,.09);border:1px solid rgba(198,151,46,.22);font-size:11.5px;line-height:1.5;color:var(--muted);}',
      '#unitEditPanel .unit-editor-protected{font-size:10.5px;color:var(--muted);margin:-3px 0 12px;}',
      '@media(max-width:520px){#unitEditPanel .unit-editor-grid{grid-template-columns:1fr}#unitEditPanel .brand-editor-actions{flex-direction:column}#unitEditPanel .brand-editor-actions button{width:100%}}'
    ].join('');
    document.head.appendChild(style);
  }

  function cleanupLegacyEditor(){
    var oldButton = document.getElementById('btnEditUnitDetails');
    if (oldButton) oldButton.remove();
    var oldPanel = document.getElementById('unitDetailsEditPanel');
    if (oldPanel) oldPanel.remove();
  }

  function closeActionMenu(){
    var menu = document.getElementById('customerActionMenu');
    var button = document.getElementById('customerActionMenuButton');
    if (menu) menu.style.display = 'none';
    if (button) button.setAttribute('aria-expanded','false');
  }

  function closeOtherEditors(){
    ['customerEditPanel','saleComplianceEditPanel','unitCancellationPanel','unitDetailsEditPanel','unitEditPanel'].forEach(function(id){
      var panel = document.getElementById(id);
      if (panel) panel.remove();
    });
  }

  function insertPanel(panel){
    var detail = document.querySelector('.detail');
    if (!detail) return;
    var badges = detail.querySelector('.badges');
    if (badges && badges.parentNode){
      badges.parentNode.insertBefore(panel,badges.nextSibling);
      return;
    }
    var type = detail.querySelector('.d-type');
    if (type && type.parentNode) type.parentNode.insertBefore(panel,type.nextSibling);
    else detail.insertBefore(panel,detail.firstChild);
  }

  function activeStatusOptions(current){
    var values = ['Drafted','Signed','Sold'];
    if (current && values.indexOf(current) === -1 && text(current).toLowerCase() !== 'cancelled') values.unshift(current);
    return values.map(function(v){ return option(v,current); }).join('');
  }

  function unitTypeSuggestions(){
    var seen = {};
    (state.dues || []).forEach(function(row){
      var type = cleanUnitType(row && row.type);
      if (type) seen[type] = true;
    });
    return Object.keys(seen).sort().map(function(v){ return '<option value="' + safe(v) + '"></option>'; }).join('');
  }

  async function showUnitEditor(c){
    var existing = document.getElementById('unitEditPanel');
    if (existing){ existing.remove(); return; }
    closeOtherEditors();

    var panel = document.createElement('div');
    panel.id = 'unitEditPanel';
    panel.className = 'brand-editor';
    panel.innerHTML = '<p class="section-label" style="margin-top:0">Edit Unit</p><p class="stat-sub">Loading unit details…</p>';
    insertPanel(panel);

    try{
      var results = await Promise.all([
        sb.from('units').select('id,unit_no,project_name,unit_type,floor,area,price_per_sqft,total_price,status').eq('id',c.sno).single(),
        sb.from('sales').select('id,unit_id,furniture_status,source,brokerage_percentage,brokerage_amount').eq('unit_id',c.sno).order('id',{ascending:false}).limit(1).single()
      ]);
      if (results[0].error) throw results[0].error;
      if (results[1].error) throw results[1].error;
      var unit = results[0].data;
      var sale = results[1].data;
      if (!unit) throw new Error('Unit record not found.');
      if (!sale) throw new Error('No sale record is linked to this unit.');

      var furnishing = normalizeFurnishing(sale.furniture_status);
      var incentiveNote = '';
      var source = text(sale.source).trim().toLowerCase();
      if ((source === 'broker' || source === 'individual buyer') && sale.brokerage_percentage !== null && sale.brokerage_percentage !== undefined){
        incentiveNote = ' Percentage-based brokerage/voucher at ' + safe(sale.brokerage_percentage) + '% will be recalculated from the edited unit value.';
      }

      panel.innerHTML =
        '<p class="section-label" style="margin-top:0">Edit Unit</p>' +
        '<p class="stat-sub" style="margin:-5px 0 12px">All business-editable unit details are kept here in one place.</p>' +
        '<p class="brand-error" id="unitEditError" style="display:none"></p>' +
        '<div class="unit-editor-note">Changing unit details does not rewrite installment schedules or payment transactions.' + incentiveNote + ' Use the dedicated Cancel Unit workflow for cancellations.</div>' +
        '<div class="unit-editor-grid">' +
          field('euUnitNo','Unit No.',unit.unit_no || '') +
          field('euProject','Project',unit.project_name || 'Sunbliss Residences') +
          '<label class="brand-field">Unit Type<input type="text" id="euUnitType" list="euUnitTypeOptions" value="' + safe(cleanUnitType(unit.unit_type)) + '" placeholder="e.g. 2BR+STORE" /><datalist id="euUnitTypeOptions">' + unitTypeSuggestions() + '</datalist></label>' +
          field('euFloor','Floor',unit.floor || '') +
          field('euArea','Area (sq.ft)',unit.area === null ? '' : unit.area,'number',' min="0" step="0.01" inputmode="decimal"') +
          field('euPpsf','Price / sq.ft (AED)',unit.price_per_sqft === null ? '' : unit.price_per_sqft,'number',' min="0" step="0.01" inputmode="decimal"') +
          field('euTotalPrice','Total Unit Value (AED)',unit.total_price === null ? '' : unit.total_price,'number',' min="0" step="0.01" inputmode="decimal"') +
          '<label class="brand-field">Unit Status<select id="euStatus">' + activeStatusOptions(unit.status || 'Signed') + '</select></label>' +
          '<label class="brand-field">Furnishing Type<select id="euFurnishing">' + option('Fully Furnished',furnishing) + option('Semi Furnished',furnishing) + '</select></label>' +
        '</div>' +
        '<p class="unit-editor-protected">Internal unit ID, customer ownership/link, created date and payment records are protected from this editor.</p>' +
        '<div class="brand-editor-actions"><button class="btn btn-gold" id="euSave" style="justify-content:center">Save Unit</button><button class="btn-paper" id="euCancel" style="justify-content:center;margin-bottom:0">Cancel</button></div>';

      document.getElementById('euCancel').onclick = function(){ panel.remove(); };
      document.getElementById('euSave').onclick = function(){ saveUnit(c); };
    }catch(err){
      panel.innerHTML = '<p class="section-label" style="margin-top:0">Edit Unit</p><p class="brand-error">' + safe(err && err.message ? err.message : 'Could not load unit details.') + '</p><button class="btn-paper" id="euCloseError">Close</button>';
      var close = document.getElementById('euCloseError');
      if (close) close.onclick = function(){ panel.remove(); };
    }
  }

  async function saveUnit(c){
    var save = document.getElementById('euSave');
    var err = document.getElementById('unitEditError');
    try{
      var unitNo = valueOf('euUnitNo');
      var project = valueOf('euProject');
      var unitType = cleanUnitType(valueOf('euUnitType'));
      var status = valueOf('euStatus');
      var furnishing = valueOf('euFurnishing');
      if (!unitNo) throw new Error('Unit number is required.');
      if (!project) throw new Error('Project name is required.');
      if (!status) throw new Error('Unit status is required.');
      if (status.toLowerCase() === 'cancelled') throw new Error('Use the Cancel Unit workflow to cancel a unit.');
      if (furnishing !== 'Fully Furnished' && furnishing !== 'Semi Furnished') throw new Error('Choose Fully Furnished or Semi Furnished.');

      var payload = {
        p_unit_id:Number(c.sno),
        p_unit_no:unitNo,
        p_project_name:project,
        p_unit_type:unitType || null,
        p_floor:valueOf('euFloor') || null,
        p_area:numberOrNull('euArea','Area'),
        p_price_per_sqft:numberOrNull('euPpsf','Price per sq.ft'),
        p_total_price:numberOrNull('euTotalPrice','Total unit value'),
        p_status:status,
        p_furnishing_type:furnishing
      };

      save.disabled = true;
      save.textContent = 'Saving…';
      if (err) err.style.display = 'none';

      var result = await sb.rpc('crm_update_unit_details',payload);
      if (result.error) throw result.error;

      var from = state.detailFrom || 'list';
      await loadFromSupabase();
      if (typeof window.goToDetail === 'function'){
        window.goToDetail(unitNo,Number(c.sno),from);
      }else{
        state.selectedUnit = unitNo + '::' + Number(c.sno);
        state.detailFrom = from;
        state.view = 'detail';
        if (typeof window.renderMain === 'function') window.renderMain();
      }
      if (typeof window.scrollTo === 'function') window.scrollTo(0,0);
    }catch(ex){
      if (err){
        err.textContent = ex && ex.message ? ex.message : 'Could not save unit details.';
        err.style.display = 'block';
      }else{
        alert(ex && ex.message ? ex.message : 'Could not save unit details.');
      }
      if (save){ save.disabled = false; save.textContent = 'Save Unit'; }
    }
  }

  function makeMenuItem(){
    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'actionEditUnit';
    button.textContent = 'Edit Unit';
    button.style.cssText = 'display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#222);cursor:pointer;';
    return button;
  }

  function ensureMenuItem(){
    cleanupLegacyEditor();
    if (!window.state || state.view !== 'detail' || state.userRole !== 'crm_officer') return;
    var c = currentCustomer();
    var menu = document.getElementById('customerActionMenu');
    if (!c || !menu) return;
    if (document.getElementById('actionEditUnit')) return;

    var item = makeMenuItem();
    var customerEdit = document.getElementById('actionEditCustomer');
    if (customerEdit && customerEdit.parentNode === menu) customerEdit.insertAdjacentElement('afterend',item);
    else menu.insertBefore(item,menu.firstChild);
    item.addEventListener('click',function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      closeActionMenu();
      showUnitEditor(c);
    });
  }

  function refresh(){
    ensureStyles();
    cleanupLegacyEditor();
    ensureMenuItem();
  }

  var observer = new MutationObserver(function(){ refresh(); });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',refresh);
  window.addEventListener('popstate',refresh);
  refresh();
})();
