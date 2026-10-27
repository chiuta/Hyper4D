// Teste v2.1.0: hiperprisme + politopuri rectificate (numărători, Euler, lungimi de muchie, fețe) și tragerea care rotește în 4D.
// Rulare: node tests/politopuri-tragere4d.test.mjs   (PW_ROOT, CHROMIUM_PATH; FFF_AXE opțional)
import {createRequire} from 'module'; import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require('playwright');
const FILE = 'file://' + path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'index.html');
let ok = 0, bad = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ', n); } else { bad++; console.log('  FAIL', n, x ?? ''); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
const ctx = await b.newContext({viewport: {width: 1200, height: 900}, acceptDownloads: true});
const net = []; await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || /Content Security Policy/.test(m.text())) errs.push(m.text()); });
await p.goto(FILE + '#lang=en&cat=polytopes&shape=cell8'); await p.waitForTimeout(3000);
t('pornire fără erori/CSP, 0 cereri de rețea', errs.length === 0 && net.length === 0, [errs, net]);
// V, E, F, C așteptate (calculate independent, nu din cod)
const EXP = {prTetra: [8, 16, 14, 6], prOcta: [12, 30, 28, 10], prDode: [40, 80, 54, 14], prIcosa: [24, 72, 70, 22], rect5: [10, 30, 30, 10], rectTess: [32, 96, 88, 24]};
const geo = async () => p.evaluate(() => ({lines: [...document.querySelectorAll('#poly-svg line')].length, dots: document.querySelectorAll('#poly-svg circle').length, polys: document.querySelectorAll('#poly-svg polygon').length,
  vm: document.getElementById('cartus-poly-vm').textContent, euler: document.getElementById('poly-euler').textContent, corp: document.getElementById('cartus-poly-corp').textContent}));
