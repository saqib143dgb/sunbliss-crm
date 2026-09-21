/* Read-only property reconciliation. All arithmetic is in integer fils. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SunblissPaymentReport=factory();})(typeof window!=='undefined'?window:this,function(){
'use strict';
const str=v=>v==null?'':String(v), money=v=>Math.round((Number(v)||0)*100), aed=v=>v/100;
const fee=v=>/\bdld\b|admin|registration|penalt|late\s*(fee|charge)|other\s*fee/i.test(str(v));
const final=r=>/\bfinal\b|handover|possession/i.test(str(r.stage_name));
const amount=r=>money(r.revised_due_amount!=null&&r.revised_due_amount!==''?r.revised_due_amount:r.due_amount);
const date=v=>/^\d{4}-\d{2}-\d{2}/.test(str(v))?str(v).slice(0,10):'';
const sum=(xs,fn)=>xs.reduce((s,x)=>s+fn(x),0);
const key=(u,c)=>str(u)+'|'+str(c);
function reportDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Dubai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function transactionValue(t){
  const type=str(t.payment_type);
  // Narrative remarks and references do not determine whether cash exists.
  if(/bounce|void|deleted|uncleared\s*pdc|credit\s*note|carry\s*forward/i.test(type))return 0;
  if(/refund|revers/i.test(type))return -Math.abs(money(t.amount));
  return money(t.amount);
}
function build(data,asOf=reportDate()){
  const units=new Map((data.units||[]).map(u=>[str(u.id),u]));
  const customers=new Map((data.customers||[]).map(c=>[str(c.id),c]));
  const source=new Map((data.schedule||[]).map(r=>[str(r.id),r]));
  const sales=new Map();
  for(const s of data.sales||[]){const u=units.get(str(s.unit_id));if(!u||/cancel/i.test(str(u.status))||str(u.customer_id)!==str(s.customer_id))continue;
    const k=key(s.unit_id,s.customer_id),old=sales.get(k);if(!old||Number(s.id)>Number(old.id))sales.set(k,s);}
  return Array.from(sales.values()).map(s=>{
    const u=units.get(str(s.unit_id)),c=customers.get(str(s.customer_id))||{},notes=[];
    const belongs=r=>str(r.unit_id)===str(s.unit_id)&&str(r.customer_id)===str(s.customer_id);
    const feeRows=(data.schedule||[]).filter(r=>belongs(r)&&fee(r.stage_name)&&amount(r)>0);
    const feeAmount=sum(feeRows,r=>amount(r));
    const grossRows=(data.schedule||[]).filter(r=>belongs(r)&&!fee(r.stage_name)&&amount(r)>0);
    const rows=grossRows.map(r=>({id:r.id,stage:r.stage_name,isFinal:final(r),originalDate:date(r.due_date),dueDate:date(r.revised_due_date||r.due_date),collectionDate:date(r.revised_due_date||r.due_date),gross:amount(r),cash:0,issued:0,adjustment:0,rounding:0,carry:0,sourcePaid:money(r.paid_amount)}));
    const byId=new Map(rows.map(r=>[str(r.id),r]));let cash=0,unallocated=0;
    for(const t of data.transactions||[]){const linked=source.get(str(t.payment_schedule_id));const owner=t.customer_id==null&&linked?linked.customer_id:t.customer_id;
      if(str(t.unit_id)!==str(s.unit_id)||str(owner)!==str(s.customer_id)||date(t.payment_date)>asOf)continue;
      if(linked?fee(linked.stage_name):fee(t.payment_type))continue;
      const value=transactionValue(t);cash+=value;const row=byId.get(str(t.payment_schedule_id));if(row)row.cash+=value;else unallocated+=value;
    }
    let feeCash=0;
    for(const t of data.transactions||[]){const linked=source.get(str(t.payment_schedule_id));const owner=t.customer_id==null&&linked?linked.customer_id:t.customer_id;
      if(str(t.unit_id)!==str(s.unit_id)||str(owner)!==str(s.customer_id)||date(t.payment_date)>asOf)continue;
      if((linked&&fee(linked.stage_name))||(!linked&&fee(t.payment_type)))feeCash+=transactionValue(t);
    }
    let issued=0;
    for(const cn of data.credits||[]){if(!belongs(cn)||date(cn.issue_date)>asOf)continue;const linked=source.get(str(cn.payment_schedule_id));if(linked&&fee(linked.stage_name))continue;
      const value=money(cn.amount);issued+=value;const r=byId.get(str(cn.payment_schedule_id));if(r)r.issued+=value;else if(value)notes.push('Property credit is not linked to an installment.');}
    for(const ex of data.extensions||[]){if(!belongs(ex)||!/^(active|expired)$/i.test(str(ex.status))||date(ex.approved_on)>asOf)continue;const r=byId.get(str(ex.payment_schedule_id));if(r&&date(ex.extended_due_date)>r.collectionDate)r.collectionDate=date(ex.extended_due_date);}
    rows.sort((a,b)=>Number(a.isFinal)-Number(b.isFinal)||(a.dueDate||'9999').localeCompare(b.dueDate||'9999')||Number(a.id)-Number(b.id));
    const pre=rows.filter(r=>!r.isFinal),fin=rows.filter(r=>r.isFinal),gross=sum(rows,r=>r.gross);
    const spa=money(u.total_price)||gross,price=money(s.commercial_sale_price)>0?money(s.commercial_sale_price):spa;
    const discount=Math.max(0,spa-price),nonCash=Math.max(money(s.commercial_non_cash_settlement),issued-discount,0);
    let budget=Math.max(0,discount+nonCash-issued),pending=budget;
    for(const r of rows){const wanted=Math.max(0,Math.round(r.gross*discount/(spa||1))-r.issued);r.adjustment=Math.min(wanted,budget);budget-=r.adjustment;}
    const lastPre=pre[pre.length-1];if(budget&&lastPre){lastPre.adjustment+=budget;budget=0;}
    if(budget)notes.push('Approved adjustment needs an installment allocation.');
    const rounding=spa-gross;
    if(Math.abs(rounding)<=500&&lastPre)lastPre.rounding+=rounding;else if(rounding)notes.push('Schedule total differs from SPA price.');
    if(price>spa&&lastPre)lastPre.rounding+=price-spa;
    if(rows.some(r=>Math.abs(r.cash-r.sourcePaid)>1))notes.push('Receipt ledger and installment paid amounts differ.');
    let pool=unallocated;
    for(const r of rows){r.net=r.gross+r.rounding-r.issued-r.adjustment;r.remaining=r.net-r.cash;if(r.remaining<0){pool-=r.remaining;r.remaining=0;}}
    for(const r of rows){if(pool<=0)break;r.carry=Math.min(pool,r.remaining);r.remaining-=r.carry;pool-=r.carry;}
    if(pool<0)notes.push('Unallocated refund needs review.');
    const credit=Math.max(0,pool),balance=sum(rows,r=>r.remaining),check=price-cash-nonCash-balance+credit;
    if(Math.abs(check)>1)notes.push('Balance does not reconcile with agreed price.');
    const preAmount=sum(pre,r=>r.net),preBalance=sum(pre,r=>r.remaining),preCash=sum(pre,r=>Math.max(0,r.net-r.remaining)),finalAmount=sum(fin,r=>r.net),finalBalance=sum(fin,r=>r.remaining);
    const cleanFeeCash=Math.max(0,feeCash),feeBalance=Math.max(0,feeAmount-cleanFeeCash);
    const target=[30,40,50].find(t=>Math.abs(sum(pre,r=>r.gross)/(gross||1)*100-t)<=1)||null;
    if(!target||!pre.length||!fin.length)notes.push('Payment plan needs review.');
    const count=pre.filter(r=>r.remaining>1).length,finalCount=fin.filter(r=>r.remaining>1).length;
    const code=notes.length?'review':count?'pending':finalCount?'completed':'fully_paid';
    const labels={pending:'Pre-Handover Pending',completed:'Pre-Handover Completed — Final Remaining',fully_paid:'Fully Settled',review:'Review Required'};
    const maxDate=rs=>rs.map(r=>r.dueDate).filter(Boolean).sort().pop()||'';
    const schedule={planTarget:target,planLabel:target?target+'/'+(100-target):'Other',completionCode:code,completionLabel:labels[code],constructionAmount:aed(preAmount),constructionBalance:aed(preBalance),constructionSettled:aed(preAmount-preBalance),constructionCash:aed(preCash),constructionOpenCount:count,finalAmount:aed(finalAmount),finalBalance:aed(finalBalance),finalOpenCount:finalCount,totalScheduled:aed(gross),lastConstructionDue:maxDate(pre),deadline:maxDate(pre),finalDue:maxDate(fin)};
    const outRows=rows.map(r=>({...r,...Object.fromEntries(['gross','cash','issued','adjustment','rounding','carry','net','remaining'].map(k=>[k,aed(r[k])])),status:r.remaining<=1?'Settled':r.isFinal?'Final / handover':!r.collectionDate?'Undated':r.collectionDate<asOf?'Overdue':'Upcoming'}));
    return {unitId:s.unit_id,customerId:s.customer_id,unitNo:u.unit_no,customerName:c.customer_name||'',bookingDate:date(s.booking_date),asOf,schedule,rows:outRows,notes,spaPrice:aed(spa),price:aed(price),cash:aed(cash),paidPct:price?cash/price*100:0,approvedDiscount:aed(discount),nonCashSettlement:aed(nonCash),issuedCredits:aed(issued),pendingAdjustment:aed(pending),roundingAdjustment:aed(sum(rows,r=>r.rounding)),customerCredit:aed(credit),balance:aed(balance),feeAmount:aed(feeAmount),feeCash:aed(cleanFeeCash),feeBalance:aed(feeBalance),reconciliation:aed(check),overdue:aed(sum(pre.filter(r=>r.collectionDate&&r.collectionDate<asOf),r=>r.remaining)),upcoming:aed(sum(pre.filter(r=>r.collectionDate&&r.collectionDate>=asOf),r=>r.remaining)),undated:aed(sum(pre.filter(r=>!r.collectionDate),r=>r.remaining))};
  });
}
return {build,transactionValue,reportDate};
});
