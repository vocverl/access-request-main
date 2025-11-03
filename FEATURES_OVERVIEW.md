# Vitens Access Request Portal - Functionaliteiten & Design Overzicht

## 📋 Inhoudsopgave
1. [Algemene Informatie](#algemene-informatie)
2. [Kernfunctionaliteiten](#kernfunctionaliteiten)
3. [Zoek & Filter Mogelijkheden](#zoek--filter-mogelijkheden)
4. [Gebruikersinterface Componenten](#gebruikersinterface-componenten)
5. [Workflow & Processen](#workflow--processen)
6. [Technische Integraties](#technische-integraties)
7. [Design Elementen](#design-elementen)
8. [Toegankelijkheid](#toegankelijkheid)

---

## Algemene Informatie

**Applicatie naam:** Vitens Access Request Portal
**Doel:** Eenvoudig toegang aanvragen tot applicaties en SAP rollen
**Technologie:** Single Page Application (HTML, CSS, JavaScript)
**Integratie:** SAP GRC 12.0 via SOAP web services

---

## Kernfunctionaliteiten

### 1. **Drie Werkingsmodi**

#### 🎯 **Demo Modus**
- Snelle test data voor demonstraties
- Bevat Visio applicaties en P2P (Purchase-to-Pay) SAP rollen
- 8 voorbeeld rollen voorgeladen
- Geen externe connectie nodig
- **Use case:** Training, demos, development

#### 📊 **Excel Modus (Offline)**
- Upload BOR.xlsx bestand voor volledige rollenbibliotheek
- Ondersteuning voor 8000+ SAP rollen
- Werkt volledig offline
- Filter op Afdeling (Functiegebied) en Bedrijfsproces
- Excel parsing met SheetJS library
- **Use case:** Offline werken, bulk data analyse

#### 🌐 **Online Modus (Live GRC)**
- Directe connectie met SAP GRC 12.0 backend
- Real-time zoeken in productie data
- Live status updates van aanvragen
- Volledige workflow integratie
- **Use case:** Productie gebruik, live aanvragen

### 2. **Geavanceerde Zoekfunctionaliteit**

#### **Fuzzy Search Algoritme**
- **Levenshtein Distance** matching voor tolerante zoekresultaten
- Vind rollen zelfs bij typfouten of gedeeltelijke matches
- Scoring systeem:
  - Exacte match: 1000 punten
  - Begint met zoekterm: 900 punten
  - Bevat zoekterm: 800 punten
  - Fuzzy match per woord: 600-700 punten
  - Partiële similarity: 0-100 punten
- Threshold van 50 punten voor relevantie

#### **Inline Autocomplete** ✨ *Nieuw!*
- Real-time suggesties tijdens typen
- Activatie vanaf 2 karakters
- Maximaal 8 suggesties tegelijk
- **Highlighted matching text** in suggesties
- Debouncing (300ms) voor optimale performance
- **Keyboard navigatie:**
  - ↑/↓ - Navigeer door suggesties
  - Enter - Selecteer en zoek
  - Escape - Sluit dropdown
- **Mouse support:**
  - Hover effecten
  - Click to select
  - Click outside to close
- Werkt in alle drie de modi

#### **Zoekresultaat Weergave**
- Resultaten tellen in header
- Sorteer op relevantie (hoogste score eerst)
- Gestructureerde resultaat cards met:
  - Rolnaam (bold, Vitens blauw)
  - Beschrijving
  - Rol eigenaar informatie
  - Type badge (SAP Rol, Applicatie, etc.)
  - Toevoegen knop
- Visuele feedback bij items in winkelwagen

### 3. **Filter Systeem**

**Beschikbaar in Excel & Online modus:**

#### **Afdeling Filter (Functiegebied)**
- Dropdown met alle unieke afdelingen uit dataset
- Alfabetisch gesorteerd
- "Alle afdelingen" optie

#### **Bedrijfsproces Filter**
- Dropdown met alle unieke bedrijfsprocessen
- Alfabetisch gesorteerd
- "Alle bedrijfsprocessen" optie

#### **Filter Combinaties**
- Filters zijn combineerbaar
- Zoekterm optioneel bij gebruik filters
- Reset knop om alle filters te wissen
- Dynamische populatie uit Excel data

### 4. **Winkelwagen Systeem**

#### **Cart Functionaliteit**
- Verzamel meerdere rollen/applicaties
- Badge met aantal items
- Visuele items in cart met:
  - Naam
  - Type
  - Verwijder knop (✕)
- Leeg cart placeholder met icoon
- "Bestelling Indienen" knop (disabled indien leeg)

#### **Cart Interacties**
- Toevoegen vanuit zoekresultaten
- Items kunnen niet dubbel toegevoegd worden
- Verwijderen met visuele feedback
- Real-time update van badge counter
- Automatisch reset na succesvolle bestelling

### 5. **Gebruikersinformatie Sectie**

#### **Aanvraag Type**
- **Radio buttons:**
  - Voor mezelf (standaard)
  - Voor andere gebruiker

#### **Gebruikersvelden**
- Voornaam
- Achternaam
- Gebruikers-ID
- E-mail
- Manager
- Afdeling
- Zakelijke rechtvaardiging (textarea)

#### **Smart Behavior**
- Auto-populate bij "Voor mezelf" selectie
- Disabled fields voor eigen aanvraag
- Clear fields bij switch naar "Voor andere"
- SSO/AD integratie ready (placeholder)

#### **Inklapbaar Sectie** ✨
- Klikbare header om in/uit te klappen
- Animated collapse icon (↓ → →)
- Smooth max-height + opacity transition
- Persistent state tijdens sessie

### 6. **Settings & Configuratie**

#### **GRC Server Configuratie**
- Server URL
- Timeout instelling (5-120 seconden)
- Opslag in browser localStorage

#### **Authenticatie**
- Service account username
- Service account password
- Basic Auth support
- Secure storage in browser

#### **Backend Integratie**
- Toggle voor GRC backend activatie
- Automatische polling configuratie
- Polling interval (5-60 minuten)

#### **Web Services Endpoints**
- GRAC_SEARCH_ROLES_WS - Zoeken naar rollen
- GRAC_ORG_ASGN_REQUEST_WS - Aanvragen creëren
- GRAC_REQUEST_STATUS_WS - Status ophalen

#### **Connection Testing**
- Test connectie knop
- Real-time status feedback
- Error messaging bij problemen

---

## Zoek & Filter Mogelijkheden

### **Zoek Scope**

De zoekfunctie zoekt in de volgende velden:
1. **Rolnaam** (2x gewicht)
2. **Beschrijving**
3. **Type** (SAP Rol, Applicatie, etc.)
4. **Category** (visio, p2p, excel)
5. **Bedrijfsproces** (alleen Excel/Online)
6. **Functiegebied** (alleen Excel/Online)

### **Zoek Voorbeelden**

- `"visio"` → Vindt Microsoft Visio Professional & Standard
- `"p2p"` → Vindt alle Purchase-to-Pay rollen
- `"buyer"` → Vindt SAP_P2P_BUYER
- `"inkoop"` → Fuzzy match vindt inkoopgerelateerde rollen
- `"aproover"` → Fuzzy match vindt "APPROVER" (tolerant voor typos)

---

## Gebruikersinterface Componenten

### 1. **Header**

#### **Vitens Logo**
- Linksboven gepositioneerd
- Klikbaar (terug naar home)
- Hover effect met scale + shadow
- Officieel Vitens logo

#### **Applicatie Titel**
- "Access Request Portal"
- Subtitle: "Vraag eenvoudig toegang aan tot applicaties en SAP rollen"
- Vitens blauw (#2c3c8a) kleurenschema

#### **Tools Navigatie**
- 🔧 GRC Test - Link naar connection test tool
- 📊 Excel - Link naar Excel inspector
- Responsive (verberg tekst op mobiel, toon alleen emoji's)

#### **Settings Icon**
- ⚙️ Tandwiel icoon
- Rechtsboven gepositioneerd
- Hover effect met rotatie (45°)
- Opens settings modal

### 2. **Mode Switch**

#### **Visuele Presentatie**
- Prominent bovenaan rechter sidebar
- Lichtblauwe container met border
- Drie knoppen naast elkaar
- Actieve modus krijgt donkerblauw background

#### **Status Indicator**
- Gekleurde dot indicator:
  - 🟢 Groen - Online (met glow effect)
  - 🟠 Oranje - Excel/Offline
  - 🔵 Blauw - Demo
- Tekstuele status onder knoppen

#### **Icons per Modus**
- 🎯 Demo
- 📊 Excel
- 🌐 Online

### 3. **Excel Upload Sectie**

- Alleen zichtbaar in Excel modus
- Dashed border voor drag-and-drop gevoel
- File input voor .xlsx/.xls bestanden
- Status indicator met emoji's:
  - ✓ Groen - Succesvol geladen
  - ⚠ Oranje - Waarschuwing
  - ✗ Rood - Fout
- Auto-collapse na 3 seconden bij succes

### 4. **Search Box**

#### **Input Field**
- Full-width met moderne styling
- Placeholder: "Zoek naar Visio, SAP rollen of applicaties..."
- Border highlight bij focus (Vitens lichtblauw #4aaedf)
- Autocomplete dropdown integration

#### **Search Button**
- "Zoeken" label
- Vitens donkerblauw
- Hover effect met darkening

### 5. **Autocomplete Dropdown**

#### **Container**
- Verschijnt onder search input
- White background
- Lichtblauw border matching focus state
- Max height 400px met scroll
- Box shadow voor depth

#### **Suggestie Items**
- Hover state (lichtblauw background)
- Keyboard selected state (zelfde als hover)
- Drie-laags informatie:
  1. **Naam** - Bold, highlighted match
  2. **Beschrijving** - Grijs, truncated
  3. **Type badge** - Klein blauw label

#### **Special States**
- "Geen suggesties gevonden" - Centered, grijs
- Smooth scroll bij keyboard navigatie

### 6. **Filter Section**

#### **Layout**
- Grid layout: 2 dropdowns + 1 button
- Alleen zichtbaar in Excel/Online modus
- Emoji icons voor visuele appeal:
  - 🏢 Afdeling
  - ⚙️ Bedrijfsproces

#### **Dropdowns**
- Vitens styling matching search input
- Dynamisch gevuld uit data
- Trigger immediate search on change

#### **Reset Button**
- Lichtblauw (secondary color)
- "Reset Filters" label
- Full width in grid column

### 7. **Zoekresultaten**

#### **Results Header**
- "Zoekresultaten (X)" met count
- Vitens blauw
- Bold font weight

#### **Result Cards**
- Lichtgrijze background (#f9f9f9)
- Linker border accent (lichtblauw 4px)
- Hover effect:
  - White background
  - Box shadow
- Grid layout: Info links, button rechts

#### **Card Content**
- **Naam** - Bold, Vitens blauw, groot
- **Beschrijving** - Regular, grijs, line-height voor leesbaarheid
- **Rol eigenaar** - Klein, apart block met label
- **Type badge** - Inline-block, lichtblauw background

#### **Add Button**
- Lichtblauw
- "Toevoegen" of "✓ Toegevoegd"
- Disabled state wanneer in cart
- Hover effect

### 8. **Winkelwagen (Cart)**

#### **Cart Header**
- "Winkelwagen" titel
- Badge met count (cirkel, lichtblauw)
- Flex layout

#### **Cart Container**
- Aparte sectie met eigen background
- Border en padding
- Sticky positioning (blijft zichtbaar bij scrollen)

#### **Cart Items**
- Linker border accent (donkerblauw)
- Flex layout: Info links, remove rechts
- Naam + type op twee regels

#### **Remove Button**
- Rood (✕)
- Klein, compact
- Hover darkening

#### **Empty State**
- 🛒 Grote cart emoji
- "Je winkelwagen is leeg" tekst
- Centered alignment
- Grijs/opacity voor subtiliteit

#### **Order Button**
- Full width
- Vitens donkerblauw
- Bold text
- "Bestelling Indienen" label
- Disabled state wanneer cart leeg

### 9. **Messages & Feedback**

#### **Success Message**
- Groen background (#4caf50)
- White text
- Slide down animatie
- Auto-hide na 5 seconden
- Gebruikt voor:
  - Succesvolle bestellingen
  - Settings opgeslagen
  - Excel upload geslaagd

#### **Error Message**
- Rood background (#d32f2f)
- White text
- Slide down animatie
- Auto-hide na 5 seconden
- Gebruikt voor:
  - Verbinding errors
  - Validatie fouten
  - Upload fouten

#### **Loading Overlay**
- Full-screen semi-transparant overlay
- Centered spinner + tekst
- Blokeert interactie tijdens processing
- "Bezig met verwerken..." tekst

### 10. **Settings Modal**

#### **Modal Overlay**
- Semi-transparant zwart (rgba 0,0,0,0.7)
- Full screen
- Click outside to close
- Fade-in animatie

#### **Modal Content**
- White background
- Centered
- 90% width, max 700px
- Border radius
- Slide-up animatie
- Scroll support voor lange content

#### **Modal Header**
- Vitens donkerblauw background
- White text
- "⚙️ GRC Instellingen" titel
- Close button (×)

#### **Modal Body**
- Multiple sections met borders
- Form groups met labels
- Input fields met focus states
- Checkboxes voor toggles
- Helper text onder inputs

#### **Modal Footer**
- Border top scheiding
- Flex layout voor buttons
- "Test Connectie" (lichtblauw)
- "Opslaan" (donkerblauw)

#### **Connection Status**
- Groen voor success
- Rood voor error
- Slide-in vanaf boven

---

## Workflow & Processen

### **Bestelling Flow**

1. **Mode selecteren**
   - Kies Demo, Excel of Online
   - Upload Excel indien nodig

2. **Zoeken & Filteren**
   - Type zoekterm (autocomplete helpt)
   - Of gebruik filters (Excel/Online)
   - Bekijk resultaten

3. **Toevoegen aan Cart**
   - Click "Toevoegen" op gewenste rollen
   - Zie cart counter updaten
   - Review cart items

4. **Gebruikersinformatie**
   - Vul aan voor wie de aanvraag is
   - Voeg business justification toe

5. **Indienen**
   - Click "Bestelling Indienen"
   - Loading overlay verschijnt
   - Success/error message
   - Cart wordt geleegd

### **Mode-Specifieke Flows**

#### **Demo Flow**
- Directe toegang tot test data
- Simulatie van bestelling
- Console logging voor debug

#### **Excel Flow**
- Upload BOR.xlsx
- Wacht op parsing (3-5 seconden voor 8000+ rollen)
- Success message
- Filters worden gevuld
- Excel section collapst na 3 sec

#### **Online Flow**
- Settings configureren eerst
- Test connection
- Real-time zoeken in GRC
- Echte aanvraag naar GRC backend
- Ontvang request ID

---

## Technische Integraties

### **SAP GRC 12.0 SOAP Web Services**

#### **GRAC_SEARCH_ROLES_WS**
- **Functie:** Zoeken naar SAP rollen
- **Input:** Search string
- **Output:** Lijst met rollen (ID, Name, Description, Type, System, Owner)
- **Timeout:** Configureerbaar (standaard 30s)

#### **GRAC_ORG_ASGN_REQUEST_WS**
- **Functie:** Aanmaken van access requests
- **Input:**
  - Requester ID
  - User ID
  - Reference ticket number
  - Justification
  - List van rollen met valid from/to
- **Output:** Request ID
- **Timeout:** Configureerbaar

#### **GRAC_REQUEST_STATUS_WS**
- **Functie:** Ophalen request status
- **Input:** Request ID
- **Output:** Status informatie
- **Use case:** Polling voor updates

### **Excel Parsing (SheetJS)**

#### **Ondersteunde Formaten**
- .xlsx (Excel 2007+)
- .xls (Excel 97-2003)

#### **Verwachte Structuur (BOR.xlsx)**
- Sheet naam: "Data" of "data"
- Kolommen:
  - Rolnaam
  - Applicatietype
  - Roltype
  - Bedrijfsproces
  - Subproces
  - Functiegebied
  - Constellatie

#### **Parsing Features**
- Case-insensitive kolom matching
- NaN filtering
- Lege entries filteren
- Auto-description building uit multiple velden
- Progress indicator tijdens parsing

### **Browser LocalStorage**

#### **Opgeslagen Data**
- GRC server URL
- Timeout settings
- Service account credentials
- Web service endpoints
- Polling configuratie
- Backend toggle state

#### **Security Note**
- Passwords in localStorage (⚠️ voor productie: encryptie aanbevolen)
- Geen cart persistentie (session-only)

---

## Design Elementen

### **Kleurenpalet**

#### **Primary Colors**
- **Vitens Donkerblauw:** #2c3c8a
  - Headers, primary buttons, titels
- **Vitens Lichtblauw:** #4aaedf
  - Accenten, secondary buttons, highlights
- **White:** #ffffff
  - Backgrounds, text op donker

#### **Greys**
- **#f5f5f5** - Body background
- **#f9f9f9** - Card backgrounds
- **#f0f0f0** - Borders, dividers
- **#e0e0e0** - Subtle borders
- **#ddd** - Input borders
- **#999** - Placeholder text
- **#666** - Secondary text
- **#333** - Dark text

#### **Status Colors**
- **Success Green:** #4caf50
- **Error Red:** #d32f2f
- **Warning Orange:** #ff9800
- **Info Blue:** #2196f3

#### **Special Backgrounds**
- **#f0f4ff** - Light blue tint voor info sections
- **rgba(255, 255, 255, 0.15)** - Semi-transparent white voor overlays

### **Typography**

#### **Font Family**
- Arial, Helvetica, sans-serif (web-safe)

#### **Font Sizes**
- **2em** - Main header title
- **1.8em** - Modal headers
- **1.5em** - Section titles
- **1.3em** - Sub-section titles
- **1.2em** - Results header
- **1.1em** - Large text, result names
- **1em (16px)** - Body text, buttons
- **0.95em** - Form labels
- **0.9em** - Small labels
- **0.85em** - Secondary text
- **0.8em** - Status text
- **0.75em** - Tiny text, badges

#### **Font Weights**
- **600** - Semi-bold (titles, labels, important text)
- **500** - Medium (buttons, navigation)
- **400** - Normal (body text)

### **Spacing System**

#### **Padding**
- **40px** - Container horizontal padding
- **30px** - Section padding, large spacing
- **25px** - Modal header padding
- **20px** - Card padding, medium spacing
- **15px** - Small section padding
- **12px** - Input padding, compact spacing
- **8px** - Minimal spacing
- **4px** - Tiny spacing

#### **Margins**
- **30px** - Between major sections
- **20px** - Between form groups
- **15px** - Between elements
- **12px** - Between related items
- **10px** - Compact spacing
- **6px** - Minimal margins
- **4px** - Inline spacing

#### **Gaps** (Flexbox/Grid)
- **30px** - Main content grid
- **20px** - Form groups
- **15px** - Navigation items
- **12px** - Title elements
- **10px** - Search box
- **8px** - Compact groups
- **5px** - Inline elements

### **Border Radius**

- **8px** - Large rounded corners (modals)
- **6px** - Medium rounded (sections, badges)
- **4px** - Small rounded (buttons, inputs)
- **3px** - Tiny rounded (inline badges)
- **50%** - Full circle (badges, icons)

### **Borders**

#### **Widths**
- **4px** - Accent borders (result cards)
- **3px** - Medium accent
- **2px** - Input borders, focus states
- **1px** - Subtle dividers

#### **Styles**
- **Solid** - Standard borders
- **Dashed** - File upload hint

### **Shadows**

#### **Box Shadows**
- `0 2px 4px rgba(0,0,0,0.1)` - Subtle elevation (cards)
- `0 2px 8px rgba(0,0,0,0.08)` - Hover state
- `0 2px 8px rgba(44, 60, 138, 0.3)` - Blue glow (active mode)
- `0 4px 8px rgba(0,0,0,0.2)` - Logo hover
- `0 4px 12px rgba(0, 0, 0, 0.15)` - Autocomplete dropdown
- `0 10px 40px rgba(0,0,0,0.3)` - Modal (strong depth)

#### **Text Shadows**
- Niet gebruikt (clean, modern design)

### **Transitions & Animations**

#### **Transition Properties**
```css
transition: all 0.3s;           /* Default smooth transition */
transition: background 0.3s;    /* Buttons, hovers */
transition: border-color 0.3s;  /* Input focus */
transition: transform 0.3s;     /* Icons, scaling */
transition: background 0.2s;    /* Fast response */
```

#### **Keyframe Animations**

**Spin (Loading)**
```css
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

**Slide Down (Messages)**
```css
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

**Fade In (Modal overlay)**
```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

**Slide Up (Modal content)**
```css
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### **Transform Effects**
- `rotate(45deg)` - Settings icon hover
- `rotate(-90deg)` - Collapsed arrow
- `scale(1.05)` - Logo hover
- `translateY(-2px)` - Navigation hover

### **Interactive States**

#### **Hover Effects**
- Background color changes
- Border color changes
- Box shadow additions
- Transform/scale effects
- Opacity changes

#### **Focus States**
- Border color change (lichtblauw)
- Outline: none (custom borders instead)
- Visual feedback op alle interactieve elementen

#### **Disabled States**
- `background: #ccc` - Disabled buttons
- `cursor: not-allowed`
- Opacity reduction
- Removed hover effects

#### **Active States**
- Darker background colors
- Border emphasis
- Box shadows
- Text weight changes

### **Layout Patterns**

#### **Grid Layouts**
- 2-column main layout (2fr 1fr) - Content | Sidebar
- 2-column + button filter layout
- Responsive collapse to single column on mobile

#### **Flexbox Patterns**
- Space-between (headers, cart items)
- Center alignment (empty states, modals)
- Column direction (forms)
- Gap property voor spacing

#### **Positioning**
- Sticky sidebar (top: 20px)
- Fixed loading overlay
- Absolute autocomplete dropdown
- Relative containers voor absolute children

### **Responsive Design**

#### **Breakpoints**
- **1024px** - Tablet landscape
  - Single column layout
  - Static sidebar (niet sticky)
  - Reduced padding

- **768px** - Mobile
  - Hide navigation text, show only emojis
  - Adjusted padding
  - Full-width components

#### **Mobile Optimizations**
- Touch-friendly button sizes
- Larger tap targets
- Simplified navigation
- Readable font sizes (minimum 16px voor inputs)

---

## Toegankelijkheid

### **Keyboard Navigation**

#### **Tab Order**
- Logische flow door interface
- Settings icon → Navigation → Mode switch → Search → Filters → Results → Cart

#### **Keyboard Shortcuts**
- **Enter** - Submit search / Select autocomplete
- **Escape** - Close autocomplete / Close modal
- **↑/↓** - Navigate autocomplete suggestions
- **Tab** - Navigate between form fields
- **Space** - Toggle checkboxes/radio buttons

### **Screen Reader Support**

#### **Semantic HTML**
- `<button>` voor klikbare acties
- `<input>` met juiste types
- `<label>` gekoppeld aan inputs
- `<nav>` voor navigatie

#### **ARIA Attributes** (Potentiële verbetering)
- `aria-label` voor icon-only buttons
- `aria-expanded` voor collapsible secties
- `aria-live` voor dynamic updates
- `role="status"` voor messages

### **Visual Accessibility**

#### **Contrast Ratios**
- **Vitens blauw (#2c3c8a) op white**: WCAG AAA compliant
- **White text op blauw**: WCAG AAA compliant
- **Grijs (#666) op white**: WCAG AA compliant

#### **Focus Indicators**
- Zichtbare focus states op alle interactieve elementen
- Custom styling (niet alleen browser default)
- Kleurcontrast voldoet aan WCAG 2.1

#### **Text Sizing**
- Minimum 16px voor body text
- Relatieve units (em) waar mogelijk
- Geen tekst in images (behalve logo)

### **Error Prevention**

- Disabled buttons wanneer acties niet beschikbaar
- Validatie feedback
- Confirmation voor destructieve acties (impliciet via cart systeem)
- Clear error messages

### **Help & Documentation**

- Placeholder tekst in inputs
- Helper text onder form fields
- Tooltips op icons (via title attribute)
- Status messages bij belangrijke acties

---

## Browser Compatibility

### **Ondersteunde Browsers**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### **Gebruikte Features**
- ES6 JavaScript (arrow functions, const/let, template literals)
- CSS Grid & Flexbox
- CSS Custom Properties (niet gebruikt, maar mogelijk)
- Fetch API
- LocalStorage
- FileReader API (voor Excel upload)
- DOMParser (voor XML/SOAP parsing)

### **Polyfills Niet Nodig Voor**
- Moderne browsers (2021+)
- Bedrijfsomgeving met managed browsers

---

## Performance Optimizations

### **JavaScript**
- Debouncing voor autocomplete (300ms)
- Event delegation waar mogelijk
- Beperkte DOM manipulatie (innerHTML bulk updates)
- Geen externe JavaScript frameworks (vanilla JS)

### **CSS**
- Hardware-accelerated transitions (transform, opacity)
- Efficient selectors
- Geen !important usage (clean specificity)

### **Network**
- CDN voor SheetJS library
- SOAP caching mogelijk (niet geïmplementeerd)
- LocalStorage voor settings (geen herhaalde fetches)

### **Data Handling**
- Max 8 autocomplete results (beperkt rendering)
- Max 100 results bij filter-only search
- Fuzzy search threshold (50) voorkomt irrelevante matches
- Excel parsing in background (niet blocking)

---

## Security Considerations

### **Huidige Implementatie**
- Basic Auth voor GRC (username/password)
- LocalStorage voor credentials (⚠️ niet encrypted)
- No SSL/TLS enforcement in code (verwacht via server)
- No CSRF protection (client-side only app)

### **Productie Aanbevelingen**
1. **Encryptie van credentials** in localStorage
2. **HTTPS only** enforcement
3. **SSO/SAML integratie** ipv Basic Auth
4. **Backend proxy** voor GRC calls (vermijd CORS)
5. **Input sanitization** voor XSS preventie
6. **CSP headers** toevoegen
7. **Rate limiting** op GRC calls

---

## Deployment & Hosting

### **Files Required**
- `index.html` (hoofdbestand, 2700+ regels)
- `grc-config.js` (configuratie)
- `favicon.svg` (Vitens logo)
- `test-grc-connection.html` (test tool)
- `inspect-excel.html` (Excel inspector)

### **External Dependencies**
- SheetJS CDN: `https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js`
- Vitens logo: `https://www.vitens.nl/-/media/Project/Vitens/VitensNl/vitens-logo.jpg`

### **Hosting Opties**
1. **SharePoint** - Geïntegreerd in Vitens omgeving
2. **IIS** - Windows web server
3. **Static hosting** - AWS S3, Azure Storage, etc.
4. **Intranet server** - Toegankelijk binnen netwerk

### **SharePoint Deployment**
- Upload als Site Pages
- Embed in modern webparts
- Configureer permissions
- Link vanuit navigation

---

## Future Enhancements

### **Mogelijke Verbeteringen**

1. **PWA Support**
   - Offline functionality
   - Install als app
   - Push notifications

2. **Advanced Search**
   - Boolean operators (AND/OR/NOT)
   - Wildcards
   - Saved searches

3. **User Preferences**
   - Favorite roles
   - Recent searches
   - Custom themes

4. **Analytics**
   - Track popular roles
   - Search patterns
   - Conversion metrics

5. **Bulk Operations**
   - Multiple users tegelijk
   - CSV import
   - Template requests

6. **Workflow Visibility**
   - Status tracking
   - Approval progress
   - Notifications

7. **Mobile App**
   - Native iOS/Android
   - Better offline support
   - Push notifications

8. **AI/ML Features**
   - Role recommendations
   - Smart autocomplete learning
   - Duplicate detection

---

## Support & Maintenance

### **Logs & Debugging**
- Console.log statements voor belangrijke acties
- Error logging naar console
- Network tab voor SOAP call debugging

### **Common Issues**

#### **Excel Upload Fails**
- Check file format (.xlsx of .xls)
- Verify "Data" sheet exists
- Check column names

#### **GRC Connection Fails**
- Test connection in settings
- Verify server URL
- Check credentials
- Confirm network access

#### **Autocomplete Niet Zichtbaar**
- Type minimaal 2 karakters
- Check console voor errors
- Verify mode heeft data (niet leeg Excel)

#### **Search Returns No Results**
- Lower threshold in fuzzy search (regel 1598)
- Check data is geladen
- Verify filters niet te restrictief

### **Browser Console Commands**

Handige debug commands:
```javascript
// Check current mode
console.log(currentMode);

// Check loaded data
console.log(excelData.length + " Excel rollen geladen");
console.log(localAvailableAccess.length + " Demo rollen beschikbaar");

// Check cart
console.log(cart);

// Test fuzzy search
fuzzySearch("visio", localAvailableAccess);

// Check GRC config
console.log(GRC_CONFIG);
```

---

## Changelog

### **Version 1.3** (2025-01-22)
- ✨ Toegevoegd: Inline autocomplete feature
- ✨ Toegevoegd: Keyboard navigatie voor autocomplete
- ✨ Toegevoegd: Highlight matching text in suggesties
- 🎨 Verbeterd: Search box UI met dropdown integration
- ⚡ Optimalisatie: Debouncing voor betere performance

### **Version 1.2** (2025-01-22)
- ✨ Toegevoegd: Inklapbare gebruikersinformatie sectie
- 🎨 Verbeterd: Witruimte tussen components
- 🎨 Verbeterd: Mode switch naar boven van sidebar verplaatst
- 🐛 Fix: Layout spacing issues

### **Version 1.1** (2025-01-21)
- ✨ Toegevoegd: Rol eigenaar display in zoekresultaten
- ✨ Toegevoegd: Gebruikersinformatie sectie naar rechter sidebar
- 🎨 Verbeterd: Central search focus
- 🎨 Verbeterd: Clean layout

### **Version 1.0** (2025-01-20)
- 🚀 Initial release
- ✨ Three-mode system (Demo, Excel, Online)
- ✨ Fuzzy search implementation
- ✨ Excel upload & parsing
- ✨ Filter system
- ✨ Cart functionality
- ✨ GRC SOAP integration
- ✨ Settings management

---

## Contact & Credits

**Ontwikkeld voor:** Vitens N.V.
**Technologie Stack:** Vanilla HTML/CSS/JavaScript
**SAP Integratie:** GRC 12.0 SOAP Web Services
**Excel Library:** SheetJS (xlsx)

**Gegenereerd met:** [Claude Code](https://claude.com/claude-code) 🤖

---

*Laatste update: 22 januari 2025*
