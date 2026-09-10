(function(){
'use strict';
if(window.__sunblissDesktopContactSalesSplitInstalled)return;
window.__sunblissDesktopContactSalesSplitInstalled=true;

var MQ=window.matchMedia?window.matchMedia('(min-width:1024px)'):null;

function isDesktop(){return MQ?MQ.matches:window.innerWidth>=1024;}
function cleanText(node){return String(node&&node.textContent||'').replace(/\s+/g,' ').trim().toUpperCase();}
function findSection(detail,names){
  var labels=detail.querySelectorAll('.section-label');
  for(var i=0;i<labels.length;i++){
    var text=cleanText(labels[i]);
    if(names.indexOf(text)!==-1)return labels[i];
  }
  return null;
}
function collectContactNodes(label){
  var nodes=[label],node=label.nextElementSibling;
  while(node){
    if(node.classList&&node.classList.contains('section-label'))break;
    if(node.classList&&(node.classList.contains('money-grid')||node.classList.contains('cust-progress')))break;
    nodes.push(node);
    node=node.nextElementSibling;
  }
  return nodes;
}
function collectSalesNodes(label){
  var nodes=[label],node=label.nextElementSibling;
  while(node){
    if(node.classList&&node.classList.contains('section-label'))break;
    if(!(node.matches&&node.matches('.field-row,.field-address')))break;
    nodes.push(node);
    node=node.nextElementSibling;
  }
  return nodes;
}
function restoreLayout(){
  var grid=document.getElementById('sbContactSalesGrid');
  if(!grid)return;
  var contactNodes=grid.__sbContactNodes||[];
  var salesNodes=grid.__sbSalesNodes||[];
  var contactAnchor=grid.__sbContactAnchor;
  var salesAnchor=grid.__sbSalesAnchor;
  if(contactAnchor&&contactAnchor.parentNode){
    contactNodes.forEach(function(node){contactAnchor.parentNode.insertBefore(node,contactAnchor.nextSibling);contactAnchor=node;});
  }
  if(salesAnchor&&salesAnchor.parentNode){
    salesNodes.forEach(function(node){salesAnchor.parentNode.insertBefore(node,salesAnchor);});
  }
  if(grid.parentNode)grid.parentNode.removeChild(grid);
  if(grid.__sbContactAnchor&&grid.__sbContactAnchor.parentNode)grid.__sbContactAnchor.parentNode.removeChild(grid.__sbContactAnchor);
  if(grid.__sbSalesAnchor&&grid.__sbSalesAnchor.parentNode)grid.__sbSalesAnchor.parentNode.removeChild(grid.__sbSalesAnchor);
}
function applyLayout(){
  if(!isDesktop()){restoreLayout();return;}
  if(document.getElementById('sbContactSalesGrid'))return;
  var detail=document.querySelector('#main .detail');
  if(!detail)return;
  var contact=findSection(detail,['CONTACT','CONTACT DETAILS']);
  var sales=findSection(detail,['SALE & COMPLIANCE','SALES & COMPLIANCE']);
  if(!contact||!sales||contact.parentNode!==detail||sales.parentNode!==detail)return;

  var contactNodes=collectContactNodes(contact);
  var salesNodes=collectSalesNodes(sales);
  if(contactNodes.length<2||salesNodes.length<2)return;

  var contactAnchor=document.createComment('sb-contact-original-position');
  var salesAnchor=document.createComment('sb-sales-original-position');
  detail.insertBefore(contactAnchor,contact);
  detail.insertBefore(salesAnchor,sales);

  var grid=document.createElement('div');
  grid.id='sbContactSalesGrid';
  grid.className='sb-contact-sales-grid';
  var left=document.createElement('section');
  left.className='sb-contact-sales-panel sb-contact-panel';
  var right=document.createElement('section');
  right.className='sb-contact-sales-panel sb-sales-panel';
  contactNodes.forEach(function(node){left.appendChild(node);});
  salesNodes.forEach(function(node){right.appendChild(node);});
  grid.appendChild(left);
  grid.appendChild(right);
  grid.__sbContactNodes=contactNodes;
  grid.__sbSalesNodes=salesNodes;
  grid.__sbContactAnchor=contactAnchor;
  grid.__sbSalesAnchor=salesAnchor;
  detail.insertBefore(grid,contactAnchor.nextSibling);
}

function installStyles(){
  if(document.getElementById('sbContactSalesSplitStyles'))return;
  var style=document.createElement('style');
  style.id='sbContactSalesSplitStyles';
  style.textContent='@media (min-width:1024px){#sbContactSalesGrid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:clamp(28px,3vw,48px)!important;align-items:start!important;width:100%!important;min-width:0!important;margin:0 0 20px!important;box-sizing:border-box!important}#sbContactSalesGrid>.sb-contact-sales-panel{min-width:0!important;width:100%!important;box-sizing:border-box!important}#sbContactSalesGrid .section-label{margin-top:22px!important}#sbContactSalesGrid .field-row,#sbContactSalesGrid .field-address{min-width:0!important;width:100%!important;box-sizing:border-box!important}#sbContactSalesGrid .field-value{min-width:0!important;overflow-wrap:anywhere!important}}';
  document.head.appendChild(style);
}

installStyles();
var previousRenderDetail=window.renderDetail;
if(typeof previousRenderDetail==='function'){
  window.renderDetail=function(){
    var result=previousRenderDetail.apply(this,arguments);
    applyLayout();
    return result;
  };
}
applyLayout();

function handleBreakpoint(){
  if(isDesktop())applyLayout();
  else restoreLayout();
}
if(MQ){
  if(MQ.addEventListener)MQ.addEventListener('change',handleBreakpoint);
  else if(MQ.addListener)MQ.addListener(handleBreakpoint);
}
})();
