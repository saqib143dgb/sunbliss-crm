(function(){
  'use strict';
  if(window.__sunblissCreditNoteEditInstalled)return;
  window.__sunblissCreditNoteEditInstalled=true;

  function install(){
    var A=window.__sunblissCreditNoteApi;
    if(!A||!window.sb||!window.state||typeof window.renderDetail!=='function'||typeof window.loadFromSupabase!=='function'){
      setTimeout(install,60);
      return;
    }

    function ensureStyles(){
      if(document.getElementById('sunblissCreditNoteEditStyles'))return;
      var style=document.createElement('style');
      style.id='sunblissCreditNoteEditStyles';
      style.textContent=[
        '.credit-note-edit-panel{margin:4px 0 14px!important}',
        '.credit-note-actions-wrap{position:relative;display:inline-flex;align-items:center;flex:none;align-self:center}',
        '.credit-note-actions-menu button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink);cursor:pointer}',
        '.credit-note-actions-menu button:hover{background:var(--paper-dim)}'
      ].join('');
      document.head.appendChild(style);
    }

    function value(id){var el=document.getElementById(id);return el?String(el.value||'').trim():'';}
    function closeMenus(except){
      document.querySelectorAll('.credit-note-actions-menu').forEach(function(menu){
        if(menu!==except)menu.style.display='none';
      });
      document.querySelectorAll('[data-credit-note-actions="1"] .tx-actions-btn').forEach(function(btn){
        var menu=btn.parentElement&&btn.parentElement.querySelector('.credit-note-actions-menu');
        if(!menu||menu!==except)btn.setAttribute('aria-expanded','false');
      });
    }

    async function showEditor(c,n,row){
      var old=document.getElementById('creditNoteEditPanel');
      if(old)old.remove();
      closeMenus();

      if(!n||!n.id){
        alert('This credit note cannot be edited because its database ID is unavailable. Refresh and try again.');
        return;
      }

      var panel=document.createElement('div');
      panel.id='creditNoteEditPanel';
      panel.className='brand-editor credit-note-edit-panel';
      panel.innerHTML='<p class="section-label" style="margin-top:0">Edit credit note</p><p class="stat-sub">Loading credit note…</p>';
      row.parentNode.insertBefore(panel,row.nextSibling);

      try{
        var results=await Promise.all([
          sb.from('credit_notes').select('id,customer_id,unit_id,payment_schedule_id,issue_date,amount,reason,reference_number').eq('id',n.id).single(),
          sb.from('payment_schedule').select('id,stage_name,due_amount,paid_amount').eq('customer_id',n.customerId).eq('unit_id',n.unitId).order('id')
        ]);
        results.forEach(function(r){if(r.error)throw r.error;});
        var note=results[0].data,stages=results[1].data||[];
        if(!note)throw new Error('Credit note not found.');
        if(!stages.length)throw new Error('No installment schedule is linked to this customer and unit.');

        var options='';
        stages.forEach(function(stage){
          options+='<option value="'+A.safe(stage.id)+'"'+(String(stage.id)===String(note.payment_schedule_id)?' selected':'')+'>'+A.safe(stage.stage_name||'Installment')+'</option>';
        });

        panel.innerHTML=
          '<p class="section-label" style="margin-top:0">Edit credit note</p>'+
          '<p class="stat-sub" style="margin:-5px 0 12px">Customer and unit stay fixed. Changes recalculate the installment automatically and the previous values are retained in the audit history.</p>'+
          '<p class="brand-error" id="creditNoteEditError" style="display:none"></p>'+
          '<label class="brand-field">Installment<select id="cneStage">'+options+'</select></label>'+
          '<label class="brand-field">Credit note amount (AED)<input type="number" id="cneAmount" min="0.01" step="0.01" inputmode="decimal" value="'+A.safe(note.amount)+'" /></label>'+
          '<label class="brand-field">Issue date<input type="date" id="cneDate" value="'+A.safe(note.issue_date||'')+'" /></label>'+
          '<label class="brand-field">Reason<input type="text" id="cneReason" value="'+A.safe(note.reason||'')+'" /></label>'+
          '<label class="brand-field">Reference number (optional)<input type="text" id="cneRef" value="'+A.safe(note.reference_number||'')+'" /></label>'+
          '<div class="brand-editor-actions">'+
            '<button class="btn btn-gold" id="cneSave" style="justify-content:center">Save changes</button>'+
            '<button class="btn-paper" id="cneCancel" style="justify-content:center;margin-bottom:0">Cancel</button>'+
          '</div>';

        document.getElementById('cneCancel').onclick=function(){panel.remove();};
        document.getElementById('cneSave').onclick=function(){saveEdit(c,n,panel);};
      }catch(e){
        panel.innerHTML='<p class="section-label" style="margin-top:0">Edit credit note</p><p class="brand-error">'+A.safe(e&&e.message?e.message:'Could not load that credit note.')+'</p><button class="btn-paper" id="cneCloseError">Close</button>';
        var close=document.getElementById('cneCloseError');
        if(close)close.onclick=function(){panel.remove();};
      }
    }

    async function saveEdit(c,n,panel){
      var err=document.getElementById('creditNoteEditError');
      var save=document.getElementById('cneSave');
      var scheduleId=Number(value('cneStage'));
      var amount=Number(value('cneAmount'));
      var issueDate=value('cneDate');
      var reason=value('cneReason');
      var reference=value('cneRef');

      function fail(message){if(err){err.textContent=message;err.style.display='block';}}
      if(!scheduleId){fail('Select an installment.');return;}
      if(!isFinite(amount)||amount<=0){fail('Enter a valid credit note amount greater than zero.');return;}
      if(!issueDate){fail('Select the credit note issue date.');return;}
      if(!reason){fail('Enter the credit note reason.');return;}

      if(save){save.disabled=true;save.textContent='Saving…';}
      if(err)err.style.display='none';

      try{
        var result=await sb.rpc('crm_edit_credit_note',{
          p_credit_note_id:n.id,
          p_payment_schedule_id:scheduleId,
          p_issue_date:issueDate,
          p_amount:Math.round(amount*100)/100,
          p_reason:reason,
          p_reference_number:reference||null
        });
        if(result.error)throw result.error;

        var selected=state.selectedUnit,from=state.detailFrom||'list';
        if(panel)panel.remove();
        await loadFromSupabase();
        state.selectedUnit=selected;
        state.detailFrom=from;
        state.view='detail';
        if(typeof window.renderMain==='function')window.renderMain();
        else window.renderDetail();
      }catch(e){
        fail(e&&e.message?e.message:'Could not save that credit note.');
        if(save){save.disabled=false;save.textContent='Save changes';}
      }
    }

    function addActions(c,row,n){
      if(!row||!n)return;
      if(row.querySelector('[data-credit-note-actions="1"]'))return;

      var existing=row.querySelector('.tx-actions-btn');
      if(existing&&existing.parentElement)existing.parentElement.remove();

      var wrap=document.createElement('span');
      wrap.className='credit-note-actions-wrap';
      wrap.setAttribute('data-credit-note-actions','1');
      wrap.innerHTML=
        '<button type="button" class="tx-actions-btn" aria-label="Credit note actions" aria-haspopup="menu" aria-expanded="false">&#8942;</button>'+
        '<span class="tx-actions-menu credit-note-actions-menu" role="menu" style="display:none;position:absolute;right:0;top:26px;z-index:90;min-width:160px;padding:6px;background:var(--paper);border:1px solid rgba(0,0,0,.13);border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.16);">'+
          '<button type="button">Edit credit note</button>'+
        '</span>';

      var button=wrap.querySelector('.tx-actions-btn');
      var menu=wrap.querySelector('.credit-note-actions-menu');
      var edit=menu.querySelector('button');
      button.onclick=function(ev){
        ev.preventDefault();ev.stopPropagation();
        var opening=menu.style.display==='none';
        closeMenus();
        if(opening){menu.style.display='block';button.setAttribute('aria-expanded','true');}
      };
      edit.onclick=function(ev){
        ev.preventDefault();ev.stopPropagation();
        showEditor(c,n,row);
      };
      row.appendChild(wrap);
    }

    var scheduled=false;
    function decorate(){
      scheduled=false;
      if(!state||state.view!=='detail')return;
      var c=A.selectedCustomer();
      if(!c)return;
      document.querySelectorAll('.detail .tx-list .credit-note-tx-row[data-credit-note-id]').forEach(function(row){
        var id=row.getAttribute('data-credit-note-id');
        var note=(c.creditNotes||[]).find(function(x){return String(x.id)===String(id);})||(state.creditNotes||[]).find(function(x){return String(x.id)===String(id);});
        if(note)addActions(c,row,note);
      });
    }
    function scheduleDecorate(){
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(decorate);
    }

    var base=window.renderDetail;
    window.renderDetail=function(){var out=base.apply(this,arguments);scheduleDecorate();return out;};

    var app=document.getElementById('app');
    if(app&&window.MutationObserver)new MutationObserver(scheduleDecorate).observe(app,{childList:true,subtree:true});
    document.addEventListener('click',function(e){if(!(e.target&&e.target.closest&&e.target.closest('[data-credit-note-actions="1"]')))closeMenus();},true);

    ensureStyles();
    scheduleDecorate();
  }

  install();
})();
