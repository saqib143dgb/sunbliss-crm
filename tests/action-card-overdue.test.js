const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function calculator(now){
 const source=fs.readFileSync('effective_action_required_patch.js','utf8');
 class Clock extends Date{constructor(...args){super(...(args.length?args:[now+'T12:00:00']))}static now(){return new Clock().getTime()}}
 const ctx={Date:Clock};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('var cache='),source.indexOf('function visibleMatches')),ctx);return (rows,credits=[],extensions=[],tasks=[],stages=[])=>ctx.build(ctx.assemble(rows,credits,extensions,tasks),{stages});
}
const rows=[{id:1,stage_name:'1st Installment',due_amount:100000,paid_amount:0,due_date:'2026-09-01'},{id:2,stage_name:'2nd Installment',due_amount:100000,paid_amount:0,due_date:'2026-10-08'}];
test('overdue remains primary as next installment counts down and joins overdue total',()=>{
 let a=calculator('2026-09-28')(rows);assert.equal(a.message,'1st Installment is overdue: AED 100,000.');assert.equal(a.upcoming,'Next installment is due in 10 days.');
 assert.equal(calculator('2026-09-29')(rows).upcoming,'Next installment is due in 9 days.');
 assert.equal(calculator('2026-10-08')(rows).upcoming,'Next installment is due today.');
 a=calculator('2026-10-09')(rows);assert.equal(a.message,'1st & 2nd Instalments are AED 100,000 & AED 100,000, total AED 200,000.');assert.equal(a.upcoming,'');
});
test('paid installments advance the action without altering financial records',()=>{
 const partial=[{...rows[0],paid_amount:99500,status:'paid'},rows[1]],before=JSON.stringify(partial),calc=calculator('2026-09-28');
 const a=calc(partial,[],[],[{schedule_id:1,status:'pending',action_label:'Follow up'}],[{id:1,carryForwardManaged:true}]);assert.equal(a.meta.stage,'2nd Installment');assert.equal(JSON.stringify(partial),before);
 assert.equal(calc([{...rows[0],paid_amount:100000},rows[1]]).meta.stage,'2nd Installment');
});
test('applied credits and carry settle installment actions',()=>{
 const calc=calculator('2026-09-28'),partial=[{...rows[0],paid_amount:99000},rows[1]];
 assert.equal(calc(partial,[{payment_schedule_id:1,amount:500}],[],[],[{id:1,carryApplied:500}]).meta.stage,'2nd Installment');
 assert.equal(calc([{...rows[0],stage_name:'DLD + Admin Fees'}],[{payment_schedule_id:1,amount:100000}]).status,'Up to date');
});
test('approved extension protects its installment without displacing unrelated overdue debt',()=>{
 const a=calculator('2026-10-09')(rows,[],[{payment_schedule_id:2,status:'active',extended_due_date:'2026-10-15'}]);assert.equal(a.meta.stage,'1st Installment');assert.equal(a.upcoming,'Next installment is due in 6 days.');
});

test('tolerance skips small balances, preserves larger overdue debt and honors revised amounts',()=>{
 const calc=calculator('2026-09-28');
 assert.equal(calc([{...rows[0],paid_amount:99886},rows[1]]).meta.stage,'2nd Installment');
 assert.equal(calc([{...rows[0],paid_amount:98999},rows[1]]).meta.stage,'1st Installment');
 assert.equal(calc([{...rows[0],revised_due_amount:90000,paid_amount:90000},rows[1]]).meta.stage,'2nd Installment');
 assert.equal(calc(rows,[],[],[],[{id:1,status:'Paid'}]).meta.stage,'2nd Installment');
});
