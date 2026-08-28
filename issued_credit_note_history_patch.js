(function(){
'use strict';
if(window.__sunblissIssuedCreditNoteHistoryInstalled)return;
window.__sunblissIssuedCreditNoteHistoryInstalled=true;

function text(v){return v==null?'':String(v);}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase();}
function isMulti(note){
  var n=norm(note);
  return /\bcredit notes\b/.test(n)||/\b(each|every|all|future)\b.{0,45}\binstallments?\b/.test(n)||/\bagainst installments\b/.test(n)||/\binstallment-wise\b/.test(n);
}
function isExplicitIssuedOneTime(note){
  var n=norm(note);
  if(!n||n.indexOf('credit note')<0||isMulti(n))return false;
  return /\bhas been issued\b/.test(n)||/\balready issued\b/.test(n)||/\bwas issued\b/.test(n)||/\bcredit note\b.{0,45}\bissued against\b/.test(n)||/\bissued credit note\b/.test(n);
}
function specialRow(root){
  if(!root)return null;
  var rows=root.querySelectorAll('.customer-note-display-row');
  for(var i=0;i<rows.length;i++){
    var label=rows[i].querySelector('.customer-note-display-label');
    if(label&&norm(label.textContent).indexOf('special note')===0)return rows[i];
  }
  return null;
}
function rowText(row){
  var body=row&&row.querySelector('.customer-note-display-text');
  return body?body.textContent:'';
}
function hasVisibleRows(card){
  if(!card)return false;
  var rows=card.querySelectorAll('.customer-note-display-row');
  for(var i=0;i<rows.length;i++){
    if(rows[i].style.display!=='none')return true;
  }
  return false;
}
function apply(){
  if(!window.state||state.view!=='detail')return;
  var card=document.getElementById('customerNotesCard');
  if(card){
    var front=specialRow(card);
    if(front&&isExplicitIssuedOneTime(rowText(front))){
      front.style.display='none';
      front.dataset.issuedCreditNoteHistoryHidden='1';
      if(!hasVisibleRows(card))card.style.display='none';
    }
  }
  var panel=document.getElementById('customerNotesHistoryPanel');
  if(panel){
    var history=specialRow(panel);
    if(history&&isExplicitIssuedOneTime(rowText(history))){
      history.style.display='';
      var label=history.querySelector('.customer-note-display-label');
      if(label)label.textContent='Special Note · Completed';
      if(!history.querySelector('.issued-credit-note-history-help')){
        var help=document.createElement('p');
        help.className='customer-note-archive-help issued-credit-note-history-help';
        help.textContent='Archived because the required one-time credit note has already been issued.';
        history.appendChild(help);
      }
    }
  }
}
function install(){
  var root=document.getElementById('app')||document.body;
  new MutationObserver(apply).observe(root,{childList:true,subtree:true});
  apply();
}
install();
})();
