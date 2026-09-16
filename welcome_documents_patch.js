(function(){
'use strict';
if(window.__sunblissWelcomeDocuments)return;window.__sunblissWelcomeDocuments=true;
let dialog=null,opening=false;
const TYPES={welcome:'Welcome Letter',receipt:'Payment Receipt',demand:'Demand Letter',soa:'SOA'};
function current(){return window.state&&state.view==='detail'&&(state.dues||[]).find(c=>c.unit+'::'+c.sno===state.selectedUnit)}
function unwrap(r){if(r.error)throw r.error;return r.data}
function styles(){if(document.getElementById('crmDocumentStyles'))return;const s=document.createElement('style');s.id='crmDocumentStyles';s.textContent=`#btnGenerateDocument{width:100%;justify-content:center;margin-bottom:0;min-height:44px}.detail>div:has(>#btnGenerateDocument){flex-wrap:wrap}#crmDocumentDialog{padding:0;border:1px solid #34414c;width:96vw;max-width:1500px;height:94dvh;max-height:94dvh;border-radius:12px;background:#0f1a26;color:#ede6d6;overflow:hidden}#crmDocumentDialog::backdrop{background:#0009}.document-dialog-bar{height:52px;display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid #34414c;font:15px Arial}#crmDocumentDialog iframe{width:100%;height:calc(100% - 52px);border:0}.document-close{padding:7px 14px;background:transparent;border:1px solid #777;color:#ede6d6;border-radius:6px}.document-options{padding:24px;display:grid;gap:14px}.document-options button{padding:18px;text-align:left;background:#16232f;color:#ede6d6;border:1px solid #786032;border-radius:8px;font:16px Arial}@media(max-width:700px){#crmDocumentDialog{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;border-radius:0;margin:0}}`;document.head.append(s)}
function mount(){const c=current();if(!c)return;styles();document.getElementById('crmDocuments')?.remove();document.getElementById('actionGenerateDocument')?.remove();document.getElementById('btnPrintWelcomeLetter')?.remove();const old=document.getElementById('btnPrintStatement');if(old){const b=document.createElement('button');b.id='btnGenerateDocument';b.className='btn-paper';b.type='button';b.textContent='Generate Document';b.onclick=()=>open(c);old.replaceWith(b)}}
async function context(c){const unit=unwrap(await sb.from('units').select('id,customer_id,unit_no,unit_type,project_name,status').eq('id',c.sno).single());if(!unit.customer_id||unit.status==='Cancelled')throw Error('Select an active customer unit.');const [customer,transactions]=await Promise.all([sb.from('customers').select('id,customer_name').eq('id',unit.customer_id).single(),sb.from('payment_transactions').select('*').eq('unit_id',unit.id).eq('customer_id',unit.customer_id).gt('amount',0).order('payment_date',{ascending:true})]);const snapshot=JSON.parse(JSON.stringify(c));snapshot.paidPercent=window.__sunblissPaymentPercentageRules?window.__sunblissPaymentPercentageRules.progressPct(c):null;return {unit,customer:unwrap(customer),transactions:unwrap(transactions)||[],account:snapshot}}
async function open(c){if(dialog||opening)return;opening=true;const opener=document.activeElement;try{if(!['crm_officer','manager'].includes(state.userRole))throw Error('Please sign in with an authorized CRM account.');const ctx=await context(c);styles();dialog=document.createElement('dialog');dialog.id='crmDocumentDialog';dialog.setAttribute('aria-label','Generate Document');dialog.innerHTML='<div class="document-dialog-bar"><span>Generate Document</span><button class="document-close" type="button">Close</button></div><div class="document-options"></div>';document.body.append(dialog);let frame=null,kind=null;const handle=e=>{if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.channel!=='crm-welcome')return;if(e.data.action==='ready')frame.contentWindow.postMessage({channel:'crm-welcome',action:'init',context:{...ctx,documentType:kind}},location.origin)};window.addEventListener('message',handle);const close=()=>{window.removeEventListener('message',handle);dialog.close();dialog.remove();dialog=null;opener?.isConnected&&opener.focus()};dialog.querySelector('button').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close()});for(const [key,label] of Object.entries(TYPES)){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{kind=key;dialog.querySelector('.document-dialog-bar span').textContent='Generate Document → '+label;dialog.querySelector('.document-options').remove();frame=document.createElement('iframe');frame.title=label+' generator';frame.src='welcome-letter.html';dialog.append(frame)};dialog.querySelector('.document-options').append(b)}dialog.showModal()}catch(e){alert(e.message||'Could not open document generator.')}finally{opening=false}}
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
