# Jurnal de modificări — Hyper4D

## 2.2.0 — 2026-10-27

Anterior: v2.1.0. Recenzie 2 (2026-10-27).

- Nou: **hipervolumul V₄ exact** (raza circumscrisă 1, ca la celelalte) pentru toate formele care aveau „—”: hiperprismele (tetraedru 0,3017; octaedru 0,8381; dodecaedru 1,5640; icosaedru 1,6368), 5-cell rectificat (275√5/864 ≈ 0,7117), teseract rectificat (46/27 ≈ 1,7037), hiperpiramidele (cub 0,2227; octaedru 0,1929; dodecaedru 0,3169; icosaedru 0,3669) și duoprismele (inclusiv cel personalizat P×Q; 4×4 = 1,0000 = teseractul). Formule în textul informativ al hiperprismelor și rectificatelor (RO/EN). Scheletul-stea (600v) rămâne „—” (nu are volum definit).
- Nou: **rotație 4D de la tastatură** — Shift + ←/→ = planul XW, Shift + ↑/↓ = planul YZ (pas 0,08 rad), și în tutorial (mișcă cursoarele); ←/→ simplu schimbă în continuare forma. Indiciul de taste actualizat (RO/EN).
- Corectat: pentru cele 6 forme din 2.1.0, textul informativ în română apărea în engleză; acum există texte românești.
- Teste noi: `tests/hipervolum-tastatura.test.mjs` (29 de verificări): fiecare V₄ afișat este comparat cu volumul înfășurătorii convexe 4D calculat INDEPENDENT (algoritm recursiv exact, din vârfurile exportate), plus formele închise, duoprismul personalizat și tastatura.
- Hash-urile CSP recalculate; versiunea aliniată (`app.json`, `fff-info`, `sw.js`, subsol).

Nu s-a implementat:
- Politopuri trunchiate/cantelate etc.: neadăugate (definiții simple și verificabile).
- Textele noi (taste, formule) sunt în română și engleză; celelalte 6 limbi arată engleza / textul vechi. README-urile FR/IT/ES/PT/DE/HU doar cu versiunea aliniată.

## 2.1.0 — 2026-10-27

Anterior: v2.0.0. Recenzie 2026-10-27.

- Nou: **6 politopuri** — hiperprisme peste tetraedru (8·16·14), octaedru (12·30·28), dodecaedru (40·80·54), icosaedru (24·72·70), **5-cell rectificat** (10·30·30), **teseract rectificat** (32·96·88; 64 triunghiuri + 24 pătrate). Vârfuri generate din definiții matematice simple (produs cu segment; mijloacele muchiilor); muchii și fețe calculate, verificate: numărători, lungimi de muchie egale, verificarea Euler V − E + F − C = 0 (6, 10, 14, 22, 10, 24 de celule), export JSON/OBJ funcțional.
- Nou: buton **„Tragerea rotește în 4D”** (și Shift + tragere): tragerea schimbă rotația XW/YZ în loc de camera 3D; în tutorial mișcă cursoarele XW și YZ. Anunț pentru cititoare de ecran.
- „Stare: stabil”, „Offline: complet” în README (EN/RO).
- Teste noi: `tests/politopuri-tragere4d.test.mjs` (51 de verificări). Rulate și `tutorial4d` (40) și `fff-r8` (41): trec.
- Hash-urile CSP recalculate; versiunea aliniată (`app.json`, `fff-info`, `sw.js`, subsol).

Nu s-a implementat / de reținut:
- Tutorialul introductiv pentru nematematicieni exista deja (v2.0.0, interactiv, 8 limbi); nu s-a adăugat altul.
- Hipervolumul V₄ în blocul de titlu pentru formele noi: afișat „—” (nu s-a calculat/verificat).
- Alte politopuri (trunchiate, cantelate, runcinate, 4D prisme peste solide arhimedice): nu s-au adăugat.
- Tragerea 4D nu are echivalent de tastatură (cursoarele tutorialului da).
- Textele noi: română și engleză; celelalte 6 limbi arată engleza (neverificat nativ). README FR/IT/ES/PT/DE/HU neactualizate.
