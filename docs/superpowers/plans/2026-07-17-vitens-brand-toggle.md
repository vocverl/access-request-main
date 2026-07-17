# Merk-thema toggle (Profilus/Vitens) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** De access request app tijdens een demo live tussen Profilus- en Vitens-look laten wisselen via een header-toggle en `?brand=` URL-parameter, uitbreidbaar naar toekomstige klanten.

**Architecture:** Branding wordt data-gedreven. De ~36 hardcoded kleuren in `index.html` worden vervangen door CSS-variabelen met Profilus-defaults in `:root` en een `[data-brand="vitens"]`-override. Een JS `BRANDS`-register beheert de niet-CSS assets (titel/logo/favicon). Eén `applyBrand(id)`-functie zet `document.documentElement.dataset.brand`, wisselt assets, en bewaart de keuze in localStorage. Drie ingangen (URL-param, localStorage, default) bepalen het startmerk.

**Tech Stack:** Statische single-file `index.html` (vanilla HTML/CSS/JS), GitHub Pages, geen build-stap, geen test-runner. Verificatie = grep-assertions + handmatige browsercheck.

## Global Constraints

- Eén bestand: alle wijzigingen in `index.html` (+ twee asset-bestanden in `images/`). Geen build-tools, geen dependencies.
- Profilus-uiterlijk MOET identiek blijven aan de huidige live-versie (default = profilus).
- Branch: `profilus` (live op accessrequest.profilus.nl). Commit naar deze branch = deploy.
- Profilus primair `#3EA0CF`, accent `#4aaedf`. Vitens primair `#2c3c8a`, accent `#3a4db0`.
- localStorage-sleutel: `arp-brand`. Default-merk: `profilus`. URL-param: `?brand=<id>`.
- Kleuren horen in CSS (per `[data-brand]`), niet in het JS-register.
- Register uitbreidbaar: nieuw merk = 1 config-regel + 1 CSS-blok + assets + 1 pil, zonder `applyBrand` aan te raken.

---

### Task 1: Branding-kleuren → CSS-variabelen

Vervang alle hardcoded merk-kleuren binnen de `<style>` door CSS-variabelen en voeg de merk-paletten toe. Dit verandert het uiterlijk niet (Profilus-defaults).

**Files:**
- Modify: `index.html` (de `<style>`-block; `:root` toevoegen bovenin, alle `#3EA0CF`/`#4aaedf` vervangen)

**Interfaces:**
- Produces: CSS-variabelen `--brand-primary`, `--brand-primary-light` op `:root`; merk-override-selector `[data-brand="vitens"]`. Taak 3/4 sturen deze via `document.documentElement.dataset.brand`.

- [ ] **Step 1: Voeg `:root` en Vitens-palet toe**

Direct na de bestaande `* { … }` reset (bovenin de `<style>`, vóór `body {`), voeg toe:

```css
        :root {
            --brand-primary: #3EA0CF;
            --brand-primary-light: #4aaedf;
        }

        [data-brand="vitens"] {
            --brand-primary: #2c3c8a;
            --brand-primary-light: #3a4db0;
        }
```

- [ ] **Step 2: Vervang alle primaire kleur-occurrences**

Vervang binnen de `<style>`-block elke letterlijke `#3EA0CF` door `var(--brand-primary)` en elke `#4aaedf` door `var(--brand-primary-light)`. Doe dit met een gerichte replace-all over de style-sectie (regels ~1–1040). Laat de rgba-schaduwen (`rgba(44, 60, 138, …)`) en overige kleuren (grijs, groen-status) ongemoeid.

- [ ] **Step 3: Verifieer dat er geen bare merk-hex meer in de style staat**

Run:
```bash
cd ~/AI-coding/claude-code/access-request-main
awk '/<style>/,/<\/style>/' index.html | grep -nE '#3EA0CF|#4aaedf|#3ea0cf'
```
Expected: geen output (alle merk-hex nu via `var(...)`).

- [ ] **Step 4: Verifieer variabele-definities aanwezig**

Run:
```bash
grep -nE '\-\-brand-primary:|\[data-brand="vitens"\]' index.html
```
Expected: minstens 3 regels — `--brand-primary:` in `:root`, `--brand-primary:` in de vitens-block, en de `[data-brand="vitens"]` selector.

- [ ] **Step 5: Handmatige browsercheck — Profilus ongewijzigd**

