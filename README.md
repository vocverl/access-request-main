# 🌊 Vitens Access Request Portal

> Een moderne, gebruiksvriendelijke webapplicatie voor het aanvragen van toegang tot applicaties en SAP rollen binnen Vitens.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://vocverl.github.io/vitens-access-request-app/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.3-blue.svg)](CHANGELOG.md)

---

## 📋 Inhoudsopgave

- [Overzicht](#-overzicht)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Werkingsmodi](#-werkingsmodi)
- [Installatie](#-installatie)
- [Gebruik](#-gebruik)
- [Technische Details](#-technische-details)
- [Configuratie](#-configuratie)
- [Documentatie](#-documentatie)
- [Roadmap](#-roadmap)
- [Support](#-support)
- [Credits](#-credits)

---

## 🎯 Overzicht

De **Vitens Access Request Portal** is een Single Page Application (SPA) die het proces van het aanvragen van toegang tot applicaties en SAP rollen binnen Vitens vereenvoudigt. De applicatie biedt een intuïtieve interface met geavanceerde zoek- en filtermogelijkheden, ondersteund door SAP GRC 12.0 integratie.

### **Belangrijkste Voordelen**

- ✅ **Self-service** - Gebruikers kunnen zelf toegang aanvragen zonder IT-tickets
- ✅ **Snelle zoekfunctie** - Geavanceerde fuzzy search met autocomplete
- ✅ **Flexibel** - Drie werkingsmodi voor verschillende use cases
- ✅ **Gebruiksvriendelijk** - Moderne UI met Vitens huisstijl
- ✅ **Geïntegreerd** - Directe koppeling met SAP GRC systeem

---

## ✨ Features

### **🔍 Geavanceerde Zoekfunctionaliteit**

#### **Fuzzy Search Algoritme**
- Levenshtein Distance matching voor tolerante zoekresultaten
- Vind rollen zelfs bij typfouten of gedeeltelijke matches
- Intelligent scoring systeem voor relevante resultaten
- Zoekt in naam, beschrijving, type, afdeling en bedrijfsproces

#### **Inline Autocomplete** ⭐ *Nieuw in v1.3*
- Real-time suggesties tijdens het typen (vanaf 2 karakters)
- Maximaal 8 relevante suggesties
- Highlighted matching text in suggesties
- Volledige keyboard navigatie (↑/↓ pijltjes, Enter, Escape)
- Debouncing voor optimale performance (300ms)
- Click-to-select en click-outside-to-close

### **🎚️ Filter Systeem**

- **Afdeling Filter** - Filter op Functiegebied
- **Bedrijfsproces Filter** - Filter op Bedrijfsproces
- Combineerbare filters voor precisie
- Dynamisch gevuld uit Excel data
- Reset functie voor alle filters tegelijk

### **🛒 Winkelwagen Systeem**

- Verzamel meerdere rollen in één aanvraag
- Visuele badge met aantal items
- Remove functionaliteit per item
- Automatische validatie en feedback
- Één-klik indienen naar GRC

### **👤 Gebruikersinformatie**

- **Aanvraag voor mezelf** - Auto-populate met SSO gegevens
- **Aanvraag voor andere** - Handmatige invoer
- Volledige gebruikersdetails:
  - Naam (voor- en achternaam)
  - Gebruikers-ID en e-mail
  - Manager en afdeling
  - Zakelijke rechtvaardiging (verplicht veld)
- **Inklapbare sectie** voor ruimtebesparing ⭐ *Nieuw in v1.2*

### **⚙️ GRC Integratie**

- **SAP GRC 12.0** SOAP web services
- Real-time zoeken in productie GRC systeem
- Automatische request aanmaak met tracking
- Status polling voor updates
- Configureerbare endpoints en authenticatie

### **📊 Excel Upload & Offline Modus**

- Upload BOR.xlsx voor 8000+ SAP rollen
- SheetJS parsing voor Excel bestanden
- Werkt volledig offline
- Filters automatisch gevuld uit Excel data
- Progress indicator tijdens parsing

### **🎨 Modern Design**

- Vitens huisstijl kleuren en branding
- Responsive design voor desktop en tablet
- Smooth animations en transitions
- Intuïtieve navigation en workflow
- Accessibility features (keyboard navigation, WCAG compliant)

---

## 📸 Screenshots

### Dashboard - Search & Autocomplete
```
┌─────────────────────────────────────────────────────────────────┐
│  🌊 Vitens Logo          Access Request Portal      🔧📊⚙️    │
│  Vraag eenvoudig toegang aan tot applicaties en SAP rollen      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Zoeken naar toegang                                            │
│  ┌───────────────────────────────────────────────┐              │
│  │ Zoek naar Visio, SAP rollen...      [Zoeken] │              │
│  └───────────────────────────────────────────────┘              │
│  ┌───────────────────────────────────────────────┐              │
│  │ ✓ Microsoft Visio Professional                │              │
│  │   Diagrammen en flowcharts maken   Applicatie │              │
│  │ ✓ SAP_P2P_BUYER                                │              │
│  │   Inkoper rechten voor inkooporders  SAP Rol  │              │
│  └───────────────────────────────────────────────┘              │
│                                                                  │
│  Zoekresultaten (6)                                             │
│  ┌─────────────────────────────────────┐                        │
│  │ Microsoft Visio Professional        │  [Toevoegen]           │
│  │ Diagrammen en flowcharts maken      │                        │
│  │ Rol eigenaar: IT Support Team       │                        │
│  │ [Applicatie]                         │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sidebar - Mode Switch & Cart
```
┌────────────────────────────────────┐
│  Modus:                            │
│  ┌─────────┬──────────┬──────────┐ │
│  │ 🎯 Demo │ 📊 Excel │ 🌐 Online│ │
│  └─────────┴──────────┴──────────┘ │
│  🟢 Online Modus - Live GRC        │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Gebruikersinformatie      ▼  │  │
│  ├──────────────────────────────┤  │
│  │ Aanvraag voor: ⚪ Mezelf     │  │
│  │ Voornaam: [Jan]              │  │
│  │ Achternaam: [Jansen]         │  │
│  │ ...                          │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Winkelwagen            [3]   │  │
│  ├──────────────────────────────┤  │
│  │ Visio Professional           │  │
│  │ Applicatie              [×]  │  │
│  ├──────────────────────────────┤  │
│  │ SAP_P2P_BUYER                │  │
│  │ SAP Rol                 [×]  │  │
│  ├──────────────────────────────┤  │
│  │                              │  │
│  │   [Bestelling Indienen]      │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

## 🎚️ Werkingsmodi

De applicatie ondersteunt drie verschillende werkingsmodi voor verschillende use cases:

### 🎯 **Demo Modus**

**Ideaal voor:** Training, demonstraties, development

- ✅ Voorgeladen test data (8 rollen)
- ✅ Geen setup vereist
- ✅ Snelle toegang voor demos
- ✅ Simuleert volledige workflow

**Beschikbare demo data:**
- Microsoft Visio Professional & Standard
- SAP P2P rollen (Buyer, Approver, Requester, Receiver, Vendor Manager, Invoice Processor)

### 📊 **Excel Modus (Offline)**

**Ideaal voor:** Offline werken, bulk data analyse, geen GRC toegang

- ✅ Upload BOR.xlsx met 8000+ SAP rollen
- ✅ Werkt volledig offline
- ✅ Filters op Afdeling en Bedrijfsproces
- ✅ Geen netwerk connectie nodig
- ✅ SheetJS parsing voor Excel bestanden

**Excel bestand verwachtingen:**
- Sheet naam: "Data" of "data"
- Kolommen: Rolnaam, Applicatietype, Roltype, Bedrijfsproces, Subproces, Functiegebied, Constellatie

### 🌐 **Online Modus (Live GRC)**

**Ideaal voor:** Productie gebruik, live aanvragen

- ✅ Directe connectie met SAP GRC 12.0
- ✅ Real-time zoeken in productie data
- ✅ Live request aanmaak met tracking
- ✅ Status polling voor updates
- ✅ Volledige workflow integratie

**Vereisten:**
- De **GRC-connector** draait — zie [`server/README.md`](server/README.md)
- Netwerktoegang tot het GRC-systeem (bij Vitens: Citrix Secure Access)

> De browser praat niet rechtstreeks met SAP. Dat kan niet: SAP stuurt geen
> CORS-headers, dus de browser gooit elk antwoord weg. En het service account
> hoort niet in een webpagina, waar iedereen het kan uitlezen. De connector
> staat ertussen en houdt de credentials op de server.

---

## 🚀 Installatie

### **Optie 1: Lokaal Gebruik**

1. **Clone de repository**
   ```bash
   git clone https://github.com/vocverl/vitens-access-request-app.git
   cd vitens-access-request-app
   ```

2. **Open de applicatie**
   ```bash
   # Open index.html in je browser
   open index.html  # macOS
   start index.html # Windows
   xdg-open index.html # Linux
   ```

3. **Start de connector** (nodig voor Online Modus)
   ```bash
   npm install
   cp .env.example .env   # daarna invullen, zie server/README.md
   npm run dev            # http://127.0.0.1:8086
   ```
   De connector levert de app uit én verzorgt de koppeling met SAP GRC.
   Zonder connector werken Demo- en Excel-modus wel, Online-modus niet.

4. **Of gebruik een lokale server** (alleen Demo/Excel)
   ```bash
   # Python 3
   python -m http.server 8000

   # PHP
   php -S localhost:8000

   # Node.js (npx)
   npx serve
   ```

   Navigeer naar: `http://localhost:8000`

### **Optie 2: SharePoint Deployment**

1. Upload bestanden naar SharePoint Document Library
2. Embed `index.html` in moderne SharePoint page
3. Configureer permissions voor gebruikers
4. Link vanuit navigatie menu

Zie [SHAREPOINT_DEPLOYMENT_GUIDE.md](SHAREPOINT_DEPLOYMENT_GUIDE.md) voor details.

### **Optie 3: IIS / Web Server**

1. Copy bestanden naar web root directory
2. Configureer HTTPS (aanbevolen)
3. Set permissions voor service account
4. Configure CORS indien nodig voor GRC calls

### **Optie 4: GitHub Pages** (Live Demo)

De applicatie draait live op: https://vocverl.github.io/vitens-access-request-app/

---

## 📖 Gebruik

### **Quick Start - Demo Modus**

1. Open de applicatie in je browser
2. Standaard staat de app in **Demo Modus** 🎯
3. Type een zoekterm (bijv. "visio" of "buyer")
4. Zie autocomplete suggesties verschijnen
5. Klik op een suggestie of druk Enter
6. Voeg rollen toe aan winkelwagen met "Toevoegen"
7. Vul gebruikersinformatie in (optioneel, auto-populated)
8. Klik "Bestelling Indienen"

### **Excel Modus Gebruik**

1. Switch naar **Excel Modus** 📊
2. Upload je BOR.xlsx bestand
3. Wacht op parsing (3-5 seconden voor 8000+ rollen)
4. Gebruik filters voor Afdeling en/of Bedrijfsproces
5. Zoek met fuzzy matching
6. Voeg rollen toe en dien in

### **Online Modus Gebruik**

Serveradres, service account en endpoints staan in `.env` op de server, niet
in de app. Er is dus niets meer in te vullen in het instellingenscherm.

1. Zorg dat de netwerkverbinding staat (bij Vitens: Citrix Secure Access)
2. Start de connector: `npm run dev`
3. Open `http://127.0.0.1:8086`
4. Switch naar **Online Modus** 🌐
5. Zoek en vraag aan — data komt live uit GRC

Werkt er iets niet, open dan `test-grc-connection.html`. Die loopt de hele
keten langs en vertelt wáár het misgaat: configuratie, verbinding, autorisatie
of de webservice zelf.

### **Keyboard Shortcuts**

- **Enter** - Submit search / Select autocomplete suggestie
- **↑/↓** - Navigate autocomplete suggesties
- **Escape** - Close autocomplete dropdown
- **Tab** - Navigate door formulier velden

---

## 🔧 Technische Details

### **Technology Stack**

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Excel Parsing:** SheetJS (xlsx) v0.20.1
- **SAP Integration:** SOAP Web Services (GRC 12.0)
- **Storage:** Browser LocalStorage voor settings
- **Styling:** Custom CSS met Vitens branding

### **Browser Compatibility**

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome  | 90+            | ✅ Supported |
| Firefox | 88+            | ✅ Supported |
| Safari  | 14+            | ✅ Supported |
| Edge    | 90+            | ✅ Supported |

### **File Structure**

```
vitens-access-request-app/
├── index.html                    # Hoofdapplicatie (2700+ regels)
├── grc-config.js                 # GRC configuratie
├── favicon.svg                   # Vitens favicon
├── test-grc-connection.html      # GRC connection test tool
├── inspect-excel.html            # Excel inspector tool
├── README.md                     # Dit bestand
├── FEATURES_OVERVIEW.md          # Uitgebreide feature documentatie
├── SHAREPOINT_DEPLOYMENT_GUIDE.md # SharePoint deployment guide
└── scripts/
    └── inspect_bor.py            # Python BOR analysis script
```

### **Dependencies**

**External (CDN):**
- SheetJS: `https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js`
- Vitens logo: `https://www.vitens.nl/-/media/Project/Vitens/VitensNl/vitens-logo.jpg`

**No npm packages required** - volledig standalone applicatie!

### **API Integration - SAP GRC 12.0**

De connector spreekt vijf SOAP web services aan. De operatienamen komen uit de
WSDL van het systeem zelf; zie [`server/README.md`](server/README.md) voor het
volledige contract en de valkuilen.

| Servicedefinitie | Operatie | Functie |
|---|---|---|
| `GRAC_SEARCH_ROLES_WS` | `GracIdmRoleSearchServices` | Rollen zoeken |
| `GRAC_USER_ACCES_WS` | `GracIdmUsrAccsReqServices` | Access request indienen |
| `GRAC_REQUEST_STATUS_WS` | `GracIdmRequestStatServices` | Status opvragen |
| `GRAC_REQUEST_DETAILS_WS` | `GracIdmReqDetailsServices` | Details opvragen |
| `GRAC_LOOKUP_WS` | `GracIdmLookupServices` | Geldige codewaarden |

> Let op: voor het indienen is `GRAC_USER_ACCES_WS` de juiste service.
> `GRAC_ORG_ASSGN_REQUEST_WS` gaat over organisatorische toewijzingen, niet over
> rolaanvragen — een eerdere versie gebruikte die per abuis.

### **Performance**

- **Autocomplete debouncing:** 300ms
- **Max autocomplete results:** 8 items
- **Max filter results:** 100 items (zonder search term)
- **Excel parsing:** 3-5 seconden voor 8000+ rollen
- **Fuzzy search threshold:** 50 punten (minimale relevantie)

### **Security**

✅ **Huidige implementatie:**
- Credentials staan in `.env` op de server, nooit in de browser
- De connector bindt op `127.0.0.1` en is niet vanaf het netwerk bereikbaar
- De aanvrager wordt door de server bepaald, niet door de pagina — anders kan
  iedereen die de API bereikt indienen namens een collega
- Oude credentials uit `localStorage` worden bij het laden gewist
- HTTPS naar GRC, met validatie tegen de interne CA

⚠️ **Nog open:**
- `GRC_TLS_INSECURE=true` zolang de interne root-CA niet beschikbaar is
- SSO: de architectuur staat klaar (`AUTH_MODE=header`), er moet een proxy voor
  die de aanmelding afhandelt
- Add backend proxy voor GRC calls (CORS)
- Add input sanitization voor XSS preventie
- Implement CSP headers

---

## ⚙️ Configuratie

### **GRC-instellingen**

Serveradres, service account en endpoints staan in **`.env` op de server**, niet
in de app. Zie [`server/README.md`](server/README.md) voor de volledige lijst.

```bash
GRC_BASE_URL=https://grc-dev.vitens.lan
GRC_CLIENT=100
GRC_USERNAME=...
GRC_PASSWORD=...
```

`GET /api/health` vertelt wat er nog ontbreekt, en het ⚙️-scherm in de app toont
diezelfde status ter controle.

> **Waarom niet meer in de app?** Eerdere versies vroegen om een service account
> in het instellingenscherm en bewaarden dat in `localStorage`. Alles wat daar
> staat is leesbaar voor elk script op de pagina. De credentials horen in het
> serverproces, buiten bereik van de browser. Oude opgeslagen wachtwoorden worden
> bij het laden actief gewist.

**Wat wél in het instellingenscherm staat:**
- ✅ **Automatische Status Polling** - Poll elke 15 minuten
- **Polling Interval:** 15 minuten (5-60 minuten)

### **Excel Upload Configuratie**

Verwachte Excel structuur (BOR.xlsx):

| Kolom | Beschrijving | Verplicht |
|-------|--------------|-----------|
| Rolnaam | Naam van de SAP rol | ✅ Ja |
| Applicatietype | Type applicatie (SAP, etc.) | Nee |
| Roltype | Type rol | Nee |
| Bedrijfsproces | Bedrijfsproces categorie | Nee |
| Subproces | Sub-proces | Nee |
| Functiegebied | Afdeling/functiegebied | Nee |
| Constellatie | Systeem/constellatie | Nee |

---

## 📚 Documentatie

Uitgebreide documentatie is beschikbaar in aparte bestanden:

- **[FEATURES_OVERVIEW.md](FEATURES_OVERVIEW.md)** - Complete features & design documentatie
  - Alle functionaliteiten uitgebreid beschreven
  - Design system (kleuren, typography, spacing)
  - UI componenten details
  - Toegankelijkheid features
  - Technische specificaties
  - Deployment opties

- **[SHAREPOINT_DEPLOYMENT_GUIDE.md](SHAREPOINT_DEPLOYMENT_GUIDE.md)** - SharePoint deployment
  - Stap-voor-stap deployment instructies
  - Permissions configuratie
  - Troubleshooting tips

### **Inline Documentatie**

De code bevat uitgebreide comments in het Nederlands:
- Functie beschrijvingen
- Sectie headers
- Complex logic uitleg
- TODO's voor toekomstige verbeteringen

---

## 🗺️ Roadmap

### **Version 1.4 (Gepland)**
- [ ] PWA support voor offline gebruik
- [ ] Push notifications voor request updates
- [ ] Favoriete rollen opslaan
- [ ] Recent searches historie

### **Version 2.0 (Toekomst)**
- [ ] Multi-user bulk requests
- [ ] CSV import voor bulk aanvragen
- [ ] Advanced analytics dashboard
- [ ] Role recommendations met ML
- [ ] Mobile native app (iOS/Android)
- [ ] Email notifications
- [ ] Approval workflow visibility

### **Backlog**
- [ ] SSO/SAML integratie
- [ ] Backend proxy service
- [ ] Request template systeem
- [ ] Dark mode support
- [ ] Multi-language support (EN/NL)

---

## 🐛 Troubleshooting

### **Veelvoorkomende Problemen**

#### **Autocomplete werkt niet**
- ✅ Type minimaal 2 karakters
- ✅ Check browser console voor errors
- ✅ Verify dat je mode data heeft (niet lege Excel)

#### **Excel upload faalt**
- ✅ Check bestandsformaat (.xlsx of .xls)
- ✅ Verify "Data" sheet bestaat in Excel
- ✅ Check kolom namen (case-insensitive)

#### **GRC connectie faalt**
- ✅ Test connectie in settings eerst
- ✅ Verify server URL correct is
- ✅ Check credentials zijn correct
- ✅ Confirm netwerk toegang tot GRC server
- ✅ Check CORS instellingen

#### **Geen zoekresultaten**
- ✅ Verlaag threshold in code (regel 1598)
- ✅ Check dat data is geladen (console: `excelData.length`)
- ✅ Verify filters niet te restrictief zijn

### **Debug Console Commands**

Open browser console (F12) en type:

```javascript
// Check huidige mode
console.log(currentMode);

// Check geladen data
console.log(`${excelData.length} Excel rollen geladen`);
console.log(`${localAvailableAccess.length} Demo rollen beschikbaar`);

// Check winkelwagen
console.log(cart);

// Test fuzzy search
fuzzySearch("visio", localAvailableAccess);

// Check GRC configuratie
console.log(GRC_CONFIG);
```

---

## 💬 Support

### **Hulp nodig?**

1. **Documentatie:** Check [FEATURES_OVERVIEW.md](FEATURES_OVERVIEW.md) voor details
2. **Issues:** Open een issue op GitHub voor bugs/feature requests
3. **Contact:** Neem contact op met je IT-afdeling voor GRC toegang

### **Feedback & Contributions**

Feedback en suggesties zijn welkom! Open een issue op GitHub of neem contact op met het development team.

---

## 📊 Statistieken

- **Lines of Code:** 2700+ (index.html)
- **Functionaliteiten:** 30+ features
- **Supported Roles:** 8000+ (Excel mode)
- **Werkingsmodi:** 3 (Demo, Excel, Online)
- **Browser Compatibility:** 4 browsers
- **Dependencies:** 1 (SheetJS CDN)
- **Loading Time:** < 1 seconde
- **Excel Parse Time:** 3-5 seconden (8000+ rollen)

---

## 🏆 Credits

**Ontwikkeld voor:** Vitens N.V.

**Technology:**
- Vanilla JavaScript (ES6+)
- HTML5 & CSS3
- SheetJS voor Excel parsing
- SAP GRC 12.0 SOAP integration

**Generated with:**
- [Claude Code](https://claude.com/claude-code) 🤖 - AI-assisted development

**Version:** 1.3 (22 januari 2025)

---

## 📜 Changelog

### **v1.3** - 2025-01-22
- ✨ **NEW:** Inline autocomplete feature met keyboard navigatie
- ✨ **NEW:** Highlight matching text in autocomplete suggesties
- ⚡ **IMPROVED:** Search box UI met dropdown integration
- ⚡ **IMPROVED:** Debouncing voor betere performance

### **v1.2** - 2025-01-22
- ✨ **NEW:** Inklapbare gebruikersinformatie sectie
- ⚡ **IMPROVED:** Witruimte tussen components
- ⚡ **IMPROVED:** Mode switch naar boven van sidebar
- 🐛 **FIX:** Layout spacing issues

### **v1.1** - 2025-01-21
- ✨ **NEW:** Rol eigenaar display in zoekresultaten
- ✨ **NEW:** Gebruikersinformatie sectie naar rechter sidebar
- ⚡ **IMPROVED:** Central search focus
- ⚡ **IMPROVED:** Clean layout

### **v1.0** - 2025-01-20
- 🚀 **Initial release**
- ✨ Three-mode system (Demo, Excel, Online)
- ✨ Fuzzy search implementation
- ✨ Excel upload & parsing
- ✨ Filter system
- ✨ Cart functionality
- ✨ GRC SOAP integration
- ✨ Settings management

---

## 📄 License

© 2025 Vitens N.V. All rights reserved.

---

<div align="center">

**[Live Demo](https://vocverl.github.io/vitens-access-request-app/)** • **[Documentatie](FEATURES_OVERVIEW.md)** • **[Issues](https://github.com/vocverl/vitens-access-request-app/issues)**

Gemaakt met ❤️ voor Vitens

</div>
