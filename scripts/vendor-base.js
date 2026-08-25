const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Maintenance-only source for refreshing the frozen bootstrap snapshot.
// Normal production builds never make a network request to it.
const SOURCE = (process.env.CRM_BASE_URL || 'https://sunbliss-q3pmfsk79-sunbliss-crm.vercel.app').replace(/\/+$/, '');
const OUT = process.env.CRM_BASE_OUT || path.join(process.cwd(), 'vendor', 'base');
const REQUIRED_FILES = ['index.html', ...Array.from({ length: 13 }, (_, i) => `chunk_${String(i).padStart(2, '0')}.js`)];
const OPTIONAL_FILES = ['letterhead.jpg'];

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function download(file, required) {
  const response = await fetch(`${SOURCE}/${file}`, { redirect: 'follow' });
  if (!response.ok) {
    if (!required) {
      console.warn(`Optional base asset ${file} unavailable (${response.status}); skipping.`);
      return null;
    }
    throw new Error(`Failed to vendor ${file}: HTTP ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const manifest = {
    source: SOURCE,
    purpose: 'Frozen bootstrap snapshot for deterministic, network-free production builds.',
    files: []
  };

  for (const file of REQUIRED_FILES) {
    const body = await download(file, true);
    fs.writeFileSync(path.join(OUT, file), body);
    manifest.files.push({ file, bytes: body.length, sha256: sha256(body) });
  }

  for (const file of OPTIONAL_FILES) {
    const body = await download(file, false);
    if (!body) continue;
    fs.writeFileSync(path.join(OUT, file), body);
    manifest.files.push({ file, bytes: body.length, sha256: sha256(body) });
  }

  fs.writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Vendored ${manifest.files.length} base files into ${path.relative(process.cwd(), OUT)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
