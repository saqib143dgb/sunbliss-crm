(function(){
'use strict';
if(window.__sunblissAskCrmAiUpgradeInstalled)return;
window.__sunblissAskCrmAiUpgradeInstalled=true;

var coreCache={at:0,data:null},financeCache={at:0,data:null},extraCache={};
var history=[];
function txt(v){return v==null?'':String(v)}
function norm(v){return txt(v).toLowerCase().replace(/instalment/g,'installment').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')}
function n(v){var x=Number(v);return isFinite(x)?x:0}
function uniq(a){return Array.from(new Set((a||[]).filter(function(x){return x!=null&&x!==''})))}
function iso(v){var s=txt(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function sourceDone(v){return /signed|done|complete|completed|registered|issued|yes/.test(norm(v))}
function stageIsBooking(s){return /booking/.test(norm(s&&s.stage_name))}
function effectiveDue(s,ext){var e=ext&&ext[String(s.id)];if(e&&norm(e.status)==='active'&&iso(e.extended_due_date)>=today())return iso(e.extended_due_date);return iso(s.revised_due_date)||iso(s.due_date)}
function money(v){var x=Math.round(n(v)*100)/100;return 'AED '+x.toLocaleString('en-AE',{maximumFractionDigits:2})}
function stopWords(){return {what:1,whats:1,is:1,the:1,a:1,an:1,of:1,for:1,to:1,how:1,many:1,much:1,show:1,me:1,tell:1,about:1,payment:1,status:1,customer:1,customers:1,unit:1,units:1,please:1,current:1,crm:1,has:1,have:1,paid:1,sold:1,sale:1,sales:1,by:1,are:1,was:1,were:1,from:1,with:1,and:1,in:1,on:1,do:1,does:1,any:1,available:1,data:1,can:1,you:1,give:1,get:1}}
function tokens(q){var stop=stopWords();return norm(q).split(' ').filter(function(t){return t.length>=3&&!stop[t]&&!/^\d+$/.test(t)})}

async function loadCore(){
 if(coreCache.data&&Date.now()-coreCache.at<60000)return coreCache.data;
 var r=await Promise.all([
  sb.from('sales').select('id,customer_id,unit_id,booking_date,spa_status,oqood_status,dld_status,sold_by,source,broker_name,broker_company'),
  sb.from('units').select('id,unit_no,unit_type,total_price,status,availability_status,customer_id'),
  sb.from('customers').select('id,customer_name')
 ]);
 r.forEach(function(x){if(x.error)throw x.error});
 var d={sales:r[0].data||[],units:r[1].data||[],customers:r[2].data||[],unitById:{},customerById:{},saleByUnit:{}};
 d.units.forEach(function(x){d.unitById[String(x.id)]=x});d.customers.forEach(function(x){d.customerById[String(x.id)]=x});d.sales.forEach(function(x){d.saleByUnit[String(x.unit_id)]=x});
 coreCache={at:Date.now(),data:d};return d;
}
async function loadFinance(){
 if(financeCache.data&&Date.now()-financeCache.at<45000)return financeCache.data;
 var r=await Promise.all([
  sb.from('payment_schedule').select('id,customer_id,unit_id,stage_name,due_amount,due_date,revised_due_date,paid_amount,paid_date,status'),
  sb.from('payment_transactions').select('id,customer_id,unit_id,payment_schedule_id,payment_date,amount,payment_type,payment_reference'),
  sb.from('credit_notes').select('id,customer_id,unit_id,payment_schedule_id,issue_date,amount,reference_number'),
  sb.from('payment_extensions').select('id,customer_id,unit_id,payment_schedule_id,original_due_date,extended_due_date,status')
 ]);
 r.forEach(function(x){if(x.error)throw x.error});
 var d={schedules:r[0].data||[],transactions:r[1].data||[],credits:r[2].data||[],extensions:r[3].data||[],cashBySchedule:{},creditBySchedule:{},extBySchedule:{}};
 d.transactions.forEach(function(x){if(x.payment_schedule_id!=null)d.cashBySchedule[String(x.payment_schedule_id)]=(d.cashBySchedule[String(x.payment_schedule_id)]||0)+n(x.amount)});
 d.credits.forEach(function(x){if(x.payment_schedule_id!=null)d.creditBySchedule[String(x.payment_schedule_id)]=(d.creditBySchedule[String(x.payment_schedule_id)]||0)+n(x.amount)});
 d.extensions.forEach(function(x){if(x.payment_schedule_id!=null&&norm(x.status)==='active')d.extBySchedule[String(x.payment_schedule_id)]=x});
 financeCache={at:Date.now(),data:d};return d;
}
async function optionalTable(table){
 if(extraCache[table]&&Date.now()-extraCache[table].at<45000)return extraCache[table].rows;
 try{var r=await sb.from(table).select('*').limit(120);if(r.error)throw r.error;extraCache[table]={at:Date.now(),rows:r.data||[]};return r.data||[]}catch(e){return[]}
}
async function extrasFor(q){
 var qn=norm(q),out={},jobs=[];function add(k,t){jobs.push(optionalTable(t).then(function(rows){out[k]=rows}))}
 if(/action|task|follow up|reminder|demand letter/.test(qn))add('scheduled_actions','scheduled_actions');
 if(/cancel|cancelled|canceled|forfeit/.test(qn)){add('cancelled_units','cancelled_units');add('cancelled_unit_adjustments','cancelled_unit_adjustments')}
 if(/carry|forward|adjustment/.test(qn)){add('carry_forward_events','carry_forward_events');add('carry_forward_allocations','carry_forward_allocations')}
 if(/note|remark/.test(qn))add('sales_note_history','sales_note_history');
 if(/audit|edited|edit log|deleted|deletion|change log/.test(qn)){add('payment_transaction_edit_log','payment_transaction_edit_log');add('payment_transaction_deletion_log','payment_transaction_deletion_log');add('credit_note_edit_log','credit_note_edit_log')}
 await Promise.all(jobs);return out;
}

function salesRows(core){
 return core.sales.map(function(s){var u=core.unitById[String(s.unit_id)]||{},c=core.customerById[String(s.customer_id)]||{};return {customer:c.customer_name||'',unit:u.unit_no||'',unitType:u.unit_type||'',totalPrice:n(u.total_price),bookingDate:iso(s.booking_date),soldBy:s.sold_by||'',source:s.source||'',brokerName:s.broker_name||'',brokerCompany:s.broker_company||'',spa:s.spa_status||'',oqood:s.oqood_status||'',dld:s.dld_status||'',unitStatus:u.status||'',availability:u.availability_status||''}})
}
function group(rows,key){
 var m={};rows.forEach(function(r){var k=txt(r[key]).trim()||'Not specified';if(!m[k])m[k]={label:k,saleRecords:0,c:{},u:{},salesValue:0};var g=m[k];g.saleRecords++;g.c[r.customer]=1;g.u[r.unit]=1;g.salesValue+=n(r.totalPrice)});
 return Object.keys(m).map(function(k){var g=m[k];return {label:g.label,saleRecords:g.saleRecords,customers:Object.keys(g.c).length,units:Object.keys(g.u).length,salesValue:Math.round(g.salesValue*100)/100}}).sort(function(a,b){return b.units-a.units});
}
function matchUnits(q,core){
 var m=txt(q).toUpperCase().match(/\b([A-Z]\d{1,2}-\d{2,4})\b/);if(m){var e=core.units.filter(function(u){return txt(u.unit_no).toUpperCase()===m[1]});if(e.length)return e}
 var ts=tokens(q),scores=[];core.customers.forEach(function(c){var name=norm(c.customer_name),words=name.split(' '),score=0;ts.forEach(function(t){if(words.indexOf(t)>=0)score+=4;else if(name.indexOf(t)>=0)score++});if(score>0)scores.push({id:String(c.id),score:score})});scores.sort(function(a,b){return b.score-a.score});if(!scores.length)return[];var top=scores[0].score,ids={};scores.filter(function(x){return x.score===top}).slice(0,4).forEach(function(x){ids[x.id]=1});return core.units.filter(function(u){return ids[String(u.customer_id)]}).slice(0,8);
}
function unitFinance(core,fin){
 var t=today();return core.units.map(function(u){var uid=String(u.id),c=core.customerById[String(u.customer_id)]||{},sale=core.saleByUnit[uid]||{},sched=fin.schedules.filter(function(s){return String(s.unit_id)===uid&&!stageIsBooking(s)}),tx=fin.transactions.filter(function(x){return String(x.unit_id)===uid}),cr=fin.credits.filter(function(x){return String(x.unit_id)===uid}),out=0,over=0,overN=0,next=null,extN=0;sched.forEach(function(s){var settled=n(fin.cashBySchedule[String(s.id)])+n(fin.creditBySchedule[String(s.id)]),rem=Math.max(0,n(s.due_amount)-settled),due=effectiveDue(s,fin.extBySchedule);out+=rem;if(rem>1&&due&&due<t){over+=rem;overN++}if(rem>1&&due&&due>=t&&(!next||due<next.due))next={stage:s.stage_name,due:due,remaining:rem};if(fin.extBySchedule[String(s.id)])extN++});var latest=tx.slice().sort(function(a,b){return iso(b.payment_date).localeCompare(iso(a.payment_date))})[0];return {customer:c.customer_name||'',unit:u.unit_no||'',unitType:u.unit_type||'',soldBy:sale.sold_by||'',source:sale.source||'',cashReceived:Math.round(tx.reduce(function(a,x){return a+n(x.amount)},0)*100)/100,creditNotes:Math.round(cr.reduce(function(a,x){return a+n(x.amount)},0)*100)/100,outstanding:Math.round(out*100)/100,overdue:Math.round(over*100)/100,overdueStages:overN,nextStage:next?next.stage:'',nextDue:next?next.due:'',nextRemaining:next?Math.round(next.remaining*100)/100:0,activeExtensions:extN,latestPaymentDate:latest?iso(latest.payment_date):'',latestPaymentAmount:latest?n(latest.amount):0,latestPaymentReference:latest&&latest.payment_reference?latest.payment_reference:'',spa:sale.spa_status||'',oqood:sale.oqood_status||'',dld:sale.dld_status||''}})
}
function targetDetails(units,core,fin){
 return units.map(function(u){var uid=String(u.id),c=core.customerById[String(u.customer_id)]||{},sale=core.saleByUnit[uid]||{};return {customer:c.customer_name||'',unit:u.unit_no||'',unitType:u.unit_type||'',totalPrice:n(u.total_price),sale:{bookingDate:iso(sale.booking_date),soldBy:sale.sold_by||'',source:sale.source||'',brokerName:sale.broker_name||'',brokerCompany:sale.broker_company||'',spa:sale.spa_status||'',oqood:sale.oqood_status||'',dld:sale.dld_status||''},paymentSchedule:fin.schedules.filter(function(x){return String(x.unit_id)===uid}).map(function(x){return {id:x.id,stage:x.stage_name,dueAmount:n(x.due_amount),contractualDue:iso(x.due_date),revisedDue:iso(x.revised_due_date),effectiveDue:effectiveDue(x,fin.extBySchedule),storedPaid:n(x.paid_amount),status:x.status||'',linkedCash:n(fin.cashBySchedule[String(x.id)]),linkedCreditNote:n(fin.creditBySchedule[String(x.id)]),remainingUsingLinkedLedger:Math.max(0,n(x.due_amount)-n(fin.cashBySchedule[String(x.id)])-n(fin.creditBySchedule[String(x.id)]))}}),transactions:fin.transactions.filter(function(x){return String(x.unit_id)===uid}).sort(function(a,b){return iso(b.payment_date).localeCompare(iso(a.payment_date))}).map(function(x){return {date:iso(x.payment_date),amount:n(x.amount),type:x.payment_type||'',reference:x.payment_reference||'',scheduleId:x.payment_schedule_id}}),creditNotes:fin.credits.filter(function(x){return String(x.unit_id)===uid}).map(function(x){return {date:iso(x.issue_date),amount:n(x.amount),reference:x.reference_number||'',scheduleId:x.payment_schedule_id}}),extensions:fin.extensions.filter(function(x){return String(x.unit_id)===uid}).map(function(x){return {scheduleId:x.payment_schedule_id,originalDue:iso(x.original_due_date),extendedDue:iso(x.extended_due_date),status:x.status||''}})}})
}
function collections(fin){var m={};fin.transactions.forEach(function(x){var d=iso(x.payment_date);if(!d)return;var k=d.slice(0,7);if(!m[k])m[k]={month:k,amount:0,transactions:0,units:{}};m[k].amount+=n(x.amount);m[k].transactions++;m[k].units[String(x.unit_id)]=1});return Object.keys(m).sort().map(function(k){return {month:k,amount:Math.round(m[k].amount*100)/100,transactions:m[k].transactions,units:Object.keys(m[k].units).length}})}
function financeOverview(fin){var t=today(),d=new Date();d.setDate(d.getDate()+7);var end=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'),over=0,due=0,next=0,ou={},du={},nu={};fin.schedules.forEach(function(s){if(stageIsBooking(s))return;var dt=effectiveDue(s,fin.extBySchedule),rem=Math.max(0,n(s.due_amount)-n(fin.cashBySchedule[String(s.id)])-n(fin.creditBySchedule[String(s.id)]));if(rem<=1||!dt)return;if(dt<t){over+=rem;ou[String(s.unit_id)]=1}if(dt===t){due+=rem;du[String(s.unit_id)]=1}if(dt>=t&&dt<=end){next+=rem;nu[String(s.unit_id)]=1}});return {cashReceivedAllTransactions:Math.round(fin.transactions.reduce(function(a,x){return a+n(x.amount)},0)*100)/100,creditNotesTotal:Math.round(fin.credits.reduce(function(a,x){return a+n(x.amount)},0)*100)/100,overdueAmount:Math.round(over*100)/100,overdueUnits:Object.keys(ou).length,dueTodayAmount:Math.round(due*100)/100,dueTodayUnits:Object.keys(du).length,dueNext7DaysAmount:Math.round(next*100)/100,dueNext7DaysUnits:Object.keys(nu).length,activeExtensions:fin.extensions.filter(function(x){return norm(x.status)==='active'}).length}}
async function snapshot(q){
 var r=await Promise.all([loadCore(),loadFinance(),extrasFor(q)]),core=r[0],fin=r[1],sr=salesRows(core),uf=unitFinance(core,fin),targets=matchUnits(q,core),docs={spaCompleted:sr.filter(function(x){return sourceDone(x.spa)}).length,spaPending:sr.filter(function(x){return !sourceDone(x.spa)}).length,oqoodCompleted:sr.filter(function(x){return sourceDone(x.oqood)}).length,oqoodPending:sr.filter(function(x){return !sourceDone(x.oqood)}).length,dldCompleted:sr.filter(function(x){return sourceDone(x.dld)}).length,dldPending:sr.filter(function(x){return !sourceDone(x.dld)}).length};
 return {generatedAt:new Date().toISOString(),currentDate:today(),readOnly:true,definitions:{soldCounts:'Based on sales rows; unique customers and units are precomputed separately.',directBroker:'Based on sales.source.',cashReceived:'Sum of payment_transactions.',paymentOutstanding:'due_amount minus payment_transactions linked by payment_schedule_id minus linked credit notes. payment_schedule.paid_amount is supplied separately for named units because legacy records can differ.',effectiveDueDate:'Active future extension date, else revised_due_date, else contractual due_date.'},overview:{saleRecords:sr.length,uniqueCustomers:uniq(sr.map(function(x){return x.customer})).length,uniqueSoldUnits:uniq(sr.map(function(x){return x.unit})).length,totalSalesValue:Math.round(sr.reduce(function(a,x){return a+n(x.totalPrice)},0)*100)/100,documents:docs,finance:financeOverview(fin)},salesByPerson:group(sr,'soldBy'),salesBySource:group(sr,'source'),salesByUnitType:group(sr,'unitType'),collectionsByMonth:collections(fin),salesRows:sr,unitFinance:uf,targetDetails:targetDetails(targets,core,fin),extras:r[2]};
}

async function askAI(q,snap){
 var headers={'Content-Type':'application/json'},ctrl=new AbortController(),timer=setTimeout(function(){ctrl.abort()},35000);
 try{var s=await sb.auth.getSession(),token=s&&s.data&&s.data.session&&s.data.session.access_token;if(token)headers.Authorization='Bearer '+token}catch(_e){}
 try{var resp=await fetch('/api/ask-crm',{method:'POST',headers:headers,body:JSON.stringify({question:q,snapshot:snap,history:history.slice(-6)}),signal:ctrl.signal}),data={};try{data=await resp.json()}catch(_e){}if(!resp.ok||!data.answer)throw new Error(data.error||'AI request failed');return data.answer}finally{clearTimeout(timer)}
}
function fallback(q,snap){
 var qn=norm(q),ov=snap.overview;
 if(snap.targetDetails.length){var d=snap.targetDetails[0],tx=d.transactions||[],sched=d.paymentSchedule||[],out=sched.filter(function(x){return !/booking/.test(norm(x.stage))}).reduce(function(a,x){return a+n(x.remainingUsingLinkedLedger)},0),latest=tx[0];return d.unit+' · '+d.customer+'\nCash received: '+money(tx.reduce(function(a,x){return a+n(x.amount)},0))+'\nOutstanding scheduled amount: '+money(out)+(latest?'\nLatest payment: '+money(latest.amount)+' · '+latest.date+(latest.reference?' · '+latest.reference:''):'')}
 if(qn.indexOf('direct')>=0){var x=snap.salesBySource.find(function(g){return norm(g.label)==='direct'});if(x)return 'Direct: '+x.customers+' customers across '+x.units+' sold units.'}
 if(qn.indexOf('broker')>=0){var b=snap.salesBySource.find(function(g){return norm(g.label)==='broker'});if(b)return 'Broker: '+b.customers+' customers across '+b.units+' sold units.'}
 var p=snap.salesByPerson.find(function(g){return norm(g.label).split(' ').some(function(t){return t.length>3&&qn.split(' ').indexOf(t)>=0})});if(p)return p.label+': '+p.customers+' customers across '+p.units+' sold units.';
 if(/overdue/.test(qn))return 'Overdue: '+ov.finance.overdueUnits+' units · '+money(ov.finance.overdueAmount)+'.';
 if(/due today/.test(qn))return 'Due today: '+ov.finance.dueTodayUnits+' units · '+money(ov.finance.dueTodayAmount)+'.';
 if(/spa/.test(qn))return 'SPA completed: '+ov.documents.spaCompleted+' · Pending: '+ov.documents.spaPending+'.';
 if(/oqood/.test(qn))return 'Oqood completed: '+ov.documents.oqoodCompleted+' · Pending: '+ov.documents.oqoodPending+'.';
 if(/dld/.test(qn))return 'DLD completed: '+ov.documents.dldCompleted+' · Pending: '+ov.documents.dldPending+'.';
 return 'The AI interpreter is temporarily unavailable. Please retry in a moment. No CRM data was changed.';
}

function add(role,text,meta){var box=document.querySelector('#askCrmPreviewPanel .ask-crm-messages');if(!box)return;var wrap=document.createElement('div');wrap.className='ask-crm-msg '+(role==='user'?'ask-crm-user':'ask-crm-bot');var bubble=document.createElement('div');bubble.className='ask-crm-bubble';txt(text).split('\n').forEach(function(line,i){if(i)bubble.appendChild(document.createElement('br'));bubble.appendChild(document.createTextNode(line))});wrap.appendChild(bubble);if(meta){var m=document.createElement('div');m.className='ask-crm-meta';m.textContent=meta;wrap.appendChild(m)}box.appendChild(wrap);box.scrollTop=box.scrollHeight;var body=document.querySelector('#askCrmPreviewPanel .ask-crm-body');if(body)body.scrollTop=body.scrollHeight;return wrap}
async function submit(q){
 q=txt(q).trim();if(!q)return;var form=document.querySelector('#askCrmPreviewPanel form'),field=form&&form.querySelector('input'),btn=form&&form.querySelector('button');add('user',q);history.push({role:'user',content:q});if(history.length>10)history=history.slice(-10);if(field){field.value='';field.disabled=true}if(btn){btn.disabled=true;btn.textContent='…'}var wait=add('bot','Understanding your question and checking live CRM data…','AI read-only preview');
 try{var snap=await snapshot(q),answer;try{answer=await askAI(q,snap)}catch(e){console.warn('Ask CRM AI fallback',e);answer=fallback(q,snap)}if(wait)wait.remove();add('bot',answer,'AI · Live CRM · Read-only');history.push({role:'assistant',content:answer});if(history.length>10)history=history.slice(-10)}
 catch(e){if(wait)wait.remove();add('bot','I could not read the CRM data for that question. '+(e&&e.message?e.message:String(e)),'No changes were made')}
 finally{if(field){field.disabled=false;field.focus()}if(btn){btn.disabled=false;btn.textContent='Send'}}
}

function upgrade(){
 var panel=document.getElementById('askCrmPreviewPanel'),launcher=document.getElementById('askCrmPreviewLauncher');if(!panel||!launcher){setTimeout(upgrade,120);return}
 var badge=panel.querySelector('.ask-crm-badge'),intro=panel.querySelector('.ask-crm-intro'),field=panel.querySelector('input'),form=panel.querySelector('form'),chips=panel.querySelector('.ask-crm-chips');
 if(badge)badge.textContent='AI · Read-only';if(intro)intro.textContent='Ask naturally about your CRM — combine customer names, unit numbers, salespeople, Direct/Broker source, payments, dates, documents, collections, extensions, tasks and more.';if(field)field.placeholder='Ask anything about your CRM data…';
 if(chips){chips.innerHTML='';['How many 2BR units did Farhan sell?','Which direct customers are overdue?','What has A3-902 paid so far?','Who has payment due in the next 7 days?'].forEach(function(q){var b=document.createElement('button');b.type='button';b.className='ask-crm-chip';b.textContent=q;b.onclick=function(e){e.preventDefault();submit(q)};chips.appendChild(b)})}
 form.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();submit(field.value)},true);
 window.__askCrmPreviewAsk=async function(q){var snap=await snapshot(q);try{return await askAI(q,snap)}catch(e){return fallback(q,snap)}};
 function visibility(){var ok=window.state&&(state.userRole==='crm_officer'||state.userRole==='manager');launcher.hidden=!ok;if(!ok)panel.classList.remove('open')}
 visibility();new MutationObserver(visibility).observe(document.body,{childList:true,subtree:true});
}

upgrade();
})();