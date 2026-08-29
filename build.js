const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const BASE = path.join(ROOT, 'vendor', 'base');
const OUT = path.join(ROOT, 'dist');
const TEXT_FILES = ['index.html', ...Array.from({ length: 13 }, (_, i) => `chunk_${String(i).padStart(2, '0')}.js`)];
const OPTIONAL_BINARY_FILES = ['letterhead.jpg'];
const LOCAL_STATIC_FILES = [];
const LOCAL_REPLACEMENT_FILES = {
  'chunk_11.js': 'auth_core_replacement.js'
};
const LOCAL_PATCH_FILES = [
  'feature_patch.js',
  'detail_menu_patch.js',
  'hide_duplicate_payment_patch.js',
  'transaction_ui_refine_patch.js',
  'primary_contact_patch.js',
  'insights_chart_responsive_patch.js',
  'search_focus_patch.js',
  'sales_channel_drilldown_patch.js',
  'rm_detail_patch.js',
  'broker_detail_patch.js',
  'conditional_brokerage_patch.js',
  'units_action_toolbar_patch.js',
  'bottom_nav_patch.js',
  'footer_surface_patch.js',
  'mobile_input_zoom_patch.js',
  'unit_detail_workflow_patch.js',
  'detail_action_cleanup_patch.js',
  'compliance_editor_patch.js',
  'action_required_patch.js',
  'sequenced_payment_labels_patch.js',
  'extra_installments_patch.js',
  'persistent_back_patch.js',
  'new_customer_sales_channel_patch.js',
  'smart_new_customer_patch.js',
  'furnishing_type_patch.js',
  'furnishing_refresh_patch.js',
  'installment_edit_patch.js',
  'installment_menu_portal_patch.js',
  'audit_log_patch.js',
  'detail_render_stability_patch.js',
  'unit_editor_patch.js',
  'payment_detail_patch.js',
  'payment_plan_menu_order_patch.js',
  'units_tab_search_patch.js',
  'dock_order_patch.js',
  'cancelled_unit_archive_patch.js',
  'insights_people_search_patch.js',
  'cancelled_forfeit_rule_patch_v2.js',
  'cancelled_unit_edit_patch.js',
  'professional_customer_statement_patch.js',
  'payment_statement_reference_match_patch.js',
  'credit_notes_core_patch.js',
  'credit_notes_detail_patch.js',
  'credit_notes_insights_patch.js',
  'monthly_sales_drilldown_patch.js',
  'inline_spa_oqood_patch.js',
  'carry_forward_patch.js',
  'carry_forward_audit_fix_patch.js',
  'carry_forward_action_display_patch.js',
  'transaction_ledger_reconciliation_patch.js',
  'units_export_chronological_patch.js',
  'global_detail_navigation_stability_patch.js',
  'payment_statement_full_page_width_patch.js',
  'payment_statement_cleanup_patch.js',
  'full_width_print_buttons_patch.js',
  'payment_percentage_admin_exclusion_patch.js',
  'cancel_unit_hang_fix_patch.js',
  'bold_headings_patch.js',
  'crm_heading_size_patch.js',
  'credit_note_edit_patch.js',
  'unit_meta_inline_patch.js',
  'transaction_record_order_patch.js',
  'professional_header_text_v2.js',
  'header_company_name_size_patch.js',
  'header_dubai_skyline_patch.js',
  'header_manual_sync_patch.js',
  'customer_notes_patch.js',
  'credit_note_note_lifecycle_patch.js',
  'customer_notes_stability_patch.js',
  'customer_note_display_cleanup_patch.js',
  'sale_compliance_inline_note_hide_patch.js',
  'issued_credit_note_history_patch.js',
  'notes_management_patch.js',
  'monthly_cash_flow_label_patch.js',
  'stage_integrity_and_carry_display_patch.js',
  'active_note_front_page_patch.js',
  'detail_status_flash_fix_patch.js',
  'overview_cleanup_patch.js',
  'scheduled_actions_patch.js',
  'scheduled_actions_overview_style_patch.js',
  'automatic_payment_actions_patch.js',
  'payment_extensions_core_patch.js',
  'payment_extensions_ui_patch.js',
  'payment_extensions_uncovered_overdue_patch.js',
  'scheduled_actions_extension_filter_freeze_fix.js',
  'scheduled_actions_full_page_guard.js',
  'full_page_action_workflow_patch.js'
];

function requireFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} is missing: ${path.relative(ROOT, filePath)}. Run "npm run vendor:base" only when intentionally refreshing the frozen base snapshot.`);
  }
}

function copyRequired(source, target, label) {
  requireFile(source, label);
  fs.copyFileSync(source, target);
}

function main() {
  requireFile(path.join(BASE, 'manifest.json'), 'Vendored base manifest');

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const file of TEXT_FILES) {
    copyRequired(path.join(BASE, file), path.join(OUT, file), `Vendored base file ${file}`);
  }

  for (const [target, source] of Object.entries(LOCAL_REPLACEMENT_FILES)) {
    copyRequired(path.join(ROOT, source), path.join(OUT, target), `Local replacement ${source}`);
  }

  for (const file of OPTIONAL_BINARY_FILES) {
    const source = path.join(BASE, file);
    if (fs.existsSync(source)) fs.copyFileSync(source, path.join(OUT, file));
  }

  for (const file of LOCAL_STATIC_FILES) {
    const source = path.join(ROOT, file);
    const target = path.join(OUT, file);
    requireFile(source, `Local static file ${file}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }

  for (const file of LOCAL_PATCH_FILES) {
    copyRequired(path.join(ROOT, file), path.join(OUT, file), `Local patch ${file}`);
  }

  const indexPath = path.join(OUT, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  html = html.replace(/<script\s+async\s+data-explicit-opt-in=[\s\S]*?<\/script>\s*$/i, '');
  html = html.replace(/<script[^>]+src=["'](?:professional_header_patch\.js|fresh_reference_header_patch\.js|fresh_reference_header_mobile_match_patch\.js|combined_brand_header_patch\.js)["'][^>]*><\/script>\s*/gi, '');
  for (const patch of LOCAL_PATCH_FILES) {
    if (!html.includes(patch)) {
      html = html.replace('</body>', `<script src="${patch}"></script>\n</body>`);
    }
  }

  fs.writeFileSync(indexPath, html);
  console.log(`Built self-contained CRM into ${OUT} using only repository files`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}