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
  'feature_patch.js','detail_menu_patch.js','hide_duplicate_payment_patch.js','transaction_ui_refine_patch.js','primary_contact_patch.js','insights_chart_responsive_patch.js','search_focus_patch.js','sales_channel_source_truth_patch.js','sales_channel_drilldown_patch.js','rm_detail_patch.js','broker_detail_patch.js','conditional_brokerage_patch.js','units_action_toolbar_patch.js','bottom_nav_patch.js','footer_surface_patch.js','mobile_input_zoom_patch.js','unit_detail_workflow_patch.js','detail_action_cleanup_patch.js','compliance_editor_patch.js','action_required_patch.js','sequenced_payment_labels_patch.js','extra_installments_patch.js','persistent_back_patch.js','new_customer_sales_channel_patch.js','smart_new_customer_patch.js','furnishing_type_patch.js','furnishing_refresh_patch.js','installment_edit_patch.js','installment_menu_portal_patch.js','detail_render_stability_patch.js','unit_editor_patch.js','payment_detail_patch.js','payment_plan_menu_order_patch.js','units_tab_search_patch.js','dock_order_patch.js','cancelled_unit_archive_patch.js','insights_people_search_patch.js','cancelled_unit_edit_patch.js','professional_customer_statement_patch.js','payment_statement_reference_match_patch.js','credit_notes_core_patch.js','credit_notes_detail_patch.js','monthly_sales_drilldown_patch.js','inline_spa_oqood_patch.js','carry_forward_patch.js','carry_forward_audit_fix_patch.js','carry_forward_action_display_patch.js','transaction_ledger_reconciliation_patch.js','units_export_chronological_patch.js','inventory_foundation_v2_patch.js','global_detail_navigation_stability_patch.js','payment_statement_full_page_width_patch.js','payment_statement_cleanup_patch.js','full_width_print_buttons_patch.js','payment_percentage_admin_exclusion_patch.js','cancel_unit_hang_fix_patch.js','bold_headings_patch.js','crm_heading_size_patch.js','credit_note_edit_patch.js','unit_meta_inline_patch.js','transaction_record_order_patch.js','professional_header_text_v2.js','header_company_name_size_patch.js','header_dubai_skyline_patch.js','header_manual_sync_patch.js','customer_notes_patch.js','credit_note_note_lifecycle_patch.js','sale_compliance_inline_note_hide_patch.js','issued_credit_note_history_patch.js','notes_management_patch.js','monthly_cash_flow_label_patch.js','stage_integrity_and_carry_display_patch.js','overview_cleanup_patch.js','task_outcome_experience.js','scheduled_actions_patch.js','customer_payment_response_patch.js','modification_requests_patch.js','scheduled_actions_payment_link_guard_patch.js','scheduled_actions_overview_style_patch.js','automatic_payment_actions_v2_patch.js','payment_extensions_core_patch.js','payment_extensions_ui_patch.js','customer_history_patch.js','payment_extensions_uncovered_overdue_patch.js','payment_schedule_revised_dates_patch.js','payment_plan_revision_ui_patch.js','scheduled_actions_extension_filter_freeze_fix.js','extension_navigation_root_fix.js','scheduled_actions_full_page_guard.js','full_page_action_workflow_patch.js','effective_action_required_patch.js','action_required_reference_card_patch.js','scheduled_actions_filter_cleanup_patch.js','scheduled_extension_reference_card_patch.js','scheduled_extension_row_text_refine_patch.js','extension_operational_summary_patch.js','installment_menu_button_position_patch.js','global_visual_stability_patch.js','bottom_nav_float_spacing_patch.js','bottom_nav_viewport_anchor_patch.js','bottom_nav_smooth_shadow_patch.js','desktop_exact_preview_observer_guard.js','desktop_responsive_crm_patch.js','desktop_executive_shell_preview_patch.js','desktop_reference_exact_v2_patch.js','desktop_reference_header_exact_patch.js','desktop_header_brand_remove_patch.js','desktop_overview_flicker_guard_patch.js','mobile_header_background_patch.js','empty_installment_visibility_patch.js','overview_kpi_countup_patch.js','record_payment_reliability_patch.js','transaction_integrity_reliability_patch.js','transaction_action_menu_root_fix.js','payment_tolerance_aed_1000_patch.js','payment_schedule_source_truth_patch.js','detail_action_unification_patch.js','installment_partial_order_patch.js','record_payment_save_delegate_patch.js','desktop_contact_sales_split_patch.js','manager_visit_history_patch.js','welcome_documents_patch.js','carry_only_status_display_fix_patch.js','binary_compliance_status_patch.js','inline_compliance_full_page_fix_patch.js','atomic_new_customer_save_patch.js','customer_workspace_interactions_patch.js','crm_render_readiness_patch.js','overview_kpi_drilldown_patch.js','desktop_deep_page_shell_patch.js','desktop_units_sold_donut_kpi_patch.js','reference_layout_viewport_patch.js','overview_reconciliation_patch.js','spa_workflow_patch.js','test_mode_ui.js','unit_type_breakdown_patch.js','instagram_pill_proportions_patch.js','inventory_layout_refinement_patch.js','customer_editor_mobile_reference_patch.js','payment_plan_mobile_reference_patch.js','payment_revision_mobile_reference_patch.js','unit_editor_mobile_reference_patch.js','customer_scheduled_tasks_pill_patch.js','lib/price_revision_core.js','lib/spa_financial_reconciliation_source.js','spa_price_revision_ui_patch.js'
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
function transformCore(source,file){if(file==='chunk_10.js')source=removeLegacyDetailNote(source);source=applyDldPaidTolerance(source,file);if(file==='chunk_08.js')source=removeInsightsOverdueAging(simplifyDldTracker(source));if(file==='chunk_03.js')source=supportBackgroundRefresh(makeCustomerPortfolioSourceTruth(source));if(file==='chunk_07.js')source=addOverviewKpiRenderHook(source);if(file==='chunk_10.js')source=fixReviewedDetailPresentation(fixInstallmentLedgerRender(source));if(file==='chunk_11.js')source=makeAuthBootImmediate(source);return source;}
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

  return source;
}

