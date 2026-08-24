(function(){
  'use strict';

  function normalize(value){
    return String(value || '').replace(/\s+/g,' ').trim().toLowerCase();
  }

  function dateToIso(value){
    if (!value) return '';
    if (typeof window.dateToISO === 'function' && value instanceof Date) return window.dateToISO(value);
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    var d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function selected(value, option){
    return String(value || '').toLowerCase() === String(option).toLowerCase() ? ' selected' : '';
  }

  function escapeHtml(value){
    if (typeof window.esc === 'function') return window.esc(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  function cleanSaleEditor(){
    var panel = document.getElementById('saleComplianceEditPanel');
    if (!panel) return;

    panel.querySelectorAll('.section-label').forEach(function(label){
      var text = normalize(label.textContent);
      if (text === 'edit sale & compliance') label.textContent = 'Edit Sale';
      if (text === 'compliance') label.hidden = true;
    });

    ['scSpaStatus','scSpaDate','scOqoodStatus','scOqoodDate','scFurnitureStatus','scDldStatus'].forEach(function(id){
      var field = document.getElementById(id);
      if (!field) return;
      var holder = field.closest ? field.closest('label.brand-field') : field.parentNode;
      if (holder){
        holder.hidden = true;
        holder.setAttribute('aria-hidden','true');
      }
      field.setAttribute('tabindex','-1');
    });

    var remarks = document.getElementById('scRemarks');
    if (remarks){
      var remarksLabel = remarks.closest ? remarks.closest('label.brand-field') : remarks.parentNode;
      if (remarksLabel){
        for (var i=0;i<remarksLabel.childNodes.length;i++){
          var node = remarksLabel.childNodes[i];
          if (node.nodeType === 3 && normalize(node.nodeValue).indexOf('sales / compliance remarks') === 0){
            node.nodeValue = 'Sale remarks';
            break;
          }
        }
      }
    }
  }

  function renameDetailActions(){
    var saleAction = document.getElementById('actionEditSaleCompliance');
    if (saleAction) saleAction.textContent = 'Edit Sale';

    var complianceAction = document.getElementById('actionUpdateStatus');
    if (complianceAction) complianceAction.textContent = 'Compliance';

    document.querySelectorAll('.detail .section-label').forEach(function(label){
      if (normalize(label.textContent) === 'update spa & oqood status') label.textContent = 'Compliance';
    });
  }

  function installComplianceForm(){
    window.renderStatusForm = function(c){
      var values = state.statusFormValues || {
        spa: c.spa || 'Not Started',
        spaDate: c.info && c.info.spaDate ? dateToIso(c.info.spaDate) : '',
        oqood: c.oqood || 'Not Started',
        oqoodDate: c.info && c.info.oqoodDate ? dateToIso(c.info.oqoodDate) : '',
        furniture: c.furniture && String(c.furniture).toLowerCase() === 'signed' ? 'Furnished' : 'Unfurnished'
      };
      var html = '<div class="brand-editor">';
      if (state.statusFormError) html += '<p class="brand-error">' + escapeHtml(state.statusFormError) + '</p>';

      html += '<label class="brand-field">SPA status<select id="sfSpa">';
      ['Not Started','Drafted','Signed'].forEach(function(option){
        html += '<option value="' + escapeHtml(option) + '"' + selected(values.spa,option) + '>' + escapeHtml(option) + '</option>';
      });
      html += '</select></label>';
      html += '<label class="brand-field">SPA signed date (optional)<input type="date" id="sfSpaDate" value="' + escapeHtml(values.spaDate) + '" /></label>';

      html += '<label class="brand-field">OQOOD status<select id="sfOqood">';
      ['Not Started','Pending','Completed'].forEach(function(option){
        html += '<option value="' + escapeHtml(option) + '"' + selected(values.oqood,option) + '>' + escapeHtml(option) + '</option>';
      });
      html += '</select></label>';
      html += '<label class="brand-field">OQOOD completed date (optional)<input type="date" id="sfOqoodDate" value="' + escapeHtml(values.oqoodDate) + '" /></label>';

      html += '<label class="brand-field">Furnishing<select id="sfFurniture">';
      ['Unfurnished','Furnished'].forEach(function(option){
        html += '<option value="' + escapeHtml(option) + '"' + selected(values.furniture,option) + '>' + escapeHtml(option) + '</option>';
      });
      html += '</select></label>';

      html += '<div class="brand-editor-actions">';
      html += '<button class="btn btn-gold" id="sfSave" style="justify-content:center"' + (state.statusFormSaving ? ' disabled' : '') + '>' + (state.statusFormSaving ? 'Saving…' : 'Save compliance') + '</button>';
      html += '<button class="btn-paper" id="sfCancel" style="justify-content:center;margin-bottom:0">Cancel</button>';
      html += '</div></div>';
      return html;
    };

    window.saveStatus = async function(c){
      var spaEl = document.getElementById('sfSpa');
      var spaDateEl = document.getElementById('sfSpaDate');
      var oqoodEl = document.getElementById('sfOqood');
      var oqoodDateEl = document.getElementById('sfOqoodDate');
      var furnitureEl = document.getElementById('sfFurniture');
      if (!spaEl || !oqoodEl || !furnitureEl) return;

      var spa = spaEl.value;
      var spaDate = spaDateEl ? spaDateEl.value : '';
      var oqood = oqoodEl.value;
      var oqoodDate = oqoodDateEl ? oqoodDateEl.value : '';
      var furniture = furnitureEl.value;

      state.statusFormValues = {
        spa:spa,
        spaDate:spaDate,
        oqood:oqood,
        oqoodDate:oqoodDate,
        furniture:furniture
      };
      state.statusFormSaving = true;
      state.statusFormError = null;
      renderDetail();

      try{
        var result = await sb.from('sales').update({
          spa_status:spa,
          spa_date:spaDate || null,
          oqood_status:oqood,
          oqood_date:oqoodDate || null,
          furniture_status:furniture,
          updated_at:new Date().toISOString()
        }).eq('unit_id',c.sno);
        if (result.error) throw result.error;

        state.statusFormOpen = false;
        state.statusFormSaving = false;
        state.statusFormValues = null;
        await loadFromSupabase();
        render();
      }catch(err){
        state.statusFormSaving = false;
        state.statusFormError = err && err.message ? err.message : 'Could not save compliance.';
        renderDetail();
      }
    };
  }

  function refresh(){
    renameDetailActions();
    cleanSaleEditor();
  }

  function install(){
    if (!window.state || !window.sb || typeof window.renderDetail !== 'function'){
      setTimeout(install,50);
      return;
    }
    if (window.__sunblissComplianceEditorInstalled) return;
    window.__sunblissComplianceEditorInstalled = true;

    installComplianceForm();

    var originalRenderDetail = window.renderDetail;
    window.renderDetail = function(){
      var out = originalRenderDetail.apply(this,arguments);
      refresh();
      return out;
    };

    var observer = new MutationObserver(function(){ refresh(); });
    observer.observe(document.body,{childList:true,subtree:true});
    refresh();
  }

  install();
})();
