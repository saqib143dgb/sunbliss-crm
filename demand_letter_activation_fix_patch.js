(function(){
'use strict';
if(window.__sunblissDemandActivationFix)return;
window.__sunblissDemandActivationFix=true;

const FRAME_SELECTOR='#crmDocumentDialog iframe[src*="welcome-letter.html"], iframe[src*="welcome-letter.html"]';
const MAX_ATTEMPTS=240;
const RETRY_MS=100;
const BANK={
  name:'Bank of Baroda',
  holder:'Sunbliss Residences by Purvanchal Real Estate Developers',
  address1:'Deira Dubai, Deira Branch, P.O. Box 5107, Kuwait Building,',
  address2:'Plot No. 45, Bur Dubai, UAE',
  account:'90030200025144',
  iban:'AE370110090030200025144',
  swift:'BARBAEADDEI'
};

function bankDetailsText(){
  return [
    'Escrow Account Details:',
    'Bank Name: '+BANK.name,
    'Account Holder: '+BANK.holder,
    'Bank Address: '+BANK.address1+' '+BANK.address2,
    'Account Number: '+BANK.account,
    'IBAN: '+BANK.iban,
    'SWIFT Code: '+BANK.swift
  ].join('\n');
}

function numberValue(v){
  const n=Number(String(v??0).replace(/[^0-9.-]/g,''));
  return Number.isFinite(n)?n:0;
}

function iframeContext(w){
  try{return w.eval('crmContext')||null}catch(_e){return null}
}

function bridgeHelper(w,name){
  if(typeof w[name]==='function')return true;
  try{
    const fn=w.eval(name);
    if(typeof fn==='function'){
      w[name]=fn;
      return true;
    }
  }catch(_e){}
  return false;
}

function generationButton(d){
  return d.getElementById('generate');
}

function setReadyState(d,ready){
  const button=generationButton(d);
  const notice=d.getElementById('notice');
  if(button)button.disabled=!ready;
  if(!ready){
    if(notice&&!/Generating PDF|PDF ready/i.test(notice.textContent||'')){
      notice.textContent='Preparing Demand Letter renderer…';
    }
  }else if(notice&&/Preparing Demand Letter renderer/i.test(notice.textContent||'')){
    notice.textContent='';
  }
}

function normalizeDemandState(w,d){
  const ctx=iframeContext(w);
  const account=ctx?.account;
  if(account){
    const total=numberValue(account.total ?? ctx?.customer?.total ?? ctx?.customer?.unitValue);
    const received=numberValue(account.cashReceived ?? account.received ?? ctx?.customer?.received);
    if(total>0)account.outstanding=Math.max(0,total-received);
  }
  const accountDetails=d.getElementById('accountDetails');
  if(accountDetails){
    accountDetails.required=false;
    accountDetails.value=bankDetailsText();
    const label=accountDetails.closest('label');
    if(label)label.style.display='none';
  }
}

function rendererIsActive(w){
  return !!(w?.makeDocumentPdf&&w.makeDocumentPdf.__crmDemandMasterReference===true);
}

function blockLegacyDemandGenerator(w){
  if(rendererIsActive(w)||typeof w.makeDocumentPdf!=='function'||w.makeDocumentPdf.__sbLegacyDemandBlocked)return;
  const blocked=async function(){
    throw new Error('Demand Letter renderer could not complete safely. Close Generate Document, reopen it, and try again.');
  };
  blocked.__sbLegacyDemandBlocked=true;
  w.makeDocumentPdf=blocked;
}

function installSubmitGuard(w,d){
  const form=d.getElementById('details');
  if(!form||form.dataset.sbDemandActivationSubmitGuard==='1')return;
  form.dataset.sbDemandActivationSubmitGuard='1';
  form.addEventListener('submit',event=>{
    if(rendererIsActive(w))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setReadyState(d,false);
    const notice=d.getElementById('notice');
    if(notice)notice.textContent='Preparing Demand Letter renderer. Please try again in a moment.';
    setTimeout(scan,0);
  },true);
}

function markActive(w,d){
  d.documentElement.dataset.crmDemandMasterReference='1';
  d.documentElement.dataset.crmDemandRendererStatus='active';
  w.__sunblissDemandRendererActivated=true;
  setReadyState(d,true);
}

function nudgeReferencePatch(){
  try{
    const marker=document.createComment('sunbliss-demand-activation');
    document.documentElement.appendChild(marker);
    marker.remove();
  }catch(_e){}
}

function reloadReferencePatchOnce(){
  if(window.__sunblissDemandActivationReloaded)return;
  window.__sunblissDemandActivationReloaded=true;
  window.__sunblissDemandReferenceMatchV2=false;
  const script=document.createElement('script');
  script.src='demand_letter_reference_match_patch.js?activation='+Date.now();
  script.dataset.sbDemandActivationReload='1';
  script.onload=()=>setTimeout(scan,0);
  script.onerror=()=>console.error('[Sunbliss CRM] Unable to reload Demand Letter reference renderer.');
  document.body.appendChild(script);
}

function activate(frame,attempt=0){
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d){
      if(attempt<MAX_ATTEMPTS)setTimeout(()=>activate(frame,attempt+1),RETRY_MS);
      return;
    }

    const stage=d.getElementById('stage');
    if(!stage||!w.PDFLib?.PDFDocument||typeof w.makeDocumentPdf!=='function'){
      if(attempt<MAX_ATTEMPTS)setTimeout(()=>activate(frame,attempt+1),RETRY_MS);
      return;
    }

    installSubmitGuard(w,d);
    setReadyState(d,false);
    normalizeDemandState(w,d);
    bridgeHelper(w,'drawHeader');
    bridgeHelper(w,'drawFooter');

    if(rendererIsActive(w)){
      markActive(w,d);
      return;
    }

    blockLegacyDemandGenerator(w);

    if(d.documentElement.dataset.crmDemandMasterReference==='1'){
      delete d.documentElement.dataset.crmDemandMasterReference;
    }

    if(attempt===0)reloadReferencePatchOnce();
    nudgeReferencePatch();

    setTimeout(()=>{
      try{
        normalizeDemandState(w,d);
        bridgeHelper(w,'drawHeader');
        bridgeHelper(w,'drawFooter');
        if(rendererIsActive(w)){
          markActive(w,d);
          return;
        }
        if(attempt<MAX_ATTEMPTS)activate(frame,attempt+1);
        else{
          d.documentElement.dataset.crmDemandRendererStatus='failed';
          setReadyState(d,false);
          const notice=d.getElementById('notice');
          if(notice)notice.textContent='Demand Letter renderer could not initialize. Close Generate Document and reopen it.';
          console.error('[Sunbliss CRM] Demand Letter exact renderer did not activate.');
        }
      }catch(err){
        if(attempt<MAX_ATTEMPTS)setTimeout(()=>activate(frame,attempt+1),RETRY_MS);
        else{
          setReadyState(d,false);
          console.error('[Sunbliss CRM] Demand Letter activation guard failed.',err);
        }
      }
    },RETRY_MS);
  }catch(err){
    if(attempt<MAX_ATTEMPTS)setTimeout(()=>activate(frame,attempt+1),RETRY_MS);
    else console.error('[Sunbliss CRM] Demand Letter activation guard failed.',err);
  }
}

function bindFrame(frame){
  activate(frame,0);
  if(frame.dataset.sbDemandActivationLoadBound!=='1'){
    frame.dataset.sbDemandActivationLoadBound='1';
    frame.addEventListener('load',()=>activate(frame,0));
  }
}

function scan(){
  document.querySelectorAll(FRAME_SELECTOR).forEach(bindFrame);
}

const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',scan,{passive:true});
window.addEventListener('message',event=>{
  if(event?.data?.channel==='crm-welcome'&&event?.data?.action==='ready'){
    setTimeout(scan,0);
    setTimeout(scan,150);
    setTimeout(scan,500);
    setTimeout(scan,1200);
  }
});
scan();
})();