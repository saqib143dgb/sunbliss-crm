(function(){
  'use strict';

  if (window.__sunblissFurnishingTypeInstalled) return;
  window.__sunblissFurnishingTypeInstalled = true;

  function text(value){ return value === null || value === undefined ? '' : String(value); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
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
    if (v.indexOf('semi') !== -1 || v === 'unfurnished') return 'Semi Furnished';
    if (v.indexOf('fully') !== -1 || v === 'furnished' || v === 'signed') return 'Fully Furnished';
    return 'Semi Furnished';
  }
  function isFurnishing(value){ return value === 'Fully Furnished' || value === 'Semi Furnished'; }
  function selectedCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return c && (String(c.unit || '') + '::' + String(c.sno || '')) === String(state.selectedUnit); }) || null;
  }
  function formatDate(value){
    if (!value) return '';
    if (typeof window.dateToISO === 'function' && value instanceof Date) return window.dateToISO(value);
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0,10);
  }
  function option(value,current){ return '<option value="' + safe(value) + '"' + (value === current ? ' selected' : '') + '>' + safe(value) + '</option>'; }

  function ensureStyles(){
    if (document.getElementById('sunblissFurnishingTypeStyles')) return;
    var style = document.createElement('style');
    style.id = 'sunblissFurnishingTypeStyles';
    style.textContent = [
      '#btnEditUnitDetails{margin:-3px 0 12px;}',
      '#unitDetailsEditPanel{margin:0 0 16px;box-shadow:none;border:1px solid rgba(198,151,46,.32);}',
      '#unitDetailsEditPanel select,#ncFurnishingType,.furnishing-select{display:block;width:100%;margin-top:5px;padding:10px 11px;border:1px solid var(--paper-line);border-radius:8px;font:500 16px/1.2 Inter,sans-serif;color:var(--ink);background:var(--paper-dim);box-sizing:border-box;}',
      '.furnishing-badge-semi{color:var(--amber)!important;border-color:rgba(156,90,18,.35)!important;background:rgba(156,90,18,.08)!important;}',
      '@media(max-width:480px){#unitDetailsEditPanel .brand-editor-actions{flex-direction:column}#unitDetailsEditPanel .brand-editor-actions button{width:100%}}'
    ].join('');
    document.head.appendChild(style);
  }

  async function enrichFurnishing(){
    if (!window.sb || !window.state) return;
    var result = await sb.from('sales').select('unit_id,furniture_status');
    if (result.error) throw result.error;
    var byUnit = {};
    (result.data || []).forEach(function(row){ byUnit[String(row.unit_id)] = normalizeFurnishing(row.furniture_status); });
    [state.dues,state.cancelled].forEach(function(list){
      if (!Array.isArray(list)) return;
      list.forEach(function(c){
        if (!c) return;
        c.type = cleanUnitType(c.type);
        var furnishing = byUnit[String(c.sno)] || normalizeFurnishing(c.furniture);
        c.info = c.info || {};
        c.info.furnishingType = furnishing;
        c.furniture = furnishing === 'Fully Furnished' ? 'Signed' : 'Semi Furnished';
      });
    });
  }

  function decorateFurnishingLabels(){
    ensureStyles();
    document.querySelectorAll('.filter-group').forEach(function(group){
      var label = group.querySelector('.filter-group-label');
      if (!label || text(label.textContent).trim().toLowerCase() !== 'furniture') return;
      label.textContent = 'Furnishing Type';
      var chips = group.querySelectorAll('.chip');
      if (chips[0]) chips[0].textContent = 'Fully Furnished';
      if (chips[1]) chips[1].textContent = 'Semi Furnished';
    });
    document.querySelectorAll('.overview .section-label').forEach(function(label){
      if (text(label.textContent).trim().toLowerCase() !== 'furniture status') return;
      label.textContent = 'Furnishing Type';
      var pipeline = label.nextElementSibling;
      if (!pipeline) return;
      var labels = pipeline.querySelectorAll('.pill-stat-lbl');
      if (labels[0]) labels[0].textContent = 'Fully Furnished';
      if (labels[1]) labels[1].textContent = 'Semi Furnished';
    });
    var c = selectedCustomer();
    var detail = document.querySelector('.detail');
    if (c && detail){
      var dType = detail.querySelector('.d-type');
      if (dType) dType.textContent = cleanUnitType(c.type) || 'Unit type not specified';
      var furnishing = c.info && c.info.furnishingType ? c.info.furnishingType : normalizeFurnishing(c.furniture);
      detail.querySelectorAll('.badges .badge').forEach(function(badge){
        var value = text(badge.textContent).trim().toLowerCase();
        if (value === 'furnished' || value === 'unfurnished' || value === 'fully furnished' || value === 'semi furnished'){
          badge.textContent = furnishing;
          badge.classList.toggle('badge-good',furnishing === 'Fully Furnished');
          badge.classList.toggle('badge-warn',furnishing === 'Semi Furnished');
          badge.classList.toggle('furnishing-badge-semi',furnishing === 'Semi Furnished');
        }
      });
      addUnitEditButton(c,dType);
    }
  }

  function addUnitEditButton(c,dType){
    if (!dType || !window.state || state.userRole !== 'crm_officer') return;
    if (document.getElementById('btnEditUnitDetails')) return;
    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'btnEditUnitDetails';
    button.className = 'btn-paper';
    button.textContent = 'Edit unit type & furnishing';
    dType.insertAdjacentElement('afterend',button);
    button.addEventListener('click',function(){ showUnitEditor(c,button); });
  }

  function showUnitEditor(c,button){
    var old = document.getElementById('unitDetailsEditPanel');
    if (old){ old.remove(); return; }
    var furnishing = c.info && c.info.furnishingType ? c.info.furnishingType : normalizeFurnishing(c.furniture);
    var types = {};
    (state.dues || []).forEach(function(row){ var t=cleanUnitType(row.type); if (t) types[t]=true; });
    var list = Object.keys(types).sort().map(function(t){ return '<option value="' + safe(t) + '"></option>'; }).join('');
    var panel = document.createElement('div');
    panel.id = 'unitDetailsEditPanel';
    panel.className = 'brand-editor';
    panel.innerHTML = '<p class="section-label" style="margin-top:0">Edit unit details</p>' +
      '<p class="brand-error" id="unitDetailsEditError" style="display:none"></p>' +
      '<label class="brand-field">Unit type<input type="text" id="ueUnitType" list="ueUnitTypeOptions" value="' + safe(cleanUnitType(c.type)) + '" placeholder="e.g. 1BR+STORE" /><datalist id="ueUnitTypeOptions">' + list + '</datalist></label>' +
      '<label class="brand-field">Furnishing type<select id="ueFurnishing" class="furnishing-select">' + option('Fully Furnished',furnishing) + option('Semi Furnished',furnishing) + '</select></label>' +
      '<div class="brand-editor-actions"><button class="btn btn-gold" id="ueSave" style="justify-content:center">Save changes</button><button class="btn-paper" id="ueCancel" style="justify-content:center;margin-bottom:0">Cancel</button></div>';
    button.insertAdjacentElement('afterend',panel);
    document.getElementById('ueCancel').onclick = function(){ panel.remove(); };
    document.getElementById('ueSave').onclick = function(){ saveUnitDetails(c); };
  }

  async function saveUnitDetails(c){
    var unitType = cleanUnitType(document.getElementById('ueUnitType').value);
    var furnishing = document.getElementById('ueFurnishing').value;
    var err = document.getElementById('unitDetailsEditError');
    var save = document.getElementById('ueSave');
    if (!unitType){ err.textContent='Enter the unit type.'; err.style.display='block'; return; }
    if (!isFurnishing(furnishing)){ err.textContent='Choose Fully Furnished or Semi Furnished.'; err.style.display='block'; return; }
    save.disabled=true; save.textContent='Saving…'; err.style.display='none';
    var key = state.selectedUnit, from = state.detailFrom || 'list';
    try{
      var results = await Promise.all([
        sb.from('units').update({unit_type:unitType}).eq('id',c.sno),
        sb.from('sales').update({furniture_status:furnishing,updated_at:new Date().toISOString()}).eq('unit_id',c.sno)
      ]);
      results.forEach(function(r){ if (r.error) throw r.error; });
      await loadFromSupabase();
      state.selectedUnit=key; state.detailFrom=from; state.view='detail';
      if (typeof window.renderMain === 'function') window.renderMain(); else if (typeof window.renderDetail === 'function') window.renderDetail();
    }catch(ex){ err.textContent=ex && ex.message ? ex.message : 'Could not save unit details.'; err.style.display='block'; save.disabled=false; save.textContent='Save changes'; }
  }

  function complianceForm(c){
    var values = state.statusFormValues || {spa:c.spa || 'Not Started',spaDate:c.info && c.info.spaDate ? formatDate(c.info.spaDate) : '',oqood:c.oqood || 'Not Started',oqoodDate:c.info && c.info.oqoodDate ? formatDate(c.info.oqoodDate) : '',furniture:c.info && c.info.furnishingType ? c.info.furnishingType : normalizeFurnishing(c.furniture)};
    function opts(items,current){ return items.map(function(x){ return option(x,current); }).join(''); }
    var html='<div class="brand-editor">';
    if (state.statusFormError) html+='<p class="brand-error">'+safe(state.statusFormError)+'</p>';
    html+='<label class="brand-field">SPA status<select id="sfSpa" class="furnishing-select">'+opts(['Not Started','Drafted','Signed'],values.spa)+'</select></label>';
    html+='<label class="brand-field">SPA signed date (optional)<input type="date" id="sfSpaDate" value="'+safe(values.spaDate)+'" /></label>';
    html+='<label class="brand-field">OQOOD status<select id="sfOqood" class="furnishing-select">'+opts(['Not Started','Pending','Completed'],values.oqood)+'</select></label>';
    html+='<label class="brand-field">OQOOD completed date (optional)<input type="date" id="sfOqoodDate" value="'+safe(values.oqoodDate)+'" /></label>';
    html+='<label class="brand-field">Furnishing type<select id="sfFurniture" class="furnishing-select">'+opts(['Fully Furnished','Semi Furnished'],values.furniture)+'</select></label>';
    html+='<div class="brand-editor-actions"><button class="btn btn-gold" id="sfSave" style="justify-content:center"'+(state.statusFormSaving?' disabled':'')+'>'+(state.statusFormSaving?'Saving…':'Save compliance')+'</button><button class="btn-paper" id="sfCancel" style="justify-content:center;margin-bottom:0">Cancel</button></div></div>';
    return html;
  }

  async function saveCompliance(c){
    var spa=document.getElementById('sfSpa'), spaDate=document.getElementById('sfSpaDate'), oqood=document.getElementById('sfOqood'), oqoodDate=document.getElementById('sfOqoodDate'), furniture=document.getElementById('sfFurniture');
    if (!spa || !oqood || !furniture) return;
    state.statusFormValues={spa:spa.value,spaDate:spaDate?spaDate.value:'',oqood:oqood.value,oqoodDate:oqoodDate?oqoodDate.value:'',furniture:furniture.value};
    state.statusFormSaving=true; state.statusFormError=null; renderDetail();
    try{
      var result=await sb.from('sales').update({spa_status:spa.value,spa_date:spaDate&&spaDate.value?spaDate.value:null,oqood_status:oqood.value,oqood_date:oqoodDate&&oqoodDate.value?oqoodDate.value:null,furniture_status:furniture.value,updated_at:new Date().toISOString()}).eq('unit_id',c.sno);
      if (result.error) throw result.error;
      state.statusFormOpen=false; state.statusFormSaving=false; state.statusFormValues=null;
      var key=state.selectedUnit, from=state.detailFrom || 'list';
      await loadFromSupabase(); state.selectedUnit=key; state.detailFrom=from; state.view='detail'; renderMain();
    }catch(ex){ state.statusFormSaving=false; state.statusFormError=ex&&ex.message?ex.message:'Could not save compliance.'; renderDetail(); }
  }

  function decorateNewCustomer(baseSave){
    var unitType=document.getElementById('ncUnitType');
    if (!unitType) return;
    if (!document.getElementById('ncFurnishingType')){
      var label=document.createElement('label');
      label.className='brand-field'; label.id='ncFurnishingTypeField';
      var draft=state.__newCustomerFurnishingType || '';
      label.innerHTML='Furnishing type<select id="ncFurnishingType"><option value="">Choose furnishing type</option>'+option('Fully Furnished',draft)+option('Semi Furnished',draft)+'</select>';
      var holder=unitType.closest ? unitType.closest('label.brand-field') : unitType.parentNode;
      if (holder) holder.insertAdjacentElement('afterend',label);
      document.getElementById('ncFurnishingType').addEventListener('change',function(){ state.__newCustomerFurnishingType=this.value; });
    }
    var save=document.getElementById('ncSave');
    if (!save || save.getAttribute('data-furnishing-save')==='1') return;
    var clone=save.cloneNode(true); clone.setAttribute('data-furnishing-save','1'); save.parentNode.replaceChild(clone,save);
    clone.addEventListener('click',async function(){
      var field=document.getElementById('ncFurnishingType');
      var furnishing=field?field.value:state.__newCustomerFurnishingType;
      if (!isFurnishing(furnishing)){ state.newCustomerFormError='Choose Fully Furnished or Semi Furnished.'; if (typeof window.renderNewCustomer==='function') window.renderNewCustomer(); return; }
      state.__newCustomerFurnishingType=furnishing;
      await baseSave();
      if (state.newCustomerFormError || state.view !== 'detail' || !state.selectedUnit) return;
      var parts=String(state.selectedUnit).split('::'); var unitId=parts.length>1?Number(parts[1]):null; if (!unitId) return;
      var result=await sb.from('sales').update({furniture_status:furnishing,updated_at:new Date().toISOString()}).eq('unit_id',unitId);
      if (result.error){ alert(result.error.message || 'Customer created, but furnishing type could not be saved.'); return; }
      var key=state.selectedUnit, from=state.detailFrom || 'list'; state.__newCustomerFurnishingType=null;
      await loadFromSupabase(); state.selectedUnit=key; state.detailFrom=from; state.view='detail'; renderMain();
    });
  }

  async function exportCleanUnits(rows){
    if (!window.ExcelJS) throw new Error('Spreadsheet library did not load — check your connection and try again.');
    var wb=new ExcelJS.Workbook(); wb.creator=(state.branding&&state.branding.name)||'Sunbliss Residences'; wb.created=new Date();
    var ws=wb.addWorksheet('Units');
    ws.columns=[{header:'Unit',key:'unit',width:14},{header:'Customer',key:'customer',width:24},{header:'Unit Type',key:'type',width:18},{header:'Furnishing Type',key:'furnishing',width:20},{header:'Total (AED)',key:'total',width:16},{header:'Received (AED)',key:'received',width:16},{header:'Outstanding (AED)',key:'outstanding',width:18},{header:'SPA',key:'spa',width:14},{header:'OQOOD',key:'oqood',width:14}];
    var header=ws.getRow(1); header.height=20; header.eachCell(function(cell){ cell.font={bold:true,color:{argb:'FFFFFFFF'}}; cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF16232F'}}; });
    (rows||[]).forEach(function(item){
      var c=item&&item.c?item.c:item; if (!c) return;
      var row=ws.addRow({unit:c.unit||'',customer:typeof window.titleCase==='function'?window.titleCase(c.name):text(c.name),type:cleanUnitType(c.type),furnishing:c.info&&c.info.furnishingType?c.info.furnishingType:normalizeFurnishing(c.furniture),total:c.total,received:c.received,outstanding:c.outstanding,spa:c.spa||'Not Started',oqood:c.oqood||'Not Completed'});
      ['total','received','outstanding'].forEach(function(key){ row.getCell(key).numFmt='#,##0'; });
      row.eachCell(function(cell){ cell.border={bottom:{style:'thin',color:{argb:'FFDCD2B6'}}}; });
    });
    ws.views=[{state:'frozen',ySplit:1}];
    var buffer=await wb.xlsx.writeBuffer();
    var blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var url=URL.createObjectURL(blob), a=document.createElement('a'); a.href=url; a.download='Sunbliss-Units-'+new Date().toISOString().slice(0,10)+'.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }

  function install(){
    if (!window.state || !window.sb || typeof window.loadFromSupabase!=='function' || typeof window.renderDetail!=='function') { setTimeout(install,50); return; }
    ensureStyles();
    var originalLoad=window.loadFromSupabase;
    window.loadFromSupabase=async function(){ var result=await originalLoad.apply(this,arguments); await enrichFurnishing(); return result; };
    var originalRenderDetail=window.renderDetail;
    window.renderDetail=function(){ var result=originalRenderDetail.apply(this,arguments); decorateFurnishingLabels(); return result; };
    window.renderStatusForm=complianceForm;
    window.saveStatus=saveCompliance;
    window.exportFilteredList=exportCleanUnits;
    var baseSaveNewCustomer=typeof window.saveNewCustomer==='function' ? window.saveNewCustomer : null;
    var observer=new MutationObserver(function(){ decorateFurnishingLabels(); if (baseSaveNewCustomer) decorateNewCustomer(baseSaveNewCustomer); });
    observer.observe(document.body,{childList:true,subtree:true});
    enrichFurnishing().then(function(){ decorateFurnishingLabels(); if (baseSaveNewCustomer) decorateNewCustomer(baseSaveNewCustomer); if (state.view!=='detail' && typeof window.renderMain==='function') window.renderMain(); }).catch(function(err){ console.warn('Could not load furnishing types',err); });
  }

  install();
})();
