(function(){
'use strict';
if(window.__sunblissTransactionActionMenuRootFixInstalled)return;
window.__sunblissTransactionActionMenuRootFixInstalled=true;

var activeRow=null;
var portal=null;

function text(v){return v==null?'':String(v)}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase()}
function isCreditRow(row){return !!(row&&(row.classList.contains('credit-note-tx-row')||row.hasAttribute('data-credit-note-id')||row.querySelector('[data-credit-note-actions="1"]')))}
function api(){return window.__sunblissTransactionIntegrityApi||null}

function ensureStyles(){
  if(document.getElementById('transactionActionMenuRootFixStyles'))return;
  var s=document.createElement('style');
  s.id='transactionActionMenuRootFixStyles';
  s.textContent=[
    '#transactionActionsPortal{position:fixed;z-index:20050;min-width:178px;padding:6px;background:var(--paper,#F6F1E4);border:1px solid rgba(0,0,0,.13);border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.18);box-sizing:border-box}',
    '#transactionActionsPortal button{display:block;width:100%;border:0;background:transparent;text-align:left;padding:10px 11px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink,#16232F);cursor:pointer}',
    '#transactionActionsPortal button:active,#transactionActionsPortal button:focus-visible{background:var(--paper-dim,#EBE3CE);outline:none}',
    '#transactionActionsPortal .tx-root-delete{color:var(--rust,#AE3B2B)}',
    '#transactionEditPanel.crm-action-awaiting-ready{opacity:1!important;visibility:visible!important;pointer-events:auto!important}',
    '#transactionEditPanel.crm-full-page-inline{z-index:20040!important}'
  ].join('');
  document.head.appendChild(s);
}

function closeOriginalMenus(){
  document.querySelectorAll('.detail .tx-actions-menu').forEach(function(menu){menu.style.display='none'});
  document.querySelectorAll('.detail .tx-actions-btn').forEach(function(btn){btn.setAttribute('aria-expanded','false')});
}
function closePortal(){
  if(portal&&portal.isConnected)portal.remove();
  portal=null;
  if(activeRow){var b=activeRow.querySelector('.tx-actions-btn');if(b)b.setAttribute('aria-expanded','false')}
  activeRow=null;
}
function actionPanelOpen(){
  return !!document.querySelector('#transactionEditPanel,#creditNoteEditPanel,#installmentEditOverlay,#installmentDeleteOverlay,#paymentDetailOverlay,#customerEditPanel,#unitEditPanel,#saleComplianceEditPanel,#unitCancellationPanel,#inlineComplianceEditor,#customerNotesManagementPanel,.record-payment-panel,#scheduledActionPanel,#paymentExtensionPanel');
}
function releaseStaleInvisibleTransactionPanel(){
  var panel=document.getElementById('transactionEditPanel');
  if(panel&&panel.classList.contains('crm-action-awaiting-ready')&&norm(panel.textContent).indexOf('loading transaction')!==-1){panel.remove()}
  if(!actionPanelOpen())document.body.classList.remove('crm-full-page-action-open');
}
function positionPortal(button){
  if(!portal||!button)return;
  portal.style.visibility='hidden';
  portal.style.left='0px';portal.style.top='0px';
  var rect=button.getBoundingClientRect();
  var w=portal.offsetWidth||178,h=portal.offsetHeight||86;
  var left=Math.max(8,Math.min(window.innerWidth-w-8,rect.right-w));
  var top=rect.bottom+6;
  if(top+h>window.innerHeight-8)top=Math.max(8,rect.top-h-6);
  portal.style.left=Math.round(left)+'px';portal.style.top=Math.round(top)+'px';portal.style.visibility='visible';
}
function makePortal(row,button){
  closePortal();closeOriginalMenus();releaseStaleInvisibleTransactionPanel();
  var a=api();
  if(!a||typeof a.openEditor!=='function')return;
  activeRow=row;
  portal=document.createElement('div');
  portal.id='transactionActionsPortal';
  portal.setAttribute('role','menu');
  portal.innerHTML='<button type="button" class="tx-root-edit">Edit transaction</button><button type="button" class="tx-root-delete">Delete transaction</button>';
  document.body.appendChild(portal);
  button.setAttribute('aria-expanded','true');
  positionPortal(button);
  var edit=portal.querySelector('.tx-root-edit');
  var del=portal.querySelector('.tx-root-delete');
  edit.addEventListener('click',function(ev){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    var targetRow=activeRow;
    closePortal();
    if(targetRow&&targetRow.isConnected)a.openEditor(targetRow);
  },true);
  del.addEventListener('click',function(ev){
    ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
    var targetRow=activeRow;
    closePortal();
    if(targetRow&&targetRow.isConnected&&typeof a.deleteTransaction==='function')a.deleteTransaction(targetRow,del);
  },true);
}
function transactionButtonFromEvent(event){
  if(!event.target||!event.target.closest)return null;
  var button=event.target.closest('.detail .tx-actions-btn');
  if(!button)return null;
  if(button.closest('[data-credit-note-actions="1"]'))return null;
  var row=button.closest('.tx-row');
  if(!row||isCreditRow(row))return null;
  var menu=row.querySelector('.tx-actions-menu');
  if(!menu)return null;
  var labels=Array.prototype.map.call(menu.querySelectorAll('button'),function(x){return norm(x.textContent)});
  if(labels.indexOf('edit transaction')===-1&&labels.indexOf('delete transaction')===-1)return null;
  return {button:button,row:row};
}
function captureTransactionButton(event){
  var hit=transactionButtonFromEvent(event);
  if(!hit)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
  if(portal&&activeRow===hit.row){closePortal();return}
  makePortal(hit.row,hit.button);
}
function outsideClick(event){
  if(!portal)return;
  if(event.target&&event.target.closest&&event.target.closest('#transactionActionsPortal'))return;
  if(transactionButtonFromEvent(event))return;
  closePortal();
}
function install(){
  ensureStyles();
  if(!api()){setTimeout(install,60);return}
  document.addEventListener('click',captureTransactionButton,true);
  document.addEventListener('click',outsideClick,false);
  window.addEventListener('resize',closePortal);
  window.addEventListener('scroll',closePortal,true);
  window.addEventListener('pageshow',function(){closePortal();releaseStaleInvisibleTransactionPanel()});
  window.addEventListener('popstate',closePortal);
  releaseStaleInvisibleTransactionPanel();
}
install();
})();
