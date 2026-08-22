const fs = require('fs');
const path = require('path');

const BASE = 'https://sunbliss-q3pmfsk79-sunbliss-crm.vercel.app';
const OUT = path.join(process.cwd(), 'dist');
const TEXT_FILES = ['index.html', ...Array.from({ length: 13 }, (_, i) => `chunk_${String(i).padStart(2, '0')}.js`)];
const OPTIONAL_BINARY_FILES = ['letterhead.jpg'];
const LOCAL_PATCH_FILES = ['feature_patch.js', 'detail_menu_patch.js', 'hide_duplicate_payment_patch.js', 'transaction_ui_refine_patch.js', 'primary_contact_patch.js', 'insights_chart_responsive_patch.js', 'search_focus_patch.js', 'header_compact_patch.js', 'sales_channel_drilldown_patch.js', 'rm_detail_patch.js', 'broker_detail_patch.js', 'conditional_brokerage_patch.js', 'units_action_toolbar_patch.js', 'bottom_nav_patch.js', 'footer_surface_patch.js', 'mobile_input_zoom_patch.js', 'header_spacing_patch.js'];

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

  // Make sure the deployed site uses its own local copied chunks and then loads
  // the CRM extensions after the original application code.
  html = html.replace(/<script\s+async\s+data-explicit-opt-in=[\s\S]*?<\/script>\s*$/i, '');
  if (!html.includes('feature_patch.js')) {
    html = html.replace('</body>', '<script src="feature_patch.js"></script>\n</body>');
  }
  if (!html.includes('detail_menu_patch.js')) {
    html = html.replace('</body>', '<script src="detail_menu_patch.js"></script>\n</body>');
  }
  if (!html.includes('hide_duplicate_payment_patch.js')) {
    html = html.replace('</body>', '<script src="hide_duplicate_payment_patch.js"></script>\n</body>');
  }
  if (!html.includes('transaction_ui_refine_patch.js')) {
    html = html.replace('</body>', '<script src="transaction_ui_refine_patch.js"></script>\n</body>');
  }
  if (!html.includes('primary_contact_patch.js')) {
    html = html.replace('</body>', '<script src="primary_contact_patch.js"></script>\n</body>');
  }
  if (!html.includes('insights_chart_responsive_patch.js')) {
    html = html.replace('</body>', '<script src="insights_chart_responsive_patch.js"></script>\n</body>');
  }
  if (!html.includes('search_focus_patch.js')) {
    html = html.replace('</body>', '<script src="search_focus_patch.js"></script>\n</body>');
  }
  if (!html.includes('header_compact_patch.js')) {
    html = html.replace('</body>', '<script src="header_compact_patch.js"></script>\n</body>');
  }
  if (!html.includes('sales_channel_drilldown_patch.js')) {
    html = html.replace('</body>', '<script src="sales_channel_drilldown_patch.js"></script>\n</body>');
  }
  if (!html.includes('rm_detail_patch.js')) {
    html = html.replace('</body>', '<script src="rm_detail_patch.js"></script>\n</body>');
  }
  if (!html.includes('broker_detail_patch.js')) {
    html = html.replace('</body>', '<script src="broker_detail_patch.js"></script>\n</body>');
  }
  if (!html.includes('conditional_brokerage_patch.js')) {
    html = html.replace('</body>', '<script src="conditional_brokerage_patch.js"></script>\n</body>');
  }
  if (!html.includes('units_action_toolbar_patch.js')) {
    html = html.replace('</body>', '<script src="units_action_toolbar_patch.js"></script>\n</body>');
  }
  if (!html.includes('bottom_nav_patch.js')) {
    html = html.replace('</body>', '<script src="bottom_nav_patch.js"></script>\n</body>');
  }
  if (!html.includes('footer_surface_patch.js')) {
    html = html.replace('</body>', '<script src="footer_surface_patch.js"></script>\n</body>');
  }
  if (!html.includes('mobile_input_zoom_patch.js')) {
    html = html.replace('</body>', '<script src="mobile_input_zoom_patch.js"></script>\n</body>');
  }
  if (!html.includes('header_spacing_patch.js')) {
    html = html.replace('</body>', '<script src="header_spacing_patch.js"></script>\n</body>');
  }
  fs.writeFileSync(indexPath, html);

  console.log(`Built self-contained CRM into ${OUT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
