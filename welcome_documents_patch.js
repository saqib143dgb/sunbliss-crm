(function(){
'use strict';
if(window.__sunblissWelcomeDocuments)return;window.__sunblissWelcomeDocuments=true;
let dialog=null,opening=false;
const TYPES={welcome:'Welcome Letter',receipt:'Payment Receipt',soa:'SOA'};
const GENERATOR_STYLE_ID='crmDocumentGeneratorGlobalStyles';
function current(){return window.state&&state.view==='detail'&&(state.dues||[]).find(c=>c.unit+'::'+c.sno===state.selectedUnit)}
function unwrap(r){if(r.error)throw r.error;return r.data}
function styles(){
  if(document.getElementById('crmDocumentStyles'))return;
  const s=document.createElement('style');
  s.id='crmDocumentStyles';
  s.textContent=`
#btnGenerateDocument{width:100%;justify-content:center;margin-bottom:0;min-height:44px}
.detail>div:has(>#btnGenerateDocument){flex-wrap:wrap}
#crmDocumentDialog{--doc-ink:#16232f;--doc-paper:#f6f1e4;--doc-gold:#c6972e;box-sizing:border-box;padding:0;border:1px solid #dcd2b6;width:calc(100vw - 40px);max-width:600px;max-height:90dvh;border-radius:12px;background:var(--doc-paper);color:var(--doc-ink);overflow:hidden;box-shadow:0 24px 80px #040a1655}
#crmDocumentDialog.document-workspace{max-width:1500px;height:94dvh;max-height:94dvh}
#crmDocumentDialog::backdrop{background:rgba(4,10,16,.65);backdrop-filter:blur(3px)}
#crmDocumentDialog *{box-sizing:border-box}
.document-dialog-bar{height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 22px;background:#0f1a26;color:#ede6d6;border-bottom:2px solid #c6972e}
.document-dialog-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Fraunces',Georgia,serif;font-size:21px;font-weight:500}
.document-close,.document-back{flex:none;min-height:38px;padding:7px 12px;border:1px solid #ede6d655;border-radius:6px;background:transparent;color:inherit;font:14px 'Inter',system-ui,sans-serif;cursor:pointer}
.document-back[hidden]{display:none}
.document-back:hover,.document-close:hover{background:#ffffff12}
.document-close:focus-visible,.document-back:focus-visible,.document-options button:focus-visible{outline:2px solid var(--doc-gold);outline-offset:3px}
#crmDocumentDialog iframe{display:block;width:100%;height:calc(100% - 64px);border:0;background:var(--doc-paper)}
.document-options{overflow:auto;max-height:calc(90dvh - 64px);padding:24px}
.document-customer{margin:0 0 18px;color:#736c5c;font:14px/1.5 'Inter',system-ui,sans-serif;overflow-wrap:anywhere}
.document-options-grid{display:grid;gap:10px}
.document-options button{display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;min-height:76px;padding:16px 18px;text-align:left;background:#fffdf7;color:var(--doc-ink);border:1px solid #dcd2b6;border-radius:7px;font:16px/1.4 'Inter',system-ui,sans-serif;cursor:pointer;transition:background .15s,border-color .15s}
.document-option-label{display:block;font-weight:500}
.document-option-description{display:block;margin-top:4px;font-size:13px;font-weight:400;color:#736c5c}
.document-options button::after{content:'›';color:#8f6a1e;font:26px Georgia,serif}
.document-options button:hover{background:#fffaf0;border-color:#bba670}
@media(max-width:700px){
 #crmDocumentDialog{width:calc(100vw - 24px);border-radius:10px}
 #crmDocumentDialog.document-workspace{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border:0;border-radius:0;margin:0}
 .document-dialog-bar{padding:10px 14px;gap:8px}
 .document-dialog-title{font-size:18px}
 .document-options{padding:18px}
 .document-options button{padding:14px;min-height:72px}
 .document-back,.document-close{padding:7px 9px}
}
`;
  document.head.append(s);
}
function styleGeneratorFrame(frame){
  try{
    const d=frame.contentDocument;if(!d||!d.head)return;
    document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]').forEach(function(link){
      if(!d.querySelector('link[href="'+link.href+'"]'))d.head.appendChild(link.cloneNode(true));
    });
    if(d.getElementById(GENERATOR_STYLE_ID))return;
    const s=d.createElement('style');s.id=GENERATOR_STYLE_ID;
    s.textContent=`
:root{--ink:#16232f!important;--ink-2:#0f1a26;--panel:#fffdf7!important;--paper:#f6f1e4;--paper-dim:#ebe3ce;--paper-line:#dcd2b6;--gold:#c6972e!important;--gold-deep:#8f6a1e;--cream:#ede6d6!important;--cream-dim:#b9af9a;--muted:#736c5c;--shadow:0 1px 2px rgba(15,26,38,.08),0 8px 24px rgba(15,26,38,.06)}
html{background:var(--ink-2)}
body{margin:0!important;background:var(--ink-2)!important;color:var(--ink)!important;font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif!important}
header{display:none!important;max-width:none!important;margin:0!important;padding:24px 28px 28px!important;background:var(--ink-2)!important;border-bottom:0!important;color:var(--cream)!important}
header>div{min-width:0}
header h1{margin:5px 0 0!important;color:var(--cream)!important;font-family:'Fraunces',Georgia,serif!important;font-size:29px!important;font-weight:600!important;line-height:1.12!important;letter-spacing:-.02em!important;text-transform:none!important}
header .eyebrow{color:var(--gold)!important;font-family:'IBM Plex Mono','SFMono-Regular',Consolas,monospace!important;font-size:11px!important;font-weight:600!important;letter-spacing:.15em!important;line-height:1.45!important}
header .badge{flex:none;padding:8px 15px!important;border:1px solid rgba(198,151,46,.7)!important;border-radius:999px!important;background:rgba(198,151,46,.055)!important;color:#e3c16f!important;font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;font-weight:600!important}
main{box-sizing:border-box!important;max-width:none!important;min-height:100dvh!important;margin:0!important;padding:24px!important;display:grid!important;grid-template-columns:minmax(300px,380px) minmax(0,1fr)!important;gap:24px!important;background:var(--paper)!important;border-radius:0!important;box-shadow:0 -1px 0 rgba(255,255,255,.025)!important}
.panel{background:var(--panel)!important;border:1px solid var(--paper-line)!important;border-radius:8px!important;padding:22px!important;margin-bottom:18px!important;box-shadow:none!important;color:var(--ink)!important}
h2{position:relative!important;margin:0 0 20px!important;padding:0 0 12px!important;border-left:0!important;border-bottom:1px solid var(--paper-line)!important;color:var(--ink)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:18px!important;font-weight:650!important;line-height:1.3!important;letter-spacing:-.01em!important}
label{display:block!important;margin-bottom:14px!important;color:var(--muted)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:14px!important;font-weight:500!important;line-height:1.4!important}
input,select,textarea{display:block!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;min-height:44px!important;margin-top:7px!important;padding:10px 12px!important;border:1px solid #d2c7aa!important;border-radius:6px!important;background:#fff!important;color:var(--ink)!important;box-shadow:inset 0 1px 1px rgba(15,26,38,.025)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;line-height:1.4!important}
input[type="date"],input[type="datetime-local"],input[type="month"],input[type="time"]{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;inline-size:100%!important;max-inline-size:100%!important;min-inline-size:0!important;-webkit-min-logical-width:0!important;-webkit-appearance:none!important;appearance:none!important}
label,.row,.row>*{min-width:0!important;max-width:100%!important}
textarea{min-height:96px!important;resize:vertical!important}
input[readonly],select:disabled{background:var(--paper-dim)!important;color:#5d5a52!important;opacity:1!important}
input:focus,select:focus,textarea:focus,button:focus-visible{outline:2px solid var(--gold)!important;outline-offset:2px!important;border-color:var(--gold-deep)!important}
.row{gap:12px!important}
button{font-family:'Inter',system-ui,sans-serif!important}
.primary{width:100%!important;min-height:46px!important;margin-top:10px!important;padding:11px 16px!important;border:1px solid var(--gold)!important;border-radius:6px!important;background:var(--gold)!important;color:var(--ink-2)!important;box-shadow:none!important;font-size:15px!important;font-weight:600!important;letter-spacing:.005em!important}
.primary:hover{background:#d0a23a!important}
.muted{color:var(--muted)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:12.5px!important;line-height:1.55!important}
#notice{min-height:22px!important;margin-top:12px!important;color:var(--gold-deep)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;font-weight:600!important}
.previewbar{margin-bottom:12px!important}
.previewbar h2{margin:0!important}
.paper-wrap{padding:18px!important;border:1px solid var(--paper-line)!important;border-radius:8px!important;background:var(--paper-dim)!important;box-shadow:inset 0 1px 2px rgba(15,26,38,.04)!important}
.doc{border-top:1px solid var(--paper-line)!important}
.doc button{border:1px solid #cdbf9b!important;background:#fff!important;color:var(--ink)!important}
.download-link{border-radius:6px!important}
@media(max-width:900px){
  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="hidden"]),select,textarea{font-size:16px!important}
  header{padding:20px 20px 24px!important}
  header h1{font-size:27px!important}
  main{min-height:100dvh!important;padding:18px 16px 28px!important;grid-template-columns:1fr!important;gap:18px!important;border-radius:0!important}
  .panel{padding:18px!important;border-radius:8px!important}
  .row{grid-template-columns:1fr!important}
  .paper-wrap{padding:9px!important}
}
@media(max-width:520px){
  header{align-items:flex-start!important;gap:14px!important}
  header .badge{margin-top:2px!important;padding:7px 11px!important;font-size:12px!important}
  header h1{font-size:25px!important}
  main{padding-left:14px!important;padding-right:14px!important}
}
@media print{body{background:#fff!important}main{background:#fff!important;border-radius:0!important;padding:0!important}}
`;
    d.head.appendChild(s);
    /* iOS Safari can keep an intrinsic minimum width on native date controls.
       Fit date-like controls to the exact width of their own form field, without
       changing the document-generator theme or any other control styling. */
    const fitDateFields=function(){
      d.querySelectorAll('input[type="date"],input[type="datetime-local"],input[type="month"],input[type="time"]').forEach(function(input){
        const host=input.parentElement;
        if(!host)return;
        const available=Math.floor(host.getBoundingClientRect().width);
        if(!available)return;
        input.style.setProperty('box-sizing','border-box','important');
        input.style.setProperty('min-width','0','important');
        input.style.setProperty('max-width',available+'px','important');
        input.style.setProperty('width',available+'px','important');
        input.style.setProperty('inline-size',available+'px','important');
        input.style.setProperty('-webkit-appearance','none','important');
        input.style.setProperty('appearance','none','important');
      });
    };
    fitDateFields();
    const dateObserver=new MutationObserver(function(){requestAnimationFrame(fitDateFields);});
    if(d.body)dateObserver.observe(d.body,{childList:true,subtree:true,attributes:true,attributeFilter:['type','class','style']});
    frame.contentWindow.addEventListener('resize',fitDateFields,{passive:true});
    setTimeout(fitDateFields,50);
  }catch(_e){}
}
function mount(){const c=current();if(!c)return;styles();document.getElementById('crmDocuments')?.remove();document.getElementById('actionGenerateDocument')?.remove();document.getElementById('btnPrintWelcomeLetter')?.remove();const old=document.getElementById('btnPrintStatement');if(old){const b=document.createElement('button');b.id='btnGenerateDocument';b.className='btn-paper';b.type='button';b.textContent='Generate Document';b.onclick=()=>open(c);old.replaceWith(b)}}
async function context(c){const unit=unwrap(await sb.from('units').select('id,customer_id,unit_no,unit_type,project_name,status').eq('id',c.sno).single());if(!unit.customer_id||unit.status==='Cancelled')throw Error('Select an active customer unit.');const [customer,transactions]=await Promise.all([sb.from('customers').select('id,customer_name').eq('id',unit.customer_id).single(),sb.from('payment_transactions').select('*').eq('unit_id',unit.id).eq('customer_id',unit.customer_id).gt('amount',0).order('payment_date',{ascending:true})]);const snapshot=JSON.parse(JSON.stringify(c));snapshot.paidPercent=window.__sunblissPaymentPercentageRules?window.__sunblissPaymentPercentageRules.progressPct(c):null;return {unit,customer:unwrap(customer),transactions:unwrap(transactions)||[],account:snapshot}}
async function open(c){
  if(dialog||opening)return;opening=true;const opener=document.activeElement;
  try{
    if(!['crm_officer','manager'].includes(state.userRole))throw Error('Please sign in with an authorized CRM account.');
    const ctx=await context(c);styles();dialog=document.createElement('dialog');dialog.id='crmDocumentDialog';dialog.setAttribute('aria-label','Generate Document');
    dialog.innerHTML='<div class="document-dialog-bar"><button class="document-back" type="button" hidden aria-label="Back to document list">‹ Back</button><span class="document-dialog-title">Generate Document</span><button class="document-close" type="button">Close</button></div><div class="document-options"><p class="document-customer"></p><div class="document-options-grid"></div></div>';
    document.body.append(dialog);let frame=null,kind=null;
    const handle=e=>{if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.channel!=='crm-welcome')return;if(e.data.action==='ready')frame.contentWindow.postMessage({channel:'crm-welcome',action:'init',context:{...ctx,documentType:kind}},location.origin)};
    window.addEventListener('message',handle);
    const close=()=>{window.removeEventListener('message',handle);dialog.close();dialog.remove();dialog=null;opener?.isConnected&&opener.focus()};
    dialog.querySelector('.document-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
    dialog.querySelector('.document-customer').textContent=ctx.customer.customer_name+' · '+ctx.unit.unit_no;
    const options=dialog.querySelector('.document-options');
    const back=dialog.querySelector('.document-back');
    const descriptions={welcome:'Customer welcome and payment acknowledgement',receipt:'Receipt for a recorded payment',soa:'Statement of account and payment history'};
    back.onclick=()=>{frame?.remove();frame=null;kind=null;dialog.classList.remove('document-workspace');options.hidden=false;back.hidden=true;dialog.querySelector('.document-dialog-title').textContent='Generate Document';grid.querySelector('button')?.focus()};
    const grid=dialog.querySelector('.document-options-grid');
    for(const [key,label] of Object.entries(TYPES)){
      const b=document.createElement('button');b.type='button';b.innerHTML='<span><span class="document-option-label">'+label+'</span><span class="document-option-description">'+descriptions[key]+'</span></span>';
      b.onclick=()=>{kind=key;dialog.querySelector('.document-dialog-title').textContent=key==='soa'?'Statement of Account':label;options.hidden=true;back.hidden=false;dialog.classList.add('document-workspace');back.focus();frame=document.createElement('iframe');frame.title=label+' generator';frame.src='welcome-letter.html';frame.addEventListener('load',()=>styleGeneratorFrame(frame));dialog.append(frame)};
      grid.append(b);
    }
    dialog.showModal();
  }catch(e){alert(e.message||'Could not open document generator.')}finally{opening=false}
}
function install(){if(!window.state||!window.sb||typeof window.renderDetail!=='function'||!window.__sunblissCustomerActionMenuInstalled){setTimeout(install,80);return}const previous=window.renderDetail;window.renderDetail=function(){const result=previous.apply(this,arguments);mount();return result};mount()}
install();
})();

