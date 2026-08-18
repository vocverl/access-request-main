# GRC-connector

De schakel tussen de Access Request Portal en SAP GRC Access Control 12.0.

## Waarom dit bestaat

De portal is een webpagina. Die kan niet rechtstreeks met SAP praten, om twee
redenen die geen van beide aan de pagina op te lossen zijn:

**De browser blokkeert het antwoord.** SAP's ICM stuurt geen CORS-headers, dus
een `fetch` vanuit de pagina naar `grc-dev.vitens.lan` levert wel een verzoek op,
maar het antwoord bereikt je JavaScript nooit. Dat is een veiligheidsregel in de
browser zelf, geen instelling.

**Het service account zou in de pagina staan.** Alles wat een webpagina nodig
heeft om in te loggen, kan iedereen die de pagina opent uitlezen.

De connector lost allebei op door ertussen te gaan staan:

```
browser  ──JSON──▶  connector  ──SOAP──▶  SAP GRC (GRD)
         same-origin           Citrix Secure Access
```

De pagina praat alleen met haar eigen origin, dus CORS speelt geen rol meer. De
credentials blijven in het serverproces.

## Snel starten

```bash
npm install
cp .env.example .env     # daarna zelf invullen, zie hieronder
npm run dev              # http://127.0.0.1:8086
```

Voorwaarde: **Citrix Secure Access moet verbonden zijn.** Zonder tunnel bestaat
`grc-dev.vitens.lan` niet en meldt de connector dat ook zo.

Controleer of alles staat via `http://127.0.0.1:8086/test-grc-connection.html` —
die pagina loopt de hele keten langs, van configuratie tot een echte zoekopdracht
op GRD.

## Configuratie

Alles komt uit environment variables, zodat dezelfde code lokaal en op een server
draait. `.env` staat in `.gitignore`.

| Variabele | Wat |
|---|---|
| `GRC_BASE_URL` | `https://grc-dev.vitens.lan` |
| `GRC_CLIENT` | `100` |
| `GRC_USERNAME` / `GRC_PASSWORD` | Service account met `S_SERVICE`-autorisatie |
| `GRC_TLS_CA_FILE` | PEM met de Vitens-CA-keten, zie `scripts/build-ca-bundle.mjs` |
| `GRC_TLS_INSECURE` | Noodrem voor lokaal testen. Nooit op een server |
| `GRC_EP_*` | Endpointpaden uit SOAMANAGER |
| `GRC_WSDL_PREFIX` | Zie "De WSDL zit niet waar je denkt" |
| `AUTH_MODE` | `local` of `header` — zie [auth.js](auth.js) |
| `LOCAL_USER_ID` | Aanvrager in ontwikkelmodus |
| `ENABLE_DEBUG_ENDPOINTS` | Zet `/api/debug/*` aan. Uit op een server |

`GET /api/health` vertelt wat er nog ontbreekt.

## API

| Route | Doel |
|---|---|
| `GET /api/health` | Configuratie, services, TLS- en identiteitsstatus |
| `GET /api/me` | Wie de server als aanvrager gebruikt, en hoe dat is vastgesteld |
| `POST /api/roles/search` | Rollen zoeken. Body: `{ searchTerm?, functionalArea?, businessProcess?, subProcess?, system?, roleType?, roleOwner? }` |
| `POST /api/requests` | Access request indienen |
| `GET /api/requests/:nr/status` | Status van een aanvraag |
| `GET /api/requests/:nr` | Details |
| `GET /api/lookup?lists=priorityType` | Geldige codewaarden bij GRC opvragen |
| `GET /api/debug/wsdl?service=` | WSDL van een service (alleen met debug aan) |
| `POST /api/debug/soap` | Vrije SOAP-call, om formaatvarianten te proberen |
| `GET /api/debug/probe?path=` | Rauwe GET op een pad in GRD |

## Het GRC-contract

Dit is de kennis die het meeste tijd kostte om te vinden. De bron is altijd de
WSDL van GRD zelf, niet de documentatie.

### De WSDL zit niet waar je denkt

`<endpoint>?wsdl` werkt niet op deze SAP-versie; je krijgt een misleidende fout
over een *config key* die op een kapotte binding lijkt. De echte URL staat in
SOAMANAGER onder **WSDL-URL voor binding** en heeft een eigen prefix:

```
/sap/bc/srt/wsdl/flv_<sleutel>/bndg_url  +  het endpointpad
```

Die sleutel is per systeem. Zet hem in `GRC_WSDL_PREFIX`.

### Operatienamen

Alle vijf wijken af van wat de SAP-note suggereert:

| Servicedefinitie | Operatie |
|---|---|
| `GRAC_SEARCH_ROLES_WS` | `GracIdmRoleSearchServices` |
| `GRAC_USER_ACCES_WS` | `GracIdmUsrAccsReqServices` |
| `GRAC_REQUEST_STATUS_WS` | `GracIdmRequestStatServices` |
| `GRAC_REQUEST_DETAILS_WS` | `GracIdmReqDetailsServices` |
| `GRAC_LOOKUP_WS` | `GracIdmLookupServices` |

Namespace: `urn:sap-com:document:sap:soap:functions:mc-style`.

Let op: voor het indienen is `GRAC_USER_ACCES_WS` de juiste service.
`GRAC_ORG_ASSGN_REQUEST_WS` gaat over organisatorische toewijzingen, niet over
rolaanvragen.

### Codes zijn driecijferig

`029` werkt, `29` geeft *"Ongeldig aanvr.type"*. Dat geldt voor alle codevelden.

### Veldvolgorde is bindend

De structuren gebruiken `xsd:sequence` en binnen die structuren is **geen enkel
veld optioneel**. Elementen in een andere volgorde, of weglaten in plaats van
leeg meesturen, levert een afwijzing op. Zie [grc/schema.js](grc/schema.js).