for (const [k, [V, E, F, C]] of Object.entries(EXP)) {
  await p.click('#subnav-polytopes [data-shape="' + k + '"]'); await p.waitForTimeout(250);
  const g = await geo();
  t(k + ': ' + V + '·' + E + '·' + F + ' (vârfuri·muchii·fețe) desenate = valorile teoretice', g.vm === V + '·' + E + '·' + F && g.lines === E && g.polys === F && g.dots === V, g);
  t(k + ': V − E + F − C = ' + (V - E + F - C) + ' = 0 ✓ în pagină', V - E + F - C === 0 && new RegExp(V + ' − ' + E + ' \\+ ' + F + ' − ' + C + ' = 0 ✓').test(g.euler), g.euler);
  t(k + ': hash-ul păstrează forma', (await p.evaluate(() => location.hash)).includes('shape=' + k));
}
// lungimea muchiilor: uniformă (hiperprisme și rectificate au toate muchiile egale)
const J = await p.evaluate(async () => { const out = {}; for (const k of ['prTetra', 'prOcta', 'prDode', 'prIcosa', 'rect5', 'rectTess']) { document.querySelector('#subnav-polytopes [data-shape="' + k + '"]').click(); await new Promise(r => setTimeout(r, 200)); const [dl] = await Promise.all([new Promise(res => { const o = URL.createObjectURL; URL.createObjectURL = function (bl) { bl.text().then(res); URL.createObjectURL = o; return o.call(URL, bl); }; document.getElementById('poly-export-json').click(); })]); out[k] = JSON.parse(dl); } return out; });
for (const k of Object.keys(EXP)) {
  const o = J[k], d = e => Math.hypot(...o.vertices[e[0]].map((x, i) => x - o.vertices[e[1]][i]));
  const L = o.edges.map(d), mn = Math.min(...L), mx = Math.max(...L);
  t(k + ': toate muchiile au aceeași lungime (±1e-6)', mx - mn < 1e-6, [mn, mx]);
  const R = o.vertices.map(v => Math.hypot(...v)); t(k + ': normalizat la raza circumscrisă 1', Math.abs(Math.max(...R) - 1) < 1e-6);
  const sq = o.faces.filter(f => f.length === 4).length; t(k + ': număr de fețe pătrate = ' + ({prTetra: 6, prOcta: 12, prDode: 30, prIcosa: 30, rect5: 0, rectTess: 24}[k]), sq === {prTetra: 6, prOcta: 12, prDode: 30, prIcosa: 30, rect5: 0, rectTess: 24}[k], sq);
}
// tragerea 4D
await p.click('#subnav-polytopes [data-shape="cell8"]'); await p.waitForTimeout(250);
if ((await p.getAttribute('#poly-play', 'aria-pressed')) === 'true') await p.click('#poly-play');
const ang = () => p.evaluate(() => [document.getElementById('cartus-xw').textContent, document.getElementById('cartus-yz').textContent]);
const box = await (await p.$('#poly-svg')).boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
const a0 = await ang(); await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 80, cy + 40, {steps: 5}); await p.mouse.up();
t('implicit: tragerea mișcă camera 3D, unghiurile 4D (XW, YZ) rămân', JSON.stringify(await ang()) === JSON.stringify(a0), [a0, await ang()]);
t('butonul „Drag rotates in 4D” există, neapăsat', (await p.getAttribute('#poly-dragmode', 'aria-pressed')) === 'false');
await p.click('#poly-dragmode'); t('după clic: aria-pressed=true + anunț', (await p.getAttribute('#poly-dragmode', 'aria-pressed')) === 'true' && /rotate|rotates/i.test(await p.textContent('#svg-status')), await p.textContent('#svg-status'));
const a1 = await ang(); await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 100, cy, {steps: 5}); await p.mouse.up();
const a2 = await ang();
t('mod 4D, tragere orizontală: XW se schimbă (≈ 100·0,012 rad ≈ 69°), YZ rămâne', a2[0] !== a1[0] && a2[1] === a1[1] && Math.abs(parseInt(a2[0]) - parseInt(a1[0]) - 69) <= 3, [a1, a2]);
await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx, cy - 50, {steps: 5}); await p.mouse.up();
const a3 = await ang(); t('mod 4D, tragere verticală (în sus): YZ crește (≈ +34°), XW rămâne', a3[0] === a2[0] && a3[1] !== a2[1], [a2, a3]);
await p.click('#poly-dragmode'); const a4 = await ang(); await p.mouse.move(cx, cy); await p.keyboard.down('Shift'); await p.mouse.down(); await p.mouse.move(cx + 50, cy, {steps: 4}); await p.mouse.up(); await p.keyboard.up('Shift');
t('Shift + tragere = rotație 4D chiar cu modul oprit', (await ang())[0] !== a4[0], [a4, await ang()]);
// tutorial pornit: tragerea în 4D mișcă cursoarele XW/YZ
await p.click('#tut-toggle'); await p.waitForTimeout(300); await p.click('#poly-dragmode');
const s0 = await p.evaluate(() => [document.getElementById('tut-ang-3').value, document.getElementById('tut-ang-2').value]);
await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 60, cy + 30, {steps: 5}); await p.mouse.up();
const s1 = await p.evaluate(() => [document.getElementById('tut-ang-3').value, document.getElementById('tut-ang-2').value]);
t('în tutorial, tragerea 4D mișcă cursoarele XW și YZ', s0[0] !== s1[0] && s0[1] !== s1[1], [s0, s1]);
// limbi
for (const l of ['ro', 'fr', 'de', 'hu']) { await p.selectOption('#lang-select', l); await p.waitForTimeout(200); await p.click('#subnav-polytopes [data-shape="rectTess"]'); await p.waitForTimeout(200);
  const g = await geo(); const info = await p.textContent('#poly-info-text'); t('limba ' + l + ': forma nouă se afișează, text informativ prezent (' + info.slice(0, 18) + '…)', g.lines === 96 && info.length > 40 && g.corp.length > 3, g); }
await p.selectOption('#lang-select', 'ro'); await p.waitForTimeout(200); await p.click('#subnav-polytopes [data-shape="prDode"]'); await p.waitForTimeout(200);
t('ro: nume și grup în română', /Hiperprismă\/dodecaedru/.test(await p.textContent('#cartus-poly-corp')) && /Hiperprisme/.test(await p.textContent('#subnav-polytopes')) && /Tragerea rotește în 4D/.test(await p.textContent('#poly-dragmode')));
const AX = process.env.FFF_AXE; if (AX) { await p.evaluate(fs.readFileSync(AX, 'utf8') + '\n;0'); const v = await p.evaluate(async () => (await axe.run(document, {resultTypes: ['violations']})).violations.map(x => x.id)); t('axe: 0 violări', v.length === 0, v); }
t('fără erori JS', errs.length === 0, errs);
await b.close(); console.log(`\n${ok} ok / ${bad} eșuate`); process.exit(bad ? 1 : 0);
