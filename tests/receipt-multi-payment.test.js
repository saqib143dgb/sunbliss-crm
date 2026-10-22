const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('welcome-letter.html','utf8');
const start=html.indexOf('function selectedReceiptTransactions(){');
const end=html.indexOf('function renderReceipt(){',start);
assert(start>0&&end>start,'receipt source functions are present');
const source=html.slice(start,end);
const mockRows=[
 {id:10,amount:10000,payment_date:'2026-10-20',payment_type:'1st Installment',payment_schedule_id:50,payment_reference:'TRF-A',accounts_confirmation_status:'confirmed'},
 {id:11,amount:4200,payment_date:'2026-10-21',payment_type:'DLD + Admin Fees',payment_schedule_id:51,payment_reference:'CHQ-B',accounts_confirmation_status:'confirmed'},
 {id:12,amount:3500,payment_date:'2026-10-21',payment_type:'2nd Installment',payment_schedule_id:52,payment_reference:'PENDING',accounts_confirmation_status:'pending'}
];
function makeContext(ids=[10,11],changes={}){
 const values={receiptNo:'100',date:'2026-10-22',instrument:'Online',bank:'',reference:'TRF-A',...changes};
 const ctx={
  crmContext:{documentType:'receipt',transactions:mockRows,paymentSchedule:[
   {id:50,stage_name:'1st Installment'},
   {id:51,stage_name:'DLD + Admin Fees'},
   {id:52,stage_name:'2nd Installment'}
  ],customer:{customer_name:'Demo Customer'},unit:{unit_no:'TEST-001',unit_type:'2BR'}},
  document:{querySelectorAll:()=>ids.map(id=>({value:String(id)}))},
  val:name=>values[name]||'',
  values:()=>({customer:'Demo Customer',unit:'TEST-001',type:'2BR',amount:mockRows.filter(t=>ids.includes(t.id)&&t.accounts_confirmation_status==='confirmed').reduce((sum,t)=>sum+t.amount,0)}),
  receiptCustomerDetails:()=>({address:'Dubai',contact:'0500000000',area:'1200'}),
  clean:t=>String(t??''),
  money:n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2}),
  amountWords:()=> 'Fourteen thousand two hundred UAE dirhams only'
 };
 const sandbox=vm.createContext(ctx);
 vm.runInContext(source+';globalThis._selected=selectedReceiptTransactions;globalThis._scene=receiptScene;globalThis._method=receiptInstrumentType;',sandbox);
 const scene=()=>sandbox._scene((str,size)=>String(str).length*size*.5);
 return {ctx,sandbox,scene};
}
function sceneTexts(scene){return scene().filter(x=>typeof x.text==='string').map(x=>x.text).join(' ')}
test('only Accounts-confirmed selected transactions are included',()=>{
 const a=makeContext([10,11,12]);
 assert.deepEqual(Array.from(a.sandbox._selected(),x=>x.id),[10,11]);
});
test('multiple selected payments render separate instrument rows with distinct references and one combined total',()=>{
 const a=makeContext([10,11],{'receipt-method-10':'Online','receipt-method-11':'Cheque','receipt-bank-11':'Bank B'});
 const txt=sceneTexts(a.scene);
 assert.match(txt,/SPRED:100/);
 assert.match(txt,/TRF-A/);
 assert.match(txt,/CHQ-B/);
 assert.match(txt,/Bank B/);
 assert.match(txt,/Online/);
 assert.match(txt,/Escrow/);
 assert.match(txt,/Cheque/);
 assert.match(txt,/Developer/);
 assert.match(txt,/14,200/);
 assert.match(txt,/TOTAL/);
 assert.equal((txt.match(/PAYMENT RECEIPT/g)||[]).length,1);
});
test('one selected payment retains editable single receipt reference',()=>{
 const a=makeContext([10],{reference:'MANUAL-REF','receipt-reference-10':'DO-NOT-USE'});
 const txt=sceneTexts(a.scene);
 assert.match(txt,/MANUAL-REF/);
 assert.doesNotMatch(txt,/DO-NOT-USE/);
 assert.doesNotMatch(txt,/TOTAL/);
});
test('pending transaction cannot appear on a receipt',()=>{
 const a=makeContext([12]);
 assert.equal(a.sandbox._selected().length,0);
});
test('generator offers checkbox selection and shows a selected total',()=>{
 assert.match(html,/name="receiptPayment"/);
 assert.match(html,/receiptSelectionSummary/);
 assert.match(html,/Total selected amount \(AED\)/);
 assert.match(html,/txs\.reduce\(\(sum,t\)=>sum\+Math\.round\(Number\(t\.amount\)\*100\),0\)\/100/);
});