(function(){
'use strict';
if(window.__sunblissExtensionNavigationRootFix)return;
window.__sunblissExtensionNavigationRootFix=true;

var navigating=false;

function customerForUnit(unitId){
  if(!window.state||!Array.isArray(state.dues))return null;
  return state.dues.find(function(c){return Number(c&&c.sno)===Number(unitId);})||null;
}

function openExtensionCustomer(unitId){
  if(navigating)return;
  var c=customerForUnit(unitId);
  if(!c||!window.state)return;
  navigating=true;
  try{
    /* Extension rows deliberately bypass goToDetail. That function is wrapped by
       several legacy modules. Use the single canonical navigation API exported by
       the global navigation layer, or one direct render as a safe fallback. */
    if(typeof window.__sunblissOpenCustomerDetail==='function'){
      window.__sunblissOpenCustomerDetail(c.unit,c.sno,'overview');
    }else{
      state.selectedUnit=String(c.unit)+'::'+String(c.sno);
      state.detailFrom='overview';
      state.revealedFields={};
      state.view='detail';
      var main=document.getElementById('main');
      if(main)window.mainEl=main;
      if(typeof window.renderMain==='function')window.renderMain();
      else if(typeof window.renderDetail==='function')window.renderDetail();
      if(typeof window.scrollTo==='function')window.scrollTo(0,0);
    }
  }finally{
    window.setTimeout(function(){navigating=false;},500);
  }
}

/* Capture the Extension row before its historical onclick handler or any bubbling
   handler can see the event. This makes Extension -> customer detail a single-owner
   navigation path on Safari/iPhone as well as desktop browsers. */
document.addEventListener('click',function(event){
  if(!event.target||!event.target.closest)return;
  var row=event.target.closest('[data-ext-unit]');
  if(!row)return;
  event.preventDefault();
  event.stopPropagation();
  if(typeof event.stopImmediatePropagation==='function')event.stopImmediatePropagation();
  openExtensionCustomer(row.getAttribute('data-ext-unit'));
},true);
})();