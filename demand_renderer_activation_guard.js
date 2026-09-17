(function(){
'use strict';
if(window.__sunblissDemandRendererActivationGuard)return;
window.__sunblissDemandRendererActivationGuard=true;

const FRAME_SELECTOR='#crmDocumentDialog iframe[src*="welcome-letter.html"]';
const POLL_MS=120;
const MAX_WAIT_MS=90000;
const EXACT_FLAG='__sunblissDemandReferenceMatchV2';
const PREVIEW_FLAG='__sunblissDemandLivePdfPreview';
const ERROR_FLAG='__sunblissDocumentErrorGuard';

function cacheBust(src){
  return src+(src.includes('?')?'&':'?')+'lateDemandActivation='+Date.now();
}

function reloadPatch(flag,src,done){
  try{window[flag]=false;}catch(_e){}
  const script=document.createElement('script');
  script.src=cacheBust(src);
  script.dataset.sbLateDemandPatch=src;
  script.onload=()=>{script.remove();done&&done();};
  script.onerror=()=>{script.remove();done&&done(new Error('Could not reload '+src));};
  document.head.appendChild(script);
}

function hideAccountDetails(d){
  const field=d.getElementById('accountDetails');
  if(!field)return;
  field.required=false;
  const label=field.closest('label');
  if(label)label.style.display='none';
}

function rearmDependents(frame){
  let w,d;
  try{w=frame.contentWindow;d=frame.contentDocument;}catch(_e){return;}
  if(!w||!d||!w.makeDocumentPdf?.__crmDemandMasterReference)return;
  hideAccountDetails(d);
  d.documentElement.dataset.crmDemandRendererStatus='active';

  if(d.documentElement.dataset.crmDemandLivePdfPreview!=='1'&&!frame.dataset.sbDemandPreviewRearm){
    frame.dataset.sbDemandPreviewRearm='1';
    reloadPatch(PREVIEW_FLAG,'demand_letter_live_preview_patch.js',()=>{
      setTimeout(()=>{delete frame.dataset.sbDemandPreviewRearm;},300);
    });
  }
  if(!w.makeDocumentPdf.__crmUserSafeErrorGuard&&!frame.dataset.sbDemandErrorRearm){
    frame.dataset.sbDemandErrorRearm='1';
    reloadPatch(ERROR_FLAG,'document_error_guard_patch.js',()=>{
      setTimeout(()=>{delete frame.dataset.sbDemandErrorRearm;},300);
    });
  }
}

function activateExact(frame){
  if(frame.dataset.sbDemandExactRearm==='1')return;
  frame.dataset.sbDemandExactRearm='1';
  reloadPatch(EXACT_FLAG,'demand_letter_reference_match_patch.js',()=>{
    setTimeout(()=>{
      delete frame.dataset.sbDemandExactRearm;
      try{
        const w=frame.contentWindow,d=frame.contentDocument;
        if(w?.makeDocumentPdf?.__crmDemandMasterReference){
          hideAccountDetails(d);
          rearmDependents(frame);
        }
      }catch(_e){}
    },120);
  });
}

function demandReady(frame){
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    return !!(
      w&&d&&
      d.getElementById('stage')&&
      w.PDFLib?.PDFDocument&&
      typeof w.makeDocumentPdf==='function'&&
      typeof w.drawHeader==='function'&&
      typeof w.drawFooter==='function'
    );
  }catch(_e){return false;}
}

function watch(frame,startedAt){
  if(!frame?.isConnected)return;
  const start=startedAt||Date.now();
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    if(w&&d&&d.getElementById('stage'))hideAccountDetails(d);
    if(demandReady(frame)){
      if(w.makeDocumentPdf.__crmDemandMasterReference)rearmDependents(frame);
      else activateExact(frame);
      if(!w.makeDocumentPdf.__crmDemandMasterReference||
         d.documentElement.dataset.crmDemandLivePdfPreview!=='1'||
         !w.makeDocumentPdf.__crmUserSafeErrorGuard){
        setTimeout(()=>watch(frame,start),POLL_MS);
      }
      return;
    }
  }catch(_e){}
  if(Date.now()-start<MAX_WAIT_MS)setTimeout(()=>watch(frame,start),POLL_MS);
}

function bind(frame){
  if(!frame||frame.dataset.sbDemandActivationBound==='1')return;
  frame.dataset.sbDemandActivationBound='1';
  frame.addEventListener('load',()=>watch(frame,Date.now()));
  watch(frame,Date.now());
}

function scan(){
  document.querySelectorAll(FRAME_SELECTOR).forEach(bind);
}

new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',scan,{passive:true});
scan();
})();
