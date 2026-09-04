const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE = path.join(ROOT, 'vendor', 'base');
const OUT = path.join(ROOT, 'dist');
const TEXT_FILES = ['index.html', ...Array.from({ length: 13 }, (_, i) => `chunk_${String(i).padStart(2, '0')}.js`)];
const OPTIONAL_BINARY_FILES = ['letterhead.jpg'];
const LOCAL_STATIC_FILES = ['assets/purvanchal-p-logo.svg','assets/purvanchal-p-dubai.png','assets/purvanchal-p-desktop-previous.png','assets/purvanchal-p-thin-ring.png','assets/sunbliss-mobile-header-background.webp'];
const LOCAL_REPLACEMENT_FILES = { 'chunk_11.js': 'auth_core_replacement.js' };
const LOCAL_BROWSER_VENDOR_FILES = {
  'vendor/xlsx.full.min.js': path.join(ROOT,'node_modules','xlsx','dist','xlsx.full.min.js'),
  'vendor/exceljs.min.js': path.join(ROOT,'node_modules','exceljs','dist','exceljs.min.js'),
  'vendor/pdf.min.js': path.join(ROOT,'node_modules','pdfjs-dist','build','pdf.min.js'),
  'vendor/pdf.worker.min.js': path.join(ROOT,'node_modules','pdfjs-dist','build','pdf.worker.min.js'),
  'vendor/supabase.js': path.join(ROOT,'node_modules','@supabase','supabase-js','dist','umd','supabase.js')
};
const PRELOAD_PATCH_FILES = ['mutation_observer_guard_patch.js','smooth_navigation_preview_patch.js','overview_kpi_countup_patch.js','header_shadow_stability_patch.js'];
const LOCAL_PATCH_FILES = [
  'feature_patch.js','detail_menu_patch.js','hide_duplicate_payment_patch.js','transaction_ui_refine_patch.js','primary_contact_patch.js','insights_chart_responsive_patch.js','search_focus_patch.js','sales_channel_source_truth_patch.js','sales_channel_drilldown_patch.js','rm_detail_patch.js','broker_detail_patch.js','conditional_brokerage_patch.js','units_action_toolbar_patch.js','bottom_nav_patch.js','footer_surface_patch.js','mobile_input_zoom_patch.js','unit_detail_workflow_patch.js','detail_action_cleanup_patch.js','compliance_editor_patch.js','action_required_patch.js','sequenced_payment_labels_patch.js','extra_installments_patch.js','persistent_back_patch.js','new_customer_sales_channel_patch.js','smart_new_customer_patch.js','furnishing_type_patch.js','furnishing_refresh_patch.js','installment_edit_patch.js','installment_menu_portal_patch.js','detail_render_stability_patch.js','unit_editor_patch.js','payment_detail_patch.js','payment_plan_menu_order_patch.js','units_tab_search_patch.js','dock_order_patch.js','cancelled_unit_archive_patch.js','insights_people_search_patch.js','cancelled_forfeit_rule_patch_v2.js','cancelled_unit_edit_patch.js','professional_customer_statement_patch.js','payment_statement_reference_match_patch.js','credit_notes_core_patch.js','credit_notes_detail_patch.js','credit_notes_insights_patch.js','monthly_sales_drilldown_patch.js','inline_spa_oqood_patch.js','carry_forward_patch.js','carry_forward_audit_fix_patch.js','carry_forward_action_display_patch.js','transaction_ledger_reconciliation_patch.js','units_export_chronological_patch.js','inventory_foundation_v2_patch.js','global_detail_navigation_stability_patch.js','payment_statement_full_page_width_patch.js','payment_statement_cleanup_patch.js','full_width_print_buttons_patch.js','payment_percentage_admin_exclusion_patch.js','cancel_unit_hang_fix_patch.js','bold_headings_patch.js','crm_heading_size_patch.js','credit_note_edit_patch.js','unit_meta_inline_patch.js','transaction_record_order_patch.js','professional_header_text_v2.js','header_company_name_size_patch.js','header_dubai_skyline_patch.js','header_manual_sync_patch.js','customer_notes_patch.js','credit_note_note_lifecycle_patch.js','customer_notes_stability_patch.js','customer_note_display_cleanup_patch.js','sale_compliance_inline_note_hide_patch.js','issued_credit_note_history_patch.js','notes_management_patch.js','monthly_cash_flow_label_patch.js','stage_integrity_and_carry_display_patch.js','active_note_front_page_patch.js','detail_status_flash_fix_patch.js','overview_cleanup_patch.js','scheduled_actions_patch.js','scheduled_actions_payment_link_guard_patch.js','scheduled_actions_overview_style_patch.js','automatic_payment_actions_v2_patch.js','payment_extensions_core_patch.js','payment_extensions_ui_patch.js','payment_extensions_uncovered_overdue_patch.js','payment_schedule_revised_dates_patch.js','scheduled_actions_extension_filter_freeze_fix.js','extension_navigation_root_fix.js','detail_attention_pills_patch.js','scheduled_actions_full_page_guard.js','full_page_action_workflow_patch.js','effective_action_required_patch.js','action_required_reference_card_patch.js','scheduled_actions_filter_cleanup_patch.js','scheduled_extension_reference_card_patch.js','scheduled_extension_row_text_refine_patch.js','extension_operational_summary_patch.js','installment_menu_button_position_patch.js','global_visual_stability_patch.js','bottom_nav_float_spacing_patch.js','bottom_nav_viewport_anchor_patch.js','bottom_nav_smooth_shadow_patch.js','desktop_exact_preview_observer_guard.js','desktop_responsive_crm_patch.js','desktop_executive_shell_preview_patch.js','desktop_reference_exact_v2_patch.js','desktop_reference_header_exact_patch.js','desktop_header_brand_remove_patch.js','desktop_overview_flicker_guard_patch.js','mobile_header_background_patch.js','empty_installment_visibility_patch.js','overview_kpi_countup_patch.js','record_payment_reliability_patch.js','transaction_integrity_reliability_patch.js','transaction_action_menu_root_fix.js'
];
const RUNTIME_PATCH_FILES = LOCAL_PATCH_FILES.filter(file => !PRELOAD_PATCH_FILES.includes(file));
const CORE_BUNDLE_FILE = 'core.bundle.js';
const UI_BUNDLE_FILE = 'ui.bundle.js';

