(function(){
'use strict';
if(window.__customerHistoryInstalled)return;
window.__customerHistoryInstalled=true;
// Email-only Customer History. Legacy CRM activity data and task ledgers remain unchanged.
var openVersion=0,viewMode='installment',directionFilter='all',searchValue='',openGroups={};
function val(x){return String(x===null||x===undefined?'':x).trim();}
function safe(x){return val(x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cunit(){var s=window.state;if(!s)return null;return (s.dues||[]).find(function(c){return c.unit+'::'+c.sno===s.selectedUnit;})||null;}
function allowed(){return !!(window.state&&['manager','crm_officer'].indexOf(state.userRole)>=0);}
function timeValue(x){var n=Date.parse(val(x));return isNaN(n)?0:n;}
function when(x){var d=new Date(x);if(isNaN(d.getTime()))return 'Date unavailable';return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Dubai'})+' · '+d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dubai'});}
function cap(v){return val(v).replace(/_/g,' ').replace(/\b\w/g,function(x){return x.toUpperCase();});}
function shortSubject(s){return val(s).replace(/^(re:|fw:|fwd:)\s*/ig,'');}
function isNested(e){return /^(re:|fw:|fwd:)/i.test(val(e.subject))||/request|re.request|extension|approval|approved|reject|reminder|follow.up|decision|commitment|response|reply/i.test(val(e.title)+' '+val(e.activity_type));}
function isSpa(e){return e.activity_type==='spa_correspondence'||/\bspa\b[\s-]*(?:signing|invitation|execution|agreement|contract|signature)|\binvitation\b.{0,30}\bspa\b|\bsales?\s*(?:and|&)\s*purchase\s*agreement\b/i.test(val(e.title)+' '+val(e.subject));}
function isWelcome(e){return e.activity_type==='welcome_letter'||/booking confirmation|welcome letter/i.test(e.title);}
function isDownPayment(e){return /\bdown[\s-]*payment\b|\bbooking[\s-]*(?:amount|payment|fee)\b/i.test(val(e.title)+' '+val(e.subject));}
function stagePosition(n){var name=val(n).toLowerCase();if(/\bdown\s+payment\b/.test(name))return 10;if(/^1st\s+instal/.test(name))return 20;if(/^dld\b|^admin\b/.test(name))return 25;if(/^([2-9])(nd|rd|th)\s+instal/.test(name)){var m=name.match(/^([2-9])/);return 20+10*Number(m[1]);}if(/^final/.test(name))return 150;return 160;}
function isInstallmentSubject(e){return ['demand_letter','gentle_reminder','payment_receipt','payment_follow_up','customer_reply','extension_requested','extension_forwarded','extension_approved','extension_approved_conditional','extension_rejected','extension_rerequested','management_decision_sent','extension_customer_accepted','extension_customer_declined','payment_commitment','credit_note_sent'].indexOf(e.activity_type)>=0||/instal(l)?ment|payment|extension|credit note|demand letter/i.test(e.subject);}
function close(){openVersion++;var p=document.getElementById('customerHistoryPanel');if(p)p.remove();document.body.classList.remove('customer-history-open');}
function styles(){
 if(document.getElementById('customerEmailHistoryStyle'))return;
 var x=document.createElement('style');x.id='customerEmailHistoryStyle';
 x.textContent=[
 '#customerHistoryPanel{position:fixed;inset:0;z-index:16050;overflow-y:auto;overflow-x:hidden;background:var(--paper,#F7F3EA);color:var(--ink,#242728);font-family:Inter,CRMInter,Arial,sans-serif;padding:0 18px calc(50px + env(safe-area-inset-bottom));box-sizing:border-box}',
 '#customerHistoryPanel *{box-sizing:border-box}',
 'body.customer-history-open{overflow:hidden}',
 '#customerHistoryPanel .ch-shell{max-width:960px;margin:0 auto;padding:24px 0}',
 '#customerHistoryPanel .ch-header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:20px}',
 '#customerHistoryPanel h2{margin:0;font:700 24px/1.2 Inter,CRMInter,sans-serif;letter-spacing:-.025em;color:var(--ink)}',
 '#customerHistoryPanel .ch-sub{color:var(--muted,#697072);font-size:12px;line-height:1.5;margin:6px 0 0}',
 '#customerHistoryPanel .ch-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;min-height:36px;padding:8px 13px;border:1px solid var(--paper-line,#dcd6c9);border-radius:999px;background:var(--paper-bright,#fffdf9);color:var(--ink);font:600 11px/1.25 Inter,CRMInter,sans-serif;white-space:nowrap}',
 '#customerHistoryPanel .ch-btn:focus-visible,#customerHistoryPanel summary:focus-visible{outline:2px solid var(--gold-deep,#a78243);outline-offset:3px}',
 '#customerHistoryPanel .ch-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:0 0 15px}',
 '#customerHistoryPanel .ch-metric{border:1px solid var(--paper-line,#dcd6c9);border-radius:12px;background:var(--paper-bright,#fffdf9);padding:13px 15px}',
 '#customerHistoryPanel .ch-metric strong{font:700 20px/1.2 Inter,CRMInter,sans-serif;display:block;color:var(--ink);font-variant-numeric:tabular-nums}',
 '#customerHistoryPanel .ch-metric span{display:block;margin-top:5px;color:var(--muted);font:500 11px/1.35 Inter,CRMInter,sans-serif}',
 '#customerHistoryPanel .ch-controls{display:grid;gap:11px;margin:0 0 15px}',
 '#customerHistoryPanel .ch-segments{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid var(--paper-line,#dcd6c9);border-radius:999px;background:var(--paper-bright,#fffdf9);padding:3px;gap:3px}',
 '#customerHistoryPanel .ch-segments button{border:0;border-radius:999px;background:transparent;min-height:35px;font:650 12px/1.2 Inter,CRMInter,sans-serif;color:var(--muted);cursor:pointer}',
 '#customerHistoryPanel .ch-segments button[aria-pressed=true]{background:var(--ink,#333839);color:var(--paper-bright,#fffdf9)}',
 '#customerHistoryPanel .ch-filterrow{display:flex;align-items:center;justify-content:space-between;gap:10px}',
 '#customerHistoryPanel .ch-dir{display:flex;gap:4px;min-width:0;flex-wrap:wrap}',
 '#customerHistoryPanel .ch-dir button{min-height:31px;padding:7px 11px;border:1px solid var(--paper-line,#dcd6c9);border-radius:999px;font:600 10.8px Inter,CRMInter,sans-serif;color:var(--muted);background:var(--paper-bright,#fffdf9);cursor:pointer}',
 '#customerHistoryPanel .ch-dir button[aria-pressed=true]{color:var(--ink);border-color:var(--gold-deep,#a78243);background:rgba(160,125,55,.08)}',
 '#customerHistoryPanel .ch-search{width:min(380px,100%);min-width:120px;min-height:37px;padding:9px 12px;border:1px solid var(--paper-line,#dcd6c9);border-radius:9px;background:var(--paper-bright,#fffdf9);font:500 12px Inter,CRMInter,sans-serif;color:var(--ink)}',
 '#customerHistoryPanel .ch-caption{font:500 11px/1.45 Inter,CRMInter,sans-serif;color:var(--muted);margin:5px 0 13px}',
 '#customerHistoryPanel .ch-group{border:1px solid var(--paper-line,#dcd6c9);border-radius:13px;overflow:hidden;background:var(--paper-bright,#fffdf9);margin:0 0 10px}',
 '#customerHistoryPanel .ch-group>summary{display:flex;align-items:center;gap:11px;justify-content:space-between;cursor:pointer;list-style:none;padding:15px 16px}',
 '#customerHistoryPanel summary::-webkit-details-marker{display:none}',
 '#customerHistoryPanel .ch-icon{flex:none;width:33px;height:33px;display:grid;place-items:center;border-radius:9px;border:1px solid var(--paper-line);color:var(--gold-deep,#97763e);font-size:15px}',
 '#customerHistoryPanel .ch-gmeta{min-width:0;flex:1}',
 '#customerHistoryPanel .ch-gname{display:block;font:700 13.5px/1.3 Inter,CRMInter,sans-serif;color:var(--ink)}',
 '#customerHistoryPanel .ch-gdesc{display:block;margin-top:3px;font:500 10.8px/1.35 Inter,CRMInter,sans-serif;color:var(--muted)}',
 '#customerHistoryPanel .ch-chevron{flex:none;color:var(--muted);font-size:17px;transition:transform .15s}',
 '#customerHistoryPanel .ch-group[open]>summary .ch-chevron{transform:rotate(180deg)}',
 '#customerHistoryPanel .ch-groupbody{border-top:1px solid var(--paper-line,#dcd6c9);padding:13px 15px 16px}',
 '#customerHistoryPanel .ch-line{border-left:1.5px solid var(--paper-line,#dcd6c9);margin-left:10px;padding:0 0 0 19px}',
 '#customerHistoryPanel .ch-item{position:relative;margin:0 0 10px;min-width:0}',
 '#customerHistoryPanel .ch-item:last-child{margin-bottom:0}',
 '#customerHistoryPanel .ch-item:before{position:absolute;content:"";width:9px;height:9px;border:2px solid var(--gold-deep,#a78243);border-radius:50%;background:var(--paper-bright,#fffdf9);left:-25px;top:17px}',
 '#customerHistoryPanel .ch-item[data-nested=true]{margin-left:13px}',
 '#customerHistoryPanel .ch-item[data-nested=true]:before{width:7px;height:7px;left:-38px;border-color:var(--muted,#85908f)}',
 '#customerHistoryPanel .ch-email{border:1px solid var(--paper-line,#dcd6c9);border-radius:10px;background:var(--paper-bright,#fffdf9);overflow:hidden}',
 '#customerHistoryPanel .ch-email>summary{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;padding:12px 13px;cursor:pointer;list-style:none}',
 '#customerHistoryPanel .ch-date{display:block;font:500 10.5px/1.35 Inter,CRMInter,sans-serif;color:var(--muted);margin-bottom:4px}',
 '#customerHistoryPanel .ch-title{display:block;font:650 12.8px/1.35 Inter,CRMInter,sans-serif;color:var(--ink);overflow-wrap:anywhere}',
 '#customerHistoryPanel .ch-preview{display:block;margin-top:5px;font:500 11.3px/1.45 Inter,CRMInter,sans-serif;color:var(--muted);overflow-wrap:anywhere}',
 '#customerHistoryPanel .ch-side{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:5px}',
 '#customerHistoryPanel .ch-direction{border:1px solid var(--paper-line);border-radius:999px;padding:3px 7px;font:650 9.5px/1.2 Inter,CRMInter,sans-serif;white-space:nowrap;color:var(--muted)}',
 '#customerHistoryPanel .ch-direction.sent{color:var(--gold-deep,#92723a)}',
 '#customerHistoryPanel .ch-details{padding:12px 13px 14px;border-top:1px solid var(--paper-line);display:grid;gap:8px;background:rgba(130,111,75,.035)}',
 '#customerHistoryPanel .ch-detailrow{display:grid;grid-template-columns:78px minmax(0,1fr);gap:10px;align-items:start}',
 '#customerHistoryPanel .ch-detailrow small{font:600 10.5px/1.45 Inter,CRMInter,sans-serif;color:var(--muted)}',
 '#customerHistoryPanel .ch-detailrow span{font:500 11.3px/1.5 Inter,CRMInter,sans-serif;color:var(--ink);white-space:pre-wrap;overflow-wrap:anywhere}',
 '#customerHistoryPanel .ch-original{font:650 11px Inter,CRMInter,sans-serif;color:var(--gold-deep,#97763e);text-decoration:underline;text-underline-offset:3px;display:inline-block;margin-top:3px}',
 '#customerHistoryPanel .ch-info{border:1px solid var(--paper-line,#dcd6c9);padding:12px;border-radius:10px;font:500 11.5px/1.5 Inter,CRMInter,sans-serif;color:var(--muted);margin:0 0 13px;background:var(--paper-bright,#fffdf9)}',
 '#customerHistoryPanel .ch-empty{padding:24px 12px;text-align:center;color:var(--muted);font-size:12px}',
 '#customerHistoryPanel .ch-flag{display:inline-block;color:var(--gold-deep,#97763e);font-weight:650}',
 '@media(max-width:650px){#customerHistoryPanel{padding:0 10px calc(30px + env(safe-area-inset-bottom))}#customerHistoryPanel .ch-shell{padding:16px 0}#customerHistoryPanel h2{font-size:21px}#customerHistoryPanel .ch-header{margin-bottom:15px}#customerHistoryPanel .ch-metric{padding:10px}#customerHistoryPanel .ch-metric strong{font-size:18px}#customerHistoryPanel .ch-group>summary{padding:12px 10px}#customerHistoryPanel .ch-groupbody{padding:11px 9px 12px}#customerHistoryPanel .ch-filterrow{align-items:stretch;flex-direction:column}#customerHistoryPanel .ch-search{width:100%;max-width:none}#customerHistoryPanel .ch-dir{justify-content:flex-start}#customerHistoryPanel .ch-item[data-nested=true]{margin-left:6px}#customerHistoryPanel .ch-item[data-nested=true]:before{left:-31px}#customerHistoryPanel .ch-email>summary{padding:11px 10px}#customerHistoryPanel .ch-title{font-size:12px}#customerHistoryPanel .ch-details{padding:11px}}'
 ].join('');
 document.head.appendChild(x);
}
function resultRow(e,k,v){if(!val(v))return '';return '<div class="ch-detailrow"><small>'+safe(k)+'</small><span>'+safe(v)+'</span></div>';}
function itemHtml(e,context,allView){
 var matched=val(context),nest=isNested(e),url=/^https:\/\/mail\.google\.com\/mail\//i.test(val(e.gmail_url))?val(e.gmail_url):'';
 var detail=resultRow(e,'Subject',e.subject)+resultRow(e,'From',e.sender_email)+resultRow(e,'To',e.recipient_email)+resultRow(e,'Linked to',matched)+resultRow(e,'Summary',e.summary);
 if(e._threadCount>1)detail+=resultRow(e,'Conversation',e._threadCount+' verified messages in this Gmail thread');
 if(e.has_attachment)detail+=resultRow(e,'Attachment','Original email includes an attachment');
 return '<article class="ch-item" data-nested="'+(nest?'true':'false')+'"><details class="ch-email"><summary><span style="min-width:0;flex:1"><span class="ch-date">'+safe(when(e.activity_at))+(allView&&matched?' · '+safe(matched):'')+'</span><span class="ch-title">'+safe(e.title||cap(e.activity_type))+'</span>'+(val(e.summary)?'<span class="ch-preview">'+safe(e.summary)+'</span>':'')+'</span><span class="ch-side"><span class="ch-direction '+(e.direction==='sent'?'sent':'received')+'">'+(e.direction==='sent'?'Sent':'Received')+'</span><span class="ch-chevron" aria-hidden="true">⌄</span></span></summary><div class="ch-details">'+detail+(url?'<a class="ch-original" target="_blank" rel="noopener noreferrer" href="'+safe(url)+'">Open original Gmail message ↗</a>':'<span class="ch-preview">Original Gmail link not available</span>')+'</div></details></article>';
}
function stagesSort(a,b){
 if(a.sortPriority!==b.sortPriority)return a.sortPriority-b.sortPriority;
 return val(a.sortDate).localeCompare(val(b.sortDate))||val(a.name).localeCompare(val(b.name));
}
function groupsFor(rows,stages,links){
 var stageMap={},linkMap={},groups={},threadCount={};
 stages.forEach(function(s){stageMap[String(s.id)]=s;});
 links.forEach(function(l){
  var s=stageMap[String(l.payment_schedule_id)];if(!s)return;
  var key=String(l.email_event_id);(linkMap[key]=linkMap[key]||[]).push(s);
 });
 rows.forEach(function(e){if(e.gmail_thread_id){var id=String(e.gmail_thread_id);threadCount[id]=(threadCount[id]||0)+1;}});
 rows.forEach(function(e){
  e._threadCount=e.gmail_thread_id?threadCount[String(e.gmail_thread_id)]||1:1;
  var matched=linkMap[String(e.id)]||[];
  e._matched=matched;
  var items=isSpa(e)?[{id:'spa',name:'SPA Correspondence',desc:'SPA signing invitations and related emails · Separate from Welcome',sortPriority:30,sortDate:''}]:matched.length?matched.map(function(s){return{id:'stage:'+s.id,name:s.stage_name,desc:isDownPayment(e)?'Booking amount and down payment correspondence':'Verified installment correspondence',sortPriority:stagePosition(s.stage_name),sortDate:s.due_date||'9999-12-31'};}):[isWelcome(e)?{id:'booking',name:'Booking & Welcome',desc:'Booking confirmations and Welcome Letters',sortPriority:0,sortDate:''}:isDownPayment(e)?{id:'deposit-review',name:'Booking Amount / Down Payment',desc:'Email verified · exact installment link needs review',sortPriority:9,sortDate:''}:isInstallmentSubject(e)?{id:'review',name:'Needs Installment Review',desc:'Verified email · installment not yet confirmed',sortPriority:220,sortDate:''}:{id:'general',name:'General Correspondence',desc:'Messages not tied to a specific installment',sortPriority:210,sortDate:''}];
  items.forEach(function(g){
   if(!groups[g.id])groups[g.id]={id:g.id,name:g.name,desc:g.desc,sortPriority:g.sortPriority,sortDate:g.sortDate,events:[]};
   groups[g.id].events.push(e);
  });
 });
 return Object.keys(groups).map(function(id){var g=groups[id];g.events.sort(function(a,b){return timeValue(a.activity_at)-timeValue(b.activity_at)||Number(a.id)-Number(b.id);});return g;}).sort(stagesSort);
}
function matches(e,context){
 return (directionFilter==='all'||e.direction===directionFilter)&&(!searchValue||(val(e.title)+' '+val(e.summary)+' '+val(e.subject)+' '+val(e.sender_email)+' '+val(e.recipient_email)+' '+context).toLowerCase().indexOf(searchValue)>=0);
}
function render(panel,model){
 if(!panel.isConnected)return;
 panel.querySelectorAll('[data-history-view]').forEach(function(n){n.setAttribute('aria-pressed',String(n.getAttribute('data-history-view')===viewMode));});
 panel.querySelectorAll('[data-history-dir]').forEach(function(n){n.setAttribute('aria-pressed',String(n.getAttribute('data-history-dir')===directionFilter));});
 var host=panel.querySelector('#chRecords'),count=panel.querySelector('#chCount'),html='',seen={};
 if(viewMode==='all'){
  var items=model.emails.filter(function(e){return matches(e,e._matched.map(function(s){return s.stage_name;}).join(' · '));});
  items.sort(function(a,b){return timeValue(a.activity_at)-timeValue(b.activity_at)||Number(a.id)-Number(b.id);});
  html=items.length?'<div class="ch-group"><div class="ch-groupbody" style="border:0"><div class="ch-line">'+items.map(function(e){return itemHtml(e,e._matched.length?e._matched.map(function(s){return s.stage_name;}).join(' · '):isSpa(e)?'SPA Correspondence':isDownPayment(e)?'Down Payment · link needs review':isInstallmentSubject(e)&&!isWelcome(e)?'Installment not yet verified':isWelcome(e)?'Booking & Welcome':'General Correspondence',true);}).join('')+'</div></div></div>':'<p class="ch-empty">No verified emails match these filters.</p>';
  count.textContent=items.length+' of '+model.emails.length+' verified emails · Oldest to newest';
 }else{
  var total=0,shown=0;
  model.groups.forEach(function(g,idx){
   var list=g.events.filter(function(e){return matches(e,g.name);});if(!list.length)return;
   list.forEach(function(e){seen[e.id]=1;});total+=list.length;
   var opened=openGroups[g.id]!==undefined?openGroups[g.id]:idx<3;
   html+='<details class="ch-group" data-group="'+safe(g.id)+'"'+(searchValue||opened?' open':'')+'><summary><span class="ch-icon" aria-hidden="true">'+(g.id==='booking'?'✉':g.id==='spa'?'✎':g.id==='review'?'?':g.id==='deposit-review'?'↳':g.id==='general'?'↗':'▤')+'</span><span class="ch-gmeta"><span class="ch-gname">'+safe(g.name)+'</span><span class="ch-gdesc">'+list.length+' email'+(list.length===1?'':'s')+' · '+safe(g.desc)+'</span></span><span class="ch-chevron" aria-hidden="true">⌄</span></summary><div class="ch-groupbody">'+(g.id==='review'?'<p class="ch-info">These emails are verified, but their exact installment has not been confirmed. ChatGPT can link them after reviewing the full correspondence.</p>':'')+'<div class="ch-line">'+list.map(function(e){return itemHtml(e,g.name,false);}).join('')+'</div></div></details>';
   shown++;
  });
  count.textContent=Object.keys(seen).length+' of '+model.emails.length+' verified emails · '+shown+' correspondence groups';
  if(!html)html='<p class="ch-empty">No verified emails match these filters.</p>';
 }
 host.innerHTML=html;
 host.querySelectorAll('details.ch-group').forEach(function(g){g.addEventListener('toggle',function(){if(!searchValue)openGroups[g.getAttribute('data-group')]=g.open;});});
}
async function load(c){
 if(window.__crmTestMode&&window.__crmTestMode.active)return{emails:[],groups:[],testMode:true};
 var unit=Number(c.sno);if(!unit||!isFinite(unit))throw new Error('Customer unit not available.');
 var res=await Promise.all([
  sb.from('crm_gmail_history_events').select('id,unit_id,customer_id,gmail_message_id,gmail_thread_id,activity_at,direction,activity_type,title,summary,subject,sender_email,recipient_email,gmail_url,has_attachment,match_basis').eq('unit_id',unit).order('activity_at',{ascending:true}).order('id',{ascending:true}).limit(1200),
  sb.from('payment_schedule').select('id,unit_id,stage_name,due_date').eq('unit_id',unit).limit(200),
  sb.from('units').select('customer_id,unit_no').eq('id',unit).single()
 ]);
 for(var k=0;k<res.length;k++)if(res[k].error)throw new Error('The email history could not be loaded. Please retry.');
 var actualCustomer=Number(res[2].data&&res[2].data.customer_id)||0;
 if(!actualCustomer)throw new Error('Customer identity could not be verified.');
 var emails=(res[0].data||[]).filter(function(e){return Number(e.customer_id)===actualCustomer;});
 var links=[];
 for(var i=0;i<emails.length;i+=100){
  var ids=emails.slice(i,i+100).map(function(e){return Number(e.id);});
  var r=await sb.from('crm_gmail_history_installment_links').select('email_event_id,payment_schedule_id,conversation_key,link_basis').in('email_event_id',ids).limit(1200);
  if(r.error)throw new Error('Installment relationships could not be loaded. Please retry.');
  links.push.apply(links,r.data||[]);
 }
 var stages=res[1].data||[];
 return{emails:emails,groups:groupsFor(emails,stages,links),testMode:false};
}
async function open(){
 var c=cunit();if(!allowed()||!c)return;
 close();styles();var v=++openVersion;
 var m=document.getElementById('customerActionMenu');if(m)m.style.display='none';
 var mb=document.getElementById('customerActionMenuButton');if(mb)mb.setAttribute('aria-expanded','false');
 viewMode='installment';directionFilter='all';searchValue='';openGroups={};
 document.body.classList.add('customer-history-open');
 var p=document.createElement('section');p.id='customerHistoryPanel';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label','Customer Email History');
 p.innerHTML='<div class="ch-shell"><div class="ch-header"><div><h2>Email History</h2><p class="ch-sub">'+safe(c.name)+' · '+safe(c.unit)+' · '+safe(c.info&&c.info.project||'Sunbliss Residences')+'</p></div><button type="button" class="ch-btn" id="chBack">Back</button></div>'+
 '<div class="ch-metrics"><div class="ch-metric"><strong id="chTotal">—</strong><span>Total emails</span></div><div class="ch-metric"><strong id="chSent">—</strong><span>Sent</span></div><div class="ch-metric"><strong id="chReceived">—</strong><span>Received</span></div></div>'+
 '<div class="ch-controls"><div class="ch-segments" aria-label="Email history view"><button type="button" data-history-view="installment" aria-pressed="true">By Installment</button><button type="button" data-history-view="all" aria-pressed="false">All Emails</button></div><div class="ch-filterrow"><div class="ch-dir" aria-label="Email direction"><button type="button" data-history-dir="all" aria-pressed="true">All</button><button type="button" data-history-dir="sent" aria-pressed="false">Sent</button><button type="button" data-history-dir="received" aria-pressed="false">Received</button></div><input class="ch-search" id="chSearch" type="search" placeholder="Search email history" aria-label="Search email history"></div></div>'+
 '<p id="chNotice"></p><p class="ch-caption" id="chCount">Loading verified correspondence…</p><div id="chRecords" aria-live="polite"><p class="ch-empty">Loading verified emails…</p></div></div>';
 document.body.appendChild(p);
 p.querySelector('#chBack').onclick=close;
 p.querySelector('#chSearch').addEventListener('input',function(e){searchValue=val(e.target.value).toLowerCase();if(p._emailModel)render(p,p._emailModel);});
 p.querySelectorAll('[data-history-view]').forEach(function(b){b.addEventListener('click',function(){viewMode=b.getAttribute('data-history-view');if(p._emailModel)render(p,p._emailModel);});});
 p.querySelectorAll('[data-history-dir]').forEach(function(b){b.addEventListener('click',function(){directionFilter=b.getAttribute('data-history-dir');if(p._emailModel)render(p,p._emailModel);});});
 try{
  var model=await load(c);if(!p.isConnected||v!==openVersion)return;
  p._emailModel=model;
  p.querySelector('#chTotal').textContent=model.emails.length;
  p.querySelector('#chSent').textContent=model.emails.filter(function(e){return e.direction==='sent';}).length;
  p.querySelector('#chReceived').textContent=model.emails.filter(function(e){return e.direction==='received';}).length;
  if(model.testMode)p.querySelector('#chNotice').innerHTML='<p class="ch-info">Test Mode does not display live customer emails. Switch to live CRM to view verified correspondence.</p>';
  else if(!model.emails.length)p.querySelector('#chNotice').innerHTML='<p class="ch-info">No verified Gmail correspondence has been imported for this customer yet. Use ChatGPT to review and update the email history.</p>';
  else p.querySelector('#chNotice').innerHTML='<p class="ch-info">Read-only correspondence from verified email records. Related emails are grouped by installment. Sent or received labels are based only on original Gmail evidence.</p>';
  render(p,model);
 }catch(e){if(!p.isConnected||v!==openVersion)return;p.querySelector('#chCount').textContent='History unavailable';p.querySelector('#chRecords').innerHTML='<p class="ch-info">Could not load verified email history. Please reopen and try again. No CRM data was changed.</p>';}
}
function menu(){
 if(!allowed()||state.view!=='detail')return;
 var m=document.getElementById('customerActionMenu');if(!m||m.querySelector('#actionCustomerHistory'))return;
 var b=document.createElement('button');b.type='button';b.id='actionCustomerHistory';b.style.cssText='display:block;width:100%;border:0;background:transparent;text-align:left;padding:9px 10px;border-radius:7px;font:600 12px/1.3 Inter,Arial,sans-serif;color:var(--ink);cursor:pointer';
 b.textContent='Email History';b.onclick=function(e){e.preventDefault();e.stopPropagation();open();};m.appendChild(b);
}
new MutationObserver(menu).observe(document.body,{childList:true,subtree:true});menu();
window.__sunblissOpenCustomerHistory=open;
})();