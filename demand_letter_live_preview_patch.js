(function(){
'use strict';
if(window.__sunblissDemandLivePdfPreview)return;
window.__sunblissDemandLivePdfPreview=true;

const FRAME_SELECTOR='#crmDocumentDialog iframe[src*="welcome-letter.html"]';
const STYLE_ID='sunblissDemandLivePdfPreviewStyles';
const PDFJS_SRC='vendor/pdf.min.js';
const PDFJS_WORKER='vendor/pdf.worker.min.js';

function install(frame,attempt=0){
  try{
    const w=frame.contentWindow,d=frame.contentDocument;
    if(!w||!d)return;
    const stage=d.getElementById('stage');
    const form=d.getElementById('details');
    const letter=d.getElementById('letter');
    if(!stage||!form||!letter||typeof w.makeDocumentPdf!=='function'||!w.makeDocumentPdf.__crmDemandMasterReference){
      if(attempt<120)setTimeout(()=>install(frame,attempt+1),75);
      return;
    }
    if(d.documentElement.dataset.crmDemandLivePdfPreview==='1')return;
    d.documentElement.dataset.crmDemandLivePdfPreview='1';
    installStyles(d);

    let timer=null;
    let renderToken=0;
    const schedule=()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>renderPreview(frame,++renderToken),180);
    };

    form.addEventListener('input',schedule);
    form.addEventListener('change',schedule);
    w.addEventListener('resize',schedule,{passive:true});
    w.addEventListener('orientationchange',schedule,{passive:true});
    schedule();
  }catch(_e){
    if(attempt<120)setTimeout(()=>install(frame,attempt+1),75);
  }
}

