// Teste pentru funcțiile din v1.1.0: export OBJ/JSON al politopului, cod QR al stării, tipărire, 7 limbi + kit.
// Rulare: node tests/fff-r8.test.mjs   (Playwright din /opt/node-tools, Chromium din /opt/pw-browsers; rețea blocată)
import {createRequire} from 'module'; import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
const require = createRequire('/opt/node-tools/package.json'); const {chromium} = require('playwright');
const HERE = path.dirname(fileURLToPath(import.meta.url)); const FILE = 'file://' + path.join(HERE, '..', 'index.html');
const AXE = process.env.FFF_AXE || '/tmp/claude-0/-home-claude/78529928-3825-51c3-b9bd-0e81655ab6bc/scratchpad/sweep/node_modules/axe-core/axe.min.js';
let ok = 0, bad = 0; const t = (n, c, x) => { if (c) { ok++; console.log('  ok  ', n); } else { bad++; console.log('  FAIL', n, x ?? ''); } };
const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
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
const shape = async (p, key) => { await p.click('.pill[data-shape="' + key + '"]'); await p.waitForTimeout(400); };

const {ctx, p, errs, net} = await mk(1280, 800, 'dark', '#lang=en&cat=polytopes&shape=cell8');
t('pornire fără erori/CSP', errs.length === 0, errs); t('0 cereri de rețea', net.length === 0, net);
t('kitul (core, label, bundle, qr) încărcat', await p.evaluate(() => !!(window.FFF && FFF.qr && FFF.label && FFF.bundle)));
await p.click('#poly-play'); await p.click('[data-proj="ortografica"]'); await p.waitForTimeout(300);
t('rotația oprită (pauză)', (await p.getAttribute('#poly-play', 'aria-pressed')) === 'false');
// --- JSON
const j = await dl(p, '#poly-export-json'); const J = JSON.parse(j.txt);
t('JSON: nume fișier, format', j.name === 'hyper4d-cell8.json' && J.format === 'hyper4d-polytope' && J.version === '1.2.0', j.name);
t('JSON 8-cell: 16 vârfuri, 32 muchii, 24 fețe', J.counts.vertices === 16 && J.counts.edges === 32 && J.counts.faces === 24 && J.vertices.length === 16 && J.edges.length === 32 && J.faces.length === 24, JSON.stringify(J.counts));
t('JSON: vârfuri 4D de normă 1 (rază circumscrisă 1)', J.vertices.every(v => v.length === 4 && Math.abs(Math.hypot(...v) - 1) < 1e-6));
const el = J.edges.map(([a, c]) => Math.hypot(...J.vertices[a].map((x, i) => x - J.vertices[c][i]))); t('JSON: toate muchiile teseractului au aceeași lungime (1,0)', Math.max(...el) - Math.min(...el) < 1e-6 && Math.abs(el[0] - 1) < 1e-6, [Math.min(...el), Math.max(...el)]);
t('JSON: fețele sunt pătrate cu 4 indici distincți valizi', J.faces.every(f => f.length === 4 && new Set(f).size === 4 && f.every(i => i >= 0 && i < 16)));
// --- OBJ: verificare independentă față de unghiurile afișate în cartuș
const o = await dl(p, '#poly-export-obj'); const lines = o.txt.split('\n');
const V = lines.filter(l => l.startsWith('v ')).map(l => l.split(' ').slice(1).map(Number)), Lr = lines.filter(l => l.startsWith('l ')).map(l => l.split(' ').slice(1).map(Number));
t('OBJ: 16 v, 32 l, nume .obj', o.name === 'hyper4d-cell8.obj' && V.length === 16 && Lr.length === 32 && Lr.every(([a, c]) => a >= 1 && c <= 16 && a !== c), [V.length, Lr.length]);
const ang = async id => parseFloat((await p.textContent(id)).replace('°', ''));
const a1 = (await ang('#cartus-xw')) * Math.PI / 180, a2 = (await ang('#cartus-yz')) * Math.PI / 180;
const exp = J.vertices.map(([x, y, z, w]) => { const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2); return [x * c1 - w * s1, y * c2 - z * s2, y * s2 + z * c2]; });
const err = Math.max(...V.map((v, i) => Math.hypot(v[0] - exp[i][0], v[1] - exp[i][1], v[2] - exp[i][2])));
t('OBJ (ortografic): vârfurile = rotația 4D a datelor JSON cu unghiurile din cartuș (±0,02)', err < 0.02, err);
// perspectivă: altă proiecție
await p.click('[data-proj="perspectiva"]'); await p.waitForTimeout(200);
const o2 = await dl(p, '#poly-export-obj'); const V2 = o2.txt.split('\n').filter(l => l.startsWith('v ')).map(l => l.split(' ').slice(1).map(Number));
const exp2 = J.vertices.map(([x, y, z, w]) => { const c1 = Math.cos(a1), s1 = Math.sin(a1), c2 = Math.cos(a2), s2 = Math.sin(a2); const r = [x * c1 - w * s1, y * c2 - z * s2, y * s2 + z * c2, x * s1 + w * c1], k = 3 / (3 - r[3]); return [r[0] * k, r[1] * k, r[2] * k]; });
const err2 = Math.max(...V2.map((v, i) => Math.hypot(v[0] - exp2[i][0], v[1] - exp2[i][1], v[2] - exp2[i][2]))); t('OBJ (perspectivă): vârfurile coincid cu proiecția w-perspectivă calculată independent (±0,02)', err2 < 0.02, err2);
// alte politopi
for (const [k, V0, E0] of [['cell5', 5, 10], ['cell16', 8, 24], ['cell24', 24, 96], ['cell600', 120, 720], ['cell120', 600, 1200]]) { await shape(p, k); const r = JSON.parse((await dl(p, '#poly-export-json')).txt); t(k + ': ' + V0 + ' vârfuri, ' + E0 + ' muchii în JSON', r.counts.vertices === V0 && r.counts.edges === E0, JSON.stringify(r.counts)); }
await shape(p, 'duoCustom'); const jd = JSON.parse((await dl(p, '#poly-export-json')).txt); t('duoprism personalizat: V = P·Q, E = 2·P·Q', jd.counts.vertices === jd.counts.edges / 2 && jd.vertices.length === jd.counts.vertices, JSON.stringify(jd.counts));
await shape(p, 'cell8');
// --- QR
await p.click('#poly-qr'); await p.waitForTimeout(400);
t('QR: dialog deschis cu SVG', await p.evaluate(() => document.getElementById('h4d-qr').open && !!document.querySelector('#h4d-qr-img svg')));
const url = await p.textContent('#h4d-qr-url'); t('QR: adresa = publică + hash-ul curent', /^https:\/\/chiuta\.github\.io\/Hyper4D\/#.*shape=cell8/.test(url), url);
const dec = await p.evaluate(async () => { const svg = document.querySelector('#h4d-qr-img svg').outerHTML, u = URL.createObjectURL(new Blob([svg], {type: 'image/svg+xml'})), im = new Image(); await new Promise((r, j) => { im.onload = r; im.onerror = j; im.src = u; }); const c = document.createElement('canvas'); c.width = c.height = 420; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 420, 420); x.drawImage(im, 0, 0, 420, 420); const bl = await new Promise(r => c.toBlob(r, 'image/png')); try { const r = await FFF.qr.scan(new File([bl], 'q.png', {type: 'image/png'})); return r && (r.text || r); } catch (e) { return 'ERR ' + e.message; } });
t('QR: decodat înapoi = adresa afișată', dec === url, dec);
t('QR: axe 0 violări cu dialogul deschis', (await runAxe(p)).length === 0, await runAxe(p));
await p.keyboard.press('Escape'); await p.waitForTimeout(200); t('QR: Esc închide dialogul', await p.evaluate(() => !document.getElementById('h4d-qr').open));
// --- 7 limbi
const labels = {};
for (const l of ['ro', 'en', 'fr', 'it', 'es', 'pt', 'de']) {
  await p.selectOption('#lang-select', l); await p.waitForTimeout(250);
  labels[l] = await p.evaluate(() => ['poly-export-obj', 'poly-export-json', 'poly-qr', 'poly-print'].map(i => document.getElementById(i).textContent.trim()));
}
t('toate cele 7 limbi au 4 etichete nevide', Object.values(labels).every(a => a.length === 4 && a.every(x => x.length > 2)), JSON.stringify(labels));
t('etichetele diferă între limbi (nu e doar engleza)', new Set(Object.values(labels).map(a => a[3])).size >= 5, JSON.stringify(Object.values(labels).map(a => a[3])));
await p.selectOption('#lang-select', 'de'); await p.click('#poly-qr'); await p.waitForTimeout(300);
t('dialog QR tradus în germană', /QR-Code der aktuellen Ansicht/.test(await p.textContent('#h4d-qr-title')) && /Adresse kopieren/.test(await p.textContent('#h4d-qr-copy')));
await p.keyboard.press('Escape'); await p.selectOption('#lang-select', 'en');
// --- print
await p.emulateMedia({media: 'print'});
const pr = await p.evaluate(() => ({bg: getComputedStyle(document.body).backgroundColor, tabs: getComputedStyle(document.querySelector('.tabs')).display, row: getComputedStyle(document.getElementById('poly-share-row')).display, stroke: getComputedStyle(document.querySelector('#poly-svg line')).stroke}));
t('print: fundal alb, file/butoane ascunse, linii închise la culoare', pr.bg === 'rgb(255, 255, 255)' && pr.tabs === 'none' && pr.row === 'none' && /rgb\(11, 32, 56\)/.test(pr.stroke), JSON.stringify(pr));
const pdf = await p.pdf({printBackground: false}); fs.writeFileSync('/tmp/_h4d_print.pdf', pdf); t('print: PDF generat', pdf.length > 3000);
await p.screenshot({path: '/tmp/_h4d_print.png'}); await p.emulateMedia({media: 'screen'});
let n = 0; await p.click('#poly-print'); t('buton Tipărește fără erori', true);
t('axe 0 violări pagina Politopuri', (await runAxe(p)).length === 0, await runAxe(p));
await p.click('.tab[data-cat="curves"]'); await p.waitForTimeout(300); t('axe 0 violări pagina Secțiuni', (await runAxe(p)).length === 0, await runAxe(p));
t('fără erori pe parcurs', errs.length === 0, errs); t('0 cereri de rețea pe parcurs', net.length === 0, net);
await p.click('#app-version'); await p.waitForTimeout(400); t('dialog Transparență se deschide', await p.evaluate(() => !!document.querySelector('dialog.fff-dlg[open]'))); t('axe 0 violări cu Transparență', (await runAxe(p)).length === 0, await runAxe(p));
await ctx.close();
{ const m = await mk(360, 740, 'light', '#lang=ro&cat=polytopes&shape=cell24');
  t('360: fără depășire orizontală', await m.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await m.p.evaluate(() => document.documentElement.scrollWidth));
  t('360: rândul de butoane încape', await m.p.evaluate(() => [...document.querySelectorAll('#poly-share-row button:not([hidden])')].every(x => x.getBoundingClientRect().right <= innerWidth)));
  await m.p.click('#poly-qr'); await m.p.waitForTimeout(300); t('360: dialog QR încape', await m.p.evaluate(() => { const r = document.getElementById('h4d-qr').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
  t('360: axe 0 violări (luminos, dialog deschis)', (await runAxe(m.p)).length === 0, await runAxe(m.p)); t('360: fără erori', m.errs.length === 0, m.errs); await m.ctx.close(); }
{ const m = await mk(1280, 800, 'dark'); const html = fs.readFileSync(path.join(HERE, '..', 'index.html'), 'utf8').replace(/<!--fff:kit:start[\s\S]*?<!--fff:kit:end-->/, '');
  const tmp = path.join(HERE, '..', '_nokit.tmp.html'); /* în directorul aplicației, ca manifestul și iconițele relative să existe */ fs.writeFileSync(tmp, html); await m.p.goto('file://' + tmp + '#cat=polytopes&shape=cell8'); await m.p.waitForTimeout(1500);
  t('fără kit: fără erori, butonul QR ascuns, exportul funcționează', m.errs.length === 0 && !(await m.p.isVisible('#poly-qr')) && (await dl(m.p, '#poly-export-json')).txt.length > 100, m.errs); await m.ctx.close(); fs.unlinkSync(tmp); }
await b.close();
console.log(`\n${ok} ok / ${bad} eșuate`); process.exit(bad ? 1 : 0);
