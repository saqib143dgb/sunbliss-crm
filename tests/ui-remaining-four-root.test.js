const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const cancel=fs.readFileSync('unit_detail_workflow_patch.js','utf8');
const modification=fs.readFileSync('modification_requests_patch.js','utf8');
const response=fs.readFileSync('customer_payment_response_patch.js','utf8');
const scheduled=fs.readFileSync('scheduled_actions_patch.js','utf8');
const legacy=fs.readFileSync('scheduled_actions_full_page_guard.js','utf8');

function block(source,start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0,'Missing '+start);assert.ok(b>a,'Missing '+end);return source.slice(a,b);
}
function allRegex(src,words){for(const w of words)assert.ok(src.includes(w),'Missing '+w);}
test('all four updated sources compile without changing data or dates',()=>{
 [cancel,modification,response,scheduled,legacy].forEach(x=>new vm.Script(x));
});
test('Cancel Unit has source-owned fixed header and portaled scroll card',()=>{
 allRegex(cancel,['function cancellationRootUi(panel)','crm-cancel-head','crm-cancel-back','crm-cancel-scroll','crm-cancel-actions',"cancellationRootUi(panel);","closeCancellationUi(panel);"]);
 assert.match(cancel,/z-index:30100!important/);
 assert.match(cancel,/flex:1 1 auto!important;min-height:0!important/);
 assert.match(cancel,/border-bottom:0!important;border-radius:14px 14px 0 0!important/);
 assert.match(cancel,/padding:12px 16px calc\(32px \+ env\(safe-area-inset-bottom\)\)!important/);
 assert.match(cancel,/flex-direction:row!important;align-items:stretch!important;gap:10px!important/);
});
test('Cancel Unit remains financially and date identical',()=>{
 for(const id of ['cuDate','cuType','cuReason','cuSettlement','cuRefundAmount','cuForfeitedAmount','cuRemarks','cuConfirm','cuKeep'])
   assert.ok(cancel.includes(id),id);
 assert.match(cancel,/'<label class="brand-field">Cancellation date<input type="date" id="cuDate" value="' \+ todayISO\(\)/);
 assert.match(cancel,/sb\.rpc\('crm_cancel_unit',\{/);
 for(const k of ['p_unit_id','p_cancellation_date:date','p_cancellation_type:type','p_refund_amount:refund','p_forfeited_amount:forfeited'])assert.ok(cancel.includes(k),k);
 assert.match(cancel,/refund \+ forfeited > paid \+ 0\.01/);
 const ui=block(cancel,'function cancellationRootUi(panel)','function showCancellationPanel(c)');
 assert.doesNotMatch(ui,/sb\.(?:rpc|from)\(|\.value\s*=/);
});
test('Record Customer Response uses approved header, border and footer with mobile-only CSS',()=>{
 allRegex(response,['class="cpr-back"','id="cprBack"','class="cpr-head-content"','class="cpr-body"','class="cpr-foot"','var back=p.querySelector(\'#cprBack\')']);
 assert.match(response,/@media\(max-width:1023px\)/);
 assert.match(response,/border-bottom:0!important;border-radius:14px 14px 0 0!important/);
 assert.match(response,/grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
 assert.match(response,/border-radius:999px!important/);
 assert.match(response,/calc\(32px \+ env\(safe-area-inset-bottom\)\)/);
});
test('Record Customer Response preserves all outcomes, original date defaults and RPCs',()=>{
 for(const id of ['cprSchedule','cprOutcome','cprNote','cprNextDate','cprParts','cprSave','cprClose'])assert.ok(response.includes(id),id);
 allRegex(response,["safe(addDays(3))",'function syncOutcome()','function saveResponse(c)','function partRow(n)','function parts()']);
 assert.match(response,/crm_create_payment_extension_request/);
 assert.match(response,/crm_record_customer_payment_response/);
 assert.match(response,/p_requested_until:nextDate/);
 assert.match(response,/p_next_date:\(outcome==='will_pay_later'\|\|outcome==='no_response'\)\?nextDate:null/);
});
test('Modification Requests list now has accessible back and fixed Close footer',()=>{
 allRegex(modification,['mrBackMain','mrFooterClose','class="mr-foot"','class="mr-heading"','mr-body','mr-content','function syncModificationFooter(p)']);
 assert.match(modification,/#modificationRequestPanel \.mr-foot/);
 assert.match(modification,/margin:0 -16px calc\(-14px - env\(safe-area-inset-bottom\)\)!important/);
 assert.match(modification,/border-bottom:0!important;border-radius:14px 14px 0 0!important/);
});
test('Modification new/edit action buttons are moved as existing nodes and desktop is untouched',()=>{
 const ui=block(modification,'function syncModificationFooter(p)','function requestCard(r)');
 assert.match(ui,/if\(!\(window\.matchMedia\?/);
 assert.match(ui,/footer\.appendChild\(fresh\)/);
 assert.match(ui,/footer\.classList\.add\('has-form-actions'\)/);
 assert.doesNotMatch(ui,/\.value\s*=|sb\.rpc/);
 assert.match(modification,/syncModificationFooter\(p\)/);
 assert.match(modification,/'#'\+panelId\+' \.mr-back,#'\+panelId\+' \.mr-foot\{display:none\}'/);
});
test('Modification existing request dates, follow-up dates, results and approvals stay unchanged',()=>{
 allRegex(modification,['id="mrDate" value="\'+safe(today())','id="mrNextDate" value="\'+safe(addDays(3))','crm_create_modification_request','crm_advance_modification_request','p_request_date:date','p_next_date:next||null','function stepForm(r)','function statusLabel(v)']);
 assert.match(modification,/if\(!date\)return fail\('Select the request date\.'\)/);
 assert.match(modification,/if\(wrap\.style\.display!=='none'&&!next\)return fail\('Select the next date\.'\)/);
});
test('Old Schedule Action stylesheet no longer overrides the source-owned mobile renderer',()=>{
 const active=scheduled.includes('function scheduledRootUi(panel)');
 assert.equal(active,true);
 for(const sel of ['#scheduledActionPanel{position:fixed','#scheduledActionPanel>.section-label:first-child{position:sticky','#scheduledActionPanel .brand-editor-actions{position:sticky','#scheduledActionPanel .brand-editor-actions button{width:100%'])
   assert.ok(legacy.includes('body:not(.crm-scheduled-ui-open) '+sel),'legacy rule should be disabled for current UI: '+sel);
 assert.match(scheduled,/crm-scheduled-back/);
 assert.match(scheduled,/crm-scheduled-actions/);
});
test('Scheduled task due dates and all saved workflow branches remain source-owned and unchanged',()=>{
 for(const term of ["task?task.due_date:''","id=\"saDate\" value","crm_record_scheduled_outcome","crm_resolve_payment_workflow_task","crm_create_partial_payment_commitment","crm_record_extension_customer_response","function scheduledRootUi(panel)"])assert.ok(scheduled.includes(term),term);
 assert.match(scheduled,/body\.crm-scheduled-ui-open>#scheduledActionPanel/);
 assert.match(scheduled,/flex-direction:row!important;align-items:stretch!important;gap:10px!important/);
});
test('No new late CSS script is registered; all UI updates are in original screen sources',()=>{
 const build=fs.readFileSync('build.js','utf8');
 assert.doesNotMatch(build,/cancel_modification_response_mobile_patch/);
 for(const src of [cancel,modification,response,legacy])assert.doesNotMatch(src,/\/rest\/v1\/|setInterval\(|new WebSocket/);
});
