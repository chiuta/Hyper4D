// Teste v2.2.0: hipervolumul V₄ al formelor noi (calculat INDEPENDENT prin înfășurătoare convexă exactă, recursivă, din vârfurile exportate)
// și rotația 4D de la tastatură (Shift + săgeți). Rulare: node tests/hipervolum-tastatura.test.mjs (PW_ROOT, CHROMIUM_PATH)
import {createRequire} from 'module'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ', n); } else { bad++; console.log('  FAIL', n, x ?? ''); } };

// ---- volum al înfășurătorii convexe în R^d (d = 1..4), fără biblioteci: fațete = hiperplane de suport prin d puncte ----
const EPS = 2e-5;   // vârfurile exportate sunt rotunjite
function nullNormal(rows, d) {   // vector unitar ortogonal pe cele d-1 rânduri (Gauss–Jordan); null dacă rangul < d-1
  const M = rows.map(r => r.slice()); const piv = []; let r = 0;
  for (let c = 0; c < d && r < M.length; c++) {
    let p = r; for (let i = r + 1; i < M.length; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    if (Math.abs(M[p][c]) < 1e-7) continue;
    [M[r], M[p]] = [M[p], M[r]]; const f = M[r][c]; for (let j = 0; j < d; j++) M[r][j] /= f;
    for (let i = 0; i < M.length; i++) if (i !== r) { const g = M[i][c]; for (let j = 0; j < d; j++) M[i][j] -= g * M[r][j]; }
    piv.push(c); r++;
  }
  if (piv.length < d - 1) return null;
  const free = [...Array(d).keys()].find(c => !piv.includes(c)); const n = Array(d).fill(0); n[free] = 1;
  piv.forEach((c, i) => { n[c] = -M[i][free]; }); const L = Math.hypot(...n); return n.map(x => x / L);
}
function hullVol(P, d) {
  if (d === 1) { const v = P.map(p => p[0]); return Math.max(...v) - Math.min(...v); }
  const n = P.length, cen = Array(d).fill(0); P.forEach(p => p.forEach((x, i) => { cen[i] += x / n; }));
  const seen = new Set(); let vol = 0;
  const idx = []; const rec = (start) => {
    if (idx.length === d) {
      const rows = []; for (let i = 1; i < d; i++) rows.push(P[idx[i]].map((x, k) => x - P[idx[0]][k]));
      const nm = nullNormal(rows, d); if (!nm) return;
      const c = nm.reduce((s, x, k) => s + x * P[idx[0]][k], 0);
      let pos = 0, neg = 0; const on = [];
      for (let i = 0; i < n; i++) { const dd = nm.reduce((s, x, k) => s + x * P[i][k], 0) - c; if (dd > EPS) pos++; else if (dd < -EPS) neg++; else on.push(i); }
      if (pos && neg) return; const key = on.join(','); if (seen.has(key)) return; seen.add(key);
      // bază ortonormală a hiperplanului
      const basis = []; for (let i = 1; i < on.length && basis.length < d - 1; i++) {
        let v = P[on[i]].map((x, k) => x - P[on[0]][k]);
        basis.forEach(b => { const pr = v.reduce((s, x, k) => s + x * b[k], 0); v = v.map((x, k) => x - pr * b[k]); });
        const L = Math.hypot(...v); if (L > 1e-5) basis.push(v.map(x => x / L));
      }
      const Q = on.map(i => basis.map(b => P[i].reduce((s, x, k) => s + x * b[k], 0)));
      const h = Math.abs(nm.reduce((s, x, k) => s + x * cen[k], 0) - c);
      vol += h * hullVol(Q, d - 1) / d; return;
    }
    for (let i = start; i < n; i++) { idx.push(i); rec(i + 1); idx.pop(); }
  };
  rec(0); return vol;
}
// verificare a verificatorului: cub unitate, teseract, simplex
const cube = [], tess = []; for (let m = 0; m < 8; m++) cube.push([m & 1, (m >> 1) & 1, (m >> 2) & 1]); for (let m = 0; m < 16; m++) tess.push([m & 1, (m >> 1) & 1, (m >> 2) & 1, (m >> 3) & 1]);
t('verificator: volum cub 1, teseract 1, simplex 4D 1/24', Math.abs(hullVol(cube, 3) - 1) < 1e-9 && Math.abs(hullVol(tess, 4) - 1) < 1e-9 && Math.abs(hullVol([[0,0,0,0],[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]], 4) - 1 / 24) < 1e-9);

const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const ctx = await b.newContext({viewport: {width: 1200, height: 900}, acceptDownloads: true});
const net = []; await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || /Content Security Policy/.test(m.text())) errs.push(m.text()); });
await p.goto(FILE + '#lang=en&cat=polytopes&shape=cell8'); await p.waitForTimeout(2500);
t('pornire fără erori/CSP, 0 cereri de rețea', errs.length === 0 && net.length === 0, [errs, net]);
const KEYS = ['prTetra', 'prOcta', 'prDode', 'prIcosa', 'rect5', 'rectTess', 'pyrCube', 'pyrOcta', 'pyrDode', 'pyrIcosa', 'duo33', 'duo35'];
const J = await p.evaluate(async (keys) => { const out = {}; for (const k of keys) { document.querySelector('#subnav-polytopes [data-shape="' + k + '"]').click(); await new Promise(r => setTimeout(r, 200)); const dl = await new Promise(res => { const o = URL.createObjectURL; URL.createObjectURL = function (bl) { bl.text().then(res); URL.createObjectURL = o; return o.call(URL, bl); }; document.getElementById('poly-export-json').click(); }); out[k] = {json: JSON.parse(dl), hv: document.getElementById('cartus-poly-hv').textContent}; } return out; }, KEYS);
for (const k of KEYS) {
  const V = J[k].json.vertices, R = Math.max(...V.map(v => Math.hypot(...v)));
  const vol = hullVol(V, 4);
  t(k + ': raza circumscrisă 1 și V₄ afișat (' + J[k].hv + ') = înfășurătoarea convexă (' + vol.toFixed(6) + ') la 4 zecimale', Math.abs(R - 1) < 1e-6 && J[k].hv === vol.toFixed(4) && Math.abs(Number(J[k].hv) - vol) < 5.1e-5, [R, J[k].hv, vol]);
}
// valori exacte în formă închisă
const EXACT = {rect5: 275 * Math.sqrt(5) / 864, rectTess: 46 / 27, duo33: 27 / 64, prOcta: (4 / 3) * Math.SQRT2 / Math.pow(1.5, 2)};
for (const [k, v] of Object.entries(EXACT)) t(k + ': V₄ = ' + v.toFixed(4) + ' (formă închisă)', J[k].hv === v.toFixed(4), [J[k].hv, v]);
// duoprism personalizat: P=Q=4 = teseractul (V₄ = 1), P=5, Q=7 = produsul ariilor
await p.click('#subnav-polytopes [data-shape="duoCustom"]'); await p.waitForTimeout(200);
await p.selectOption('#duo-p-select', '4'); await p.selectOption('#duo-q-select', '4'); await p.waitForTimeout(250);
t('duoprism 4×4: V₄ = 1.0000 (= teseractul)', (await p.textContent('#cartus-poly-hv')) === '1.0000', await p.textContent('#cartus-poly-hv'));
await p.selectOption('#duo-p-select', '5'); await p.selectOption('#duo-q-select', '7'); await p.waitForTimeout(250);
const A = n => n / 2 * Math.sin(2 * Math.PI / n);
t('duoprism 5×7: V₄ = A₅·A₇/4', (await p.textContent('#cartus-poly-hv')) === (A(5) * A(7) / 4).toFixed(4), await p.textContent('#cartus-poly-hv'));
t('info exact vizibil (EN) pentru hiperprisma/teseractul rectificat', await (async () => { await p.click('#subnav-polytopes [data-shape="rectTess"]'); await p.waitForTimeout(200); return /Exact hypervolume \(circumradius 1\): V₄ = 46\/27/.test(await p.textContent('#poly-info-text')); })());
await p.selectOption('#lang-select', 'ro'); await p.waitForTimeout(200); await p.click('#subnav-polytopes [data-shape="rect5"]'); await p.waitForTimeout(200);
t('info exact vizibil (RO)', /Hipervolum exact \(raza circumscrisă 1\): V₄ = 275√5\/864/.test(await p.textContent('#poly-info-text')));
t('RO: indiciul de taste menționează Shift + săgeți', /Shift \+ ← → ↑ ↓ = rotație 4D/.test(await p.textContent('.keys-hint')));
await p.selectOption('#lang-select', 'en'); await p.waitForTimeout(200);
// tastatură
await p.click('#subnav-polytopes [data-shape="cell8"]'); await p.waitForTimeout(250);
if ((await p.getAttribute('#poly-play', 'aria-pressed')) === 'true') await p.click('#poly-play');
await p.evaluate(() => document.activeElement && document.activeElement.blur());
const ang = () => p.evaluate(() => [document.getElementById('cartus-xw').textContent, document.getElementById('cartus-yz').textContent]);
const a0 = await ang(); const shape0 = await p.evaluate(() => location.hash);
for (let i = 0; i < 5; i++) await p.keyboard.press('Shift+ArrowRight');
const a1 = await ang();
t('Shift + → ×5: XW crește (≈ 5·0,08 rad ≈ 23°), YZ neschimbat, forma nu s-a schimbat', a1[0] !== a0[0] && a1[1] === a0[1] && Math.abs(parseInt(a1[0]) - parseInt(a0[0]) - 23) <= 2 && (await p.evaluate(() => location.hash)) === shape0, [a0, a1]);
for (let i = 0; i < 5; i++) await p.keyboard.press('Shift+ArrowUp');
const a2 = await ang(); t('Shift + ↑ ×5: YZ crește, XW neschimbat', a2[1] !== a1[1] && a2[0] === a1[0] && parseInt(a2[1]) > parseInt(a1[1]), [a1, a2]);
for (let i = 0; i < 5; i++) await p.keyboard.press('Shift+ArrowLeft'); for (let i = 0; i < 5; i++) await p.keyboard.press('Shift+ArrowDown');
t('Shift + ← și ↓ aduc înapoi unghiurile', JSON.stringify(await ang()) === JSON.stringify(a0), [await ang(), a0]);
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(250);
t('→ simplu schimbă în continuare forma (neafectat)', (await p.evaluate(() => location.hash)) !== shape0);
// tutorial pornit: tastele mișcă cursoarele
await p.click('#tut-toggle'); await p.waitForTimeout(300);
const s0 = await p.evaluate(() => [document.getElementById('tut-ang-3').value, document.getElementById('tut-ang-2').value]);
await p.evaluate(() => document.activeElement && document.activeElement.blur());
await p.keyboard.press('Shift+ArrowRight'); await p.keyboard.press('Shift+ArrowUp');
const s1 = await p.evaluate(() => [document.getElementById('tut-ang-3').value, document.getElementById('tut-ang-2').value]);
t('în tutorial, Shift + săgeți mișcă cursoarele XW și YZ', s0[0] !== s1[0] && s0[1] !== s1[1], [s0, s1]);
t('fără erori JS', errs.length === 0, errs);
await b.close(); console.log(`\n${ok} ok / ${bad} eșuate`); process.exit(bad ? 1 : 0);
