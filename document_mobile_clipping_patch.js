(function(){
'use strict';
if(window.__sunblissDocumentMobileClippingGuard)return;
window.__sunblissDocumentMobileClippingGuard=true;

const STYLE_ID='sunblissDocumentMobileClippingGuardStyles';
const FRAME_STYLE_ID='sunblissDocumentFrameMobileClippingGuard';

function installParentStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
@media(max-width:700px){
  #crmDocumentDialog{
    position:fixed!important;
    inset:0!important;
    width:100%!important;
    max-width:none!important;
    height:100dvh!important;
    max-height:none!important;
    margin:0!important;
    padding:0!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
  }
  #crmDocumentDialog .document-dialog-bar,
  #crmDocumentDialog .document-options,
  #crmDocumentDialog .document-options-grid{
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  #crmDocumentDialog iframe{
    display:block!important;
    width:100%!important;
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  body:has(#crmDocumentDialog[open]){
    overflow-x:hidden!important;
  }
}
`;
  document.head.appendChild(style);
}

function resetFrameX(frame){
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d)return;
    if(d.documentElement)d.documentElement.scrollLeft=0;
    if(d.body)d.body.scrollLeft=0;
    if(w.scrollX!==0)w.scrollTo(0,w.scrollY);
  }catch(_e){}
}

function installFrame(frame,attempt=0){
  try{
    const d=frame.contentDocument,w=frame.contentWindow;
    if(!d||!w||!d.head){
      if(attempt<40)setTimeout(()=>installFrame(frame,attempt+1),50);
      return;
    }
    if(!d.getElementById(FRAME_STYLE_ID)){
      const style=d.createElement('style');
      style.id=FRAME_STYLE_ID;
      style.textContent=`
@media(max-width:900px){
  html,body{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    overflow-x:hidden!important;
    overscroll-behavior-x:none!important;
  }
  header,main,aside,section,.panel,.paper-wrap,.paper,.previewbar{
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box!important;
  }
  main{
    width:100%!important;
  }
  aside,section{
    width:100%!important;
  }
  .previewbar{
    flex-wrap:wrap!important;
  }
  .paper-wrap{
    width:100%!important;
    overflow:hidden!important;
  }
  .paper{
    width:100%!important;
    margin-left:auto!important;
    margin-right:auto!important;
  }
}
`;
      d.head.appendChild(style);
    }
    resetFrameX(frame);
    if(frame.dataset.sbMobileClippingBound!=='1'){
      frame.dataset.sbMobileClippingBound='1';
      w.addEventListener('pageshow',()=>resetFrameX(frame),{passive:true});
      w.addEventListener('resize',()=>resetFrameX(frame),{passive:true});
      w.addEventListener('orientationchange',()=>resetFrameX(frame),{passive:true});
    }
  }catch(_e){
    if(attempt<40)setTimeout(()=>installFrame(frame,attempt+1),50);
  }
}

function scan(){
  document.querySelectorAll('#crmDocumentDialog iframe[src*="welcome-letter.html"]').forEach(frame=>{
    installFrame(frame);
    if(frame.dataset.sbMobileClippingLoadBound!=='1'){
      frame.dataset.sbMobileClippingLoadBound='1';
      frame.addEventListener('load',()=>installFrame(frame,0));
    }
  });
}

installParentStyles();
const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',scan,{passive:true});
scan();
})();
