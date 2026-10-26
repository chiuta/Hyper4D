// Teste v2.0.0: tutorialul interactiv 4D (analogia dimensională, șase plane de rotație, politopi).
// Rulare: node tests/tutorial4d.test.mjs
// [fff-portable] axe-core: FFF_AXE / AXE_PATH, apoi pachetul `axe-core` (npm i -D axe-core). Dacă lipsește: undefined (testele cu axe pică cu mesaj clar).
import {createRequire as __fffCR} from 'node:module';
const __fffAxe = () => process.env.FFF_AXE || process.env.AXE_PATH || (() => { try { return __fffCR(import.meta.url).resolve('axe-core/axe.min.js'); } catch { return undefined; } })();
import {createRequire} from 'module'; import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url)); const FILE = 'file://' + path.join(HERE, '..', 'index.html');
const AXE = process.env.FFF_AXE || __fffAxe();
let ok = 0, bad = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ', n); } else { bad++; console.log('  FAIL', n, x ?? ''); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox']});
async function mk(w = 1280, h = 800, scheme = 'dark', hash = '') {
  const ctx = await b.newContext({viewport: {width: w, height: h}, colorScheme: scheme, acceptDownloads: true});
  const net = []; await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || /Content Security Policy/.test(m.text())) errs.push(m.text()); });
  await p.goto(FILE + hash); await p.waitForTimeout(3600);
  return {ctx, p, errs, net};
}
const axeSrc = fs.readFileSync(AXE, 'utf8');
const runAxe = async p => { if (!(await p.evaluate(() => !!window.axe))) await p.evaluate(axeSrc + '\n;0'); return p.evaluate(async () => (await axe.run(document, {resultTypes: ['violations']})).violations.map(v => v.id + ':' + v.nodes.map(n => n.target.join(' ')).join(',').slice(0, 120))); };
async function dl(p, sel) { const [d] = await Promise.all([p.waitForEvent('download'), p.click(sel)]); return {name: d.suggestedFilename(), txt: fs.readFileSync(await d.path(), 'utf8')}; }
const {ctx, p, errs, net} = await mk(1280, 800, 'dark', '#lang=en&cat=polytopes&shape=cell8');
t('pornire fără erori/CSP, 0 cereri de rețea', errs.length === 0 && net.length === 0, [errs, net]);
t('tutorialul pornit închis', await p.isHidden('#tut-body') && (await p.getAttribute('#tut-toggle', 'aria-pressed')) === 'false');
await p.click('#tut-toggle');
t('tutorial deschis, pasul 1 din 6', await p.isVisible('#tut-body') && /Step 1 of 6/.test(await p.textContent('#tut-progress')), await p.textContent('#tut-progress'));
// tabelul analogiei: valorile trebuie să fie cele ale n-cubului
const tab = await p.evaluate(() => [...document.querySelectorAll('#tut-table td')].map(td => [+td.dataset.n, +td.dataset.k, +td.textContent]));
const ref = (n, k) => k > n ? 0 : (function C(a, b) { let r = 1; for (let i = 1; i <= b; i++) r = r * (a - b + i) / i; return Math.round(r); })(n, k) * 2 ** (n - k);
t('tabel: 25 celule = C(n,k)·2^(n−k)', tab.length === 25 && tab.every(([n, k, v]) => v === ref(n, k)));
t('tabel: teseract 16 vârfuri, 32 muchii, 24 pătrate, 8 cuburi, 1 teseract', [16, 32, 24, 8, 1].every((v, k) => tab.find(x => x[0] === 4 && x[1] === k)[2] === v));
t('pasul 1 nu arată cursoarele', await p.isHidden('#tut-planes'));
// coerență cu geometria desenată: V,E din cartuș = tabel
t('cartuș 16·32·24 = tabel', (await p.textContent('#cartus-poly-vm')).replace(/\s/g, '') === '16·32·24');
await p.click('#tut-next'); await p.click('#tut-next');
t('pasul 3: șase cursoare XY XZ YZ XW YW ZW', JSON.stringify(await p.$$eval('#tut-planes input', a => a.map(i => i.dataset.plane))) === JSON.stringify(['XY', 'XZ', 'YZ', 'XW', 'YW', 'ZW']));
// rotația în plan: verificare independentă a proiecției față de formula 6-plane
await p.click('[data-proj="ortografica"]'); await p.click('#poly-play'); await p.waitForTimeout(150);
t('rotație oprită pentru măsurare', (await p.getAttribute('#poly-play', 'aria-pressed')) === 'false');
const dots = () => p.$$eval('#poly-svg circle', a => a.map(c => [+c.getAttribute('cx'), +c.getAttribute('cy')]));
const ref0 = await dots();
const setA = async (k, deg) => { await p.$eval('#tut-ang-' + k, (el, d) => { el.value = d; el.dispatchEvent(new Event('input', {bubbles: true})); }, deg); };
await setA(0, 90); await p.waitForTimeout(100);
const r1 = await dots();
t('XY 90°: vederea se schimbă (≥ 8 vârfuri mutate)', r1.filter((q, i) => Math.hypot(q[0] - ref0[i][0], q[1] - ref0[i][1]) > 1).length >= 8);
await setA(0, 0); await setA(5, 180); await p.waitForTimeout(100);
// ZW 180°: (z,w) -> (-z,-w); în proiecție ortografică 3D se schimbă doar z => vârfurile se permută
const r2 = await dots();
t('cursoarele ↔ unghiurile: valoarea afișată 180°', (await p.textContent('#tut-val-5')) === '180°');
t('ZW 180° e simetrie a teseractului: mulțimea punctelor 2D ≈ aceeași mulțime ca la 0° dacă z ↔ −z e redată simetric (≤ 16 puncte)', r2.length === 16);
// planul fix: XW rotit 360° ≡ identitate
await setA(5, 0); await setA(3, 360 % 360); await p.waitForTimeout(100);
const r3 = await dots(); t('toate unghiurile 0: revenire exactă la vederea inițială', r3.every((q, i) => Math.hypot(q[0] - ref0[i][0], q[1] - ref0[i][1]) < 0.02));
// o rotație pură în XW la 90° trebuie să egaleze rotate4D cu a1=90°, a2=0 (calea veche) => cartuș
await setA(3, 90); await p.waitForTimeout(100);
t('cartuș ∠XW = 90° din cursorul XW', (await p.textContent('#cartus-xw')) === '90°');
// pasul 4: rotație automată într-un plan; planul fix afișat
await p.click('#tut-next'); await p.click('#poly-play');
t('pasul 4: rotație XW, planul YZ fix anunțat', (await p.inputValue('#tut-spin')) === '3' && /XW.*YZ/.test(await p.textContent('#tut-fixed')), await p.textContent('#tut-fixed'));
const a0 = await p.inputValue('#tut-ang-3'); await p.waitForTimeout(900);
t('rotația automată mișcă doar cursorul XW', (await p.inputValue('#tut-ang-3')) !== a0 && (await p.inputValue('#tut-ang-0')) === '0' && (await p.inputValue('#tut-ang-1')) === '0');
for (const [v, q] of [['0', 'ZW'], ['1', 'YW'], ['2', 'XW'], ['4', 'XZ'], ['5', 'XY']]) { await p.selectOption('#tut-spin', v); t('plan fix pentru spin ' + v + ' = ' + q, (await p.textContent('#tut-fixed')).includes('the ' + q + ' plane stays'), await p.textContent('#tut-fixed')); }
// pasul 5: politopi
await p.selectOption('#tut-spin', 'none'); await p.click('#tut-next');
t('pasul 5: butoane de forme vizibile', await p.isVisible('[data-tutshape="cell24"]'));
await p.click('[data-tutshape="cell24"]'); await p.waitForTimeout(300);
t('24-cell: 24 vârfuri, 96 muchii în linia live', /24 vertices, 96 edges/.test(await p.textContent('#tut-live')), await p.textContent('#tut-live'));
await p.click('[data-tutshape="cell120"]'); await p.waitForTimeout(600);
t('120-cell: 600 vârfuri, 1200 muchii', /600 vertices, 1200 edges/.test(await p.textContent('#tut-live')), await p.textContent('#tut-live'));
await p.click('[data-tutshape="cell8"]'); await p.waitForTimeout(300);
t('înapoi la teseract: 16 vârfuri, 32 muchii', /16 vertices, 32 edges/.test(await p.textContent('#tut-live')));
// pasul 6: dublă
await p.click('#tut-next');
t('pasul 6: rotație dublă selectată', (await p.inputValue('#tut-spin')) === 'double' && /Step 6 of 6/.test(await p.textContent('#tut-progress')) && await p.isDisabled('#tut-next'));
if ((await p.getAttribute('#poly-play', 'aria-pressed')) === 'false') await p.click('#poly-play');
const d0 = [await p.inputValue('#tut-ang-3'), await p.inputValue('#tut-ang-2')]; await p.waitForTimeout(900);
t('rotația dublă mișcă XW și YZ', (await p.inputValue('#tut-ang-3')) !== d0[0] && (await p.inputValue('#tut-ang-2')) !== d0[1]);
t('axe: 0 violări cu tutorialul deschis', (await runAxe(p)).length === 0, await runAxe(p));
// reset
await p.click('#tut-reset'); t('reset: toate unghiurile 0, fără rotație automată', (await p.$$eval('#tut-planes input', a => a.every(i => i.value === '0'))) && (await p.inputValue('#tut-spin')) === 'none');
// limbi: toate cele 8 au cheile
for (const l of ['ro', 'fr', 'it', 'es', 'pt', 'de', 'hu']) { await p.evaluate(h => { location.hash = h; }, '#lang=' + l + '&cat=polytopes&shape=cell8'); await p.waitForTimeout(250);
  const txt = await p.textContent('#tut-step-title'); const en = await p.evaluate(() => 0); t('limba ' + l + ': titlul pasului tradus (diferit de engleză, fără marcaj de cheie)', txt && txt !== 'The dimensional analogy' && txt !== 'tut.t6', txt); }
// închidere
await p.click('#tut-exit'); t('închidere: corpul ascuns, redarea veche (a1/a2) revine', await p.isHidden('#tut-body') && await p.isVisible('#tut-toggle'));
t('fără erori pe tot parcursul', errs.length === 0, errs);
// mobil 360
const mo = await mk(360, 740, 'light', '#lang=en&cat=polytopes&shape=cell24'); await mo.p.click('#tut-toggle'); await mo.p.click('#tut-next'); await mo.p.click('#tut-next');
t('mobil 360px: fără derulare orizontală', await mo.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
t('mobil: axe 0 violări (temă luminoasă)', (await runAxe(mo.p)).length === 0, await runAxe(mo.p));
await b.close();
console.log(`\n${ok} ok / ${bad} eșuate`); process.exit(bad ? 1 : 0);
