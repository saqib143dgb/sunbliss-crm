const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../payment_report_model'),X=require('../payment_report_export'),ExcelJS=require('exceljs');
function fixture(){return {units:[{id:1,unit_no:'TEST',customer_id:1,total_price:1000,status:'Sold'}],customers:[{id:1,customer_name:'Test Customer'}],sales:[{id:1,unit_id:1,customer_id:1,commercial_sale_price:1000}],schedule:[{id:1,unit_id:1,customer_id:1,stage_name:'Booking',due_amount:100,paid_amount:100,due_date:'2026-01-01'},{id:2,unit_id:1,customer_id:1,stage_name:'First Installment',due_amount:300,paid_amount:0,due_date:'2026-09-30'},{id:3,unit_id:1,customer_id:1,stage_name:'Final',due_amount:600,paid_amount:0,due_date:'2027-01-01'}],transactions:[{id:1,unit_id:1,customer_id:1,payment_schedule_id:1,payment_type:'Booking',amount:100,payment_date:'2026-01-01'}],credits:[],extensions:[]};}
const entry=d=>M.build(d,'2026-09-21')[0];
function pay(d,i,n){d.schedule[i].paid_amount=n;d.transactions.push({unit_id:1,customer_id:1,payment_schedule_id:d.schedule[i].id,amount:n,payment_type:'Installment',payment_date:'2026-01-01'});}
test('receipt narrative never suppresses cash; linked fees excluded from property and tracked separately',()=>{const d=fixture();d.transactions[0].remarks='no formal credit note found';d.schedule.push({id:4,unit_id:1,customer_id:1,stage_name:'DLD + Admin',due_amount:40});d.transactions.push({unit_id:1,customer_id:1,payment_schedule_id:4,payment_type:'DLD + Admin Fees',amount:40,payment_date:'2026-01-01'});const e=entry(d);assert.equal(e.cash,100);assert.equal(e.feeAmount,40);assert.equal(e.feeCash,40);assert.equal(e.feeBalance,0);});
test('approved discount applied once with issued credit',()=>{const d=fixture();d.sales[0].commercial_sale_price=900;d.credits.push({unit_id:1,customer_id:1,payment_schedule_id:1,amount:10});const e=entry(d);assert.equal(e.balance,800);assert.equal(e.pendingAdjustment,90);assert.equal(e.reconciliation,0);assert.equal(e.schedule.finalBalance,540);});
test('consolidated discount and referral do not reduce final twice',()=>{const d=fixture();d.sales[0].commercial_sale_price=900;d.sales[0].commercial_non_cash_settlement=20;d.credits.push({unit_id:1,customer_id:1,payment_schedule_id:2,amount:120});const e=entry(d);assert.equal(e.schedule.finalBalance,600);assert.equal(e.balance,780);assert.equal(e.reconciliation,0);});
test('excess payment carries to next installment',()=>{const d=fixture();d.schedule[0].paid_amount=120;d.transactions[0].amount=120;const e=entry(d);assert.equal(e.schedule.constructionBalance,280);assert.equal(e.rows[1].carry,20);assert.equal(e.balance,880);});
test('one-fils threshold and legacy paid status',()=>{const d=fixture();pay(d,1,299.98);d.schedule[1].status='Paid';assert.equal(entry(d).schedule.constructionOpenCount,1);d.transactions[1].amount=299.99;d.schedule[1].paid_amount=299.99;assert.equal(entry(d).schedule.constructionOpenCount,0);});
test('rounding explicitly reconciles to price',()=>{const d=fixture();d.schedule[1].due_amount=299.5;const e=entry(d);assert.equal(e.roundingAdjustment,.5);assert.equal(e.balance,900);assert.equal(e.reconciliation,0);});
test('cancelled accounts and other customers excluded',()=>{const d=fixture();d.transactions.push({unit_id:1,customer_id:2,amount:200});assert.equal(entry(d).cash,100);d.units[0].status='Cancelled';assert.equal(M.build(d).length,0);});
test('refunds reduce cash; voids excluded',()=>{const d=fixture();d.transactions.push({unit_id:1,customer_id:1,payment_schedule_id:1,amount:20,payment_type:'Refund'},{unit_id:1,customer_id:1,amount:999,payment_type:'Void'});d.schedule[0].paid_amount=80;assert.equal(entry(d).cash,80);assert.equal(entry(d).balance,920);});
test('extension changes overdue split but not deadline',()=>{const d=fixture();d.schedule[1].due_date='2026-08-01';d.extensions.push({unit_id:1,customer_id:1,payment_schedule_id:2,status:'active',extended_due_date:'2026-10-01',approved_on:'2026-08-01'});const e=entry(d);assert.equal(e.overdue,0);assert.equal(e.upcoming,300);assert.equal(e.schedule.deadline,'2026-08-01');});
test('missing ledger receipts flagged and input stays unchanged',()=>{const d=fixture();d.transactions=[];const before=JSON.stringify(d);assert.equal(entry(d).schedule.completionCode,'review');assert.equal(JSON.stringify(d),before);});
test('revised zero is respected',()=>{const d=fixture();d.schedule[1].revised_due_amount=0;assert.ok(!entry(d).rows.some(r=>r.id===2));});
test('workbook has only dynamic Dashboard and Details sheets',async()=>{const d=fixture();d.schedule.push({id:4,unit_id:1,customer_id:1,stage_name:'DLD + Admin Fees (SPA)',due_amount:40,paid_amount:25,due_date:'2026-01-01'});d.transactions.push({unit_id:1,customer_id:1,payment_schedule_id:4,payment_type:'DLD + Admin Fees',amount:25,payment_date:'2026-01-01'});const e=entry(d),w=X.buildWorkbook(ExcelJS,[e],{date:'2026-09-21',filters:'Pending due by Dec 2026'}),b=await w.xlsx.writeBuffer(),out=new ExcelJS.Workbook();await out.xlsx.load(b);assert.deepEqual(out.worksheets.map(s=>s.name),['Dashboard','Details']);const dash=out.getWorksheet('Dashboard'),details=out.getWorksheet('Details');assert.equal(details.getCell('B6').value,'Test Customer');assert.match(details.getCell('A3').value,/due by/);assert.equal(details.getCell('L6').value,40);assert.equal(details.getCell('M6').value,25);assert.equal(details.getCell('N6').value,15);assert.match(dash.getCell('C6').value.formula,/SUBTOTAL\(109,Details!F6:F6\)/);assert.equal(dash.getCell('C6').value.result,1000);assert.equal(dash.getCell('A16').value.result,40);assert.equal(dash.getCell('D16').value.result,25);assert.equal(dash.getCell('G16').value.result,15);});

