// Binaan statik UPBM Subis: minify js/ css/ -> dist/, cap versi (?v=<hash kandungan>) pada index.html.
// SANDARAN SELAMAT: jika esbuild tiada / gagal pada sesuatu fail, fail ASAL disalin (deploy tidak pernah gagal kerana minify).
// Sumber kekal di js/ & css/ (suntingan seperti biasa). Jalankan:  npm run build   (output: dist/)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const OUT = 'dist';
let esbuild = null;
try { esbuild = await import('esbuild'); } catch { console.warn('[bina] esbuild tiada — salin tanpa minify'); }

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });

const hash = (buf) => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
const versi = {};   // laluan relatif -> hash
let mentah = 0, minify = 0, gagal = 0;

async function proses(rel, loader) {
  const src = fs.readFileSync(rel);
  let out = src;
  if (esbuild) {
    try {
      const r = await esbuild.transform(src.toString('utf8'), { loader, minify: true, legalComments: 'none', target: 'es2019' });
      out = Buffer.from(r.code, 'utf8');
    } catch (e) { gagal++; console.warn(`[bina] minify GAGAL ${rel}: ${String(e.message).split('\n')[0]} — salin asal`); out = src; }
  }
  fs.writeFileSync(path.join(OUT, rel), out);
  versi[rel] = hash(out); mentah += src.length; minify += out.length;
}

for (const f of fs.readdirSync('js').filter((f) => f.endsWith('.js')).sort()) await proses(`js/${f}`, 'js');
for (const f of fs.readdirSync('css').filter((f) => f.endsWith('.css')).sort()) await proses(`css/${f}`, 'css');
if (fs.existsSync('laporan-sekolah.js')) await proses('laporan-sekolah.js', 'js');

// index.html: cap versi mengikut hash kandungan (cache selamat — fail berubah => URL berubah)
let html = fs.readFileSync('index.html', 'utf8');
let dicap = 0, tiada = [];
html = html.replace(/((?:src|href)=")((?:js|css)\/[^"?]+\.(?:js|css)|laporan-sekolah\.js)(?:\?v=[^"]*)?(")/g, (m, a, p, c) => {
  if (!versi[p]) { tiada.push(p); return m; }
  dicap++; return `${a}${p}?v=${versi[p]}${c}`;
});
fs.writeFileSync(path.join(OUT, 'index.html'), html);

console.log(`[bina] ${Object.keys(versi).length} fail | ${(mentah/1024).toFixed(0)} KB -> ${(minify/1024).toFixed(0)} KB | versi dicap: ${dicap} | minify gagal: ${gagal}`);
if (tiada.length) console.warn('[bina] rujukan tanpa fail:', tiada.join(', '));
if (tiada.length) process.exitCode = 1;   // rujukan skrip/css hilang = ralat sebenar
