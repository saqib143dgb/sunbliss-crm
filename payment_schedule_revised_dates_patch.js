(function(){
'use strict';
if(window.__sunblissPaymentScheduleRevisedDatesInstalled)return;
window.__sunblissPaymentScheduleRevisedDatesInstalled=true;
var cache={},loading={},queued=false;
function text(v){return v==null?'':String(v)}
function norm(v){return text(v).replace(/\s+/g,' ').trim().toLowerCase()}
function dubaiToday(){var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),a={};p.forEach(function(x){a[x.type]=x.value});return a.year+'-'+a.month+'-'+a.day}
function stageKey(v){
 var n=norm(v).replace(/\binstalment\b/g,'installment').replace(/^\s*\d+(?:\.\d+)?%\s*/,'').replace(/\s*[-–—]\s*\d+(?:\.\d+)?\s*%\s*$/,'').replace(/\s*\(spa\)/g,'').replace(/\s+/g,' ').trim();
 if(/dld|admin\s*fees?/.test(n))return'dld';if(/down\s*payment/.test(n))return'down payment';if(/^final\b/.test(n))return'final';
 return n;
}
function unitId(){if(!window.state||!state.selectedUnit)return null;var p=String(state.selectedUnit).split('::');return p.length>1&&Number(p[1])?Number(p[1]):null}
function customer(){if(!window.state||!state.selectedUnit||!Array.isArray(state.dues))return null;return state.dues.find(function(c){return c&&(text(c.unit)+'::'+text(c.sno))===text(state.selectedUnit)})||null}
function iso(v){var s=text(v).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(s)?s:''}
function dateObject(v){var s=iso(v),d=s?new Date(s+'T00:00:00'):null;return d&&!isNaN(d.getTime())?d:null}
function date(v){var d=dateObject(v);return d?d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'2-digit'}):text(v)}
function money(v){return typeof window.fmtAED==='function'?window.fmtAED(Number(v)||0):'AED '+(Number(v)||0).toLocaleString('en-US',{maximumFractionDigits:2})}
function styles(){if(document.getElementById('paymentScheduleRevisedDateStyles'))return;var s=document.createElement('style');s.id='paymentScheduleRevisedDateStyles';s.textContent='.stage-date-adjustment,.stage-amount-adjustment{display:flex;justify-content:space-between;gap:6px;margin:2px 0 4px;font-size:10px;line-height:1.35;flex-wrap:nowrap;white-space:nowrap}.stage-date-adjustment span:first-child,.stage-amount-adjustment span:first-child{color:var(--muted)}.stage-date-adjustment span:last-child,.stage-amount-adjustment span:last-child{font-family:IBM Plex Mono,monospace;text-align:right;font-weight:700;white-space:nowrap}.stage-date-adjustment.revised span:last-child,.stage-amount-adjustment.revised span:last-child{color:var(--amber,#9C5A12)}.stage-date-adjustment.extended span:last-child{color:var(--gold-deep,#8F6A1E)}';document.head.appendChild(s)}
async function load(uid,force){
 var k=String(uid),hit=cache[k];
 if(!force&&hit&&Date.now()-hit.at<5000)return hit.data;
 if(loading[k])return loading[k];
 loading[k]=(async function(){
  var q=await Promise.all([
   sb.from('payment_schedule').select('id,stage_name,due_amount,revised_due_amount,due_date,revised_due_date,paid_amount,status,revision_approved_on,revision_approved_by,revision_reference').eq('unit_id',uid),
   sb.from('payment_extensions').select('payment_schedule_id,extended_due_date,status').eq('unit_id',uid),
   sb.from('credit_notes').select('payment_schedule_id,amount').eq('unit_id',uid)
  ]);
  q.forEach(function(r){if(r.error)throw r.error});
  var ext={},today=dubaiToday();
  (q[1].data||[]).forEach(function(e){
   var d=iso(e.extended_due_date);
   if(e.status==='active'&&d>=today)ext[String(e.payment_schedule_id)]=d;
  });
  var rows={},byLabel={},credits={};
  (q[0].data||[]).forEach(function(r){
   rows[String(r.id)]=r;
   var label=stageKey(r.stage_name);
   (byLabel[label]=byLabel[label]||[]).push(r);
  });
  (q[2].data||[]).forEach(function(c){
   var k=String(c.payment_schedule_id),n=Number(c.amount)||0;
   credits[k]=(credits[k]||0)+n;
  });
  var data={rows:rows,byLabel:byLabel,extensions:ext,credits:credits};
  cache[k]={at:Date.now(),data:data};delete loading[k];return data;
 })().catch(function(e){delete loading[k];throw e});
 return loading[k];
}
function scheduleForCard(card,data,stage){
 var title=card.querySelector('.stage-name'),key=stageKey(title&&title.textContent);
 if(!key)return null;
 var matches=data.byLabel[key]||[];
 // An exact stage label takes priority over the array index: split installments
 // can share a code but each requires its own schedule ID and effective due date.
 if(matches.length===1)return matches[0];
 if(matches.length>1&&stage&&data.rows[String(stage.id)]){
  var specific=data.rows[String(stage.id)];
  if(stageKey(specific.stage_name)===key)return specific;
 }
 return null;
}
function byRow(card){var rows=card.querySelectorAll('.stage-row');for(var i=0;i<rows.length;i++){var a=rows[i].querySelector('span:first-child');if(a&&norm(a.textContent).replace(/:\s*$/,'')==='by')return rows[i]}return null}
function dueRow(card){var rows=card.querySelectorAll('.stage-row');for(var i=0;i<rows.length;i++){var a=rows[i].querySelector('span:first-child');if(a&&norm(a.textContent).replace(/:\s*$/,'')==='due')return rows[i]}return null}
function addAmountRow(after,label,value){var r=document.createElement('div');r.className='stage-amount-adjustment revised';r.innerHTML='<span></span><span></span>';r.children[0].textContent=label;r.children[1].textContent=money(value);after.insertAdjacentElement('afterend',r);return r}
function addRow(after,label,value,cls){var r=document.createElement('div');r.className='stage-date-adjustment '+cls;r.innerHTML='<span></span><span></span>';r.children[0].textContent=label;r.children[1].textContent=date(value);after.insertAdjacentElement('afterend',r);return r}
function syncStamp(card,row,stage,effective,credits){
 var stamp=card&&card.querySelector('.stamp');if(!stamp||!row)return;
 var due=row.revised_due_amount!==null&&row.revised_due_amount!==undefined?Number(row.revised_due_amount):Number(row.due_amount);
 var settled=(Number(row.paid_amount)||0)+(Number(credits[String(row.id)])||0);
 if(stage&&Number(stage.id)===Number(row.id)&&isFinite(Number(stage.settledAmount)))settled=Math.max(settled,Number(stage.settledAmount));
 var status='pending',dateDue=iso(effective);
 if(!isFinite(due)||due<=0)status='na';
 else if(norm(row.status)==='paid'||settled>=due-1)status='paid';
 else if(stage&&Number(stage.id)===Number(row.id)&&stage.accountsConfirmationPending)status='recorded';
 else if(settled>0.01)status='partial';
 else status=dateDue&&dateDue<dubaiToday()?'overdue':dateDue?'upcoming':'pending';
 ['paid','partial','overdue','upcoming','pending','na'].forEach(function(x){stamp.classList.remove('is-'+x)});
 stamp.classList.add('is-'+(status==='recorded'?'pending':status));
 stamp.textContent=status==='recorded'?'Payment Recorded':({paid:'Paid',partial:'Partial',overdue:'Overdue',upcoming:'Upcoming',pending:'Pending',na:'N/A'}[status]||'Pending');
}
async function decorate(force){
 queued=false;styles();
 if(!window.state||!window.sb||state.view!=='detail')return;
 var c=customer(),uid=unitId(),detail=document.querySelector('.detail');
 if(!c||!uid||!detail)return;
 var key=text(state.selectedUnit);
 try{
  var data=await load(uid,!!force);
  if(!window.state||state.view!=='detail'||text(state.selectedUnit)!==key)return;
  var cards=detail.querySelectorAll('.ledger-scroll .stage-card');
  cards.forEach(function(card,index){
   card.querySelectorAll('.stage-date-adjustment,.stage-amount-adjustment').forEach(function(x){x.remove()});
   var estimated=c.stages&&c.stages[index],row=scheduleForCard(card,data,estimated);
   if(!row)return;
   var stage=(c.stages||[]).find(function(s){return s&&Number(s.id)===Number(row.id)})||null;
   var anchor=byRow(card),dueAnchor=dueRow(card);
   if(!anchor)return;
   var contractual=iso(row.due_date),revised=iso(row.revised_due_date),
    extended=data.extensions[String(row.id)]||'',contractualAmount=Number(row.due_amount)||0,
    revisedAmount=row.revised_due_amount===null||row.revised_due_amount===undefined?null:Number(row.revised_due_amount);
   if(dueAnchor){
    var dueSpans=dueAnchor.querySelectorAll('span');
    if(dueSpans[1])dueSpans[1].textContent=money(contractualAmount);
    if(revisedAmount!==null&&isFinite(revisedAmount)&&Math.abs(revisedAmount-contractualAmount)>0.004)addAmountRow(dueAnchor,'Revised amount',revisedAmount);
   }
   if(contractual){
    var anchorSpans=anchor.querySelectorAll('span');
    if(anchorSpans[1])anchorSpans[1].textContent=date(contractual);
   }
   var last=anchor;
   if(revised&&revised!==contractual)last=addRow(last,'Revised to',revised,'revised');
   if(extended)last=addRow(last,'Extended to',extended,'extended');
   syncStamp(card,row,stage,extended||revised||contractual,data.credits);
  });
 }catch(e){console.warn('Could not show revised payment dates',e)}
}
function schedule(force){if(force){var uid=unitId();if(uid)delete cache[String(uid)]}if(queued)return;queued=true;requestAnimationFrame(function(){decorate(!!force)})}
function install(){if(!window.state||!window.sb||typeof window.renderDetail!=='function'){setTimeout(install,70);return}var rd=window.renderDetail;window.renderDetail=function(){var x=rd.apply(this,arguments);schedule(false);return x};document.addEventListener('click',function(e){if(e.target&&e.target.closest&&e.target.closest('#extSave,#ieSave,#scSave,#rppSave'))setTimeout(function(){schedule(true)},180)},true);window.addEventListener('pageshow',function(){schedule(false)});schedule(true)}
install();
})();
