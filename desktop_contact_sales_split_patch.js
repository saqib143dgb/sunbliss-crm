(function(){
'use strict';
if(window.__sunblissDesktopContactSalesSplitInstalled)return;
window.__sunblissDesktopContactSalesSplitInstalled=true;

var MQ=window.matchMedia?window.matchMedia('(min-width:1024px)'):null;
var raf=0;
var applying=false;

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
function headerIcon(type){
  if(type==='contact'){
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2"></circle><path d="M5.5 20c.7-4.1 3.2-6.2 6.5-6.2s5.8 2.1 6.5 6.2"></path></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3.5" width="12" height="17" rx="1.5"></rect><path d="M9 8h6M9 11.5h6M9 15h4"></path></svg>';
}
function makePanelHeader(type){
  var header=document.createElement('div');
  header.className='sb-contact-sales-header sb-'+type+'-header';
  var title=type==='contact'?'CONTACT':'SALE & COMPLIANCE';
  var subtitle=type==='contact'?'PERSONAL & CONTACT INFORMATION':'BROKERAGE & REGULATORY DETAILS';
  header.innerHTML='<span class="sb-contact-sales-header-icon">'+headerIcon(type)+'</span><span class="sb-contact-sales-header-divider" aria-hidden="true"></span><span class="sb-contact-sales-header-copy"><strong>'+title+'</strong><small>'+subtitle+'</small></span>';
  return header;
}
function makePanelBody(nodes){
  var body=document.createElement('div');
  body.className='sb-contact-sales-body';
  nodes.forEach(function(node){body.appendChild(node);});
  return body;
}
function restoreLayout(){
  var grid=document.getElementById('sbContactSalesGrid');
  if(!grid)return;
  var contactNodes=grid.__sbContactNodes||[];
  var salesNodes=grid.__sbSalesNodes||[];
  var contactAnchor=grid.__sbContactAnchor;
  var salesAnchor=grid.__sbSalesAnchor;
  if(contactAnchor&&contactAnchor.parentNode){
    var ref=contactAnchor.nextSibling;
    contactNodes.forEach(function(node){contactAnchor.parentNode.insertBefore(node,ref);});
  }
  if(salesAnchor&&salesAnchor.parentNode){
    salesNodes.forEach(function(node){salesAnchor.parentNode.insertBefore(node,salesAnchor);});
  }
  if(grid.parentNode)grid.parentNode.removeChild(grid);
  if(contactAnchor&&contactAnchor.parentNode)contactAnchor.parentNode.removeChild(contactAnchor);
  if(salesAnchor&&salesAnchor.parentNode)salesAnchor.parentNode.removeChild(salesAnchor);
}
function applyLayout(){
  if(applying)return;
  applying=true;
  try{
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
    left.appendChild(makePanelHeader('contact'));
    left.appendChild(makePanelBody(contactNodes));

    var right=document.createElement('section');
    right.className='sb-contact-sales-panel sb-sales-panel';
    right.appendChild(makePanelHeader('sales'));
    right.appendChild(makePanelBody(salesNodes));

    grid.appendChild(left);
    grid.appendChild(right);
    grid.__sbContactNodes=contactNodes;
    grid.__sbSalesNodes=salesNodes;
    grid.__sbContactAnchor=contactAnchor;
    grid.__sbSalesAnchor=salesAnchor;
    detail.insertBefore(grid,contactAnchor.nextSibling);
  }finally{
    applying=false;
  }
}

function scheduleApply(){
  if(raf)cancelAnimationFrame(raf);
  raf=requestAnimationFrame(function(){raf=0;applyLayout();});
}

function installStyles(){
  if(document.getElementById('sbContactSalesSplitStyles'))return;
  var style=document.createElement('style');
  style.id='sbContactSalesSplitStyles';
  style.textContent=`
@media (min-width:1024px){
  #sbContactSalesGrid{
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:20px!important;
    align-items:stretch!important;
    width:100%!important;
    min-width:0!important;
    margin:0 0 24px!important;
    box-sizing:border-box!important;
  }
  #sbContactSalesGrid>.sb-contact-sales-panel{
    min-width:0!important;
    width:100%!important;
    height:100%!important;
    box-sizing:border-box!important;
    background:var(--paper)!important;
    border:1px solid var(--paper-line)!important;
    border-radius:14px!important;
    padding:0!important;
    overflow:hidden!important;
    box-shadow:0 2px 7px rgba(15,26,38,.055)!important;
  }
  #sbContactSalesGrid .sb-contact-sales-header{
    min-height:86px!important;
    display:flex!important;
    align-items:center!important;
    gap:16px!important;
    box-sizing:border-box!important;
    padding:16px 20px!important;
    background:linear-gradient(180deg,rgba(198,151,46,.085) 0%,rgba(198,151,46,.035) 100%)!important;
    border-bottom:1px solid var(--paper-line)!important;
  }
  #sbContactSalesGrid .sb-contact-sales-header-icon{
    width:48px!important;
    height:48px!important;
    min-width:48px!important;
    display:grid!important;
    place-items:center!important;
    border-radius:50%!important;
    color:#fff!important;
    background:linear-gradient(145deg,#b58a2b,#8d681f)!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 2px 5px rgba(96,70,20,.14)!important;
  }
  #sbContactSalesGrid .sb-contact-sales-header-icon svg{
    width:25px!important;
    height:25px!important;
    fill:none!important;
    stroke:currentColor!important;
    stroke-width:1.8!important;
    stroke-linecap:round!important;
    stroke-linejoin:round!important;
  }
  #sbContactSalesGrid .sb-contact-sales-header-divider{
    width:1px!important;
    height:39px!important;
    background:rgba(142,103,31,.60)!important;
    flex:0 0 1px!important;
  }
  #sbContactSalesGrid .sb-contact-sales-header-copy{
    display:flex!important;
    flex-direction:column!important;
    justify-content:center!important;
    gap:7px!important;
    min-width:0!important;
  }
  #sbContactSalesGrid .sb-contact-sales-header-copy strong{
    color:var(--ink)!important;
    font-family:Inter,Arial,sans-serif!important;
    font-size:15px!important;
    font-weight:750!important;
    line-height:1!important;
    letter-spacing:.08em!important;
    white-space:nowrap!important;
  }
  #sbContactSalesGrid .sb-contact-sales-header-copy small{
    color:var(--muted)!important;
    font-family:'IBM Plex Mono',monospace!important;
    font-size:8.5px!important;
    font-weight:600!important;
    line-height:1!important;
    letter-spacing:.18em!important;
    white-space:nowrap!important;
  }
  #sbContactSalesGrid .sb-contact-sales-body{
    padding:0 18px 16px!important;
    box-sizing:border-box!important;
  }
  #sbContactSalesGrid .sb-contact-sales-body>.section-label{
    display:none!important;
  }
  #sbContactSalesGrid .field-row,
  #sbContactSalesGrid .field-address{
    min-width:0!important;
    width:100%!important;
    max-width:none!important;
    box-sizing:border-box!important;
  }
  #sbContactSalesGrid .field-value{
    min-width:0!important;
    overflow-wrap:anywhere!important;
  }
  #sbContactSalesGrid .sb-contact-panel .btn,
  #sbContactSalesGrid .sb-contact-panel .btn-paper{
    margin-top:12px!important;
    margin-bottom:0!important;
  }
}
`;
  document.head.appendChild(style);
}

installStyles();

var previousRenderDetail=window.renderDetail;
if(typeof previousRenderDetail==='function'){
  window.renderDetail=function(){
    var result=previousRenderDetail.apply(this,arguments);
    scheduleApply();
    return result;
  };
}

function observeMain(){
  var main=document.getElementById('main');
  if(!main||!window.MutationObserver)return;
  var observer=new MutationObserver(function(){
    if(applying)return;
    scheduleApply();
  });
  observer.observe(main,{childList:true,subtree:true});
}

applyLayout();
observeMain();

function handleBreakpoint(){
  if(isDesktop())scheduleApply();
  else restoreLayout();
}
if(MQ){
  if(MQ.addEventListener)MQ.addEventListener('change',handleBreakpoint);
  else if(MQ.addListener)MQ.addListener(handleBreakpoint);
}
window.addEventListener('pageshow',scheduleApply,{passive:true});
})();