function installStyles(d){
  if(d.getElementById(STYLE_ID))return;
  const style=d.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
#letter.crm-demand-live-pdf-preview{
  width:100%!important;
  max-width:100%!important;
  min-height:0!important;
  aspect-ratio:auto!important;
  margin:0 auto!important;
  padding:0!important;
  background:transparent!important;
  background-image:none!important;
  box-shadow:none!important;
  overflow:visible!important;
}
.crm-demand-preview-pages{
  width:100%;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:14px;
}
.crm-demand-preview-page{
  width:100%;
  max-width:794px;
  background:#fff;
  border:1px solid rgba(15,26,38,.14);
  border-radius:2px;
  box-shadow:0 7px 24px rgba(15,26,38,.12);
  overflow:hidden;
}
.crm-demand-preview-page canvas{
  display:block;
  width:100%;
  height:auto;
  background:#fff;
}
.crm-demand-preview-placeholder{
  width:100%;
  max-width:794px;
  min-height:180px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:28px;
  box-sizing:border-box;
  border:1px dashed #c8b98e;
  border-radius:12px;
  background:#fffdf7;
  color:#736c5c;
  text-align:center;
  font:600 13px/1.55 'Inter',system-ui,sans-serif;
}
@media(max-width:900px){
  #letter.crm-demand-live-pdf-preview{width:100%!important;}
  .crm-demand-preview-pages{gap:10px;}
  .crm-demand-preview-page{max-width:100%;box-shadow:0 4px 14px rgba(15,26,38,.1);}
  .crm-demand-preview-placeholder{min-height:130px;padding:20px 16px;}
}
`;
  d.head.appendChild(style);
}

async function ensurePdfJs(w,d){
  if(w.pdfjsLib?.getDocument){
    w.pdfjsLib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
    return w.pdfjsLib;
  }
  if(w.__sunblissPdfJsLoading)return w.__sunblissPdfJsLoading;
  w.__sunblissPdfJsLoading=new Promise((resolve,reject)=>{
    const existing=d.querySelector('script[data-sb-demand-pdfjs="1"]');
    if(existing){
      existing.addEventListener('load',()=>resolve(w.pdfjsLib),{once:true});
      existing.addEventListener('error',()=>reject(new Error('Preview renderer failed to load.')),{once:true});
      return;
    }
    const script=d.createElement('script');
    script.src=PDFJS_SRC;
    script.dataset.sbDemandPdfjs='1';
    script.onload=()=>resolve(w.pdfjsLib);
    script.onerror=()=>reject(new Error('Preview renderer failed to load.'));
    d.head.appendChild(script);
  }).then(lib=>{
    if(!lib?.getDocument)throw new Error('Preview renderer is unavailable.');
    lib.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
    return lib;
  });
  return w.__sunblissPdfJsLoading;
}

function setPlaceholder(d,text){
  const letter=d.getElementById('letter');
  if(!letter)return;
  letter.className='paper crm-demand-live-pdf-preview';
  letter.style.backgroundImage='none';
  letter.innerHTML='<div class="crm-demand-preview-placeholder"></div>';
  const box=letter.querySelector('.crm-demand-preview-placeholder');
  if(box)box.textContent=text;
}

async function renderPreview(frame,token){
  const w=frame.contentWindow,d=frame.contentDocument;
  if(!w||!d)return;
  const stage=d.getElementById('stage');
  if(!stage||stage.value===''){
    setPlaceholder(d,'Select an installment to preview the Demand Letter.');
    return;
  }
  try{
    const pdfjs=await ensurePdfJs(w,d);
    const blob=await w.makeDocumentPdf();
    if(!blob||typeof blob.arrayBuffer!=='function')throw new Error('No PDF data returned.');
    const bytes=new Uint8Array(await blob.arrayBuffer());
    const pdf=await pdfjs.getDocument({data:bytes}).promise;
    if(token!==currentToken(d))return;

    const letter=d.getElementById('letter');
    if(!letter)return;
    const pages=d.createElement('div');
    pages.className='crm-demand-preview-pages';

    for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
      const pdfPage=await pdf.getPage(pageNo);
      if(token!==currentToken(d))return;
      const base=pdfPage.getViewport({scale:1});
      const available=Math.max(280,Math.min(794,letter.parentElement?.clientWidth||794));
      const cssScale=Math.min(1,available/base.width);
      const pixelRatio=Math.min(2,Math.max(1,w.devicePixelRatio||1));
      const renderScale=Math.max(1.35,cssScale*pixelRatio);
      const viewport=pdfPage.getViewport({scale:renderScale});
      const wrap=d.createElement('div');
      wrap.className='crm-demand-preview-page';
      const canvas=d.createElement('canvas');
      canvas.width=Math.ceil(viewport.width);
      canvas.height=Math.ceil(viewport.height);
      canvas.setAttribute('aria-label','Demand Letter page '+pageNo+' of '+pdf.numPages);
      wrap.appendChild(canvas);
      pages.appendChild(wrap);
      const ctx=canvas.getContext('2d',{alpha:false});
      await pdfPage.render({canvasContext:ctx,viewport}).promise;
    }

    if(token!==currentToken(d))return;
    letter.className='paper crm-demand-live-pdf-preview';
    letter.style.backgroundImage='none';
    letter.replaceChildren(pages);
  }catch(err){
    console.error('[Sunbliss CRM] Demand Letter preview rendering failed.',err);
    setPlaceholder(d,'Preview unavailable. You can still generate and download the Demand Letter.');
  }
}

function currentToken(d){
  return Number(d.documentElement.dataset.crmDemandPreviewToken||0);
}

function scan(){
  document.querySelectorAll(FRAME_SELECTOR).forEach(frame=>{
    const d=frame.contentDocument;
    if(d&&d.documentElement){
      const originalInstallState=d.documentElement.dataset.crmDemandLivePdfPreview;
      if(originalInstallState!=='1')install(frame,0);
      const form=d.getElementById('details');
      if(form&&!form.dataset.sbDemandPreviewTokenSync){
        form.dataset.sbDemandPreviewTokenSync='1';
        const bump=()=>{d.documentElement.dataset.crmDemandPreviewToken=String((Number(d.documentElement.dataset.crmDemandPreviewToken||0)+1));};
        form.addEventListener('input',bump,{capture:true});
        form.addEventListener('change',bump,{capture:true});
        bump();
      }
    }
    if(frame.dataset.sbDemandPreviewLoadBound!=='1'){
      frame.dataset.sbDemandPreviewLoadBound='1';
      frame.addEventListener('load',()=>install(frame,0));
    }
  });
}

const observer=new MutationObserver(scan);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',scan,{passive:true});
scan();
})();