test('export-only AED 7000 tolerance marks pre-handover status completed without changing actual balance',async()=>{
  const e=entry(fixture());
  assert.equal(e.schedule.completionCode,'pending');
  assert.equal(e.schedule.constructionBalance,300);
  const w=X.buildWorkbook(ExcelJS,[e],{date:'2026-09-21',filters:'All customers'});
  const b=await w.xlsx.writeBuffer(),out=new ExcelJS.Workbook();await out.xlsx.load(b);
  const d=out.getWorksheet('Details');
  assert.equal(d.getCell('E6').value,'Completed');
  assert.equal(d.getCell('K6').value,300);
  assert.equal(d.getCell('P6').value,0);
  assert.equal(d.getCell('F6').numFmt,'#,##0.00');
});
test('export tolerance boundary is inclusive at AED 7000 and pending above it',async()=>{
  const a=entry(fixture()),b=entry(fixture());
  a.unitNo='A';a.schedule.constructionBalance=7000;
  b.unitNo='B';b.schedule.constructionBalance=7000.01;
  const w=X.buildWorkbook(ExcelJS,[a,b],{date:'2026-09-21',filters:'All customers'});
  const buf=await w.xlsx.writeBuffer(),out=new ExcelJS.Workbook();await out.xlsx.load(buf);
  const d=out.getWorksheet('Details');
  assert.equal(d.getCell('E6').value,'Completed');
  assert.equal(d.getCell('E7').value,'Pending');
  assert.equal(d.getCell('K6').value,7000);
  assert.equal(d.getCell('K7').value,7000.01);
});
