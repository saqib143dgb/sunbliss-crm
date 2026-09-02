(function(){
'use strict';
if(window.__sunblissAskCrmPreviewInstalled)return;
window.__sunblissAskCrmPreviewInstalled=true;

var coreCache={at:0,data:null},financeCache={at:0,data:null};
var panel=null,messages=null,input=null,sendBtn=null,launcher=null;
var STOP={what:1,whats:1,is:1,the:1,a:1,an:1,of:1,for:1,to:1,how:1,many:1,much:1,show:1,me:1,tell:1,about:1,payment:1,status:1,customer:1,customers:1,unit:1,units:1,please:1,current:1,crm:1,has:1,have:1,paid:1,sold:1,sale:1,sales:1,by:1,are:1,was:1,were:1,from:1,with:1,and:1,in:1,on:1,do:1,does:1,any:1,available:1,data:1};

function txt(v){return v==null?'':String(v)}
function norm(v){return txt(v).toLowerCase().replace(/instalment/g,'installment').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function n(v){var x=Number(v);return isFinite(x)?x:0}
function uniq(a){return Array.from(new Set(a.filter(function(x){return x!=null&&x!==''})))}
function money(v){var x=Math.round(n(v)*100)/100;return 'AED '+x.toLocaleString('en-AE',{minimumFractionDigits:x%1?2:0,maximumFractionDigits:2})}
function iso(v){var s=txt(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function dateText(v){var s=iso(v);if(!s)return '—';var p=s.split('-');return new Date(Number(p[0]),Number(p[1])-1,Number(p[2])).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
function unitLabel(u){return u&&u.unit_no?u.unit_no:'Unit'}
function significantTokens(q){return norm(q).split(' ').filter(function(t){return t.length>=3&&!STOP[t]&&!/^\d+$/.test(t)})}
function personKey(v){return norm(v).replace(/\b(mr|mrs|ms|miss|dr)\b/g,' ').trim().replace(/\s+/g,' ')}
function sourceDone(v){var x=norm(v);return /signed|done|complete|completed|registered|issued|yes/.test(x)}
function stageIsBooking(s){return /booking/.test(norm(s&&s.stage_name))}
function effectiveDue(s,extBySchedule){var e=extBySchedule&&extBySchedule[String(s.id)];if(e&&norm(e.status)==='active'&&iso(e.extended_due_date)>=today())return iso(e.extended_due_date);return iso(s.revised_due_date)||iso(s.due_date)}
function errMessage(e){return e&&e.message?e.message:txt(e)||'Unknown error'}

async function waitForApp(){
 if(!window.sb||!window.state){setTimeout(waitForApp,80);return}
 installUI();
}

async function loadCore(force){
 if(!force&&coreCache.data&&Date.now()-coreCache.at<60000)return coreCache.data;
 var res=await Promise.all([
  sb.from('sales').select('id,customer_id,unit_id,booking_date,spa_status,oqood_status,dld_status,sold_by,source,broker_name,broker_company'),
  sb.from('units').select('id,unit_no,unit_type,total_price,status,availability_status,customer_id'),
  sb.from('customers').select('id,customer_name')
 ]);
 res.forEach(function(r){if(r.error)throw r.error});
 var data={sales:res[0].data||[],units:res[1].data||[],customers:res[2].data||[]};
 data.unitById={};data.customerById={};data.saleByUnit={};
 data.units.forEach(function(x){data.unitById[String(x.id)]=x});
 data.customers.forEach(function(x){data.customerById[String(x.id)]=x});
 data.sales.forEach(function(x){data.saleByUnit[String(x.unit_id)]=x});
 coreCache={at:Date.now(),data:data};return data;
}

async function loadFinance(force){
 if(!force&&financeCache.data&&Date.now()-financeCache.at<45000)return financeCache.data;
 var res=await Promise.all([
  sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,paid_date,status'),
  sb.from('payment_transactions').select('id,customer_id,unit_id,payment_schedule_id,payment_date,amount,payment_type,payment_reference'),
  sb.from('credit_notes').select('id,customer_id,unit_id,payment_schedule_id,issue_date,amount,reference_number'),
  sb.from('payment_extensions').select('id,customer_id,unit_id,payment_schedule_id,original_due_date,extended_due_date,status')
 ]);
 res.forEach(function(r){if(r.error)throw r.error});
 var data={schedules:res[0].data||[],transactions:res[1].data||[],credits:res[2].data||[],extensions:res[3].data||[]};
 data.cashBySchedule={};data.creditBySchedule={};data.extBySchedule={};
 data.transactions.forEach(function(x){if(x.payment_schedule_id!=null)data.cashBySchedule[String(x.payment_schedule_id)]=(data.cashBySchedule[String(x.payment_schedule_id)]||0)+n(x.amount)});
 data.credits.forEach(function(x){if(x.payment_schedule_id!=null)data.creditBySchedule[String(x.payment_schedule_id)]=(data.creditBySchedule[String(x.payment_schedule_id)]||0)+n(x.amount)});
 data.extensions.forEach(function(x){if(x.payment_schedule_id!=null&&norm(x.status)==='active')data.extBySchedule[String(x.payment_schedule_id)]=x});
 financeCache={at:Date.now(),data:data};return data;
}

function addMessage(role,text,meta){
 if(!messages)return;
 var wrap=document.createElement('div');wrap.className='ask-crm-msg '+(role==='user'?'ask-crm-user':'ask-crm-bot');
 var bubble=document.createElement('div');bubble.className='ask-crm-bubble';
 txt(text).split('\n').forEach(function(line,i){if(i)bubble.appendChild(document.createElement('br'));bubble.appendChild(document.createTextNode(line))});
 wrap.appendChild(bubble);
 if(meta){var m=document.createElement('div');m.className='ask-crm-meta';m.textContent=meta;wrap.appendChild(m)}
 messages.appendChild(wrap);messages.scrollTop=messages.scrollHeight;
}
function setBusy(b){if(sendBtn){sendBtn.disabled=!!b;sendBtn.textContent=b?'…':'Send'}if(input)input.disabled=!!b}

function findUnitFromQuestion(q,core){
 var m=txt(q).toUpperCase().match(/\b([A-Z]\d{1,2}-\d{2,4})\b/);if(!m)return null;
 var key=m[1];return core.units.find(function(u){return txt(u.unit_no).toUpperCase()===key})||null;
}
function findCustomersFromQuestion(q,core){
 var toks=significantTokens(q);if(!toks.length)return[];
 var scored=[];
 core.customers.forEach(function(c){var name=norm(c.customer_name),score=0;toks.forEach(function(t){if(name.split(' ').indexOf(t)>=0)score+=3;else if(name.indexOf(t)>=0)score+=1});if(score>0)scored.push({c:c,score:score})});
 scored.sort(function(a,b){return b.score-a.score||txt(a.c.customer_name).localeCompare(txt(b.c.customer_name))});
 if(!scored.length)return[];var top=scored[0].score;return scored.filter(function(x){return x.score===top}).slice(0,8).map(function(x){return x.c});
}
function unitsForCustomer(cid,core){return core.units.filter(function(u){return String(u.customer_id)===String(cid)})}

function salespersonTarget(q,core){
 var raw=txt(q),m=raw.match(/(?:sold\s+by|sales\s+by|salesperson|sales\s+of)\s+([a-z][a-z .'-]{2,})/i),candidate=m?norm(m[1]):'';
 candidate=candidate.replace(/\b(today|this|month|year|please|customers?|units?|sales?)\b.*$/,'').trim();
 if(candidate)return candidate;
 var qn=norm(q),keys=uniq(core.sales.map(function(s){return personKey(s.sold_by)})).filter(Boolean),best='';
 keys.forEach(function(k){k.split(' ').forEach(function(t){if(t.length>=4&&qn.split(' ').indexOf(t)>=0&&t.length>best.length)best=t})});return best;
}

function answerSalesperson(q,core){
 var target=salespersonTarget(q,core);if(!target)return null;
 var rows=core.sales.filter(function(s){var k=personKey(s.sold_by);return k.indexOf(target)>=0||target.indexOf(k)>=0});if(!rows.length)return null;
 var customers=uniq(rows.map(function(x){return String(x.customer_id)})),units=uniq(rows.map(function(x){return String(x.unit_id)}));
 var names=uniq(rows.map(function(x){return txt(x.sold_by)})).slice(0,4);
 return (names[0]||target)+' has '+customers.length+' customer'+(customers.length===1?'':'s')+' across '+units.length+' sold unit'+(units.length===1?'':'s')+' in the CRM.';
}
function answerSource(q,core){
 var qn=norm(q),source=qn.indexOf('direct')>=0?'DIRECT':(qn.indexOf('broker')>=0||qn.indexOf('brokerage')>=0?'BROKER':'');if(!source)return null;
 if(!/(how many|count|customers|sales|sold|units|source|direct|broker)/.test(qn))return null;
 var rows=core.sales.filter(function(s){return norm(s.source)===source.toLowerCase()}),customers=uniq(rows.map(function(x){return String(x.customer_id)}));
 return source==='DIRECT'?'There are '+customers.length+' direct customer'+(customers.length===1?'':'s')+' in the CRM ('+rows.length+' sale record'+(rows.length===1?'':'s')+').':'There are '+customers.length+' broker-sourced customer'+(customers.length===1?'':'s')+' in the CRM ('+rows.length+' sale record'+(rows.length===1?'':'s')+').';
}
function answerTotalSales(q,core){
 var qn=norm(q);if(!/(total|how many|count)/.test(qn)||!/(sold|sales|customers|units)/.test(qn))return null;
 var type=(qn.match(/\b(1br|2br|3br|studio)\b/)||[])[1];
 var rows=core.sales.slice();if(type){rows=rows.filter(function(s){var u=core.unitById[String(s.unit_id)];return norm(u&&u.unit_type).indexOf(type)>=0});}
 var customers=uniq(rows.map(function(x){return String(x.customer_id)})),units=uniq(rows.map(function(x){return String(x.unit_id)}));
 if(type)return type.toUpperCase()+': '+units.length+' sold unit'+(units.length===1?'':'s')+' across '+customers.length+' customer'+(customers.length===1?'':'s')+'.';
 return 'The CRM currently has '+customers.length+' customer'+(customers.length===1?'':'s')+' across '+units.length+' sold unit'+(units.length===1?'':'s')+'.';
}
function answerDocuments(q,core){
 var qn=norm(q),field='',label='';if(qn.indexOf('spa')>=0){field='spa_status';label='SPA'}else if(qn.indexOf('oqood')>=0){field='oqood_status';label='Oqood'}else if(qn.indexOf('dld')>=0){field='dld_status';label='DLD'}else return null;
 if(!/(how many|count|pending|signed|done|status|complete|registered)/.test(qn))return null;
 var done=core.sales.filter(function(s){return sourceDone(s[field])}),pending=core.sales.length-done.length;
 if(/pending|not signed|not done|outstanding/.test(qn))return label+' pending: '+pending+' sale record'+(pending===1?'':'s')+'.';
 return label+' completed: '+done.length+' · Pending: '+pending+'.';
}

function unitFinanceSummary(unit,core,fin){
 var uid=String(unit.id),customer=core.customerById[String(unit.customer_id)]||{},sale=core.saleByUnit[uid]||{};
 var schedules=fin.schedules.filter(function(x){return String(x.unit_id)===uid&&!stageIsBooking(x)}),tx=fin.transactions.filter(function(x){return String(x.unit_id)===uid}),credits=fin.credits.filter(function(x){return String(x.unit_id)===uid});
 var cash=tx.reduce(function(a,x){return a+n(x.amount)},0),cn=credits.reduce(function(a,x){return a+n(x.amount)},0),rows=[];
 schedules.forEach(function(s){var settled=n(fin.cashBySchedule[String(s.id)])+n(fin.creditBySchedule[String(s.id)]),rem=Math.max(0,n(s.due_amount)-settled),due=effectiveDue(s,fin.extBySchedule),ext=fin.extBySchedule[String(s.id)];rows.push({s:s,settled:settled,remaining:rem,due:due,ext:ext})});
 var outstanding=rows.reduce(function(a,x){return a+x.remaining},0),overdue=rows.filter(function(x){return x.remaining>1&&x.due&&x.due<today()}),next=rows.filter(function(x){return x.remaining>1&&x.due&&x.due>=today()}).sort(function(a,b){return a.due.localeCompare(b.due)})[0];
 var recent=tx.slice().sort(function(a,b){return iso(b.payment_date).localeCompare(iso(a.payment_date))})[0];
 var lines=[unitLabel(unit)+' · '+(customer.customer_name||'Customer'),'Cash received: '+money(cash)+(cn>0?' · Credit notes: '+money(cn):''),'Outstanding scheduled amount: '+money(outstanding)];
 if(overdue.length){lines.push('Overdue: '+money(overdue.reduce(function(a,x){return a+x.remaining},0))+' across '+overdue.length+' installment'+(overdue.length===1?'':'s')+'.')}
 if(next){lines.push('Next due: '+next.s.stage_name+' · '+money(next.remaining)+' · '+dateText(next.due)+(next.ext?' (extension active)':'')+'.')}
 if(recent){lines.push('Latest payment: '+money(recent.amount)+' · '+dateText(recent.payment_date)+(recent.payment_reference?' · '+recent.payment_reference:'')+'.')}
 var docs=[];if(sale.spa_status)docs.push('SPA '+sale.spa_status);if(sale.oqood_status)docs.push('Oqood '+sale.oqood_status);if(sale.dld_status)docs.push('DLD '+sale.dld_status);if(docs.length)lines.push(docs.join(' · ')+'.');
 return lines.join('\n');
}
async function answerCustomerOrUnit(q,core){
 var unit=findUnitFromQuestion(q,core),customers=[];
 if(!unit)customers=findCustomersFromQuestion(q,core);
 if(!unit&&customers.length===0)return null;
 if(!unit&&customers.length>1){
  var list=customers.slice(0,5).map(function(c){var us=unitsForCustomer(c.id,core).map(function(u){return u.unit_no}).filter(Boolean).join(', ');return '• '+c.customer_name+(us?' — '+us:'')});
  return 'I found more than one matching customer. Please use the unit number or full name:\n'+list.join('\n');
 }
 if(!unit&&customers.length===1){var us=unitsForCustomer(customers[0].id,core);if(us.length===1)unit=us[0];else if(us.length>1){return customers[0].customer_name+' has multiple units: '+us.map(function(u){return u.unit_no}).join(', ')+'. Ask using the unit number for an exact payment status.'}}
 if(!unit)return null;
 var fin=await loadFinance(false);return unitFinanceSummary(unit,core,fin);
}

async function answerCollections(q,core){
 var qn=norm(q);if(!/(collection|collected|received|cash|payment received)/.test(qn))return null;
 var fin=await loadFinance(false),rows=fin.transactions.slice(),prefix='',label='all recorded';var d=new Date(),y=d.getFullYear(),m=d.getMonth()+1;
 if(/today/.test(qn)){prefix=today();rows=rows.filter(function(x){return iso(x.payment_date)===prefix});label='today'}
 else if(/this month|month to date|mtd/.test(qn)){prefix=y+'-'+String(m).padStart(2,'0');rows=rows.filter(function(x){return iso(x.payment_date).indexOf(prefix)===0});label='this month'}
 else if(/this year|year to date|ytd/.test(qn)){prefix=String(y);rows=rows.filter(function(x){return iso(x.payment_date).indexOf(prefix)===0});label='this year'}
 else return null;
 var total=rows.reduce(function(a,x){return a+n(x.amount)},0),units=uniq(rows.map(function(x){return String(x.unit_id)}));return 'Cash collected '+label+': '+money(total)+' across '+units.length+' unit'+(units.length===1?'':'s')+' ('+rows.length+' transaction'+(rows.length===1?'':'s')+').';
}
async function answerDue(q,core){
 var qn=norm(q);if(!/(overdue|due today|due in|next \d+ days|upcoming due)/.test(qn))return null;
 var fin=await loadFinance(false),t=today(),days=0,m=qn.match(/(?:next|in) (\d+) days?/);if(m)days=Math.min(60,Math.max(1,Number(m[1])||0));
 var end=t;if(days){var d=new Date();d.setDate(d.getDate()+days);end=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 var byUnit={},rows=[];
 fin.schedules.forEach(function(s){if(stageIsBooking(s))return;var due=effectiveDue(s,fin.extBySchedule),rem=Math.max(0,n(s.due_amount)-n(fin.cashBySchedule[String(s.id)])-n(fin.creditBySchedule[String(s.id)]));if(rem<=1||!due)return;var ok=qn.indexOf('overdue')>=0?due<t:(qn.indexOf('due today')>=0?due===t:(days?due>=t&&due<=end:false));if(!ok)return;rows.push({s:s,due:due,remaining:rem});byUnit[String(s.unit_id)]=(byUnit[String(s.unit_id)]||0)+rem});
 var total=rows.reduce(function(a,x){return a+x.remaining},0),uids=Object.keys(byUnit),top=uids.sort(function(a,b){return byUnit[b]-byUnit[a]}).slice(0,5).map(function(id){var u=core.unitById[id];return (u?u.unit_no:'Unit '+id)+' '+money(byUnit[id])});
 var label=qn.indexOf('overdue')>=0?'Overdue':'Due'+(days?' in the next '+days+' days':' today');return label+': '+uids.length+' unit'+(uids.length===1?'':'s')+' · '+money(total)+(top.length?'\nTop: '+top.join(' · '):'')+'.';
}

async function answerQuestion(q){
 var core=await loadCore(false),qn=norm(q);if(!qn)return 'Type a question about the CRM.';
 var customerIntent=/payment|status|paid|outstanding|due|installment|installment|receipt|credit|extension/.test(qn);
 if(customerIntent){var exact=await answerCustomerOrUnit(q,core);if(exact)return exact}
 var a=answerSalesperson(q,core);if(a)return a;
 a=answerSource(q,core);if(a)return a;
 a=answerDocuments(q,core);if(a)return a;
 a=await answerCollections(q,core);if(a)return a;
 a=await answerDue(q,core);if(a)return a;
 if(!customerIntent){a=await answerCustomerOrUnit(q,core);if(a)return a}
 a=answerTotalSales(q,core);if(a)return a;
 return 'I could not map that question reliably yet. In this preview, try sales by person, Direct/Broker counts, customer or unit payment status, overdue/due payments, collections, SPA/Oqood/DLD status, or sold-unit counts. This assistant is read-only.';
}

async function submitQuestion(q){q=txt(q).trim();if(!q)return;addMessage('user',q);input.value='';setBusy(true);addMessage('bot','Checking live CRM data…','Read-only preview');var placeholder=messages.lastElementChild;try{var answer=await answerQuestion(q);if(placeholder)placeholder.remove();addMessage('bot',answer,'Live CRM · Read-only')}catch(e){if(placeholder)placeholder.remove();console.warn('Ask CRM preview error',e);addMessage('bot','I could not read the CRM data for that question. '+errMessage(e),'No changes were made')}finally{setBusy(false);input.focus()}}

function style(){if(document.getElementById('askCrmPreviewStyles'))return;var s=document.createElement('style');s.id='askCrmPreviewStyles';s.textContent='.ask-crm-launch{position:fixed;right:22px;bottom:28px;z-index:2147482500;display:flex;align-items:center;gap:9px;border:1px solid rgba(162,124,53,.28);border-radius:999px;background:#111827;color:#fff;padding:11px 15px;font:700 12px/1.2 Inter,Arial,sans-serif;box-shadow:0 14px 35px rgba(15,23,42,.22);cursor:pointer}.ask-crm-launch svg{width:18px;height:18px}.ask-crm-launch:focus-visible,.ask-crm-panel button:focus-visible,.ask-crm-panel input:focus-visible{outline:3px solid rgba(162,124,53,.34);outline-offset:2px}.ask-crm-panel{position:fixed;right:22px;bottom:82px;z-index:2147482501;width:min(410px,calc(100vw - 32px));height:min(610px,calc(100vh - 130px));display:none;grid-template-rows:auto 1fr auto;background:#fff;border:1px solid rgba(15,23,42,.12);border-radius:18px;box-shadow:0 22px 60px rgba(15,23,42,.25);overflow:hidden;color:#111827;font-family:Inter,Arial,sans-serif}.ask-crm-panel.open{display:grid}.ask-crm-head{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;border-bottom:1px solid #e5e7eb;background:#fff}.ask-crm-title{display:flex;align-items:center;gap:9px;min-width:0}.ask-crm-title strong{font-size:14px}.ask-crm-badge{font:700 9px/1.2 IBM Plex Mono,monospace;color:#7c5b1c;background:#f7f1e5;border:1px solid #ead8ad;padding:4px 7px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}.ask-crm-close{border:0;background:transparent;width:38px;height:38px;border-radius:10px;font-size:22px;cursor:pointer;color:#4b5563}.ask-crm-body{overflow:auto;padding:14px;background:#f8fafc}.ask-crm-intro{font-size:12px;line-height:1.45;color:#64748b;margin:0 0 10px}.ask-crm-chips{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 14px}.ask-crm-chip{border:1px solid #d6dbe3;background:#fff;color:#334155;border-radius:999px;padding:7px 9px;font:600 10px/1.2 Inter,Arial,sans-serif;cursor:pointer}.ask-crm-msg{display:flex;flex-direction:column;margin:9px 0;max-width:88%}.ask-crm-user{margin-left:auto;align-items:flex-end}.ask-crm-bot{margin-right:auto;align-items:flex-start}.ask-crm-bubble{white-space:normal;font-size:12px;line-height:1.5;padding:10px 12px;border-radius:14px;background:#fff;border:1px solid #e2e8f0;color:#1e293b}.ask-crm-user .ask-crm-bubble{background:#111827;color:#fff;border-color:#111827;border-bottom-right-radius:5px}.ask-crm-bot .ask-crm-bubble{border-bottom-left-radius:5px}.ask-crm-meta{font-size:9px;color:#94a3b8;margin-top:4px;padding:0 3px}.ask-crm-compose{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px;border-top:1px solid #e5e7eb;background:#fff}.ask-crm-compose input{min-width:0;border:1px solid #d8dee8;border-radius:12px;padding:11px 12px;font-size:16px;line-height:1.2;color:#111827;background:#fff}.ask-crm-send{border:0;border-radius:12px;background:#111827;color:#fff;padding:0 14px;min-width:64px;font:700 11px/1 Inter,Arial,sans-serif;cursor:pointer}.ask-crm-send:disabled{opacity:.55;cursor:default}@media(max-width:767px){.ask-crm-launch{right:14px;bottom:86px;padding:11px 13px}.ask-crm-launch span{display:none}.ask-crm-panel{right:12px;bottom:78px;width:calc(100vw - 24px);height:min(590px,calc(100vh - 118px));border-radius:16px}}';document.head.appendChild(s)}

function installUI(){
 if(document.getElementById('askCrmPreviewLauncher'))return;style();
 launcher=document.createElement('button');launcher.type='button';launcher.id='askCrmPreviewLauncher';launcher.className='ask-crm-launch';launcher.setAttribute('aria-label','Open Ask CRM preview');launcher.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3l1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Zm6 9 .9 2.6L21.5 15l-2.6.9L18 18.5l-.9-2.6-2.6-.9 2.6-.9L18 12ZM6 13l1.1 3.1L10 17.2l-2.9 1.1L6 21.4l-1.1-3.1L2 17.2l2.9-1.1L6 13Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg><span>Ask CRM</span>';
 panel=document.createElement('section');panel.className='ask-crm-panel';panel.id='askCrmPreviewPanel';panel.setAttribute('aria-label','Ask CRM preview');
 panel.innerHTML='<div class="ask-crm-head"><div class="ask-crm-title"><strong>Ask CRM</strong><span class="ask-crm-badge">Read-only preview</span></div><button type="button" class="ask-crm-close" aria-label="Close Ask CRM">×</button></div><div class="ask-crm-body"><p class="ask-crm-intro">Ask in plain English. Answers are calculated from the CRM data you already have access to. This preview cannot change records.</p><div class="ask-crm-chips"></div><div class="ask-crm-messages" aria-live="polite"></div></div><form class="ask-crm-compose"><input aria-label="Ask a CRM question" placeholder="e.g. What is A3-902 payment status?" autocomplete="off"><button class="ask-crm-send" type="submit">Send</button></form>';
 document.body.appendChild(launcher);document.body.appendChild(panel);
 messages=panel.querySelector('.ask-crm-messages');input=panel.querySelector('input');sendBtn=panel.querySelector('.ask-crm-send');
 var chips=panel.querySelector('.ask-crm-chips');['How many customers are sold by Farhan?','How many customers are direct?','What is A3-902 payment status?','How much collected this month?'].forEach(function(q){var b=document.createElement('button');b.type='button';b.className='ask-crm-chip';b.textContent=q;b.addEventListener('click',function(){submitQuestion(q)});chips.appendChild(b)});
 launcher.addEventListener('click',function(){panel.classList.toggle('open');if(panel.classList.contains('open'))setTimeout(function(){input.focus()},20)});
 panel.querySelector('.ask-crm-close').addEventListener('click',function(){panel.classList.remove('open');launcher.focus()});
 panel.querySelector('form').addEventListener('submit',function(e){e.preventDefault();submitQuestion(input.value)});
 addMessage('bot','Ask me about sales, Direct/Broker source, a customer or unit payment status, overdue or upcoming payments, collections, SPA, Oqood or DLD.','Live CRM · Read-only');
 window.__askCrmPreviewAsk=answerQuestion;
}

waitForApp();
})();
