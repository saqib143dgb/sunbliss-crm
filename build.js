const fs = require('fs');
const path = require('path');

const BASE = 'https://sunbliss-q3pmfsk79-sunbliss-crm.vercel.app';
const OUT = path.join(process.cwd(), 'dist');
const TEXT_FILES = ['index.html', ...Array.from({ length: 13 }, (_, i) => `chunk_${String(i).padStart(2, '0')}.js`)];
const OPTIONAL_BINARY_FILES = ['letterhead.jpg'];
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
  'header_compact_patch.js',
  'sales_channel_drilldown_patch.js',
  'rm_detail_patch.js',
  'broker_detail_patch.js',
  'conditional_brokerage_patch.js',
  'units_action_toolbar_patch.js',
  'bottom_nav_patch.js',
  'footer_surface_patch.js',
  'mobile_input_zoom_patch.js',
  'header_spacing_patch.js',
  'unit_detail_workflow_patch.js',
  'detail_action_cleanup_patch.js',
  'compliance_editor_patch.js',
  'action_required_patch.js',
  'sequenced_payment_labels_patch.js',
  'extra_installments_patch.js',
  'persistent_back_patch.js',
  'new_customer_sales_channel_patch.js',
  'furnishing_type_patch.js',
  'furnishing_refresh_patch.js'
];

async function download(file, required = true) {
  const res = await fetch(`${BASE}/${file}`, { redirect: 'follow' });
  if (!res.ok) {
    if (!required) {
      console.warn(`Optional asset ${file} unavailable (${res.status}); skipping.`);
      return null;
    }
    throw new Error(`Failed to download ${file}: HTTP ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const file of TEXT_FILES) {
    const body = await download(file, true);
    fs.writeFileSync(path.join(OUT, file), body);
  }

  for (const [target, source] of Object.entries(LOCAL_REPLACEMENT_FILES)) {
    const replacementSource = path.join(process.cwd(), source);
    if (!fs.existsSync(replacementSource)) throw new Error(`${source} is missing`);
    fs.copyFileSync(replacementSource, path.join(OUT, target));
  }

  for (const file of OPTIONAL_BINARY_FILES) {
    const body = await download(file, false);
    if (body) fs.writeFileSync(path.join(OUT, file), body);
  }

  for (const file of LOCAL_PATCH_FILES) {
    const patchSource = path.join(process.cwd(), file);
    if (!fs.existsSync(patchSource)) throw new Error(`${file} is missing`);
    fs.copyFileSync(patchSource, path.join(OUT, file));
  }

  const indexPath = path.join(OUT, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  html = html.replace(/<script\s+async\s+data-explicit-opt-in=[\s\S]*?<\/script>\s*$/i, '');
  for (const patch of LOCAL_PATCH_FILES) {
    if (!html.includes(patch)) {
      html = html.replace('</body>', `<script src="${patch}"></script>\n</body>`);
    }
  }

  fs.writeFileSync(indexPath, html);
  console.log(`Built self-contained CRM into ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