/* Approved section-title framing: style-only DOM grouping, no text changes. */
(function(){
'use strict';
if(window.__sunblissSectionFrames)return;window.__sunblissSectionFrames=true;
var queued=false,running=false;
function excluded(h){return !!h.closest('.sbx-section-frame,.stat-hero,.kpi-card,.kpi-tile,.summary-card,.summary-tile');}
function stopNode(n){return !n||n.classList.contains('section-label')||n.classList.contains('footnote')||n.classList.contains('tabs');}
function frameHeading(h){
  if(!h||!h.isConnected||excluded(h)||h.dataset.sbxSectionFramed==='1')return;
  var parent=h.parentElement;if(!parent||parent.classList.contains('sbx-section-body'))return;
  var nodes=[],n=h.nextElementSibling;
  while(n&&!stopNode(n)){nodes.push(n);n=n.nextElementSibling;}
  if(!nodes.length)return;
  var frame=document.createElement('section');frame.className='sbx-section-frame';
  var body=document.createElement('div');body.className='sbx-section-body';
  parent.insertBefore(frame,h);frame.appendChild(h);frame.appendChild(body);
  for(var i=0;i<nodes.length;i++)body.appendChild(nodes[i]);
  h.dataset.sbxSectionFramed='1';
}
function apply(){
  queued=false;if(running)return;running=true;
  try{var root=document.getElementById('main');if(!root)return;var headings=root.querySelectorAll('.section-label');for(var i=0;i<headings.length;i++)frameHeading(headings[i]);}
  finally{running=false;}
}
function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply);}
var observer=new MutationObserver(schedule);
function installFrames(){var main=document.getElementById('main');if(!main){setTimeout(installFrames,80);return;}observer.observe(main,{childList:true,subtree:true});schedule();}
installFrames();
})();
