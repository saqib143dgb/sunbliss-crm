(function(){
  'use strict';

  if (window.__sunblissInlineSpaOqoodInstalled) return;
  window.__sunblissInlineSpaOqoodInstalled = true;

  function text(value){ return value == null ? '' : String(value); }
  function norm(value){ return text(value).replace(/\s+/g,' ').trim().toLowerCase(); }
  function safe(value){
    if (typeof window.esc === 'function') return window.esc(text(value));
    return text(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function dateToIso(value){
    if (!value) return '';
    if (typeof window.dateToISO === 'function' && value instanceof Date) return window.dateToISO(value);
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    var m=d.getMonth()+1,day=d.getDate();
    return d.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(day<10?'0'+day:day);
  }
  function currentCustomer(){
    if (!window.state || !state.selectedUnit || !Array.isArray(state.dues)) return null;
    return state.dues.find(function(c){ return (c.unit+'::'+c.sno)===state.selectedUnit; }) || null;
  }
  function canEdit(){ return !!(window.state && state.userRole === 'crm_officer'); }
  function statusTone(kind,status){
    var value=norm(status);
    if ((kind==='spa' && value==='signed') || (kind==='oqood' && value==='completed')) return 'good';
    return 'warn';
  }
  function displayStatus(kind,status){
    var value=norm(status);
    if (kind==='spa') return value==='signed'?'Signed':'Pending';
    return value==='completed'?'Completed':'Pending';
  }

  function ensureStyles(){
    if (document.getElementById('sunblissInlineSpaOqoodStyles')) return;
    var style=document.createElement('style');
    style.id='sunblissInlineSpaOqoodStyles';
    style.textContent=[
      '#actionUpdateStatus,#btnOpenStatusForm{display:none!important}',
      '.inline-compliance-strip{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;width:calc(100% + 36px);margin:0 -18px 15px;border-top:1px solid rgba(115,108,92,.16);border-bottom:1px solid rgba(115,108,92,.16);background:rgba(255,255,255,.08)}',
      '.inline-compliance-chip{appearance:none;width:100%;min-width:0;border:0;background:transparent;border-radius:0;padding:10px 12px;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--muted);font:500 11px/1.2 Inter,sans-serif;white-space:nowrap}',
      '.inline-compliance-chip+ .inline-compliance-chip{border-left:1px solid rgba(115,108,92,.16)}',
      'button.inline-compliance-chip{cursor:pointer;transition:background .15s ease,color .15s ease}',
      'button.inline-compliance-chip:hover{background:rgba(115,108,92,.05)}',
      'button.inline-compliance-chip:active{background:rgba(115,108,92,.08)}',
      'button.inline-compliance-chip:focus-visible{outline:2px solid rgba(143,106,30,.55);outline-offset:-2px}',
      '.inline-compliance-chip[data-tone="good"]{color:rgba(63,122,87,.82)}',
      '.inline-compliance-chip[data-tone="warn"]{color:rgba(156,90,18,.78)}',
      '.inline-compliance-chip-label{font:650 9px/1.2 "IBM Plex Mono",monospace;letter-spacing:.07em;color:var(--muted)}',
      '.inline-compliance-chip-status{font-weight:600;overflow:hidden;text-overflow:ellipsis}',
      '.inline-compliance-chip-arrow{font-size:12px;opacity:.32;margin-left:0}',
      '#inlineComplianceEditor{margin:0 0 12px;padding:13px 14px}',
      '#inlineComplianceEditor .section-label{margin:0 0 10px}',
      '#inlineComplianceEditor .brand-field select{display:block;width:100%;margin-top:5px;padding:9px 11px;border:1px solid var(--paper-line);border-radius:8px;font-family:Inter,sans-serif;font-size:13.5px;color:var(--ink);background:var(--paper-dim)}',
      '.inline-compliance-hint{font-size:10.5px;color:var(--muted);margin:-3px 0 11px;line-height:1.45}',
      '@media(max-width:390px){.inline-compliance-chip{padding:9px 7px;gap:4px;font-size:10.5px}.inline-compliance-chip-label{font-size:8.5px}.inline-compliance-chip-arrow{font-size:11px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function removeMenuCompliance(){
    var saleAction=document.getElementById('actionEditSaleCompliance');
    if (saleAction) saleAction.textContent='Edit Sale';

    var action=document.getElementById('actionUpdateStatus');
    if (action) action.remove();
    var menu=document.getElementById('customerActionMenu');
    if (menu){
      Array.prototype.slice.call(menu.querySelectorAll('button')).forEach(function(btn){
        var label=norm(btn.textContent);
        if (label==='compliance' || label.indexOf('update spa / oqood')===0 || label.indexOf('update spa & oqood')===0) btn.remove();
      });
    }
    var oldButton=document.getElementById('btnOpenStatusForm');
    if (oldButton) oldButton.style.display='none';

    var legacySpa=document.getElementById('sfSpa');
    if (legacySpa){
      var legacyPanel=legacySpa.closest ? legacySpa.closest('.brand-editor') : null;
      if (legacyPanel) legacyPanel.remove();
      if (window.state){
        state.statusFormOpen=false;
        state.statusFormValues=null;
        state.statusFormError=null;
      }
    }
  }

  function removeDuplicateBadges(){
    var badges=document.querySelector('.detail .badges');
    if (!badges) return;
    Array.prototype.slice.call(badges.querySelectorAll('.badge')).forEach(function(badge){
      var label=norm(badge.textContent);
      if (label.indexOf('spa ')===0 || label.indexOf('oqood ')===0) badge.remove();
    });
    if (!badges.querySelector('.badge')) badges.style.display='none';
  }

  function chipHtml(kind,label,status){
    var editable=canEdit();
    var tag=editable?'button':'span';
    var attrs=editable?' type="button" data-inline-compliance="'+kind+'" aria-label="Update '+label+' status"':'';
    return '<'+tag+' class="inline-compliance-chip" data-tone="'+statusTone(kind,status)+'"'+attrs+'>'+
      '<span class="inline-compliance-chip-label">'+safe(label)+'</span>'+
      '<span class="inline-compliance-chip-status">'+safe(displayStatus(kind,status))+'</span>'+
      (editable?'<span class="inline-compliance-chip-arrow">›</span>':'')+
    '</'+tag+'>';
  }

  function renderStrip(){
    var c=currentCustomer();
    var detail=document.querySelector('.detail');
    var name=detail && detail.querySelector('.d-name');
    if (!c || !detail || !name) return;

    var existing=document.getElementById('inlineComplianceStrip');
    if (existing) existing.remove();

    var strip=document.createElement('div');
    strip.id='inlineComplianceStrip';
    strip.className='inline-compliance-strip';
    strip.setAttribute('aria-label','SPA and OQOOD status');
    strip.innerHTML=chipHtml('spa','SPA',c.spa)+chipHtml('oqood','OQOOD',c.oqood);
    name.parentNode.insertBefore(strip,name);

    if (canEdit()){
      strip.querySelectorAll('[data-inline-compliance]').forEach(function(btn){
        btn.addEventListener('click',function(){ openEditor(btn.getAttribute('data-inline-compliance')); });
      });
    }
  }

  function selectOptions(values,current){
    var html='';
    values.forEach(function(option){
      html+='<option value="'+safe(option)+'"'+(norm(option)===norm(current)?' selected':'')+'>'+safe(option)+'</option>';
    });
    return html;
  }

  function openEditor(kind){
    if (!canEdit()) return;
    var c=currentCustomer();
    var strip=document.getElementById('inlineComplianceStrip');
    if (!c || !strip) return;

    var existing=document.getElementById('inlineComplianceEditor');
    if (existing){
      var same=existing.getAttribute('data-kind')===kind;
      existing.remove();
      if (same) return;
    }

    var customerPanel=document.getElementById('customerEditPanel');
    if (customerPanel) customerPanel.remove();
    var salePanel=document.getElementById('saleComplianceEditPanel');
    if (salePanel) salePanel.remove();

    var isSpa=kind==='spa';
    var title=isSpa?'SPA':'OQOOD';
    var status=isSpa?displayStatus('spa',c.spa):displayStatus('oqood',c.oqood);
    var currentDate=isSpa?(c.info&&c.info.spaDate):(c.info&&c.info.oqoodDate);
    var options=isSpa?['Pending','Signed']:['Pending','Completed'];
    var dateLabel=isSpa?'SPA signed date':'OQOOD completed date';

    var panel=document.createElement('div');
    panel.id='inlineComplianceEditor';
    panel.className='brand-editor';
    panel.setAttribute('data-kind',kind);
    panel.innerHTML=
      '<div class="crm-compliance-editor-head">'+
        '<button type="button" id="inlineComplianceBack" class="crm-compliance-back" aria-label="Back to customer">'+
          '<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'+
        '</button>'+
        '<h2 class="crm-compliance-editor-title">Update '+safe(title)+'</h2>'+
      '</div>'+
      '<p class="brand-error" id="inlineComplianceError" style="display:none" role="alert"></p>'+
      '<div class="crm-compliance-editor-card">'+
        '<label class="brand-field"><span class="crm-compliance-field-label">Status</span>'+
          '<span class="crm-compliance-select-wrap"><select id="inlineComplianceStatus">'+selectOptions(options,status)+'</select>'+
            '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'+
          '</span></label>'+
        '<label class="brand-field"><span class="crm-compliance-field-label">'+safe(dateLabel)+' <span class="crm-compliance-optional">(optional)</span></span>'+
          '<span class="crm-compliance-date-wrap"><input type="date" id="inlineComplianceDate" aria-label="'+safe(dateLabel)+'" value="'+safe(dateToIso(currentDate))+'" />'+
            '<span class="crm-compliance-date-placeholder" aria-hidden="true">Select date</span>'+
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.2" y="5" width="17.6" height="16" rx="1.7"/><path d="M7.5 2.6v4.7M16.5 2.6v4.7M3.2 10.5h17.6"/></svg>'+
          '</span></label>'+
      '</div>'+
      '<div class="brand-editor-actions crm-compliance-editor-actions">'+
        '<button class="btn btn-gold" type="button" id="inlineComplianceSave">Save '+safe(title)+'</button>'+
        '<button class="btn-paper" type="button" id="inlineComplianceCancel">Cancel</button>'+
      '</div>';

    strip.parentNode.insertBefore(panel,strip.nextSibling);
    document.getElementById('inlineComplianceCancel').onclick=function(){ panel.remove(); };
    document.getElementById('inlineComplianceBack').onclick=function(){ panel.remove(); };
    var dateInput=document.getElementById('inlineComplianceDate');
    var dateWrap=panel.querySelector('.crm-compliance-date-wrap');
    function updateDatePlaceholder(){
      if(dateWrap&&dateInput)dateWrap.classList.toggle('crm-compliance-date-empty',!dateInput.value);
    }
    if(dateInput){
      dateInput.addEventListener('input',updateDatePlaceholder);
      dateInput.addEventListener('change',updateDatePlaceholder);
      updateDatePlaceholder();
    }
    document.getElementById('inlineComplianceSave').onclick=function(){ saveStatus(kind); };
  }

  async function saveStatus(kind){
    var c=currentCustomer();
    var statusEl=document.getElementById('inlineComplianceStatus');
    var dateEl=document.getElementById('inlineComplianceDate');
    var save=document.getElementById('inlineComplianceSave');
    var err=document.getElementById('inlineComplianceError');
    if (!c || !statusEl || !save) return;

    var payload={updated_at:new Date().toISOString()};
    if (kind==='spa'){
      payload.spa_status=statusEl.value;
      payload.spa_date=dateEl && dateEl.value ? dateEl.value : null;
    }else{
      payload.oqood_status=statusEl.value;
      payload.oqood_date=dateEl && dateEl.value ? dateEl.value : null;
    }

    try{
      save.disabled=true;
      save.textContent='Saving…';
      if (err) err.style.display='none';

      var result=await sb.from('sales').update(payload).eq('unit_id',c.sno);
      if (result.error) throw result.error;

      // Portaled mobile editor is outside .detail, so close it explicitly
      // after a successful save, before rendering the refreshed customer.
      var savedEditor=document.getElementById('inlineComplianceEditor');
      if(savedEditor)savedEditor.remove();
      document.body.classList.remove('sunbliss-inline-compliance-full-page');
      var unit=c.unit,sno=c.sno,from=state.detailFrom||'list';
      await loadFromSupabase();
      goToDetail(unit,sno,from);
    }catch(ex){
      if (err){
        err.textContent=ex && ex.message ? ex.message : 'Could not update status.';
        err.style.display='block';
      }
      save.disabled=false;
      save.textContent='Save '+(kind==='spa'?'SPA':'OQOOD');
    }
  }

  function decorate(){
    if (!window.state || state.view!=='detail') return;
    ensureStyles();
    removeMenuCompliance();
    removeDuplicateBadges();
    renderStrip();
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail!=='function'){
      window.setTimeout(install,50);
      return;
    }
    var base=window.renderDetail;
    window.renderDetail=function(){
      var out=base.apply(this,arguments);
      decorate();
      return out;
    };
    if (state.view==='detail') decorate();
  }

  install();
})();
