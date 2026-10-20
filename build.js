const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE = path.join(ROOT, 'vendor', 'base');
const OUT = path.join(ROOT, 'dist');
const TEXT_FILES = ['index.html', ...Array.from({ length: 13 }, (_, i) => `chunk_${String(i).padStart(2, '0')}.js`)];
const OPTIONAL_BINARY_FILES = ['letterhead.jpg'];
const LOCAL_STATIC_FILES = ['apple-touch-icon.png','apple-touch-icon-v2.png','apple-touch-icon-v3.png','test_mode_bootstrap.js','test_document_watermark.js','assets/inter-latin-variable.woff2','assets/Inter-LICENSE.txt','welcome-letter.html','welcome-pdf-lib.js','spa-generator.html','spa-reference.pdf','desktop_header_approved.css','assets/sunbliss-desktop-header-approved-20260914.png','section_headers.css','assets/purvanchal-p-logo.svg','assets/purvanchal-p-dubai.png','assets/purvanchal-p-desktop-previous.png','assets/purvanchal-p-thin-ring.png','assets/sunbliss-mobile-header-background.webp','assets/sunbliss-mobile-skyline-6bf2fc29.jpeg'];
const LOCAL_REPLACEMENT_FILES = { 'chunk_11.js': 'auth_core_replacement.js' };
const LOCAL_BROWSER_VENDOR_FILES = {
  'vendor/xlsx.full.min.js': path.join(ROOT,'node_modules','xlsx','dist','xlsx.full.min.js'),
  'vendor/exceljs.min.js': path.join(ROOT,'node_modules','exceljs','dist','exceljs.min.js'),
  'vendor/pdf.min.js': path.join(ROOT,'node_modules','pdfjs-dist','build','pdf.min.js'),
  'vendor/pdf.worker.min.js': path.join(ROOT,'node_modules','pdfjs-dist','build','pdf.worker.min.js'),
  'vendor/supabase.js': path.join(ROOT,'node_modules','@supabase','supabase-js','dist','umd','supabase.js')
};
const PRELOAD_PATCH_FILES = ['mutation_observer_guard_patch.js','smooth_navigation_preview_patch.js','overview_kpi_countup_patch.js','header_shadow_stability_patch.js','desktop_skyline_stability_preload.js'];
const LOCAL_PATCH_FILES = [
  'feature_patch.js','detail_menu_patch.js','hide_duplicate_payment_patch.js','transaction_ui_refine_patch.js','primary_contact_patch.js','insights_chart_responsive_patch.js','search_focus_patch.js','sales_channel_source_truth_patch.js','sales_channel_drilldown_patch.js','rm_detail_patch.js','broker_detail_patch.js','conditional_brokerage_patch.js','units_action_toolbar_patch.js','bottom_nav_patch.js','footer_surface_patch.js','mobile_input_zoom_patch.js','unit_detail_workflow_patch.js','detail_action_cleanup_patch.js','compliance_editor_patch.js','action_required_patch.js','sequenced_payment_labels_patch.js','extra_installments_patch.js','persistent_back_patch.js','new_customer_sales_channel_patch.js','smart_new_customer_patch.js','furnishing_type_patch.js','furnishing_refresh_patch.js','installment_edit_patch.js','installment_menu_portal_patch.js','detail_render_stability_patch.js','unit_editor_patch.js','payment_detail_patch.js','payment_plan_menu_order_patch.js','units_tab_search_patch.js','dock_order_patch.js','cancelled_unit_archive_patch.js','insights_people_search_patch.js','cancelled_unit_edit_patch.js','professional_customer_statement_patch.js','payment_statement_reference_match_patch.js','credit_notes_core_patch.js','credit_notes_detail_patch.js','monthly_sales_drilldown_patch.js','inline_spa_oqood_patch.js','carry_forward_patch.js','carry_forward_audit_fix_patch.js','carry_forward_action_display_patch.js','transaction_ledger_reconciliation_patch.js','units_export_chronological_patch.js','inventory_foundation_v2_patch.js','global_detail_navigation_stability_patch.js','payment_statement_full_page_width_patch.js','payment_statement_cleanup_patch.js','full_width_print_buttons_patch.js','payment_percentage_admin_exclusion_patch.js','cancel_unit_hang_fix_patch.js','bold_headings_patch.js','crm_heading_size_patch.js','credit_note_edit_patch.js','unit_meta_inline_patch.js','transaction_record_order_patch.js','professional_header_text_v2.js','header_company_name_size_patch.js','header_dubai_skyline_patch.js','header_manual_sync_patch.js','customer_notes_patch.js','credit_note_note_lifecycle_patch.js','sale_compliance_inline_note_hide_patch.js','issued_credit_note_history_patch.js','notes_management_patch.js','monthly_cash_flow_label_patch.js','stage_integrity_and_carry_display_patch.js','overview_cleanup_patch.js','task_outcome_experience.js','scheduled_actions_patch.js','customer_payment_response_patch.js','modification_requests_patch.js','scheduled_actions_payment_link_guard_patch.js','scheduled_actions_overview_style_patch.js','automatic_payment_actions_v2_patch.js','payment_extensions_core_patch.js','payment_extensions_ui_patch.js','customer_history_patch.js','payment_extensions_uncovered_overdue_patch.js','payment_schedule_revised_dates_patch.js','payment_plan_revision_ui_patch.js','scheduled_actions_extension_filter_freeze_fix.js','extension_navigation_root_fix.js','scheduled_actions_full_page_guard.js','full_page_action_workflow_patch.js','effective_action_required_patch.js','action_required_reference_card_patch.js','scheduled_actions_filter_cleanup_patch.js','scheduled_extension_reference_card_patch.js','scheduled_extension_row_text_refine_patch.js','extension_operational_summary_patch.js','installment_menu_button_position_patch.js','global_visual_stability_patch.js','bottom_nav_float_spacing_patch.js','bottom_nav_viewport_anchor_patch.js','bottom_nav_smooth_shadow_patch.js','desktop_exact_preview_observer_guard.js','desktop_responsive_crm_patch.js','desktop_executive_shell_preview_patch.js','desktop_reference_exact_v2_patch.js','desktop_reference_header_exact_patch.js','desktop_header_brand_remove_patch.js','desktop_overview_flicker_guard_patch.js','mobile_header_background_patch.js','empty_installment_visibility_patch.js','overview_kpi_countup_patch.js','record_payment_reliability_patch.js','transaction_integrity_reliability_patch.js','transaction_action_menu_root_fix.js','payment_tolerance_aed_1000_patch.js','payment_schedule_source_truth_patch.js','detail_action_unification_patch.js','installment_partial_order_patch.js','record_payment_save_delegate_patch.js','desktop_contact_sales_split_patch.js','manager_visit_history_patch.js','welcome_documents_patch.js','carry_only_status_display_fix_patch.js','binary_compliance_status_patch.js','inline_compliance_full_page_fix_patch.js','atomic_new_customer_save_patch.js','customer_workspace_interactions_patch.js','crm_render_readiness_patch.js','overview_kpi_drilldown_patch.js','desktop_deep_page_shell_patch.js','desktop_units_sold_donut_kpi_patch.js','reference_layout_viewport_patch.js','overview_reconciliation_patch.js','spa_workflow_patch.js','test_mode_ui.js','unit_type_breakdown_patch.js','instagram_pill_proportions_patch.js','inventory_layout_refinement_patch.js','customer_editor_mobile_reference_patch.js','payment_plan_mobile_reference_patch.js','payment_revision_mobile_reference_patch.js','unit_editor_mobile_reference_patch.js','customer_scheduled_tasks_pill_patch.js','lib/price_revision_core.js','lib/spa_credit_issuance_readiness.js','lib/spa_financial_reconciliation_source.js','spa_price_revision_ui_patch.js'
];
const RUNTIME_PATCH_FILES = LOCAL_PATCH_FILES.filter(file => !PRELOAD_PATCH_FILES.includes(file));
const CORE_BUNDLE_FILE = 'core.bundle.js';
const UI_BUNDLE_FILE = 'ui.bundle.js';
function requireFile(filePath,label){if(!fs.existsSync(filePath))throw new Error(`${label} is missing: ${path.relative(ROOT,filePath)}. Run "npm run vendor:base" only when intentionally refreshing the frozen base snapshot.`);}
// Current booking reads are isolated from historical buyers. Archive readers
// intentionally use the base tables; writes always retain the original targets.
function currentBookingReads(source,file){
  if(file==='chunk_09.js'){
    var oldSort='state.sortBy==="received"?p.sort(function(t,e){return(e.c.received||0)-(t.c.received||0)}):p.sort(function(t,e){var o=t.c.outstanding===null?0:t.c.outstanding,d=e.c.outstanding===null?0:e.c.outstanding;return o-d})';
    if(source.indexOf(oldSort)<0)throw new Error('Units list sort anchor changed');
    source=source.replace(oldSort,'p.sort(function(t,e){var a=Date.parse(t.c.info&&t.c.info.bookingDate)||0,b=Date.parse(e.c.info&&e.c.info.bookingDate)||0;return b-a||(Number(e.c.customerId)||0)-(Number(t.c.customerId)||0)||(Number(e.c.sno)||0)-(Number(t.c.sno)||0)})');
  }
  if(/^cancelled_|^cancel_unit_/.test(file))return source;
  return source.replace(/\.from\((['"])(payment_schedule|sales)\1\)(\s*\.select\()/g,function(_,quote,table,select){return '.from('+quote+'current_'+table+quote+')'+select;});
}
function copyRequired(source,target,label){requireFile(source,label);fs.mkdirSync(path.dirname(target),{recursive:true});if(source.endsWith('.js'))fs.writeFileSync(target,currentBookingReads(fs.readFileSync(source,'utf8'),path.basename(source)));else fs.copyFileSync(source,target);}
function deploymentVersion(){return String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||Date.now()).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,16);}
function versionLocalScripts(html,version){return html.replace(/<script([^>]*?)src=["']([^"']+\.js(?:\?[^"']*)?)["']([^>]*)>/gi,function(match,before,src,after){if(/^(?:https?:)?\/\//i.test(src))return match;var separator=src.indexOf('?')>=0?'&':'?';return '<script'+before+'src="'+src+separator+'v='+version+'"'+after+'>';});}
function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function removeScript(html,file){return html.replace(new RegExp(`<script[^>]+src=["']${escapeRegExp(file)}(?:\\?[^"']*)?["'][^>]*><\\/script>\\s*`,'gi'),'');}
function makeFontsNonBlocking(html){return html.replace(/<link\s+href=["'](https:\/\/fonts\.googleapis\.com\/[^"']+)["']\s+rel=["']stylesheet["']\s*>/i,function(_match,href){return '<link rel="preload" as="style" href="'+href+'" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="'+href+'"></noscript>';});}
function makeAuthBootImmediate(source){const old="document.addEventListener('DOMContentLoaded',function(){boot();});";const replacement="(function(){function startAuthBoot(){if(window.__sunblissAuthBootStarted)return;window.__sunblissAuthBootStarted=true;boot();}if(document.getElementById('app'))startAuthBoot();else document.addEventListener('DOMContentLoaded',startAuthBoot,{once:true});})();";if(source.indexOf(old)===-1)throw new Error('Auth startup marker not found in chunk_11.js');return source.replace(old,replacement);}
function makeCustomerPortfolioSourceTruth(source){const old='var d=(n.data||[]).filter(function(t){return t.status!=="Cancelled"})';const replacement='var d=(n.data||[]).filter(function(t){return t.status!=="Cancelled"&&t.customer_id!==null&&t.customer_id!==undefined&&String(t.customer_id).trim()!==""})';if(source.indexOf(old)===-1)throw new Error('Customer portfolio source marker not found in chunk_03.js');return source.replace(old,replacement);}
function addOverviewKpiRenderHook(source){const old='mainEl.innerHTML=e,wireTabs()';const replacement='mainEl.innerHTML=e,window.__sunblissOverviewKpiRendered&&window.__sunblissOverviewKpiRendered(),wireTabs()';if(source.indexOf(old)===-1)throw new Error('Overview render hook marker not found in chunk_07.js');return source.replace(old,replacement);}
function fixInstallmentLedgerRender(source){
  const oldStart="e+='<div class=\"ledger-scroll\">',t.stages.forEach(function(n,l){var d=stageStatus(n.due,n.paid,n.dueDate,s),";
  const newStart="e+='<div class=\"ledger-scroll\">',t.stages.sort(function(a,b){function rank(x){var label=String(x&&x.label||'').replace(/instalment/ig,'Installment').replace(/\\s+/g,' ').trim(),m=label.match(/^(\\d+)(?:st|nd|rd|th)\\s+Installment(?:\\s+Partial\\s*[-–—]?\\s*(\\d+))?/i);if(m)return Number(m[1])*10+(m[2]?Number(m[2])/100:0);var fixed={DP:0,DOWN:0,'1ST':10,DLD:15,'2ND':20,'3RD':30,'4TH':40,'5TH':50,'6TH':60,'7TH':70,FIN:10000};return x&&Object.prototype.hasOwnProperty.call(fixed,x.code)?fixed[x.code]:9000}return rank(a)-rank(b)}).forEach(function(n,l){var d=n.code===\"DLD\"?(dldPaidWithinTolerance(n.due,dldSettledAmount(n))?\"paid\":stageStatus(n.due,dldSettledAmount(n),n.revisedDueDate||n.dueDate,s)):stageStatus(n.due,n.paid,n.revisedDueDate||n.dueDate,s),";
  if(source.indexOf(oldStart)===-1)throw new Error('Installment ledger render marker not found in chunk_10.js');
  source=source.replace(oldStart,newStart);
  const oldLate='d==="paid"&&n.dueDate&&n.paidDate&&n.paidDate.getTime()>n.dueDate.getTime()+864e5';
  const newLate='d==="paid"&&(n.revisedDueDate||n.dueDate)&&n.paidDate&&n.paidDate.getTime()>(n.revisedDueDate||n.dueDate).getTime()+864e5';
  if(source.indexOf(oldLate)===-1)throw new Error('Installment paid-late marker not found in chunk_10.js');
  return source.replace(oldLate,newLate);
}
function simplifyDldTracker(source){
  const replacements=[["pillStat(s.fullyPaid,\"Fully paid\",\"var(--sage)\",\"btnDldFullyPaid\")+pillStat(s.partiallyPaid,\"Partial\",\"var(--amber)\",\"btnDldPartial\")+pillStat(s.notStarted,\"Not started\",\"var(--muted)\",\"btnDldNotStarted\")", "pillStat(s.fullyPaid,\"Paid\",\"var(--sage)\",\"btnDldFullyPaid\")+pillStat(s.partiallyPaid+s.notStarted,\"Remaining\",\"var(--amber)\",\"btnDldRemaining\")"], ["document.getElementById(\"btnDldPartial\").addEventListener(\"click\",function(){goToUnitsList({dld:\"partial\"})}),document.getElementById(\"btnDldNotStarted\").addEventListener(\"click\",function(){goToUnitsList({dld:\"notstarted\"})})", "document.getElementById(\"btnDldRemaining\").addEventListener(\"click\",function(){goToUnitsList({dld:\"outstanding\"})})"]];
  for(const [before,after] of replacements){if(!source.includes(before))throw new Error("DLD tracker source marker not found");source=source.replace(before,after);}
  return source;
}
function applyDldPaidTolerance(source,file){
  const helpers='function dldCashPaid(stage){return Number(stage.cashPaid!==undefined?stage.cashPaid:stage.paid)||0;}function dldSettledAmount(stage){return dldCashPaid(stage)+(Number(stage.creditNoteTotal)||0);}function dldPaidWithinTolerance(due,paid){return (Number(paid)>0||Number(due)<=0)&&Math.round((Number(due)-Number(paid||0))*100)<=20000;}';
  if(file==='chunk_01.js'){
    const before='var t=a.paid||0,u=a.due-t;return u<=1?"paid":t>0?"partial":"notstarted"';
    if(!source.includes(before))throw new Error('DLD status tolerance marker not found');
    return helpers+source.replace(before,'var t=dldSettledAmount(a);return dldPaidWithinTolerance(a.due,t)?"paid":t>0?"partial":"notstarted"');
  }
  if(file==='chunk_02.js'){
    const before='var f=c.paid||0;o+=f;var s=c.due-f;t+=Math.max(0,s),s<=1?r++:f>0?u++:n++,stageStatus(c.due,c.paid,c.dueDate,a)==="overdue"&&(i++,d+=s)';
    const after='var f=dldCashPaid(c),settled=dldSettledAmount(c);o+=f;var s=c.due-settled;t+=Math.max(0,s),dldPaidWithinTolerance(c.due,settled)?r++:settled>0?u++:n++,!dldPaidWithinTolerance(c.due,settled)&&stageStatus(c.due,settled,c.dueDate,a)==="overdue"&&(i++,d+=s)';
    if(!source.includes(before))throw new Error('DLD tracker tolerance marker not found');
    return source.replace(before,after);
  }
  return source;
}
function removeInsightsOverdueAging(source){
  const start=source.indexOf('var i=overdueAging();');
  const end=source.indexOf('var n=cancelledStats();',start);
  if(start<0||end<0)throw new Error('Insights overdue aging section markers not found');
  return source.slice(0,start)+source.slice(end);
}
function fixReviewedDetailPresentation(source){const before="var a=t.info;if(a&&(a.floor||a.area||a.pricePerSqft)&&(e+='<p class=\"section-label\">Unit details</p>',a.floor&&(e+=p(\"Floor\",a.floor)),a.area&&(e+=p(\"Area\",a.area)),a.pricePerSqft&&(e+=p(\"Price / sqft\",a.pricePerSqft)))";const after="var a=t.info||{};if((e+='<p class=\"section-label\">Unit details</p>',e+=p(\"Floor\",a.floor??\"Not recorded\"),e+=p(\"Area\",a.area??\"Not recorded\"),e+=p(\"Price / sqft\",a.pricePerSqft??\"Not recorded\"))";if(!source.includes(before))throw Error("Unit details presentation marker not found");return source.replace(before,after);}
function supportBackgroundRefresh(source){
  const start='async function loadFromSupabase(){';
  const end='state.fileName=null,state.syncedAt=new Date().toISOString(),state.view="overview"';
  if(!source.includes(start)||!source.includes(end))throw Error('Background refresh source markers not found');
  return source.replace(start,'async function loadFromSupabase(options){').replace('if(e.error)throw e.error;', 'if(options&&options.preserveView)[s,r,p].forEach(function(result){if(result.error)throw result.error});if(e.error)throw e.error;').replace(end,'state.fileName=null,state.syncedAt=new Date().toISOString();if(!options||!options.preserveView)state.view="overview"');
}
function removeLegacyDetailNote(source){
  const start=source.indexOf('(t.action||t.remarks||t.updates)&&('),end=source.indexOf(",e+='<p class=\"section-label\">Installment ledger",start);
  if(start<0||end<0)throw Error('Legacy detail notice markers not found');
  return source.slice(0,start)+'void 0'+source.slice(end);
}
function showAccountsPendingInInstallmentLedger(source){
  // Presentation only. Underlying "paid" state is retained for cash accounting.
  const oldStatus='g={paid:"Paid",partial:"Partial",overdue:"Overdue",upcoming:"Upcoming",pending:"Pending",na:"N/A"}[d];e+=';
  const newStatus='g=n.accountsConfirmationPending?"Payment Recorded":{paid:"Paid",partial:"Partial",overdue:"Overdue",upcoming:"Upcoming",pending:"Pending",na:"N/A"}[d],displayD=n.accountsConfirmationPending?"pending":d;e+=';
  if(!source.includes(oldStatus))throw Error('Installment status badge anchor changed');
  source=source.replace(oldStatus,newStatus);

  const oldBadge=String.raw`<span class="stamp is-'+d+'" style="--tilt:'+b+'">'+g+'</span><div class="stage-row">`;
  const newBadge=String.raw`<span class="stamp is-'+displayD+'" style="--tilt:'+b+'"'+(n.accountsConfirmationPending?' title="Payment Recorded — Accounts Confirmation Pending"':'')+'>'+g+'</span>'+(n.accountsConfirmationPending?'<p class="stage-payment-confirmation-pending" style="font-size:10px;line-height:1.35;color:var(--slate);margin:0 0 8px">Accounts confirmation pending</p>':'')+'<div class="stage-row">`;
  if(!source.includes(oldBadge))throw Error('Installment badge markup anchor changed');
  source=source.replace(oldBadge,newBadge);

  // Show the signed SPA gross as Due, but keep stage collection status tied
  // to the net amount protected while its supplementary note is unissued.
  const sourceStage=':stageStatus(n.due,n.paid,n.revisedDueDate||n.dueDate,s)';
  if(!source.includes(sourceStage))throw Error('SPA stage-status calculation anchor changed');
  source=source.replace(sourceStage,':stageStatus(n.spaCollectionDue||n.due,n.paid,n.revisedDueDate||n.dueDate,s)');
  const oldDueRow="fmtAED(n.due)+'</span></div><div class=\"stage-row\"><span>By";
  const newDueRow="fmtAED(n.due)+'</span></div>'+(n.spaPendingCN>0?'<div class=\"stage-row\"><span>Approved CN (Pending)</span><span>'+fmtAED(n.spaPendingCN)+'</span></div>':'')+'<div class=\"stage-row\"><span>By";
  if(!source.includes(oldDueRow))throw Error('SPA gross-installment display anchor changed');
  source=source.replace(oldDueRow,newDueRow);
  // Historical DLD entry stays Paid; only the signed SPA supplementary amount
  // is disclosed separately. Do not backdate or issue a second DLD receipt.
  const dldCellOld="fmtAED(n.due)+'</span></div>'+(n.spaPendingCN>0?";
  const dldCellNew="fmtAED(n.due)+'</span></div>'+(n.dldSupplement&&n.dldSupplement.balance>0?'<div class=\"stage-row\"><span>Additional DLD (SPA) · Pending</span><span>'+fmtAED(n.dldSupplement.balance)+'</span></div>':'')+(n.spaPendingCN>0?";
  if(!source.includes(dldCellOld))throw Error('Current installment stage-row anchor changed');
  source=source.replace(dldCellOld,dldCellNew);

  const oldLate='d==="paid"&&(n.revisedDueDate||n.dueDate)&&n.paidDate&&n.paidDate.getTime()>(n.revisedDueDate||n.dueDate).getTime()+864e5';
  if(!source.includes(oldLate))throw Error('Late-paid presentation anchor changed');
  source=source.replace(oldLate,'!n.accountsConfirmationPending&&'+oldLate);
  return source;
}
function renderExecutedSpaContractRevisionNote(source){
 // Root-level customer renderer, original financial cards and SOA unchanged.
 const before="h(\"Outstanding\",fmtAED(t.outstanding),_?\"owed\":\"credit\")+\"</div>\";var E=";
 const after="h(\"Outstanding\",fmtAED(t.outstanding),_?\"owed\":\"credit\")+\"</div>\";t.spaContractRevision&&(e+='<details class=\"spa-contract-note\" style=\"margin:8px 0 0;padding:9px 12px;border:1px solid var(--paper-line);border-radius:10px;font-size:12px;line-height:1.45\"><summary style=\"cursor:pointer;font-weight:600\">Contract price revised per signed SPA</summary><p style=\"margin:8px 0 4px\">Contractual price: <strong>'+fmtAED(t.spaContractRevision.spaPrice)+'</strong> · Previous recorded price: '+fmtAED(t.spaContractRevision.previousPrice)+' · Increase: '+fmtAED(t.spaContractRevision.increase)+'.</p><p style=\"margin:0\">'+esc(t.spaContractRevision.note)+'</p></details>');var E=";
 if(!source.includes(before))throw Error('Customer contractual total markup anchor changed');
 return source.replace(before,after);
}
function transformCore(source,file){if(file==='chunk_10.js')source=removeLegacyDetailNote(source);source=applyDldPaidTolerance(source,file);if(file==='chunk_08.js')source=removeInsightsOverdueAging(simplifyDldTracker(source));if(file==='chunk_03.js')source=supportBackgroundRefresh(makeCustomerPortfolioSourceTruth(source));if(file==='chunk_07.js')source=addOverviewKpiRenderHook(source);if(file==='chunk_10.js')source=renderExecutedSpaContractRevisionNote(showAccountsPendingInInstallmentLedger(fixReviewedDetailPresentation(fixInstallmentLedgerRender(source))));if(file==='chunk_11.js')source=makeAuthBootImmediate(source);return source;}
function writeBundle(fileName,files,transform){const parts=files.map(function(file){const full=path.join(OUT,file);requireFile(full,`Bundle source ${file}`);let source=fs.readFileSync(full,'utf8');if(transform)source=transform(source,file);return `/* ${file} */\n${source}`;});fs.writeFileSync(path.join(OUT,fileName),parts.join('\n;\n'));}
function buildBundles(){const coreFiles=TEXT_FILES.slice(1);writeBundle(CORE_BUNDLE_FILE,coreFiles,transformCore);writeBundle(UI_BUNDLE_FILE,RUNTIME_PATCH_FILES);fs.appendFileSync(path.join(OUT,UI_BUNDLE_FILE),"\nwindow.__sunblissUiReady=true;\n");return {coreFiles,uiFiles:RUNTIME_PATCH_FILES};}
function refineSoaDocumentVisuals(source){
  const sectionBefore="function section(title,x,y,width=185){text(title,x,y,25,'bold',C.navy);line(x,y+15,x+width,y+15,C.gold,3)}";
  const sectionAfter="function section(title,x,y,width=185){text(title,x,y+8,25,'bold',C.navy)}";
  if(!source.includes(sectionBefore))throw new Error('SOA section-title marker not found in welcome-letter.html');
  source=source.replace(sectionBefore,sectionAfter);

  const detailsBefore="function details(x,y,w,title,rows,labelW){rect(x,y,w,206,{fill:'#f8fafc',opacity:.28});section(title,x+20,y+38,48);const top=y+57;";
  const detailsAfter="function details(x,y,w,title,rows,labelW){rect(x,y,w,206,{fill:'#f8fafc',opacity:.28});rect(x,y,w,57,{fill:C.blue,stroke:'none',opacity:1,r:8});rect(x,y+8,w,49,{fill:C.blue,stroke:'none',opacity:1,r:0});text(title,x+w/2,y+38,25,'bold','#ffffff','center',w-40);const top=y+57;";
  if(!source.includes(detailsBefore))throw new Error('SOA detail-heading marker not found in welcome-letter.html');
  source=source.replace(detailsBefore,detailsAfter);

  const noteBefore="function note(y,title,lines,compact=false){rect(74,y,1172,compact?120:141,{fill:'#ffffff',opacity:.05});section(title,95,y+33,140);lines.forEach";
  const noteAfter="function note(y,title,lines,compact=false){rect(74,y,1172,compact?120:141,{fill:'#ffffff',opacity:.05});text(title,95,y+41,25,'bold',C.navy,'left',1130);lines.forEach";
  if(!source.includes(noteBefore))throw new Error('SOA note-heading marker not found in welcome-letter.html');
  source=source.replace(noteBefore,noteAfter);

  const statusBoxBefore="rect(x+13,top+5,widths[j]-26,rowH-10,{fill:value==='Paid'?'#e9f5eb':value==='Overdue'?'#fae9e8':value==='At Possession'?'#e8edf1':'#fff5da',stroke:'none',opacity:.85,r:6});";
  const statusBoxAfter="if(value!=='Paid'&&value!=='Upcoming'&&value!=='At Possession'&&value!=='Overdue')rect(x+13,top+5,widths[j]-26,rowH-10,{fill:value==='Paid'?'#e9f5eb':value==='Overdue'?'#fae9e8':value==='At Possession'?'#e8edf1':'#fff5da',stroke:'none',opacity:.85,r:6});";
  if(!source.includes(statusBoxBefore))throw new Error('SOA installment status-box marker not found in welcome-letter.html');
  source=source.replace(statusBoxBefore,statusBoxAfter);

  const statusBefore="status:balance<=.005?'Paid':due&&due<cut?'Overdue':paid>.005?'Partial':!due&&s.code==='FIN'?'At Possession':'Upcoming'";
  const statusAfter="status:balance<=500?'Paid':due&&due<cut?'Overdue':paid>.005?'Partial':!due&&s.code==='FIN'?'At Possession':'Upcoming'";
  if(!source.includes(statusBefore))throw new Error('SOA status tolerance marker not found in welcome-letter.html');
  source=source.replace(statusBefore,statusAfter);

  const overdueBefore="overdue=round(schedule.filter(s=>soaDate(s.revisedDueDate||s.dueDate)&&soaDate(s.revisedDueDate||s.dueDate)<cut).reduce((n,s)=>n+s.balance,0))";
  const overdueAfter="overdue=round(schedule.filter(s=>s.balance>500&&soaDate(s.revisedDueDate||s.dueDate)&&soaDate(s.revisedDueDate||s.dueDate)<cut).reduce((n,s)=>n+s.balance,0))";
  if(!source.includes(overdueBefore))throw new Error('SOA overdue tolerance marker not found in welcome-letter.html');
  source=source.replace(overdueBefore,overdueAfter);

  const receivedCardBefore="const cards=[['AMOUNT RECEIVED',data.received,C.green,(data.total?data.received/data.total*100:0).toFixed(2)+'% of purchase price']";
  const receivedCardAfter="const cards=[['AMOUNT RECEIVED',data.received+data.credits,C.green,(data.total?(data.received+data.credits)/data.total*100:0).toFixed(2)+'% of purchase price']";
  if(!source.includes(receivedCardBefore))throw new Error('SOA amount received summary marker not found in welcome-letter.html');
  source=source.replace(receivedCardBefore,receivedCardAfter);

  const receivedHistoryBefore="['AMOUNT RECEIVED','AED '+soaAmount(data.received)]";
  const receivedHistoryAfter="['AMOUNT RECEIVED','AED '+soaAmount(data.received+data.credits)]";
  if(!source.includes(receivedHistoryBefore))throw new Error('SOA transaction-page amount received marker not found in welcome-letter.html');
  source=source.replace(receivedHistoryBefore,receivedHistoryAfter);

  const feeHistoryBefore="if(Math.abs(sale)>.005)history.push({date:t.payment_date,description:t.payment_type||'Payment',due:saleAlloc.map(a=>soaDate(a.stage.revisedDueDate||a.stage.dueDate)).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(soaDisplayDate).join(' / ')||'-',receipt:t.receipt_number||t.receipt_no||(/\\bSPRED\\s*:/i.test(t.payment_reference||'')?t.payment_reference:'-'),method:t.payment_method||t.instrument_type||'-',amount:sale,allocated:saleAlloc.map(a=>a.stage.label).join(' / ')||'Unallocated',sale,id:t.id})";
  const feeHistoryAfter="if(Math.abs(sale)>.005)history.push({date:t.payment_date,description:t.payment_type||'Payment',due:saleAlloc.map(a=>soaDate(a.stage.revisedDueDate||a.stage.dueDate)).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(soaDisplayDate).join(' / ')||'-',receipt:t.receipt_number||t.receipt_no||(/\\bSPRED\\s*:/i.test(t.payment_reference||'')?t.payment_reference:'-'),method:t.payment_method||t.instrument_type||'-',amount:sale,allocated:saleAlloc.map(a=>a.stage.label).join(' / ')||'Unallocated',sale,id:t.id});if(Math.abs(fee)>.005){const feeAlloc=alloc.filter(a=>soaFee(a.stage));history.push({date:t.payment_date,description:'DLD+Admin Fees',due:feeAlloc.map(a=>soaDate(a.stage.revisedDueDate||a.stage.dueDate)).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).map(soaDisplayDate).join(' / ')||'-',receipt:t.receipt_number||t.receipt_no||(/\\bSPRED\\s*:/i.test(t.payment_reference||'')?t.payment_reference:'-'),method:t.payment_method||t.instrument_type||'-',amount:round(fee),allocated:'DLD+Admin Fees',sale:0,id:String(t.id)+'-DLD'})}";
  if(!source.includes(feeHistoryBefore))throw new Error('SOA DLD/Admin transaction-history marker not found in welcome-letter.html');
  source=source.replace(feeHistoryBefore,feeHistoryAfter);


  // Consistent SOA typography tiers. This changes font sizes only; it does
  // not alter the page scene, positions, columns, payment logic or amounts.
  const changes=[
    [
      "const historyWidths=[42,128,171,140,120,132,139,140,160],historySize=17,historyTop=580",
      "const historyWidths=[42,128,171,140,120,132,139,140,160],historySize=16,historyTop=580"
    ],
    [
      "function note(y,title,lines,compact=false){rect(74,y,1172,compact?120:141,{fill:'#ffffff',opacity:.05});text(title,95,y+41,25,'bold',C.navy,'left',1130);lines.forEach((t,i)=>text(t,95,y+(compact?76:85)+i*(compact?27:34),17,'regular',C.text,'left',1130))}",
      "function note(y,title,lines,compact=false){rect(74,y,1172,compact?120:141,{fill:'#ffffff',opacity:.05});text(title,95,y+41,25,'bold',C.navy,'left',1130);lines.forEach((t,i)=>text(t,95,y+(compact?76:85)+i*(compact?27:34),16,'regular',C.text,'left',1130))}"
    ],
    [
      "text(label,x+20,630,17,'bold',C.muted,'left',340);text('AED '+soaAmount(value),x+20,679,29,'bold',color,'left',340)",
      "text(label,x+20,630,16,'bold',C.muted,'left',340);text('AED '+soaAmount(value),x+20,679,26,'bold',color,'left',340)"
    ],
    [
      "text(value,sx+21,471,i>1?24:20,i>1?'bold':'regular'",
      "text(value,sx+21,471,20,i>1?'bold':'regular'"
    ],
    [
      "function table(y,widths,heads,rows,{height,headerHeight=64,total=null,dark=false,defaultSize=17,layouts=null}={})",
      "function table(y,widths,heads,rows,{height,headerHeight=64,total=null,dark=false,defaultSize=16,layouts=null}={})"
    ],
    [
      "let rowTop=y+headerHeight;\n  bodyRows.forEach",
      "let tableFont=Math.min(defaultSize,rowH*.65);\n  if(!layouts){while(tableFont>12.5&&bodyRows.some(row=>Math.max(...row.map((t,j)=>wrap(t,widths[j]-22,tableFont,(!dark&&j===7)?'bold':'regular').length))*tableFont*1.07>rowH-7))tableFont=Math.max(12.5,Math.round((tableFont-.5)*10)/10)}\n  let rowTop=y+headerHeight;\n  bodyRows.forEach"
    ],
    [
      "let fs=layouts?defaultSize:Math.min(defaultSize,rowH*.65);let wrapped=layouts?layouts[i].lines:row.map((t,j)=>wrap(t,widths[j]-22,fs));let maxLines=Math.max(...wrapped.map(a=>a.length));while(!layouts&&maxLines*fs*1.17>rowH-7&&fs>1){fs*=.92;wrapped=row.map((t,j)=>wrap(t,widths[j]-22,fs));maxLines=Math.max(...wrapped.map(a=>a.length))}",
      "let fs=layouts?defaultSize:tableFont;let wrapped=layouts?layouts[i].lines:row.map((t,j)=>wrap(t,widths[j]-22,fs,(!dark&&j===7)?'bold':'regular'))"
    ]
  ];
  for(const [before,after] of changes){
    if(!source.includes(before))throw new Error('SOA typography anchor changed: '+before.slice(0,65));
    source=source.replace(before,after);
  }

  return source;
}

function reviseSoaFiguresUsingSignedSpa(source){
  // Layout-preserving transformation: all SOA vector scenes, headings, cards,
  // table widths, column names, page count, fonts and signatories are unchanged.
  // Apply the signed SPA prices only through the pre-existing SOA data model.
  const projection=fs.readFileSync(path.join(ROOT,'lib/soa_spa_projection_core.js'),'utf8');
  const dataStart='function soaData(ctx,date){';
  const scheduleStart='const schedule=stages.filter(';
  const legacyTotals='const total=round(c.total),balance=round(total-received-credits),overdue=round(schedule.filter(s=>s.balance>500&&soaDate(s.revisedDueDate||s.dueDate)&&soaDate(s.revisedDueDate||s.dueDate)<cut).reduce((n,s)=>n+s.balance,0));let running=total;';
  const originalReturn='schedule,history,date,round};';
  if(!source.includes(dataStart)||!source.includes(scheduleStart)||!source.includes(legacyTotals)||!source.includes(originalReturn))
    throw new Error('Original SOA calculation anchors changed; refusing to alter the format');
  source=source.replace(dataStart,projection+'\n'+dataStart);
  source=source.replace(scheduleStart,'let schedule=stages.filter(');
  const calc=[
    "// Apply revised SPA figures only from the date of execution onward.",
    "const activeSpa=!!(ctx.priceRevision&&ctx.priceRevision.signedOn&&cut>=soaDate(ctx.priceRevision.signedOn));",
    "const pendingIds=activeSpa?all.filter(t=>within(t.payment_date)&&Number(t.amount)>0&&String(t.accounts_confirmation_status||'').toLowerCase()!=='confirmed'&&String(t.payment_schedule_id||'')).map(t=>String(t.payment_schedule_id)):[];",
    "const spaProjection=activeSpa?window.SunblissSoaSpaProjection.project(schedule,ctx.priceRevision.model,{asOfDate:cut,pendingAccountsIds:pendingIds,tolerance:.005}):null;",
    "if(spaProjection)schedule=spaProjection.stages;",
    "const total=round(spaProjection?spaProjection.total:c.total),balance=round(total-received-credits),overdue=spaProjection?spaProjection.overdue:round(schedule.filter(s=>soaDate(s.revisedDueDate||s.dueDate)&&soaDate(s.revisedDueDate||s.dueDate)<cut).reduce((n,s)=>n+s.balance,0));let running=total;"
  ].join('\n ');
  source=source.replace(legacyTotals,calc);
  return source;
}

function testDocumentSafety(source){return source.replace('</head>','<script defer src="test_document_watermark.js"></script></head>').replace('const blob=await makeDocumentPdf();','const blob=await window.__crmStampTestBlob(await makeDocumentPdf());').replace('a.download=title.replace',"a.download=(window.__crmDocumentIsTest?'TEST-ONLY-':'')+title.replace");}
function main(){requireFile(path.join(BASE,'manifest.json'),'Vendored base manifest');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});for(const file of TEXT_FILES)copyRequired(path.join(BASE,file),path.join(OUT,file),`Vendored base file ${file}`);for(const [target,source] of Object.entries(LOCAL_REPLACEMENT_FILES))copyRequired(path.join(ROOT,source),path.join(OUT,target),`Local replacement ${source}`);for(const [target,source] of Object.entries(LOCAL_BROWSER_VENDOR_FILES))copyRequired(source,path.join(OUT,target),`Bundled browser dependency ${target}`);for(const file of OPTIONAL_BINARY_FILES){const source=path.join(BASE,file);if(fs.existsSync(source))fs.copyFileSync(source,path.join(OUT,file));}for(const file of LOCAL_STATIC_FILES){const source=path.join(ROOT,file),target=path.join(OUT,file);requireFile(source,`Local static file ${file}`);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}const welcomeDocumentPath=path.join(OUT,'welcome-letter.html');fs.writeFileSync(welcomeDocumentPath,testDocumentSafety(reviseSoaFiguresUsingSignedSpa(refineSoaDocumentVisuals(fs.readFileSync(welcomeDocumentPath,'utf8')))));for(const file of [...PRELOAD_PATCH_FILES,...LOCAL_PATCH_FILES])copyRequired(path.join(ROOT,file),path.join(OUT,file),`Local patch ${file}`);const bundles=buildBundles();const indexPath=path.join(OUT,'index.html');let html=fs.readFileSync(indexPath,'utf8');html=html.replace(/<script\s+async\s+data-explicit-opt-in=[\s\S]*?<\/script>\s*$/i,'');html=html.replace(/<script[^>]+src=["'](?:professional_header_patch\.js|fresh_reference_header_patch\.js|fresh_reference_header_mobile_match_patch\.js|combined_brand_header_patch\.js|audit_log_patch\.js|automatic_payment_actions_patch\.js|bottom_nav_normalize_patch\.js)["'][^>]*><\/script>\s*/gi,'');html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>','<script defer src="vendor/xlsx.full.min.js"></script>');html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>','<script defer src="vendor/exceljs.min.js"></script>');html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>','<script defer src="vendor/pdf.min.js" onload="if(window.pdfjsLib&&pdfjsLib.GlobalWorkerOptions)pdfjsLib.GlobalWorkerOptions.workerSrc=\'vendor/pdf.worker.min.js\'"></script>');html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>','');html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','');html=makeFontsNonBlocking(html);html=html.replace('</head>',`<link rel="preload" href="assets/inter-latin-variable.woff2" as="font" type="font/woff2" crossorigin><style>@font-face{font-family:CRMInter;src:url('assets/inter-latin-variable.woff2') format('woff2');font-style:normal;font-weight:100 900;font-display:swap}</style></head>`);html=html.replace('</head>','<link rel="stylesheet" href="section_headers.css?v='+deploymentVersion()+'">\n<link rel="stylesheet" href="desktop_header_approved.css?v='+deploymentVersion()+'" media="(min-width: 1024px)">\n</head>');for(const patch of PRELOAD_PATCH_FILES){html=removeScript(html,patch);html=html.replace(/<head([^>]*)>/i,`<head$1>\n<script src="${patch}"></script>`);}for(const file of [...bundles.coreFiles,...bundles.uiFiles])html=removeScript(html,file);html=removeScript(html,'app.bundle.js');html=removeScript(html,CORE_BUNDLE_FILE);html=removeScript(html,UI_BUNDLE_FILE);html=removeScript(html,'vendor/supabase.js');html=html.replace('</body>',`<script src="vendor/supabase.js"></script>\n<script src="test_mode_bootstrap.js"></script>\n<script src="${CORE_BUNDLE_FILE}"></script>\n<script defer src="${UI_BUNDLE_FILE}"></script>\n</body>`);const version=deploymentVersion();html=versionLocalScripts(html,version);html=html.replace('</head>','<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-v3.png?v='+version+'"><link rel="icon" type="image/png" href="/apple-touch-icon-v3.png?v='+version+'"><meta name="apple-mobile-web-app-title" content="CRM"></head>');fs.writeFileSync(indexPath,html);console.log(`Built cold-start optimized CRM into ${OUT}: ${bundles.coreFiles.length} core files + ${bundles.uiFiles.length} deferred UI patches, with ${PRELOAD_PATCH_FILES.length} preload guards (asset version ${version})`);}
try{main();}catch(error){console.error(error);process.exit(1);}