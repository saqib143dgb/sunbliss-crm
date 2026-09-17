(function(){
'use strict';
if(window.__sunblissDocumentErrorGuard)return;
window.__sunblissDocumentErrorGuard=true;

const FRAME_SELECTOR='#crmDocumentDialog iframe[src*="welcome-letter.html"]';
const SAFE_MESSAGE='Unable to generate the PDF right now. Close Generate Document, reopen it, and try again.';

function copyMarkers(from,to){
  try{Object.keys(from).forEach(key=>{try{to[key]=from[key]}catch(_e){}});}catch(_e){}
}

function install(frame,attempt=0){
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d)return;
    const original=w.makeDocumentPdf;
    if(typeof original!=='function'){
      if(attempt<120)setTimeout(()=>install(frame,attempt+1),75);
      return;
    }
    if(original.__crmUserSafeErrorGuard)return;

    const guarded=async function(){
      try{
        return await original.apply(this,arguments);
      }catch(err){
        console.error('[Sunbliss CRM] Document generation failed.',err);
        throw new Error(SAFE_MESSAGE);
      }
    };
    copyMarkers(original,guarded);
    guarded.__crmUserSafeErrorGuard=true;
    w.makeDocumentPdf=guarded;

    const notice=d.getElementById('notice');
    const form=d.getElementById('details');
    if(form&&notice&&form.dataset.sbDocumentRecoveryHint!=='1'){
      form.dataset.sbDocumentRecoveryHint='1';
      form.addEventListener('submit',()=>{
        if(notice.textContent===SAFE_MESSAGE)notice.textContent='Generating PDF…';
      },{capture:true});
    }
  }catch(_e){
    if(attempt<120)setTimeout(()=>install(frame,attempt+1),75);
  }
}

function scan(){
  document.querySelectorAll(FRAME_SELECTOR).forEach(frame=>{
    install(frame,0);
    if(frame.dataset.sbDocumentErrorGuardLoadBound!=='1'){
      frame.dataset.sbDocumentErrorGuardLoadBound='1';
      frame.addEventListener('load',()=>install(frame,0));
    }
  });
}

const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',scan,{passive:true});
scan();
})();
