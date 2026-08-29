(function(){
'use strict';
if(window.__sunblissNotesManagementInstalled)return;
window.__sunblissNotesManagementInstalled=true;

function txt(v){return v==null?'':String(v);}
function esc(v){return txt(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});}
function unitId(){if(!window.state||!state.selectedUnit)return null;var p=String(state.selectedUnit).split('::');return p.length>1&&Number(p[1])?Number(p[1]):null;}
function styles(){
  if(document.getElementById('notesManagementStyles'))return;
  var s=document.createElement('style');s.id='notesManagementStyles';
  s.textContent='#customerNotesManagementPanel{margin:0 0 16px;box-shadow:none;border:1px solid var(--paper-line)}.notes-management-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0 12px}.notes-management-action{display:flex;align-items:center;justify-content:center;min-height:40px;padding:9px 10px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);color:var(--ink);font:650 12px/1.25 Inter,Arial,sans-serif;cursor:pointer}.notes-current{margin:0 0 11px;padding:11px 12px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim)}.notes-current-label,.notes-history-meta{margin:0 0 4px;font:700 10px/1.25 IBM Plex Mono,monospace;letter-spacing:.045em;text-transform:uppercase;color:var(--muted)}.notes-current-text,.notes-history-text{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:500 12.5px/1.5 Inter,Arial,sans-serif;color:var(--ink)}.notes-current-help{margin:5px 0 0;font-size:10.5px;line-height:1.4;color:var(--muted)}.notes-subpanel{margin:10px 0 0;padding:11px 12px;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper)}.notes-subpanel[hidden]{display:none!important}.notes-editor-textarea{display:block;width:100%;min-height:110px;margin:7px 0 10px;padding:10px 11px;resize:vertical;border:1px solid var(--paper-line);border-radius:9px;background:var(--paper-dim);color:var(--ink);font:500 13.5px/1.5 Inter,Arial,sans-serif;box-sizing:border-box}.notes-editor-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.notes-history-item{padding:10px 0;border-top:1px solid var(--paper-line)}.notes-history-item:first-child{border-top:0;padding-top:0}.notes-history-change{margin:5px 0 0;font-size:10.8px;line-height:1.45;color:var(--muted)}.notes-management-error{margin:7px 0 0;color:var(--rust);font-size:11px;font-weight:600}@media(max-width:560px){.notes-management-actions,.notes-editor-actions{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
function closeActionMenu(){var m=document.getElementById('customerActionMenu'),b=document.getElementById('customerActionMenuButton');if(m)m.style.display='none';if(b)b.setAttribute('aria-expanded','false');}
function anchor(detail){var b=detail&&detail.querySelector('.badges');if(b&&b.parentNode)return b;var t=detail&&detail.querySelector('.d-type');return t&&t.parentNode?t:null;}
async function fetchNotes(uid){var r=await sb.from('sales').select('id,customer_note,remarks,partial_booking_note').eq('unit_id',uid).order('id',{ascending:false}).limit(1);if(r.error)throw r.error;return (r.data||[])[0]||{};}
async function fetchHistory(uid){
  var r=await sb.from('sales_note_history').select('id,old_note,new_note,edited_by,edited_at,note_type').eq('unit_id',uid).eq('note_type','note').order('edited_at',{ascending:false}).limit(100);if(r.error)throw r.error;
  var rows=r.data||[],ids=[];rows.forEach(function(x){if(x.edited_by&&ids.indexOf(x.edited_by)<0)ids.push(x.edited_by);});var names={};
  if(ids.length){var p=await sb.from('profiles').select('id,full_name').in('id',ids);if(!p.error)(p.data||[]).forEach(function(x){names[x.id]=x.full_name||'CRM Officer';});}
  rows.forEach(function(x){x.editor_name=names[x.edited_by]||'CRM Officer';});return rows;
}
function when(v){var d=new Date(v);if(isNaN(d.getTime()))return txt(v);try{return d.toLocaleString([], {year:'numeric',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return d.toLocaleString();}}
function currentBlock(note,label,help){var w=document.createElement('div');w.className='notes-current';w.innerHTML='<p class="notes-current-label">'+esc(label)+'</p><p class="notes-current-text">'+esc(txt(note).trim()||'No note recorded.')+'</p>'+(help?'<p class="notes-current-help">'+esc(help)+'</p>':'');return w;}
function renderHistory(section,rows){
  section.innerHTML='<p class="section-label" style="margin:0 0 9px">Note History</p>';
  if(!rows.length){section.insertAdjacentHTML('beforeend','<p class="stat-sub" style="margin:0">No previous Note edits recorded yet.</p>');return;}
  rows.forEach(function(row){var oldN=txt(row.old_note).trim(),newN=txt(row.new_note).trim(),action=!oldN&&newN?'Added Note':oldN&&!newN?'Removed Note':'Edited Note';var item=document.createElement('div');item.className='notes-history-item';item.innerHTML='<p class="notes-history-meta">'+esc(action)+' · '+esc(row.editor_name)+' · '+esc(when(row.edited_at))+'</p><p class="notes-history-text">'+esc(newN||'Note removed')+'</p>'+(oldN?'<p class="notes-history-change">Previous: '+esc(oldN)+'</p>':'');section.appendChild(item);});
}
async function showPanel(){
  var legacy=document.getElementById('customerNotesHistoryPanel');if(legacy)legacy.remove();var existing=document.getElementById('customerNotesManagementPanel');if(existing){existing.remove();return;}
  var detail=document.querySelector('.detail'),uid=unitId();if(!detail||!uid||!window.sb)return;
  var panel=document.createElement('div');panel.id='customerNotesManagementPanel';panel.className='brand-editor';panel.innerHTML='<p class="section-label" style="margin-top:0">Notes</p><p class="stat-sub">Loading notes…</p>';var a=anchor(detail);if(a)a.insertAdjacentElement('afterend',panel);else detail.insertBefore(panel,detail.firstChild);
  try{
    var sale=await fetchNotes(uid);if(!document.getElementById('customerNotesManagementPanel'))return;
    panel.innerHTML='<p class="section-label" style="margin-top:0">Notes</p>';
    panel.appendChild(currentBlock(sale.customer_note,'Note','Managed here. Adding, editing or deleting this Note does not change Special Note.'));
    if(txt(sale.remarks).trim())panel.appendChild(currentBlock(sale.remarks,'Special Note','Managed separately in Edit Sale.'));
    if(txt(sale.partial_booking_note).trim())panel.appendChild(currentBlock(sale.partial_booking_note,'Partial Booking Note','Managed separately and linked to partial-booking follow-up.'));

    var actions=document.createElement('div');actions.className='notes-management-actions';actions.innerHTML='<button type="button" class="notes-management-action" id="notesHistoryBtn">History</button><button type="button" class="notes-management-action" id="notesEditBtn">Add / Edit Note</button>';panel.appendChild(actions);
    var history=document.createElement('div');history.id='notesHistorySection';history.className='notes-subpanel';history.hidden=true;panel.appendChild(history);
    var editor=document.createElement('div');editor.id='notesEditorSection';editor.className='notes-subpanel';editor.hidden=true;editor.innerHTML='<p class="section-label" style="margin:0">Add / Edit Note</p><textarea class="notes-editor-textarea" id="notesEditorText" placeholder="Write the internal Note for this customer.">'+esc(txt(sale.customer_note))+'</textarea><div class="notes-editor-actions"><button type="button" class="btn btn-gold" id="notesSaveBtn" style="justify-content:center">Save Note</button><button type="button" class="btn-paper" id="notesCancelEditBtn" style="justify-content:center;margin:0">Cancel</button></div><p class="notes-management-error" id="notesEditorError" style="display:none"></p>';panel.appendChild(editor);
    var close=document.createElement('button');close.type='button';close.className='btn-paper';close.style.cssText='width:100%;justify-content:center;margin:12px 0 0';close.textContent='Close';close.onclick=function(){panel.remove();};panel.appendChild(close);

    document.getElementById('notesHistoryBtn').onclick=async function(){editor.hidden=true;history.hidden=!history.hidden;if(history.hidden)return;history.innerHTML='<p class="stat-sub" style="margin:0">Loading history…</p>';try{renderHistory(history,await fetchHistory(uid));}catch(e){history.innerHTML='<p class="notes-management-error">Could not load Note history.</p>';}};
    document.getElementById('notesEditBtn').onclick=function(){history.hidden=true;editor.hidden=!editor.hidden;if(!editor.hidden){var ta=document.getElementById('notesEditorText');if(ta){ta.focus();ta.setSelectionRange(ta.value.length,ta.value.length);}}};
    document.getElementById('notesCancelEditBtn').onclick=function(){var ta=document.getElementById('notesEditorText');if(ta)ta.value=txt(sale.customer_note);editor.hidden=true;};
    document.getElementById('notesSaveBtn').onclick=async function(){
      var save=document.getElementById('notesSaveBtn'),ta=document.getElementById('notesEditorText'),err=document.getElementById('notesEditorError');if(!save||!ta)return;
      save.disabled=true;save.textContent='Saving…';if(err)err.style.display='none';
      try{
        var r=await sb.rpc('crm_save_sales_note',{p_unit_id:uid,p_note:ta.value});if(r.error)throw r.error;
        sale.customer_note=ta.value.trim()||null;
        var blocks=panel.querySelectorAll('.notes-current');if(blocks[0])blocks[0].replaceWith(currentBlock(sale.customer_note,'Note','Managed here. Adding, editing or deleting this Note does not change Special Note.'));
        editor.hidden=true;history.hidden=false;renderHistory(history,await fetchHistory(uid));
        if(typeof window.renderDetail==='function')setTimeout(function(){try{window.renderDetail();}catch(e){}},30);
      }catch(e){if(err){err.textContent=e&&e.message?e.message:'Could not save Note.';err.style.display='block';}}
      finally{if(save){save.disabled=false;save.textContent='Save Note';}}
    };
  }catch(e){panel.innerHTML='<p class="section-label" style="margin-top:0">Notes</p><p class="notes-management-error">Could not load notes.</p>';}
}
function intercept(e){var b=e.target&&e.target.closest?e.target.closest('#actionViewNotes'):null;if(!b)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();closeActionMenu();showPanel();}
function install(){if(!window.state||!window.sb){setTimeout(install,80);return;}styles();document.addEventListener('click',intercept,true);}
install();
})();