### Zoeken doet geen impliciete jokertekens

`servicedesk` levert nul resultaten op, `*servicedesk*` dertien. De connector zet
er zelf sterretjes omheen als je ze niet meegeeft. Hoofdletters maken niet uit.

Alleen jokertekens is geen zoekopdracht maar een verzoek om alles: `**` liep in
de time-out van 30 seconden. De connector eist daarom minstens twee tekens die
geen `*` zijn.

### Filteren op functiegebied en bedrijfsproces

`FunctionalArea` en `BusinessProcess` werken als serverside filter, en mogen ook
zonder zoekterm - "alle rollen van functiegebied FM" is een zinnige vraag.

Beide willen de **code**, niet de omschrijving: `FM` werkt, `Facilitair
Management` niet. `B_PP` levert twaalf rollen, `Purchase 2 Pay` nul.

De codes staan hardgecodeerd in `index.html` (`GRC_FUNCTIEGEBIEDEN` en
`GRC_BEDRIJFSPROCESSEN`), omdat `GRAC_LOOKUP_WS` ze wel zou moeten leveren maar
lege lijsten teruggeeft. Zodra dat recht er is kunnen beide lijsten weg.

Let op codes met een ampersand (`K&F`, `N&L`, `O&A`, `W&Z`): die moeten als
`K&amp;F` de envelope in. Dat gaat goed, maar het is het soort teken waar een
zelfgebouwde XML-opbouw op stuk kan lopen.

Het zoekantwoord bevat functiegebied en bedrijfsproces **niet**. Filteren kan dus
alleen aan de GRC-kant, niet achteraf op het resultaat.

### De prioriteit-valkuil

In de UI is het prioriteitsveld via de EUP-instelling verwijderd en niet
verplicht. GRC slaat dan intern `000` op. De webservice **weigert** `000`, weigert
leeg, en eist een code uit de configuratietabel. Twee kanalen van hetzelfde
systeem met verschillende regels.

## Foutmeldingen ontcijferd

| Melding | Wat er aan de hand is |
|---|---|
| `Hostnaam niet gevonden` | Citrix Secure Access staat niet aan |
| `Het certificaat van GRD is niet te valideren` | `GRC_TLS_CA_FILE` ontbreekt of mist de root |
| HTTP 401 | Wachtwoord fout of account geblokkeerd |
| HTTP 403 | `S_SERVICE`-autorisatie ontbreekt voor deze service |
| HTTP 404 | Binding niet gepubliceerd in SOAMANAGER, of pad klopt niet |
| `Bevoegdheid ontbreekt voor service ...` | Idem, maar dan als SOAP-fout |
| `WSP Exception ... config key` | Verkeerde WSDL-URL, zie hierboven |
| Lege lijsten uit `/api/lookup` | Service account mag de configuratietabellen niet lezen |
| `Ongeldige invoer of geen geg. beschikb.` | Filterwaarde bestaat wel, maar er hangen geen rollen aan |
| `Openstaande aanvraag ... bestaat al` | Er loopt al een aanvraag voor die gebruiker op dat systeem |
| `Ongeldig aanvraagnr.` vlak na het indienen | Nog niet verwerkt. Een nieuwe aanvraag is even niet op te vragen; later wel |

Staat `ENABLE_DEBUG_ENDPOINTS` aan, dan zit de verstuurde en ontvangen XML in het
`debug`-veld van elk antwoord. Dat is bij een afwijzing meestal het snelste spoor.

### Een nieuwe aanvraag is niet meteen op te vragen

Direct na het indienen geven de status- en detailservice `Ongeldig aanvraagnr.`
voor een nummer dat GRC net zelf heeft teruggegeven. Later bestaat hij gewoon,
compleet met `ProvStatus = Succes`.

Trap daar niet in bij het testen: het lijkt alsof GRC succes meldt zonder dat er
iets gebeurt, maar de aanvraag is er wel. Wacht even, of kijk in GRC zelf.

### Het preapproved-pad maakt gebruikers aan

Aanvraagsoort `029` loopt via `REQ_PREAPPROVED` en wijst direct toe, inclusief
automatische gebruikersaanmaak als de gebruiker nog niet op de connector bestaat.
Een aanvraag voor een verzonnen gebruikers-ID levert dus een echte gebruiker op.

## Beveiliging

**Bindt op `127.0.0.1`.** Dit proces heeft een service account met toegang tot
GRD; dat mag niet vanaf het netwerk bereikbaar zijn.

**De aanvrager komt van de server.** `requesterId` uit de body wordt genegeerd.
Zou de browser dat mogen bepalen, dan kan iedereen die de API bereikt indienen
namens een willekeurige collega.

**SSO wordt niet hier afgehandeld.** Kerberos of SAML termineer je in een proxy
die daarvoor is ingericht. In `header`-modus leest de connector de identiteit uit
een header, maar alleen als het afzenderadres in `AUTH_TRUSTED_PROXIES` staat —
zonder die controle is een header triviaal te vervalsen.

**Debugroutes uit** voordat dit ergens anders dan op localhost draait: ze geven
rauwe SOAP-berichten terug.

## Nog niet af

- `GRC_TLS_INSECURE=true` totdat de Vitens-root-CA beschikbaar is. Het
  distributiepunt `pki.vitens.lan` wordt niet door de Citrix-tunnel geroutéerd.
- SSO: de architectuur staat klaar, er moet een proxy voor.
- Naam, e-mail, manager en afdeling vult de gebruiker zelf in. Die zouden uit AD
  of GRC moeten komen.
- `/api/lookup` werkt technisch, maar geeft lege lijsten tot het service account
  de configuratietabellen mag lezen.
