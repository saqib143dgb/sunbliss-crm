(function(){
'use strict';
if(window.__sunblissWelcomeDocuments)return;window.__sunblissWelcomeDocuments=true;
let dialog=null,opening=false;
const TYPES={welcome:'Welcome Letter',receipt:'Payment Receipt',demand:'Demand Letter',soa:'SOA'};
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
#crmDocumentDialog{--doc-ink:#16232f;--doc-ink-2:#0f1a26;--doc-paper:#f6f1e4;--doc-paper-dim:#ebe3ce;--doc-paper-line:#dcd2b6;--doc-gold:#c6972e;--doc-gold-deep:#8f6a1e;--doc-cream:#ede6d6;--doc-cream-dim:#b9af9a;--doc-muted:#736c5c;padding:0;border:1px solid rgba(220,210,182,.34);width:96vw;max-width:1500px;height:94dvh;max-height:94dvh;border-radius:22px;background:var(--doc-paper);color:var(--doc-ink);overflow:hidden;box-shadow:0 28px 80px rgba(4,10,16,.42)}
#crmDocumentDialog::backdrop{background:rgba(4,10,16,.72);backdrop-filter:blur(4px)}
.document-dialog-bar{height:68px;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:12px 22px;background:var(--doc-ink-2);border-bottom:1px solid rgba(220,210,182,.16);color:var(--doc-cream)}
.document-dialog-title{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:'Fraunces',Georgia,serif;font-size:22px;font-weight:600;letter-spacing:-.01em}
.document-close{flex:none;min-height:40px;padding:8px 17px;background:rgba(255,255,255,.035);border:1px solid rgba(237,230,214,.44);color:var(--doc-cream);border-radius:999px;font-family:'Inter',system-ui,sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s ease,border-color .15s ease,transform .15s ease}
.document-close:hover{background:rgba(255,255,255,.09);border-color:rgba(198,151,46,.72)}
.document-close:active{transform:translateY(1px)}
.document-close:focus-visible,.document-options button:focus-visible{outline:2px solid var(--doc-gold);outline-offset:3px}
#crmDocumentDialog iframe{display:block;width:100%;height:calc(100% - 68px);border:0;background:var(--doc-paper)}
.document-options{height:calc(100% - 68px);overflow:auto;background:var(--doc-paper);padding:28px}
.document-options-grid{width:min(100%,980px);margin:0 auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.document-options button{position:relative;display:flex;align-items:center;justify-content:space-between;min-height:78px;padding:18px 22px 18px 27px;text-align:left;background:#fffdf7;color:var(--doc-ink);border:1px solid var(--doc-paper-line);border-radius:14px;box-shadow:0 1px 2px rgba(15,26,38,.07),0 8px 24px rgba(15,26,38,.055);font-family:'Inter',system-ui,sans-serif;font-size:16px;font-weight:600;line-height:1.3;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease,background .15s ease}
.document-options button::before{content:'';position:absolute;left:0;top:16px;bottom:16px;width:4px;border-radius:0 6px 6px 0;background:var(--doc-gold)}
.document-options button::after{content:'›';margin-left:18px;color:var(--doc-gold-deep);font-family:Georgia,serif;font-size:27px;font-weight:400;line-height:1}
.document-options button:hover{transform:translateY(-1px);background:#fffaf0;border-color:#cdbb8e;box-shadow:0 2px 4px rgba(15,26,38,.08),0 12px 28px rgba(15,26,38,.08)}
@media(max-width:700px){
  #crmDocumentDialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border:0;border-radius:0;margin:0}
  .document-dialog-bar{height:64px;padding:10px 16px}
  .document-dialog-title{font-size:19px}
  .document-close{min-height:38px;padding:7px 14px;font-size:13px}
  #crmDocumentDialog iframe{height:calc(100% - 64px)}
  .document-options{height:calc(100% - 64px);padding:18px 16px 28px}
  .document-options-grid{grid-template-columns:1fr;gap:12px}
  .document-options button{min-height:68px;padding:16px 18px 16px 23px;border-radius:13px;font-size:16px}
  .document-options button::before{top:14px;bottom:14px}
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
header{max-width:none!important;margin:0!important;padding:24px 28px 28px!important;background:var(--ink-2)!important;border-bottom:0!important;color:var(--cream)!important}
header>div{min-width:0}
header h1{margin:5px 0 0!important;color:var(--cream)!important;font-family:'Fraunces',Georgia,serif!important;font-size:29px!important;font-weight:600!important;line-height:1.12!important;letter-spacing:-.02em!important;text-transform:none!important}
header .eyebrow{color:var(--gold)!important;font-family:'IBM Plex Mono','SFMono-Regular',Consolas,monospace!important;font-size:11px!important;font-weight:600!important;letter-spacing:.15em!important;line-height:1.45!important}
header .badge{flex:none;padding:8px 15px!important;border:1px solid rgba(198,151,46,.7)!important;border-radius:999px!important;background:rgba(198,151,46,.055)!important;color:#e3c16f!important;font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;font-weight:600!important}
main{box-sizing:border-box!important;max-width:none!important;min-height:calc(100dvh - 112px)!important;margin:0!important;padding:26px 28px 34px!important;display:grid!important;grid-template-columns:minmax(300px,380px) minmax(0,1fr)!important;gap:26px!important;background:var(--paper)!important;border-radius:22px 22px 0 0!important;box-shadow:0 -1px 0 rgba(255,255,255,.025)!important}
.panel{background:var(--panel)!important;border:1px solid var(--paper-line)!important;border-radius:16px!important;padding:22px!important;margin-bottom:18px!important;box-shadow:var(--shadow)!important;color:var(--ink)!important}
h2{position:relative!important;margin:0 0 20px!important;padding:0 0 0 14px!important;border-left:4px solid var(--gold)!important;color:var(--ink)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:18px!important;font-weight:650!important;line-height:1.3!important;letter-spacing:-.01em!important}
label{display:block!important;margin-bottom:14px!important;color:var(--muted)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;font-weight:600!important;line-height:1.4!important}
input,select,textarea{display:block!important;width:100%!important;min-height:44px!important;margin-top:7px!important;padding:10px 12px!important;border:1px solid #d2c7aa!important;border-radius:10px!important;background:#fff!important;color:var(--ink)!important;box-shadow:inset 0 1px 1px rgba(15,26,38,.025)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:15px!important;line-height:1.4!important}
textarea{min-height:96px!important;resize:vertical!important}
input[readonly],select:disabled{background:var(--paper-dim)!important;color:#5d5a52!important;opacity:1!important}
input:focus,select:focus,textarea:focus,button:focus-visible{outline:2px solid var(--gold)!important;outline-offset:2px!important;border-color:var(--gold-deep)!important}
.row{gap:12px!important}
button{font-family:'Inter',system-ui,sans-serif!important}
.primary{width:100%!important;min-height:46px!important;margin-top:10px!important;padding:11px 16px!important;border:1px solid var(--gold)!important;border-radius:12px!important;background:var(--gold)!important;color:var(--ink-2)!important;box-shadow:0 5px 14px rgba(143,106,30,.16)!important;font-size:15px!important;font-weight:750!important;letter-spacing:.005em!important}
.primary:hover{background:#d0a23a!important}
.muted{color:var(--muted)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:12.5px!important;line-height:1.55!important}
#notice{min-height:22px!important;margin-top:12px!important;color:var(--gold-deep)!important;font-family:'Inter',system-ui,sans-serif!important;font-size:13px!important;font-weight:600!important}
.previewbar{margin-bottom:12px!important}
.previewbar h2{margin:0!important}
.paper-wrap{padding:18px!important;border:1px solid var(--paper-line)!important;border-radius:14px!important;background:var(--paper-dim)!important;box-shadow:inset 0 1px 2px rgba(15,26,38,.04)!important}
.doc{border-top:1px solid var(--paper-line)!important}
.doc button{border:1px solid #cdbf9b!important;background:#fff!important;color:var(--ink)!important}
.download-link{border-radius:12px!important}
@media(max-width:900px){
  header{padding:20px 20px 24px!important}
  header h1{font-size:27px!important}
  main{min-height:calc(100dvh - 102px)!important;padding:18px 16px 28px!important;grid-template-columns:1fr!important;gap:18px!important;border-radius:20px 20px 0 0!important}
  .panel{padding:18px!important;border-radius:14px!important}
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
  }catch(_e){}
}
function mount(){const c=current();if(!c)return;styles();document.getElementById('crmDocuments')?.remove();document.getElementById('actionGenerateDocument')?.remove();document.getElementById('btnPrintWelcomeLetter')?.remove();const old=document.getElementById('btnPrintStatement');if(old){const b=document.createElement('button');b.id='btnGenerateDocument';b.className='btn-paper';b.type='button';b.textContent='Generate Document';b.onclick=()=>open(c);old.replaceWith(b)}}
async function context(c){const unit=unwrap(await sb.from('units').select('id,customer_id,unit_no,unit_type,project_name,status').eq('id',c.sno).single());if(!unit.customer_id||unit.status==='Cancelled')throw Error('Select an active customer unit.');const [customer,transactions]=await Promise.all([sb.from('customers').select('id,customer_name').eq('id',unit.customer_id).single(),sb.from('payment_transactions').select('*').eq('unit_id',unit.id).eq('customer_id',unit.customer_id).gt('amount',0).order('payment_date',{ascending:true})]);const snapshot=JSON.parse(JSON.stringify(c));snapshot.paidPercent=window.__sunblissPaymentPercentageRules?window.__sunblissPaymentPercentageRules.progressPct(c):null;return {unit,customer:unwrap(customer),transactions:unwrap(transactions)||[],account:snapshot}}
async function open(c){
  if(dialog||opening)return;opening=true;const opener=document.activeElement;
  try{
    if(!['crm_officer','manager'].includes(state.userRole))throw Error('Please sign in with an authorized CRM account.');
    const ctx=await context(c);styles();dialog=document.createElement('dialog');dialog.id='crmDocumentDialog';dialog.setAttribute('aria-label','Generate Document');
    dialog.innerHTML='<div class="document-dialog-bar"><span class="document-dialog-title">Generate Document</span><button class="document-close" type="button">Close</button></div><div class="document-options"><div class="document-options-grid"></div></div>';
    document.body.append(dialog);let frame=null,kind=null;
    const handle=e=>{if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.channel!=='crm-welcome')return;if(e.data.action==='ready')frame.contentWindow.postMessage({channel:'crm-welcome',action:'init',context:{...ctx,documentType:kind}},location.origin)};
    window.addEventListener('message',handle);
    const close=()=>{window.removeEventListener('message',handle);dialog.close();dialog.remove();dialog=null;opener?.isConnected&&opener.focus()};
    dialog.querySelector('.document-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});
    const grid=dialog.querySelector('.document-options-grid');
    for(const [key,label] of Object.entries(TYPES)){
      const b=document.createElement('button');b.type='button';b.textContent=label;
      b.onclick=()=>{kind=key;dialog.querySelector('.document-dialog-title').textContent='Generate Document → '+label;dialog.querySelector('.document-options').remove();frame=document.createElement('iframe');frame.title=label+' generator';frame.src='welcome-letter.html';frame.addEventListener('load',()=>styleGeneratorFrame(frame));dialog.append(frame)};
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
