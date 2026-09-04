(function(){
'use strict';
if(window.__sunblissTransactionIntegrityReliabilityInstalled)return;
window.__sunblissTransactionIntegrityReliabilityInstalled=true;

var repairing=false;
var verifyQueued=false;
var activeEdit=null;
var previousRenderDetail=null;
var previousRenderMain=null;
var previousGoToDetail=null;
var previousLoad=null;
var repairAttempts={};

function text(v){return v==null?'':String(v)}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase()}
function normUnit(v){return norm(v).replace(/[^a-z0-9]/g,'')}
function num(v){var n=Number(v);return isFinite(n)?n:0}
function safe(v){if(typeof window.esc==='function')return window.esc(text(v));return text(v).replace(/[&<>"']/g,function(ch){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
function money(v){return typeof window.fmtAED==='function'?window.fmtAED(num(v)):'AED '+num(v).toLocaleString('en-AE',{maximumFractionDigits:2})}
function dateLabel(v){var d=v instanceof Date?v:(v?new Date(text(v).slice(0,10)+'T00:00:00'):null);if(!d||isNaN(d.getTime()))return '—';return typeof window.fmtDate==='function'?window.fmtDate(d):d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
function isoDate(v){var s=text(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function value(id){var e=document.getElementById(id);return e?text(e.value).trim():''}
function currentCustomer(){
  if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;
  return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null;
}
function customerUnitId(c){return Number(c&&(c.unitId!=null?c.unitId:(c.dbUnitId!=null?c.dbUnitId:c.sno)))||0}
function customerId(c){return Number(c&&c.customerId)||0}
function paymentBase(v){return norm(v).replace(/\s+(?:partial-\d+|remaining)$/i,'').trim()}
function txTime(t){var d=t&&t.date;if(d instanceof Date&&!isNaN(d.getTime()))return d.getTime();var s=isoDate(d);return s?new Date(s+'T00:00:00').getTime():0}
function exactTransactions(c){
  if(!c||!window.state||!Array.isArray(state.recent))return [];
  var uid=customerUnitId(c),cid=customerId(c),unit=normUnit(c.unit),name=norm(c.name);
  return state.recent.filter(function(t){
    if(!t)return false;
    var tUid=Number(t.unitId||t.unit_id)||0,tCid=Number(t.customerId||t.customer_id)||0,tUnit=normUnit(t.unit),tName=norm(t.name);
    if(cid&&tCid&&cid!==tCid)return false;
    if(uid&&tUid)return uid===tUid;
    if(unit&&tUnit&&unit!==tUnit)return false;
    if(cid&&tCid)return cid===tCid;
    if(unit&&tUnit)return unit===tUnit&&(name&&tName?name===tName:true);
    return !!name&&!!tName&&name===tName;
  }).slice().sort(function(a,b){var d=txTime(a)-txTime(b);if(d)return d;return Number(a&&a.id||0)-Number(b&&b.id||0)});
}
function installExactMatcher(){window.matchTransactions=exactTransactions}

function installStyles(){
  if(document.getElementById('transactionIntegrityReliabilityStyles'))return;
  var s=document.createElement('style');s.id='transactionIntegrityReliabilityStyles';s.textContent=[
    '#transactionEditPanel{max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important;margin:0!important}',
    '#transactionEditPanel .brand-field{display:block;min-width:0!important;max-width:100%!important;overflow:hidden!important}',
    '#transactionEditPanel input,#transactionEditPanel select{display:block;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}',
    '#transactionEditPanel input[type="date"]{-webkit-appearance:none;appearance:none;padding-right:10px!important}',
    '#transactionEditPanel .brand-editor-actions{margin-top:14px}',
    '@media(max-width:520px){#transactionEditPanel .brand-editor-actions{flex-direction:column!important}#transactionEditPanel .brand-editor-actions button{width:100%!important}}'
  ].join('');document.head.appendChild(s);
}

function cashTransactionRows(detail){
  if(!detail)return [];
  return Array.prototype.slice.call(detail.querySelectorAll('.tx-list .tx-row')).filter(function(row){
    if(row.classList&&row.classList.contains('credit-note-tx-row'))return false;
    if(row.hasAttribute&&row.hasAttribute('data-credit-note-id'))return false;
    return !!row.querySelector('.tx-actions-menu button');
  });
}
function displayedCustomerName(nameNode){
  if(!nameNode)return '';
  var title=nameNode.querySelector(':scope > span:first-child');
  if(title)return text(title.textContent);
  var clone=nameNode.cloneNode(true);
  clone.querySelectorAll('#customerActionMenuButton,#customerActionMenu,.tx-actions-menu,button').forEach(function(n){n.remove()});
  return text(clone.textContent);
}
function actionPageOpen(){
  return !!document.querySelector(
    '#transactionEditPanel,#creditNoteEditPanel,#installmentEditOverlay,#installmentDeleteOverlay,#paymentDetailOverlay,'+
    '#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#unitCancellationPanel,#inlineComplianceEditor,'+
    '#customerNotesManagementPanel,.record-payment-panel,#scheduledActionPanel,#paymentExtensionPanel'
  );
}
function parseMoney(v){var n=parseFloat(text(v).replace(/[^0-9.\-]/g,''));return isFinite(n)?n:null}
function expectedDownPayment(c){
  var stages=c&&Array.isArray(c.stages)?c.stages:[];
  return stages.find(function(s){return s&&(text(s.code).toUpperCase()==='DP'||paymentBase(s.label).indexOf('down payment')===0)})||null;
}
function ledgerDownPaymentDue(detail){
  var cards=detail?detail.querySelectorAll('.ledger-scroll .stage-card'):[];
  for(var i=0;i<cards.length;i++){
    var name=cards[i].querySelector('.stage-name');
    if(!name||paymentBase(name.textContent).indexOf('down payment')!==0)continue;
    var rows=cards[i].querySelectorAll('.stage-row');
    for(var j=0;j<rows.length;j++){
      var spans=rows[j].querySelectorAll('span');
      if(spans.length>1&&norm(spans[0].textContent)==='due')return parseMoney(spans[1].textContent);
    }
  }
  return null;
}
function detailIntegrity(){
  if(!window.state||state.view!=='detail'||!state.selectedUnit)return{ok:true};
  var c=currentCustomer(),detail=document.querySelector('#main .detail');
  if(!c||!detail)return{ok:false,reason:'missing detail/customer'};
  var hiddenUnit=detail.querySelector(':scope > .d-unit')||detail.querySelector('.d-unit');
  var name=detail.querySelector(':scope > .d-name')||detail.querySelector('.d-name');
  if(hiddenUnit&&normUnit(hiddenUnit.textContent)!==normUnit(c.unit))return{ok:false,reason:'unit mismatch'};
  var shownName=displayedCustomerName(name);
  if(shownName&&norm(shownName)!==norm(typeof window.titleCase==='function'?window.titleCase(c.name):c.name))return{ok:false,reason:'customer mismatch'};
  var dp=expectedDownPayment(c),shown=ledgerDownPaymentDue(detail);
  if(dp&&dp.due!=null&&shown!=null&&Math.abs(num(dp.due)-shown)>.99)return{ok:false,reason:'ledger mismatch'};
  var txs=exactTransactions(c),rows=cashTransactionRows(detail);
  if(rows.length!==txs.length)return{ok:false,reason:'transaction mismatch'};
  return{ok:true};
}

function closeMenus(){
  document.querySelectorAll('.tx-actions-menu').forEach(function(m){m.style.display='none'});
  document.querySelectorAll('.tx-actions-btn').forEach(function(b){b.setAttribute('aria-expanded','false')});
}
function stableMenuToggle(button,menu,event){
  if(event){event.preventDefault();event.stopPropagation()}
  var opening=menu.style.display==='none'||window.getComputedStyle(menu).display==='none';
  closeMenus();
  if(opening){menu.style.display='block';button.setAttribute('aria-expanded','true')}
}
function bindTransactionActions(row){
  if(!row)return;
  var button=row.querySelector('.tx-actions-btn'),menu=row.querySelector('.tx-actions-menu');
  if(!button||!menu)return;
  var items=menu.querySelectorAll('button'),edit=null,del=null;
  Array.prototype.forEach.call(items,function(item){
    var label=norm(item.textContent);
    if(label==='edit transaction')edit=item;
    else if(label==='delete transaction')del=item;
  });
  if(!edit&&!del)return;

  button.onclick=function(event){stableMenuToggle(button,menu,event)};
  if(edit)edit.onclick=function(event){
    if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()}
    openReliableEditor(row);
  };
  if(del)del.onclick=function(event){
    if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation()}
    deleteReliableTransaction(row,del);
  };
}
function decorateTransactionRows(){
  if(!window.state||state.view!=='detail')return;
  var c=currentCustomer(),detail=document.querySelector('#main .detail');if(!c||!detail)return;
  var txs=exactTransactions(c),rows=cashTransactionRows(detail);
  rows.forEach(function(row,index){
    var t=txs[index];
    if(t&&t.id!=null){
      row.dataset.transactionId=text(t.id);
      row.dataset.transactionUnitId=text(t.unitId||t.unit_id||customerUnitId(c));
      row.dataset.transactionCustomerId=text(t.customerId||t.customer_id||customerId(c));
    }else{
      delete row.dataset.transactionId;
      delete row.dataset.transactionUnitId;
      delete row.dataset.transactionCustomerId;
    }
    bindTransactionActions(row);
  });
  detail.dataset.customerKey=text(state.selectedUnit);
  detail.dataset.unitId=text(customerUnitId(c));
}
function repairDetail(reason){
  if(repairing||actionPageOpen()||!window.state||state.view!=='detail'||!state.selectedUnit||typeof previousRenderDetail!=='function')return false;
  var key=text(state.selectedUnit),count=repairAttempts[key]||0;if(count>=2)return false;repairAttempts[key]=count+1;
  repairing=true;
  try{
    var main=document.getElementById('main');if(main)window.mainEl=main;
    previousRenderDetail.call(window);
    decorateTransactionRows();
  }catch(err){console.error('[Sunbliss] detail integrity repair failed',reason,err)}finally{repairing=false}
  return true;
}
function verifyNow(){
  verifyQueued=false;
  if(!window.state||state.view!=='detail')return;
  installExactMatcher();decorateTransactionRows();
  if(actionPageOpen())return;
  var check=detailIntegrity();
  if(!check.ok&&repairDetail(check.reason)){
    setTimeout(function(){
      if(actionPageOpen())return;
      decorateTransactionRows();
      var again=detailIntegrity();
      if(!again.ok)repairDetail(again.reason);
    },60);
  }else if(check.ok){repairAttempts[text(state.selectedUnit)]=0}
}
function scheduleVerify(){
  if(verifyQueued)return;verifyQueued=true;
  var run=function(){setTimeout(verifyNow,0)};
  if(window.requestAnimationFrame)requestAnimationFrame(run);else run();
}

function currentRowIndex(row){
  var detail=document.querySelector('#main .detail');
  return cashTransactionRows(detail).indexOf(row);
}
async function fetchTransactionForRow(row){
  var c=currentCustomer();if(!c)throw new Error('The displayed customer is no longer available. Refresh the CRM and try again.');
  var uid=customerUnitId(c),cid=customerId(c),key=text(state.selectedUnit),id=Number(row&&row.dataset&&row.dataset.transactionId)||0;
  var tx=null;
  if(id){
    var one=await sb.from('payment_transactions').select('*').eq('id',id).single();
    if(one.error)throw one.error;tx=one.data;
  }else{
    var q=sb.from('payment_transactions').select('*').eq('unit_id',uid).order('payment_date',{ascending:true}).order('id',{ascending:true});
    if(cid)q=q.eq('customer_id',cid);
    var list=await q;if(list.error)throw list.error;
    var index=currentRowIndex(row);tx=index>=0?(list.data||[])[index]||null:null;
  }
  if(!tx)throw new Error('Transaction not found. Please refresh and try again.');
  if(text(state.selectedUnit)!==key)throw new Error('The customer changed while the transaction was loading. Please try again.');
  if(uid&&Number(tx.unit_id)!==uid)throw new Error('This transaction belongs to a different unit. Please refresh and try again.');
  if(cid&&Number(tx.customer_id)!==cid)throw new Error('This transaction belongs to a different customer. Please refresh and try again.');
  return tx;
}
function editorInput(id,label,val,type,extra){
  return '<label class="brand-field">'+safe(label)+'<input id="'+id+'" type="'+(type||'text')+'" value="'+safe(val==null?'':val)+'"'+(extra||'')+' /></label>';
}
function mountEditorPanel(){
  var old=document.getElementById('transactionEditPanel');if(old)old.remove();
  var panel=document.createElement('div');
  panel.id='transactionEditPanel';
  panel.className='brand-editor';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.innerHTML='<p class="section-label" style="margin-top:0">Edit transaction</p><p class="stat-sub">Loading transaction…</p>';
  document.body.appendChild(panel);
  return panel;
}
async function openReliableEditor(row){
  closeMenus();
  var c=currentCustomer();if(!c)return;
  var key=text(state.selectedUnit),panel=mountEditorPanel();
  try{
    var tx=await fetchTransactionForRow(row);
    var schedules=await sb.from('payment_schedule')
      .select('id,customer_id,unit_id,stage_name,due_amount,paid_amount,due_date')
      .eq('customer_id',tx.customer_id)
      .eq('unit_id',tx.unit_id)
      .order('due_date',{ascending:true,nullsFirst:false})
      .order('id',{ascending:true});
    if(schedules.error)throw schedules.error;
    if(text(state.selectedUnit)!==key)throw new Error('The customer changed while the editor was opening.');
    var rows=schedules.data||[];if(!rows.length)throw new Error('No installment schedule is linked to this customer and unit.');
    var selectedId=Number(tx.payment_schedule_id)||0;
    if(!selectedId){
      var base=paymentBase(tx.payment_type),match=rows.find(function(s){return paymentBase(s.stage_name)===base});
      selectedId=match?Number(match.id):0;
    }
    var opts=rows.map(function(s){
      return '<option value="'+safe(s.id)+'"'+(Number(s.id)===selectedId?' selected':'')+'>'+safe(s.stage_name)+' · '+safe(money(Math.max(0,num(s.due_amount)-num(s.paid_amount))))+' remaining</option>';
    }).join('');
    panel.innerHTML=
      '<p class="section-label" style="margin-top:0">Edit transaction</p>'+
      '<p class="stat-sub" style="margin:-5px 0 12px">Edit the payment safely. The installment ledger is rebalanced automatically and the change remains in the audit log.</p>'+
      '<p class="brand-error" id="transactionEditError" style="display:none"></p>'+
      '<label class="brand-field">Installment<select id="teStage">'+opts+'</select></label>'+
      editorInput('teAmount','Amount paid (AED)',tx.amount,'number',' min="0.01" step="0.01" inputmode="decimal"')+
      editorInput('teDate','Payment date',isoDate(tx.payment_date),'date')+
      editorInput('teRef','Reference (optional)',tx.payment_reference||'')+
      editorInput('teRemarks','Remarks (optional)',tx.remarks||'')+
      '<div class="brand-editor-actions"><button type="button" class="btn btn-gold" id="teSave" style="justify-content:center">Save changes</button><button type="button" class="btn-paper" id="teCancel" style="justify-content:center;margin-bottom:0">Cancel</button></div>';
    activeEdit={key:key,tx:tx,schedules:rows,panel:panel};
    document.getElementById('teCancel').onclick=function(){activeEdit=null;panel.remove();scheduleVerify()};
    document.getElementById('teSave').onclick=saveReliableEdit;
  }catch(err){
    activeEdit=null;
    panel.innerHTML=
      '<p class="section-label" style="margin-top:0">Edit transaction</p>'+
      '<p class="brand-error">'+safe(err&&err.message?err.message:'Could not load that transaction.')+'</p>'+
      '<button type="button" class="btn-paper" id="teCloseError">Close</button>';
    var close=document.getElementById('teCloseError');
    if(close)close.onclick=function(){panel.remove();scheduleVerify()};
  }
}
async function refreshBackToCurrent(key,from){
  if(typeof window.loadFromSupabase==='function')await window.loadFromSupabase();
  if(!window.state)return;
  state.selectedUnit=key;state.detailFrom=from||'list';state.view='detail';
  var main=document.getElementById('main');if(main)window.mainEl=main;
  if(typeof window.renderMain==='function')window.renderMain();
  else if(typeof window.renderDetail==='function')window.renderDetail();
  scheduleVerify();
}
async function saveReliableEdit(){
  if(!activeEdit)return;
  var ctx=activeEdit,err=document.getElementById('transactionEditError'),btn=document.getElementById('teSave');
  var c=currentCustomer();
  if(!c||text(state.selectedUnit)!==ctx.key||customerUnitId(c)!==Number(ctx.tx.unit_id)){
    if(err){err.textContent='The displayed customer changed. Close this editor and try again.';err.style.display='block'}
    return;
  }
  var sid=Number(value('teStage'))||0,stage=ctx.schedules.find(function(s){return Number(s.id)===sid}),amount=Number(value('teAmount')),date=value('teDate');
  if(!stage){err.textContent='Select an installment.';err.style.display='block';return}
  if(!isFinite(amount)||amount<=0){err.textContent='Enter a valid payment amount greater than zero.';err.style.display='block';return}
  if(!date){err.textContent='Select a payment date.';err.style.display='block';return}
  btn.disabled=true;btn.textContent='Saving…';err.style.display='none';
  var from=state.detailFrom||'list',key=ctx.key;
  try{
    var r=await sb.rpc('crm_edit_payment_transaction',{
      p_transaction_id:ctx.tx.id,
      p_payment_date:date,
      p_amount:Math.round(amount*100)/100,
      p_payment_type:stage.stage_name,
      p_payment_reference:value('teRef')||null,
      p_remarks:value('teRemarks')||null
    });
    if(r.error)throw r.error;
    activeEdit=null;
    if(ctx.panel&&ctx.panel.isConnected)ctx.panel.remove();
    await refreshBackToCurrent(key,from);
  }catch(e){
    if(err){err.textContent=e&&e.message?e.message:'Could not save that transaction.';err.style.display='block'}
    btn.disabled=false;btn.textContent='Save changes';
  }
}
async function deleteReliableTransaction(row,button){
  closeMenus();
  var c=currentCustomer();if(!c)return;
  var key=text(state.selectedUnit),from=state.detailFrom||'list';
  try{
    var tx=await fetchTransactionForRow(row);
    var detail=[dateLabel(tx.payment_date),tx.payment_type||'Payment',money(tx.amount)].join(' · ');
    if(!window.confirm('Delete this transaction?\n\n'+detail+'\n\nThis will also reverse the linked installment balance. The deletion remains in the audit log.'))return;
    if(button){button.disabled=true;button.textContent='Deleting…'}
    var r=await sb.rpc('crm_delete_payment_transaction',{p_transaction_id:tx.id});
    if(r.error)throw r.error;
    activeEdit=null;
    var p=document.getElementById('transactionEditPanel');if(p)p.remove();
    await refreshBackToCurrent(key,from);
  }catch(e){
    window.alert(e&&e.message?e.message:'Could not delete that transaction.');
    if(button){button.disabled=false;button.textContent='Delete transaction'}
  }
}

function wrapFunctions(){
  installExactMatcher();
  previousRenderDetail=window.renderDetail;
  if(typeof previousRenderDetail==='function'&&!previousRenderDetail.__sunblissTransactionIntegrityWrapped){
    var rd=function(){
      var key=window.state?text(state.selectedUnit):'';
      var out=previousRenderDetail.apply(this,arguments);
      if(window.state&&state.view==='detail'&&text(state.selectedUnit)===key){decorateTransactionRows();scheduleVerify()}
      return out;
    };
    rd.__sunblissTransactionIntegrityWrapped=true;window.renderDetail=rd;
  }
  previousRenderMain=window.renderMain;
  if(typeof previousRenderMain==='function'&&!previousRenderMain.__sunblissTransactionIntegrityWrapped){
    var rm=function(){
      var out=previousRenderMain.apply(this,arguments);
      if(window.state&&state.view==='detail'){decorateTransactionRows();scheduleVerify()}
      return out;
    };
    rm.__sunblissTransactionIntegrityWrapped=true;window.renderMain=rm;
  }
  previousGoToDetail=window.goToDetail;
  if(typeof previousGoToDetail==='function'&&!previousGoToDetail.__sunblissTransactionIntegrityWrapped){
    var gd=function(){var out=previousGoToDetail.apply(this,arguments);scheduleVerify();setTimeout(scheduleVerify,90);return out};
    gd.__sunblissTransactionIntegrityWrapped=true;window.goToDetail=gd;
  }
  previousLoad=window.loadFromSupabase;
  if(typeof previousLoad==='function'&&!previousLoad.__sunblissTransactionIntegrityWrapped){
    var ld=async function(){var out=await previousLoad.apply(this,arguments);installExactMatcher();scheduleVerify();return out};
    ld.__sunblissTransactionIntegrityWrapped=true;window.loadFromSupabase=ld;
  }
}
function install(){
  if(!window.state||!window.sb||typeof window.renderDetail!=='function'||typeof window.renderMain!=='function'){setTimeout(install,60);return}
  installStyles();wrapFunctions();
  if(window.MutationObserver){
    var main=document.getElementById('main');
    if(main)new MutationObserver(function(){if(window.state&&state.view==='detail')scheduleVerify()}).observe(main,{childList:true,subtree:true});
  }
  document.addEventListener('click',function(event){
    if(!(event.target&&event.target.closest&&event.target.closest('.tx-actions-menu,.tx-actions-btn')))closeMenus();
  },false);
  window.addEventListener('pageshow',scheduleVerify);
  window.addEventListener('popstate',scheduleVerify);
  window.__sunblissTransactionIntegrityApi={
    verify:scheduleVerify,
    decorate:decorateTransactionRows,
    openEditor:openReliableEditor,
    deleteTransaction:deleteReliableTransaction,
    currentCustomer:currentCustomer
  };
  scheduleVerify();
}
install();
})();