function addSpaReconciliationAnnex(source){
  // The approved-but-unissued credits are disclosed separately from the
  // historical accounting transactions. Existing SOA numbers stay untouched.
  const dataMarker='history,date,round};';
  const dataAfter='history,date,round,priceRevision:ctx.priceRevision||null};';
  if(!source.includes(dataMarker))throw new Error('SOA data marker unavailable for SPA annex');
  source=source.replace(dataMarker,dataAfter);
  const pageMarker="pages.forEach((scene,i)=>{p=scene;text('Page '+(i+1)+' of '+pages.length";
  if(!source.includes(pageMarker))throw new Error('SOA final page numbering marker unavailable');
  const annex=String.raw`
 if(data.priceRevision){
  const rev=data.priceRevision,pr=rev.model;
  base(pages.length);
  section('SIGNED SPA RECONCILIATION',74,403,460);
  rect(74,448,1172,202,{fill:'#f8fafc',opacity:.35});
  [['SIGNED SPA PRICE',pr.spaPrice],['PREVIOUS LEDGER BASIS',data.total],
   ['APPROVED SUPPLEMENTARY CREDITS',pr.additionalApprovedCredit],
   ['NET PROPERTY CASH OBLIGATION',pr.totalCashObligation]].forEach((r,i)=>{
      const xx=95+(i%2)*582,yy=495+Math.floor(i/2)*93;
      text(r[0],xx,yy,15,'bold',C.muted);
      text('AED '+soaAmount(r[1]),xx,yy+37,29,'bold',C.navy);
   });
  section('INSTALLMENT CREDIT ALLOCATIONS',74,707,435);
  const sum=k=>pr.stages.reduce((a,s)=>a+Number(s[k]||0),0);
  table(735,[42,240,185,185,170,175,175],
     ['#','Installment','SPA Gross','Existing Issued\nCredits','New Credits\nApproved','Customer Cash\nPayable','Recorded Cash\nOutstanding'],
     pr.stages.map((s,i)=>[i+1,s.label,soaAmount(s.gross),soaAmount(s.existingIssuedCredit),
       soaAmount(s.approvedNewCredit),soaAmount(s.customerCashObligation),soaAmount(s.expectedCashOutstanding)]),
     {height:520,total:['','TOTAL',soaAmount(pr.spaPrice),soaAmount(pr.existingIssuedCredit),
       soaAmount(pr.additionalApprovedCredit),soaAmount(pr.totalCashObligation),
       soaAmount(pr.expectedCashOutstanding)]});
  section('FINANCIAL STATUS',74,1285,240);
  text('Supplementary credits approved but not issued: AED '+soaAmount(pr.pendingNewCredit),74,1335,19,'bold',C.navy);
  text('Supplementary credit notes already issued: AED '+soaAmount(pr.additionalIssuedCredit),74,1378,19,'regular',C.text);
  text('Payment awaiting Accounts clearance: AED '+soaAmount(rev.pendingAccounts),74,1421,19,'regular',C.text);
  text('Additional DLD payable (separate from property): AED '+soaAmount(rev.dld.additionalCashDue),74,1464,19,'regular',C.text);
  text('Pending approvals are not treated as issued credit notes or confirmed cash.',74,1520,17,'regular',C.muted);
 }
`;
  source=source.replace(pageMarker,annex+'\n '+pageMarker);
  // A recorded installment payment awaiting Accounts clearance is not
  // presented as a fully cleared installment on this customer's SOA.
  const pendingMarker="const total=round(c.total),balance=round(total-received-credits)";
  const pendingCode="if(ctx.priceRevision){const pendingById=new Map();"+
   "all.filter(t=>within(t.payment_date)&&String(t.accounts_confirmation_status||'').toLowerCase()!=='confirmed'&&Number(t.amount)>0).forEach(t=>{const id=String(t.payment_schedule_id||'');pendingById.set(id,(pendingById.get(id)||0)+Number(t.amount))});"+
   "schedule.forEach(s=>{if((pendingById.get(String(s.id||s.scheduleId||''))||0)>0)s.status='Pending Accounts'})}\n ";
  if(!source.includes(pendingMarker))throw new Error('SOA pending-confirmation marker unavailable');
  source=source.replace(pendingMarker,pendingCode+pendingMarker);
  const label="['PURCHASE PRICE','AED '+soaAmount(data.total)]";
  if(!source.includes(label))throw new Error('SOA ledger amount label marker unavailable');
  source=source.replaceAll(label,"[data.priceRevision?'PREVIOUS LEDGER BASIS':'PURCHASE PRICE','AED '+soaAmount(data.total)]");
  const statementLine="'This statement reconciles the contractual payment schedule with amounts recorded as paid as of the statement date.'";
  if(!source.includes(statementLine))throw new Error('SOA statement note marker unavailable');
  source=source.replace(statementLine,
    "data.priceRevision?'This page reflects the historical ledger basis; see the signed SPA reconciliation annex.':"+statementLine);
  return source;
}

