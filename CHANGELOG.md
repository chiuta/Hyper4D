# Jurnal de modificări — Hyper4D

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
