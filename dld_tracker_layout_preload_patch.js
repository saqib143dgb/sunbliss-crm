(function(){
'use strict';
if(window.__sunblissDldTrackerLayoutPreloadInstalled)return;
window.__sunblissDldTrackerLayoutPreloadInstalled=true;

var style=document.createElement('style');
style.id='sunblissDldTrackerLayoutPreloadStyle';
style.textContent=`
/*
  DLD tracker first-paint layout guard.
  This runs in <head> before the CRM renderer, so the section paints directly
  in its final desktop grid instead of briefly rendering the base stacked layout.
  No colors, typography, values, click behavior, or business logic are changed.
*/
@media (min-width:1024px){
  .overview > div:has(> #btnDldPaid){
    display:grid!important;
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    width:100%!important;
    max-width:none!important;
    height:auto!important;
    min-height:0!important;
    align-items:stretch!important;
  }

  .overview > div:has(> #btnDldPaid) > .stat-cell{
    display:flex!important;
    flex-direction:column!important;
    justify-content:center!important;
    min-width:0!important;
    width:100%!important;
    max-width:none!important;
    height:auto!important;
    min-height:104px!important;
    padding:15px 14px!important;
    box-sizing:border-box!important;
  }

  .overview > .pipeline:has(> #btnDldFullyPaid){
    display:grid!important;
    grid-template-columns:repeat(3,minmax(0,1fr))!important;
    width:100%!important;
    max-width:none!important;
    gap:9px!important;
    margin:2px 0 18px!important;
    height:auto!important;
    min-height:0!important;
    align-items:stretch!important;
    flex-wrap:nowrap!important;
  }

  .overview > .pipeline:has(> #btnDldFullyPaid) > .pill-stat{
    display:flex!important;
    flex-direction:column!important;
    justify-content:center!important;
    min-width:0!important;
    width:100%!important;
    max-width:none!important;
    height:76px!important;
    min-height:76px!important;
    margin:0!important;
    padding:11px 12px!important;
    box-sizing:border-box!important;
  }

  .overview > .pipeline:has(> #btnDldFullyPaid) > .pill-stat > .pill-stat-num{
    display:flex!important;
    align-items:center!important;
    visibility:visible!important;
    opacity:1!important;
    height:auto!important;
    min-height:0!important;
    overflow:visible!important;
  }

  .overview > .pipeline:has(> #btnDldFullyPaid) > .pill-stat > .pill-stat-lbl{
    display:block!important;
    visibility:visible!important;
    opacity:1!important;
    height:auto!important;
    min-height:0!important;
  }
}
`;
document.head.appendChild(style);
})();
