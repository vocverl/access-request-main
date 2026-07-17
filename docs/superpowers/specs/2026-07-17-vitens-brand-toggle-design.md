# Merk-thema's: header-toggle + URL-parameter

**Datum:** 2026-07-17
**Repo:** access-request-main (branch `profilus`, live op accessrequest.profilus.nl)
**Doel:** De access request app tijdens een demo live in Profilus- of Vitens-look kunnen tonen, uitbreidbaar naar toekomstige klanten.

## Probleem

De branding zit hardcoded verspreid door `index.html` (~36 kleur-occurrences: `#3EA0CF` primair, `#4aaedf` accent), plus titel en logo. De Vitens-variant bestaat nu als aparte git-branch (`vitens`) — onhandig om te demoen (branch wisselen + herdeployen). Er is geen manier om binnen de draaiende app van merk te wisselen.

## Doelen

- Binnen de draaiende app wisselen tussen Profilus (default) en Vitens.
- Drie ingangen: zichtbare header-toggle, URL-parameter, onthouden keuze.
- Uitbreidbaar: een nieuwe klant toevoegen = één config-regel + één klein CSS-blok, géén nieuwe zoek-en-vervang.
- Geen build-stap of deploy-wijziging: blijft één statische `index.html` op GitHub Pages.
- Profilus-uiterlijk verandert niet t.o.v. nu.

## Niet-doelen (YAGNI)

- Geen admin-UI om merken te beheren; register staat in de code.
- Nu alleen Profilus + Vitens uitwerken (register maakt een derde triviaal, maar we bouwen 'm niet).
- De bestaande `vitens` branch niet aanraken/verwijderen.

## Ontwerp

### 1. Branding → CSS-variabelen (mechanische refactor)

In de `:root` de Profilus-defaults definiëren:

```css
:root {
  --brand-primary: #3EA0CF;
  --brand-primary-light: #4aaedf;
}
```

Alle hardcoded `#3EA0CF` → `var(--brand-primary)` en `#4aaedf` → `var(--brand-primary-light)`.
Merk-overrides per merk als attribuut-selector:

```css
[data-brand="vitens"] {
  --brand-primary: #2c3c8a;
  --brand-primary-light: #3a4db0;
}
```

Dit verandert het huidige (Profilus-)uiterlijk niet — puur een indirectie.

### 2. Merk-register (JS)

```js
const BRANDS = {
  profilus: {
    label: 'Profilus',
    title: 'Access Request Portal - Profilus',
    logo: 'images/profilus-logo-blue.png',  // huidige header-logo, ongewijzigd
    favicon: 'favicon.svg'
  },
  vitens: {
    label: 'Vitens',
    title: 'Access Request Portal - Vitens',
    logo: 'images/vitens-logo.png',      // lokaal opgeslagen voor demo-betrouwbaarheid
    favicon: 'images/vitens-favicon.png' // idem
  }
};
const DEFAULT_BRAND = 'profilus';
```

Kleuren staan in CSS (per `[data-brand]`), niet in het register — het register beheert alleen de niet-CSS assets (titel, logo, favicon, label).

Assets: het Vitens-logo en favicon worden lokaal in `images/` opgeslagen (gedownload tijdens implementatie), niet gehotlinkt naar vitens.nl.

### 3. Schakel-functie

```js
function applyBrand(id) {
  const brand = BRANDS[id] || BRANDS[DEFAULT_BRAND];
  document.documentElement.dataset.brand = id;   // stuurt CSS-variabelen
  document.title = brand.title;
  headerLogoImg.src = brand.logo;
  faviconLink.href = brand.favicon;
  updateToggleUI(id);                            // actieve pil markeren
  localStorage.setItem('arp-brand', id);
}
```

### 4. Drie ingangen, één bron van waarheid

Bij laden, in deze volgorde:
1. URL-parameter `?brand=<id>` — als geldig, wint eenmalig en wordt opgeslagen.
2. Anders `localStorage['arp-brand']`.
3. Anders `DEFAULT_BRAND` (profilus).

Header-toggle: twee pillen (Profilus | Vitens) rechtsboven in de bestaande `.vitens-header`, in stijl van de al aanwezige `.mode-option` pillen. Klik → `applyBrand(id)`.

Onbekende/ongeldige `brand`-waarde valt stil terug op default.

### 5. Deploy

Geen wijziging: één statische `index.html` op branch `profilus` → accessrequest.profilus.nl via GitHub Pages. Commit + push naar `profilus` is de deploy.

## Testplan (handmatig in browser)

1. **Default ongewijzigd** — verse load zonder param/localStorage toont Profilus exact zoals nu (kleur, logo, titel).
2. **Toggle** — klik Vitens-pil: header, knoppen, accenten worden `#2c3c8a`, logo/titel/favicon Vitens; klik Profilus-pil: terug.
3. **URL-parameter** — `?brand=vitens` laadt direct Vitens; `?brand=onzin` valt terug op Profilus.
4. **Persistentie** — na toggle naar Vitens en refresh (zonder param) blijft Vitens actief.
5. **Voorrang** — met Vitens in localStorage en `?brand=profilus` in URL wint de URL (Profilus).
6. **Regressie** — kernflow van de app (zoeken, cart, GRC-config) werkt in beide merken.

## Uitbreidbaarheid (bewijs van doel)

Klant "Acme" toevoegen = (a) `acme:{…}` in `BRANDS`, (b) `[data-brand="acme"]{ --brand-primary:… }` CSS-blok, (c) logo/favicon in `images/`, (d) `acme`-pil in de toggle. Geen aanpassing aan `applyBrand` of de refactorde CSS.