function promoteSpaAmountsInSoa(source){
 const projection=fs.readFileSync(path.join(ROOT,'lib/soa_spa_projection_core.js'),'utf8');
 if(!source.includes('function soaData(ctx,date){'))throw Error('SOA data hook changed');
 source=source.replace('function soaData(ctx,date){',projection+'\nfunction soaData(ctx,date){');
 if(!source.includes('const schedule=stages.filter('))throw Error('SOA schedule hook changed');
 source=source.replace('const schedule=stages.filter(','let schedule=stages.filter(');
 const totalMarker='const total=round(c.total),balance=round(total-received-credits)';
 if(!source.includes(totalMarker))throw Error('SOA total hook changed');
 const projectLines=[
  'const activeSpa=!!(ctx.priceRevision&&(!ctx.priceRevision.signedOn||cut>=soaDate(ctx.priceRevision.signedOn)));',
  "const unconfirmedIds=all.filter(t=>within(t.payment_date)&&Number(t.amount)>0&&String(t.accounts_confirmation_status||'').toLowerCase()!=='confirmed'&&String(t.payment_schedule_id||'')).map(t=>String(t.payment_schedule_id));",
  'const projected=activeSpa?window.SunblissSoaSpaProjection.project(schedule,ctx.priceRevision.model,{asOfDate:cut,pendingAccountsIds:unconfirmedIds,tolerance:.005}):null;',
  'if(projected)schedule=projected.stages;',
  'const total=round(projected?projected.total:c.total),balance=round(total-received-credits);',
  'const cashOutstanding=round(projected?Math.max(0,balance-projected.pendingCredits):balance);'
 ];
 source=source.replace(totalMarker,projectLines.join('\n '));
 const oldOverdue='overdue=round(schedule.filter(s=>s.balance>500&&soaDate(s.revisedDueDate||s.dueDate)&&soaDate(s.revisedDueDate||s.dueDate)<cut).reduce((n,s)=>n+s.balance,0))';
 if(!source.includes(oldOverdue))throw Error('SOA overdue marker changed');
 source=source.replace(oldOverdue,'overdue=projected?projected.overdue:'+oldOverdue.slice('overdue='.length));
 source=source.replace(');,overdue=projected?',');const overdue=projected?');
 const oldMeta='priceRevision:ctx.priceRevision||null};';
 if(!source.includes(oldMeta))throw Error('SOA return marker changed');
 source=source.replace(oldMeta,'cashOutstanding,priceRevision:projected?ctx.priceRevision:null};');
 const begin=source.indexOf('const installmentBottom=table(819,');
 const end=source.indexOf(');\n note(installmentBottom+28',begin);
 if(begin<0||end<0)throw Error('SOA main installment table marker changed');
 const table=[
  'const installmentBottom=table(819,',
  'data.priceRevision?[42,170,165,65,170,150,133,137,140]:[42,184,190,76,190,163,173,154],',
  "data.priceRevision?['#','Installment','Due Date','%','SPA Amount (AED)','Cash + Issued CN','Approved CN Pending','Net Cash Due','Status']:",
  "['#','Installment','Due Date','%','Installment Amount (AED)','Paid Amount (AED)','Balance (AED)','Status'],",
  'data.schedule.map((s,i)=>data.priceRevision?',
  "[i+1,s.label,s.date,(data.total?(Number(s.due)/data.total*100).toFixed(2).replace(/\\.00$/,''):0)+'%',soaAmount(s.due),soaAmount(s.paid),soaAmount(s.pendingCredit),soaAmount(s.cashDue),s.status]:",
  "[i+1,s.label,s.date,(data.total?(Number(s.due)/data.total*100).toFixed(2).replace(/\\.00$/,''):0)+'%',soaAmount(s.due),soaAmount(s.paid),soaAmount(s.balance),s.status]),",
  '{height:456,total:data.priceRevision?',
  "['','TOTAL','',(data.total?sum('due')/data.total*100:0).toFixed(0)+'%',soaAmount(sum('due')),soaAmount(sum('paid')),soaAmount(sum('pendingCredit')),soaAmount(sum('cashDue')),'']:",
  "['','TOTAL','',(data.total?sum('due')/data.total*100:0).toFixed(0)+'%',soaAmount(sum('due')),soaAmount(sum('paid')),soaAmount(sum('balance')),'']})"
 ].join('\n ');
 source=source.slice(0,begin)+table+source.slice(end+1);
 const cols='const lines=wrapped[j],numeric=dark?[6,8].includes(j):[4,5,6].includes(j),center=dark?[0,1,3,4,5].includes(j):[0,2,3,7].includes(j);if(!dark&&j===7)';
 if(!source.includes(cols))throw Error('SOA table columns marker changed');
 source=source.replace(cols,"const lines=wrapped[j],spaCols=!dark&&!!data.priceRevision,numeric=dark?[6,8].includes(j):(spaCols?[4,5,6,7].includes(j):[4,5,6].includes(j)),center=dark?[0,1,3,4,5].includes(j):(spaCols?[0,2,3,8].includes(j):[0,2,3,7].includes(j));if(!dark&&j===(spaCols?8:7))");
 const paidCard="['AMOUNT RECEIVED',data.received+data.credits,C.green";
 if(!source.includes(paidCard))throw Error('SOA summary paid card changed');
 source=source.replace(paidCard,"[data.priceRevision?'CASH + ISSUED CN':'AMOUNT RECEIVED',data.received+data.credits,C.green");
 const historyPaid="['AMOUNT RECEIVED','AED '+soaAmount(data.received+data.credits)]";
 if(!source.includes(historyPaid))throw Error('SOA transaction history summary changed');
 source=source.replace(historyPaid,"[data.priceRevision?'CASH + ISSUED CN':'AMOUNT RECEIVED','AED '+soaAmount(data.received+data.credits)]");
 const oldNote="data.priceRevision?'This page reflects the historical ledger basis; see the signed SPA reconciliation annex.':";
 if(!source.includes(oldNote))throw Error('Prior SOA note changed');
 source=source.replace(oldNote,"data.priceRevision?'Installments reflect signed SPA amounts. Approved unissued CNs are not counted as paid.':");
 const note2="data.credits?'Detailed transactions start on Page 2. Paid amounts include credit notes of AED '+soaAmount(data.credits)+'. DLD/admin/Oqood are separate.':'Detailed transaction records start on Page 2. DLD, admin and Oqood charges, where applicable, are separate from the unit price.'";
 if(!source.includes(note2))throw Error('Second SOA note changed');
 source=source.replace(note2,"data.priceRevision?'Approved unissued credits AED '+soaAmount(data.priceRevision.model.pendingNewCredit)+'; expected cash outstanding AED '+soaAmount(data.cashOutstanding)+'.':("+note2+")");
 const before="data.priceRevision?'PREVIOUS LEDGER BASIS':'PURCHASE PRICE'";
 if(!source.includes(before))throw Error('SOA price heading marker changed');
 source=source.replaceAll(before,"'PURCHASE PRICE'");
 return source;
}
function testDocumentSafety(source){return source.replace('</head>','<script defer src="test_document_watermark.js"></script></head>').replace('const blob=await makeDocumentPdf();','const blob=await window.__crmStampTestBlob(await makeDocumentPdf());').replace('a.download=title.replace',"a.download=(window.__crmDocumentIsTest?'TEST-ONLY-':'')+title.replace");}
function main(){requireFile(path.join(BASE,'manifest.json'),'Vendored base manifest');fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});for(const file of TEXT_FILES)copyRequired(path.join(BASE,file),path.join(OUT,file),`Vendored base file ${file}`);for(const [target,source] of Object.entries(LOCAL_REPLACEMENT_FILES))copyRequired(path.join(ROOT,source),path.join(OUT,target),`Local replacement ${source}`);for(const [target,source] of Object.entries(LOCAL_BROWSER_VENDOR_FILES))copyRequired(source,path.join(OUT,target),`Bundled browser dependency ${target}`);for(const file of OPTIONAL_BINARY_FILES){const source=path.join(BASE,file);if(fs.existsSync(source))fs.copyFileSync(source,path.join(OUT,file));}for(const file of LOCAL_STATIC_FILES){const source=path.join(ROOT,file),target=path.join(OUT,file);requireFile(source,`Local static file ${file}`);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}const welcomeDocumentPath=path.join(OUT,'welcome-letter.html');fs.writeFileSync(welcomeDocumentPath,testDocumentSafety(promoteSpaAmountsInSoa(addSpaReconciliationAnnex(refineSoaDocumentVisuals(fs.readFileSync(welcomeDocumentPath,'utf8'))))));for(const file of [...PRELOAD_PATCH_FILES,...LOCAL_PATCH_FILES])copyRequired(path.join(ROOT,file),path.join(OUT,file),`Local patch ${file}`);const bundles=buildBundles();const indexPath=path.join(OUT,'index.html');let html=fs.readFileSync(indexPath,'utf8');html=html.replace(/<script\s+async\s+data-explicit-opt-in=[\s\S]*?<\/script>\s*$/i,'');html=html.replace(/<script[^>]+src=["'](?:professional_header_patch\.js|fresh_reference_header_patch\.js|fresh_reference_header_mobile_match_patch\.js|combined_brand_header_patch\.js|audit_log_patch\.js|automatic_payment_actions_patch\.js|bottom_nav_normalize_patch\.js)["'][^>]*><\/script>\s*/gi,'');html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>','<script defer src="vendor/xlsx.full.min.js"></script>');html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>','<script defer src="vendor/exceljs.min.js"></script>');html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>','<script defer src="vendor/pdf.min.js" onload="if(window.pdfjsLib&&pdfjsLib.GlobalWorkerOptions)pdfjsLib.GlobalWorkerOptions.workerSrc=\'vendor/pdf.worker.min.js\'"></script>');html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>','');html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','');html=makeFontsNonBlocking(html);html=html.replace('</head>',`<link rel="preload" href="assets/inter-latin-variable.woff2" as="font" type="font/woff2" crossorigin><style>@font-face{font-family:CRMInter;src:url('assets/inter-latin-variable.woff2') format('woff2');font-style:normal;font-weight:100 900;font-display:swap}</style></head>`);html=html.replace('</head>','<link rel="stylesheet" href="section_headers.css?v='+deploymentVersion()+'">\n<link rel="stylesheet" href="desktop_header_approved.css?v='+deploymentVersion()+'" media="(min-width: 1024px)">\n</head>');for(const patch of PRELOAD_PATCH_FILES){html=removeScript(html,patch);html=html.replace(/<head([^>]*)>/i,`<head$1>\n<script src="${patch}"></script>`);}for(const file of [...bundles.coreFiles,...bundles.uiFiles])html=removeScript(html,file);html=removeScript(html,'app.bundle.js');html=removeScript(html,CORE_BUNDLE_FILE);html=removeScript(html,UI_BUNDLE_FILE);html=removeScript(html,'vendor/supabase.js');html=html.replace('</body>',`<script src="vendor/supabase.js"></script>\n<script src="test_mode_bootstrap.js"></script>\n<script src="${CORE_BUNDLE_FILE}"></script>\n<script defer src="${UI_BUNDLE_FILE}"></script>\n</body>`);const version=deploymentVersion();html=versionLocalScripts(html,version);html=html.replace('</head>','<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-v3.png?v='+version+'"><link rel="icon" type="image/png" href="/apple-touch-icon-v3.png?v='+version+'"><meta name="apple-mobile-web-app-title" content="CRM"></head>');fs.writeFileSync(indexPath,html);console.log(`Built cold-start optimized CRM into ${OUT}: ${bundles.coreFiles.length} core files + ${bundles.uiFiles.length} deferred UI patches, with ${PRELOAD_PATCH_FILES.length} preload guards (asset version ${version})`);}
try{main();}catch(error){console.error(error);process.exit(1);}