function requireFile(filePath,label){if(!fs.existsSync(filePath))throw new Error(`${label} is missing: ${path.relative(ROOT,filePath)}. Run "npm run vendor:base" only when intentionally refreshing the frozen base snapshot.`);}
function copyRequired(source,target,label){requireFile(source,label);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
function deploymentVersion(){
  return String(process.env.VERCEL_GIT_COMMIT_SHA||process.env.GITHUB_SHA||Date.now()).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,16);
}
function versionLocalScripts(html,version){
  return html.replace(/<script([^>]*?)src=["']([^"']+\.js(?:\?[^"']*)?)["']([^>]*)>/gi,function(match,before,src,after){
    if(/^(?:https?:)?\/\//i.test(src))return match;
    var separator=src.indexOf('?')>=0?'&':'?';
    return '<script'+before+'src="'+src+separator+'v='+version+'"'+after+'>';
  });
}
function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function removeScript(html,file){
  return html.replace(new RegExp(`<script[^>]+src=["']${escapeRegExp(file)}(?:\\?[^"']*)?["'][^>]*><\\/script>\\s*`,'gi'),'');
}
function makeFontsNonBlocking(html){
  return html.replace(/<link\s+href=["'](https:\/\/fonts\.googleapis\.com\/[^"']+)["']\s+rel=["']stylesheet["']\s*>/i,function(_match,href){
    return '<link rel="preload" as="style" href="'+href+'" onload="this.onload=null;this.rel=\'stylesheet\'"><noscript><link rel="stylesheet" href="'+href+'"></noscript>';
  });
}
function makeAuthBootImmediate(source){
  const old="document.addEventListener('DOMContentLoaded',function(){boot();});";
  const replacement="(function(){function startAuthBoot(){if(window.__sunblissAuthBootStarted)return;window.__sunblissAuthBootStarted=true;boot();}if(document.getElementById('app'))startAuthBoot();else document.addEventListener('DOMContentLoaded',startAuthBoot,{once:true});})();";
  if(source.indexOf(old)===-1)throw new Error('Auth startup marker not found in chunk_11.js');
  return source.replace(old,replacement);
}
function writeBundle(fileName,files,transform){
  const parts=files.map(function(file){
    const full=path.join(OUT,file);requireFile(full,`Bundle source ${file}`);
    let source=fs.readFileSync(full,'utf8');
    if(transform)source=transform(source,file);
    return `/* ${file} */\n${source}`;
  });
  fs.writeFileSync(path.join(OUT,fileName),parts.join('\n;\n'));
}
function buildBundles(){
  const coreFiles=TEXT_FILES.slice(1);
  writeBundle(CORE_BUNDLE_FILE,coreFiles,function(source,file){return file==='chunk_11.js'?makeAuthBootImmediate(source):source;});
  writeBundle(UI_BUNDLE_FILE,RUNTIME_PATCH_FILES);
  return {coreFiles,uiFiles:RUNTIME_PATCH_FILES};
}
function main(){
  requireFile(path.join(BASE,'manifest.json'),'Vendored base manifest');
  fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  for(const file of TEXT_FILES)copyRequired(path.join(BASE,file),path.join(OUT,file),`Vendored base file ${file}`);
  for(const [target,source] of Object.entries(LOCAL_REPLACEMENT_FILES))copyRequired(path.join(ROOT,source),path.join(OUT,target),`Local replacement ${source}`);
  for(const [target,source] of Object.entries(LOCAL_BROWSER_VENDOR_FILES))copyRequired(source,path.join(OUT,target),`Bundled browser dependency ${target}`);
  for(const file of OPTIONAL_BINARY_FILES){const source=path.join(BASE,file);if(fs.existsSync(source))fs.copyFileSync(source,path.join(OUT,file));}
  for(const file of LOCAL_STATIC_FILES){const source=path.join(ROOT,file),target=path.join(OUT,file);requireFile(source,`Local static file ${file}`);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
  for(const file of [...PRELOAD_PATCH_FILES,...LOCAL_PATCH_FILES])copyRequired(path.join(ROOT,file),path.join(OUT,file),`Local patch ${file}`);
  const bundles=buildBundles();
  const indexPath=path.join(OUT,'index.html');let html=fs.readFileSync(indexPath,'utf8');
  html=html.replace(/<script\s+async\s+data-explicit-opt-in=[\s\S]*?<\/script>\s*$/i,'');
  html=html.replace(/<script[^>]+src=["'](?:professional_header_patch\.js|fresh_reference_header_patch\.js|fresh_reference_header_mobile_match_patch\.js|combined_brand_header_patch\.js|audit_log_patch\.js|automatic_payment_actions_patch\.js|bottom_nav_normalize_patch\.js)["'][^>]*><\/script>\s*/gi,'');
  html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>','<script defer src="vendor/xlsx.full.min.js"></script>');
  html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js"></script>','<script defer src="vendor/exceljs.min.js"></script>');
  html=html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>','<script defer src="vendor/pdf.min.js" onload="if(window.pdfjsLib&&pdfjsLib.GlobalWorkerOptions)pdfjsLib.GlobalWorkerOptions.workerSrc=\'vendor/pdf.worker.min.js\'"></script>');
  html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>','');
  html=html.replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','');
  html=makeFontsNonBlocking(html);
  for(const patch of PRELOAD_PATCH_FILES){html=removeScript(html,patch);html=html.replace(/<head([^>]*)>/i,`<head$1>\n<script src="${patch}"></script>`);}
  for(const file of [...bundles.coreFiles,...bundles.uiFiles])html=removeScript(html,file);
  html=removeScript(html,'app.bundle.js');
  html=removeScript(html,CORE_BUNDLE_FILE);
  html=removeScript(html,UI_BUNDLE_FILE);
  html=removeScript(html,'vendor/supabase.js');
  html=html.replace('</body>',`<script src="vendor/supabase.js"></script>\n<script src="${CORE_BUNDLE_FILE}"></script>\n<script defer src="${UI_BUNDLE_FILE}"></script>\n</body>`);
  const version=deploymentVersion();
  html=versionLocalScripts(html,version);
  fs.writeFileSync(indexPath,html);
  console.log(`Built cold-start optimized CRM into ${OUT}: ${bundles.coreFiles.length} core files + ${bundles.uiFiles.length} deferred UI patches, with ${PRELOAD_PATCH_FILES.length} preload guards (asset version ${version})`);
}
try{main();}catch(error){console.error(error);process.exit(1);}