Open `index.html` in de browser (of `open index.html`). Verwacht: header, knoppen, sectietitels en accenten zien er identiek uit aan de huidige live-versie (Profilus-blauw). Niets grijs/kapot.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "refactor: branding-kleuren naar CSS-variabelen (Profilus ongewijzigd)"
```

---

### Task 2: Vitens-assets lokaal opslaan

Download het Vitens-logo en favicon naar `images/` zodat de demo niet afhankelijk is van vitens.nl.

**Files:**
- Create: `images/vitens-logo.png`
- Create: `images/vitens-favicon.png`

**Interfaces:**
- Produces: bestandspaden `images/vitens-logo.png` en `images/vitens-favicon.png`, gerefereerd door het `BRANDS`-register in Taak 3.

- [ ] **Step 1: Download logo en favicon**

Run:
```bash
cd ~/AI-coding/claude-code/access-request-main/images
curl -sL "https://www.vitens.nl/-/media/Project/Vitens/VitensNl/vitens-logo.jpg" -o vitens-logo.png
curl -sL "https://www.vitens.nl/favicon.ico" -o vitens-favicon.png
```

- [ ] **Step 2: Verifieer dat het echte afbeeldingen zijn (geen HTML-foutpagina)**

Run:
```bash
cd ~/AI-coding/claude-code/access-request-main
file images/vitens-logo.png images/vitens-favicon.png
```
Expected: beide gerapporteerd als image (JPEG/PNG/MS Windows icon), NIET "HTML document" of "ASCII text". Als een download faalt: kies een alternatieve Vitens-logo-URL (bv. van vitens.nl bekijken in browser) of vraag het bestand op bij de gebruiker; ga niet door met een foutpagina.

- [ ] **Step 3: Commit**

```bash
git add images/vitens-logo.png images/vitens-favicon.png
git commit -m "assets: Vitens-logo en favicon lokaal opgeslagen"
```

---

### Task 3: Merk-register + applyBrand + init-logica

Voeg het `BRANDS`-register, de `applyBrand`-functie en de startmerk-detectie (URL > localStorage > default) toe in de JS-sectie.

**Files:**
- Modify: `index.html` (in de `<script>`-sectie; plaats het blok bovenaan de app-scripts zodat init vroeg draait)
- Modify: `index.html` — voeg een `id="faviconLink"` toe aan de bestaande `<link rel="icon">` (regel 7) en een `id` aan het header-logo `<img>` (regel ~1046)

**Interfaces:**
- Consumes: `[data-brand]` CSS uit Taak 1; asset-paden uit Taak 2.
- Produces: globale functie `applyBrand(id)` en constante `BRANDS` met keys `profilus`, `vitens`. Taak 4 (toggle) roept `applyBrand(id)` aan en verwacht dat het `.brand-option.active` bijwerkt.

- [ ] **Step 1: Geef favicon-link en header-logo een id**

Wijzig regel 7 van:
```html
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
```
naar:
```html
    <link rel="icon" type="image/svg+xml" href="favicon.svg" id="faviconLink">
```

Wijzig het header-logo `<img>` (regel ~1046) van:
```html
                <img src="images/profilus-logo-blue.png" alt="Profilus Logo">
```
naar:
```html
                <img src="images/profilus-logo-blue.png" alt="Merk logo" id="headerLogo">
```

- [ ] **Step 2: Voeg register + applyBrand + init toe**

Plaats onderstaand blok aan het begin van de eerste `<script>` in het bestand (vóór de overige app-logica):

```javascript
        // ---- Merk-thema's (Profilus / Vitens) ----
        const BRANDS = {
            profilus: {
                label: 'Profilus',
                title: 'Access Request Portal - Profilus',
                logo: 'images/profilus-logo-blue.png',
                favicon: 'favicon.svg'
            },
            vitens: {
                label: 'Vitens',
                title: 'Access Request Portal - Vitens',
                logo: 'images/vitens-logo.png',
                favicon: 'images/vitens-favicon.png'
            }
        };
        const DEFAULT_BRAND = 'profilus';
        const BRAND_STORAGE_KEY = 'arp-brand';

        function applyBrand(id) {
            if (!BRANDS[id]) id = DEFAULT_BRAND;
            const brand = BRANDS[id];
            document.documentElement.dataset.brand = id;
            document.title = brand.title;
            const logo = document.getElementById('headerLogo');
            if (logo) { logo.src = brand.logo; logo.alt = brand.label + ' logo'; }
            const fav = document.getElementById('faviconLink');
            if (fav) fav.href = brand.favicon;
            document.querySelectorAll('.brand-option').forEach(el =>
                el.classList.toggle('active', el.dataset.brand === id));
            try { localStorage.setItem(BRAND_STORAGE_KEY, id); } catch (e) {}
        }

        function initBrand() {
            const param = new URLSearchParams(location.search).get('brand');
            let stored = null;
            try { stored = localStorage.getItem(BRAND_STORAGE_KEY); } catch (e) {}
            const start = (param && BRANDS[param]) ? param
                        : (stored && BRANDS[stored]) ? stored
                        : DEFAULT_BRAND;
            applyBrand(start);
        }
        initBrand();
