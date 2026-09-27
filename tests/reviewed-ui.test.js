const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('welcome_documents_patch.js','utf8');
const snapshot=source.slice(source.indexOf('function documentSnapshot('),source.indexOf('async function context(c)'));
test('document snapshot preserves calendar dates and leaves live account unchanged',()=>{
 const old=process.env.TZ;process.env.TZ='Asia/Dubai';
 try{
  const result=vm.runInNewContext(snapshot+`;const account={stages:[{dueDate:new Date(2026,8,10),paidDate:new Date(2026,8,11),due:10000,paid:1000}],info:{dob:new Date(1985,0,2)}};const copy=documentSnapshot(account);JSON.stringify({copy,originalIsDate:account.stages[0].dueDate instanceof Date});`);
  const data=JSON.parse(result);assert.equal(data.copy.stages[0].dueDate,'2026-09-10');assert.equal(data.copy.stages[0].paidDate,'2026-09-11');assert.equal(data.copy.info.dob,'1985-01-02');assert.equal(data.copy.stages[0].paid,1000);assert.equal(data.originalIsDate,true);
 }finally{if(old===undefined)delete process.env.TZ;else process.env.TZ=old;}
});
const html=fs.readFileSync('welcome-letter.html','utf8');
const validation=html.slice(html.indexOf('function documentValidation()'),html.indexOf('function render(){if(!crmContext)return;'));
function validate(kind,tx,fields){return vm.runInNewContext(validation+'documentValidation()', {crmContext:{documentType:kind},selectedTx:()=>tx,val:id=>fields[id]||''});}
test('receipt cannot preview or export missing payment, receipt number or method',()=>{
 assert.match(validate('receipt',null,{date:'2026-09-26'}),/payment/);
 assert.match(validate('receipt',{amount:0},{date:'2026-09-26'}),/payment/);
 assert.match(validate('receipt',{amount:100},{date:'2026-09-26'}),/number/);
 assert.match(validate('receipt',{amount:100},{date:'2026-09-26',receiptNo:'123'}),/method/);
 assert.equal(validate('receipt',{amount:100},{date:'2026-09-26',receiptNo:'123',instrument:'Online'}),'');
 assert.equal(validate('soa',null,{date:'2026-09-26'}),'');
});