```

- [ ] **Step 3: Syntax-check op de JS**

Run:
```bash
cd ~/AI-coding/claude-code/access-request-main
node --check <(awk '/<script>/{f=1;next}/<\/script>/{f=0}f' index.html) 2>&1 | head
```
Expected: geen syntaxfout uit het `applyBrand`/`initBrand`-blok. (Meldingen over app-specifieke globals zijn ok; let alleen op parse-fouten.) Alternatief: open in browser en check de console — geen `SyntaxError`/`ReferenceError` bij laden.

- [ ] **Step 4: Handmatige check — URL-param en persistentie**

Open in browser:
- `index.html?brand=vitens` → header/knoppen worden Vitens-blauw (`#2c3c8a`), titel "… - Vitens", logo Vitens, favicon Vitens.
- `index.html?brand=onzin` → valt terug op Profilus.
- Na `?brand=vitens`, daarna `index.html` zonder param openen → onthoudt Vitens (localStorage).
- `index.html?brand=profilus` terwijl localStorage `vitens` is → toont Profilus (URL wint).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: merk-register + applyBrand + startmerk-detectie (URL/localStorage/default)"
```

---

### Task 4: Header-toggle (twee pillen)

Voeg een zichtbare Profilus/Vitens-schakelaar toe rechtsboven in de header, in de stijl van de bestaande `.mode-option`-pillen.

**Files:**
- Modify: `index.html` — CSS voor `.brand-switch` / `.brand-option` (in `<style>`); markup in `.header-right` (regel ~1048, vóór of naast `tools-nav`)

**Interfaces:**
- Consumes: `applyBrand(id)` en `.brand-option.active`-conventie uit Taak 3.

- [ ] **Step 1: Voeg toggle-CSS toe**

Voeg toe in de `<style>` (bij de andere header-stijlen):

```css
        .brand-switch {
            display: inline-flex;
            border: 2px solid rgba(255,255,255,0.4);
            border-radius: 6px;
            overflow: hidden;
        }
        .brand-option {
            background: transparent;
            color: white;
            border: none;
            padding: 6px 14px;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: 600;
            transition: all 0.2s;
        }
        .brand-option:not(.active):hover {
            background: rgba(255,255,255,0.15);
        }
        .brand-option.active {
            background: white;
            color: var(--brand-primary);
        }
```

- [ ] **Step 2: Voeg toggle-markup toe in de header**

In `.header-right` (regel ~1048), direct ná de openingstag `<div class="header-right">` en vóór `<nav class="tools-nav">`, voeg toe:

```html
                <div class="brand-switch" title="Demo: wissel look-and-feel">
                    <button class="brand-option" data-brand="profilus" onclick="applyBrand('profilus')">Profilus</button>
                    <button class="brand-option" data-brand="vitens" onclick="applyBrand('vitens')">Vitens</button>
                </div>
```

- [ ] **Step 3: Verifieer markup aanwezig en gekoppeld**

Run:
```bash
cd ~/AI-coding/claude-code/access-request-main
grep -nE 'class="brand-switch"|data-brand="profilus"|data-brand="vitens"' index.html
```
Expected: de `brand-switch` div en beide knoppen aanwezig.

- [ ] **Step 4: Handmatige browsercheck — live toggle**

Open `index.html`. Verwacht:
- Rechtsboven twee pillen; Profilus actief (wit), Vitens transparant.
- Klik **Vitens** → hele UI wordt `#2c3c8a`, logo/titel/favicon Vitens, Vitens-pil wit.
- Klik **Profilus** → terug naar Profilus.
- Refresh → laatst gekozen merk blijft actief.
- Kernflow (zoekveld typen → autocomplete, cart, settings-tandwiel) werkt in beide merken.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: header-toggle voor Profilus/Vitens demo-schakelaar"
```

---

## Deploy (na akkoord)

```bash
cd ~/AI-coding/claude-code/access-request-main
git push origin profilus
```
GitHub Pages herbouwt automatisch → https://accessrequest.profilus.nl/

## Self-Review notities

- **Spec-dekking:** CSS-var refactor (T1) ✓, lokale assets (T2) ✓, register+3 ingangen (T3) ✓, header-toggle "iets rijker" incl. favicon (T3+T4) ✓, geen deploy-wijziging ✓, uitbreidbaarheid (register-patroon) ✓.
- **Type-consistentie:** `applyBrand`, `BRANDS`, `.brand-option.active`, `#headerLogo`, `#faviconLink`, `arp-brand` consistent tussen T3 en T4.
- **Geen test-runner:** verificatie is bewust grep + browser; dat is het enige realistische cyclus-mechanisme voor deze statische app.
