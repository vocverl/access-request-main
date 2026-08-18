# Technisch ontwerp — Access Request Portal ↔ SAP GRC

> Stand van 18 augustus 2026, systeem **GRD** (`grc-dev.vitens.lan`, client 100).
> Alle namen en codes hieronder zijn afgelezen uit de WSDL van het systeem zelf of uit de
> GRC-configuratie — niet uit documentatie.
>
> Waarden zijn gemarkeerd als **geverifieerd** (er is een geslaagde aanroep mee gedaan) of
> **uit configuratie** (bestaat volgens GRC, nog niet getest).

---

## 1. Architectuur

```
browser ──JSON/HTTPS──▶ connector ──SOAP/HTTPS──▶ SAP GRC (GRD)
        same-origin              Citrix Secure Access
```

De browser praat niet rechtstreeks met SAP. Dat kan ook niet: de ICM van SAP stuurt geen
CORS-headers, dus de browser verwerpt elk antwoord. Bovendien zou het service-account dan in de
webpagina staan. De connector staat ertussen, vertaalt JSON naar SOAP en houdt de credentials in
het serverproces.

| Component | Technologie | Locatie |
|---|---|---|
| Frontend | Statische HTML/JS | uitgeleverd door de connector |
| Connector | Node 22, Express 4, fast-xml-parser | `127.0.0.1:8086`, alleen localhost |
| Backend | SAP GRC Access Control 12.0 | `grc-dev.vitens.lan`, client 100 |

---

## 2. Verbinding

| Instelling | Waarde |
|---|---|
| Basis-URL | `https://grc-dev.vitens.lan` (poort 443) |
| Client | `100` |
| Service-account | `RFC_ARQ`, basic authentication |
| Netwerk | Citrix Secure Access; `grc-dev.vitens.lan` resolvt alleen via de tunnel |
| TLS | Keten `grc-dev.vitens.lan` ← `Vitens-IssuingCA` ← `Vitens-RootCA` |

De root-CA zit niet in de keychain van een standaard werkplek en het distributiepunt
`pki.vitens.lan` wordt niet door de Citrix-tunnel geroutéerd. Zolang die ontbreekt draait de
connector met `GRC_TLS_INSECURE=true`. Het script `scripts/build-ca-bundle.mjs` bouwt en
controleert de keten zodra het certificaat beschikbaar is.

---

## 3. Web services

Alle vijf gepubliceerd via SOAMANAGER op GRD, pakket `GRAC_DIRECTORY_SERVICES`.
Namespace voor alle operaties: `urn:sap-com:document:sap:soap:functions:mc-style`.

| Servicedefinitie | Operatie | Functie |
|---|---|---|
| `GRAC_SEARCH_ROLES_WS` | `GracIdmRoleSearchServices` | Rollen zoeken |
| `GRAC_USER_ACCES_WS` | `GracIdmUsrAccsReqServices` | Access request indienen |
| `GRAC_REQUEST_STATUS_WS` | `GracIdmRequestStatServices` | Status van een aanvraag |
| `GRAC_REQUEST_DETAILS_WS` | `GracIdmReqDetailsServices` | Details van een aanvraag |
| `GRAC_LOOKUP_WS` | `GracIdmLookupServices` | Geldige waardelijsten opvragen |

**Let op:** voor het indienen is `GRAC_USER_ACCES_WS` de juiste service.
`GRAC_ORG_ASSGN_REQUEST_WS` gaat over organisatorische toewijzingen, niet over rolaanvragen.

### Endpointpaden

Patroon: `/sap/bc/srt/rfc/sap/<servicedefinitie>/<client>/<servicenaam>/<bindingnaam>`

```
/sap/bc/srt/rfc/sap/grac_search_roles_ws/100/service_search_roles/binding_search_roles
/sap/bc/srt/rfc/sap/grac_user_acces_ws/100/service_user_access/binding_user_access
/sap/bc/srt/rfc/sap/grac_request_status_ws/100/service_request_status/binding_request_status
/sap/bc/srt/rfc/sap/grac_request_details_ws/100/service_request_details/binding_request_details
/sap/bc/srt/rfc/sap/grac_lookup_ws/100/service_lookup/binding_lookup
```

### WSDL

**Niet** op `<endpoint>?wsdl` — dat geeft de misleidende fout
`WSP Exception caught: Waarde "config key" in methode INITIALIZE`, die op een kapotte binding
lijkt. De echte URL staat in SOAMANAGER onder *WSDL-URL voor binding* en heeft een prefix met een
per-systeem gegenereerde sleutel:

```
/sap/bc/srt/wsdl/flv_10002A111AD1/bndg_url  +  het endpointpad
```

Die sleutel (`flv_10002A111AD1`) is systeemspecifiek en verandert bij een ander GRC-systeem.

---

## 4. Berichtstructuren

Alle structuren zijn een `xsd:sequence`: **de volgorde is bindend** en binnen deze structuren is
**geen enkel veld optioneel**. Een veld weglaten is iets anders dan het leeg meesturen; laat lege
velden staan als lege elementen.

### 4.1 Zoeken — `GracIdmRoleSearchServices`

Invoervelden (alle optioneel, werken als filter):

```
Action, ApplicationType, Approver, AssociatedRole, BusinessProcess, ConnectorGroup,
CriticalLevel, FunctionalArea, Landscape, Language, LastReaffirmDt, OrgLvl, OrgVal,
Permission, Profile, ReaffirmPeriod, RoleDesc, RoleName, RoleOwner, RoleSensitivity,
RoleStatus, RoleType, SubProcess, System
```

Antwoord: `MsgReturn` + `RolesList/item` met per rol:
`RoleName, RoleDesc, System, RoleType, RoleTypeDesc, Landscape, LandscapeDesc, RoleOwner`

Er is **geen algemeen zoekveld**. Een zoekterm gaat op `RoleName`, en GRC doet géén impliciete
jokertekens: `servicedesk` geeft nul resultaten, `*servicedesk*` dertien. Hoofdletters maken niet
uit. Het antwoord bevat **niet** het functiegebied of bedrijfsproces — daarop filteren kan alleen
aan de GRC-kant.

### 4.2 Indienen — `GracIdmUsrAccsReqServices`

Verplichte blokken: `RequestHeaderData`, `RequestedLineItem`, `UserInfo`.
Optioneel: `CustomFieldsVal`, `Language`, `Parameter`, `UserGroup`.

**`RequestHeaderData`** (9 velden, in deze volgorde):
```
Reqtype, Priority, ReqDueDate, ReqInitSystem, Requestorid, Email, RequestReason, Funcarea, Bproc
```

**`RequestedLineItem/item`** (12 velden, in deze volgorde):
```
ItemName, Connector, ProvItemType, ProvType, AssignmentType, ProvStatus,
ValidFrom, ValidTo, FfOwner, Comments, ProvAction, RoleType
```

**`UserInfo/item`** (36 velden, in deze volgorde):
```
Userid, Title, Fname, Lname, SncName, UnsecSnc, Accno, UserGroup, ValidFrom, ValidTo,
Empposition, Empjob, Personnelno, Personnelarea, CommMethod, Fax, Email, Telnumber,
Department, Company, Location, Costcenter, Printer, Orgunit, Emptype, Manager,
ManagerEmail, ManagerFirstname, ManagerLastname, StartMenu, LogonLang, DecNotation,
DateFormat, Alias, UserType, Function
```

Antwoord: `MsgReturn` + `RequestId` (char50, vorm `ACCREQ/<guid>`) + `RequestNo` (char20, het
zichtbare aanvraagnummer).

Verplicht volgens de bedrijfslogica van GRC, ook al staat het schema ze leeg toe:
`Email`, `Fname`, `Lname`, `RequestReason`, `Reqtype`, `Priority`, `ReqInitSystem`, en per regel
`RoleType`.

`ReqInitSystem` verwacht de **connector-ID** (bijvoorbeeld `V4DCLNT100`), niet de naam van de
aanroepende applicatie.

`GracSWsReqhdr` heeft geen veld voor een extern ticketnummer; een Jira-referentie kan alleen in
`RequestReason` mee.

### 4.3 Status en details

| Operatie | Invoer | Antwoord |
|---|---|---|
| `GracIdmRequestStatServices` | `Language?`, `ReqNo` | `MsgReturn`, `ReqStatus` |
| `GracIdmReqDetailsServices` | `Language?`, `RequestNumber` | `MsgReturn`, `RequestDetails` |

### 4.4 Waardelijsten — `GracIdmLookupServices`

Elk invoerveld is een vlag: zet hem op `X` en de bijbehorende lijst komt terug.
Volgorde van de velden:

```
BusProc, BusSubProc, CommunicationType, CriticalLevel, EmployeeType, FunctionArea,
ItemProvType, Landscape, Language, OmObjectType, Phase, PriorityType, ProjectRelease,
RequestCustomFields, RequestType, RoleCustomFields, RoleSensitivity, RoleStatus, RoleType
```

**Werkt technisch maar geeft alle lijsten leeg terug**, zonder foutmelding. Dat wijst op
ontbrekende leesrechten van `RFC_ARQ` op de GRC-configuratietabellen. Zolang dat zo is, staan de
codelijsten hieronder hardgecodeerd in de applicatie.

---

## 5. Codelijsten

Codes zijn **driecijferig met voorloopnullen** waar ze numeriek zijn: `029` werkt, `29` geeft
*"Ongeldig aanvr.type"*.

### 5.1 Aanvraagsoorten

Uit de GRC-configuratie op GRD. Alleen die met MSMP-proces `SAP_GRAC_ACCESS_REQUEST` zijn
relevant voor dit portaal.

| Code | Omschrijving | Status |
|---|---|---|
| `001` | Nieuw account | uit configuratie — **maakt een gebruiker aan**, geen rolaanvraag |
| `002` | Account wijzigen | uit configuratie; geen enkele prioriteit werd hiervoor geaccepteerd |
| `003` | Account verwijderen | uit configuratie |
| `004` | Account blokkeren | uit configuratie |
| `005` | Gebruiker deblokkeren | uit configuratie |
| `006` | Firefighter | uit configuratie |
| `023` | Instromers | uit configuratie (Vitens-specifiek) |
| `024` | Doorstromers | uit configuratie (Vitens-specifiek) |
| `025` | Uitstromers | uit configuratie (Vitens-specifiek) |
| `026` | Mutaties | uit configuratie (Vitens-specifiek) |
| `027` | Nieuw AD account | uit configuratie |
| `029` | Preapproved | **geverifieerd** — loopt via pad `REQ_PREAPPROVED`, wijst direct toe |

Overige codes in de tabel (`009`–`021`) horen bij andere MSMP-processen: rolgoedkeuring, SoD- en
UAR-reviews, risico- en functiebeheer. Niet bruikbaar voor een access request.

### 5.2 Prioriteiten

| Code | Omschrijving | Code | Omschrijving |
|---|---|---|---|
| `001` | Medium | `009` | Medium |
| `002` | Medium | `010` | **Hoog — geverifieerd** |
| `003` | Medium | `011` | Medium |
| `004` | Medium | `012` | Laag |
| `005` | Medium | `013` | Medium |
| `007` | Hoog | `014` | Laag |
| `008` | Medium | | |

Er is geen `006`. **Prioriteit is niet los geldig, maar per aanvraagsoort.** Met soort `002` werd
géén van deze codes geaccepteerd; met `029` alleen `010`. Ga er dus niet van uit dat een code die
in de tabel staat overal werkt.

### 5.3 Bedrijfsprocessen (`BusinessProcess`, `Bproc`)

| Code | Omschrijving | Code | Omschrijving |
|---|---|---|---|
| `B_AC` | Archived | `B_MM` | Meterverwisseling & Meterbeheer |
| `B_AL` | Algemeen | `B_OC` | Order 2 Cash |
| `B_AS` | Aansluitingen | `B_PM` | Plant Maintenance |
| `B_BS` | Basis | `B_PP` | Purchase 2 Pay — **geverifieerd**, 12 rollen |
| `B_FI` | Finance — **geverifieerd**, 1 rol | `B_PS` | Project Systems |
| `B_HR` | Hire 2 Retire — **geverifieerd**, 9 rollen | `B_RB` | Reporting Basis |
| `B_KF` | Klant & Facturatie | `B_RP` | Reporting |
| `B_LG` | Logistiek | `B_SV` | Service |
| `B_MC` | Meter 2 Cash | `B_VT` | Vertrouwelijk |
| | | `B_ZP` | Zakenpartner |

### 5.4 Functiegebieden (`FunctionalArea`, `Funcarea`)

| Code | Omschrijving | Code | Omschrijving |
|---|---|---|---|
| `ALG` | Algemeen | `HR` | Human Resources — **geverifieerd**, 8 rollen |
| `AM` | Asset Management | `ICT` | ICT — **geverifieerd**, 15 rollen |
| `BD` | Business Development | `K&F` | Klant & Facturatie — **geverifieerd**, 2 rollen |
| `BJO` | Bestuurlijk Juridische Ondersteuning | `LAB` | Laboratorium |
| `COMM` | Communicatie | `N&L` | Netbeheer en Leveren |
| `DIR` | Directie | `O&A` | Ontwerp en Aanleg |
| `EVI` | Evides | `VEI` | VEI |
| `FI` | Finance | `W&Z` | Winning en Zuivering |
| `FM` | Facilitair Management — **geverifieerd**, 14 rollen | | |

Vier codes bevatten een ampersand en moeten als `K&amp;F` de SOAP-envelope in.

### 5.5 Roltypen (`RoleType`)

| Code | Omschrijving |
|---|---|
| `SIN` | Taakrol |
| `COM` | Functierol (composite) |
| `GRP` | Groep |
| `DRD` | Afgeleide rol |
| `SFG` | SuccessFactors: statische groep |

Alle vijf waargenomen in zoekresultaten. `RoleType` is **verplicht op de aanvraagregel**; zonder
komt de melding *"Rolsoort is verplicht op regel nr. 1"*.

### 5.6 Provisioning

| Veld | Waarde | Betekenis |
|---|---|---|
| `ProvItemType` | `ROL` | rol (geverifieerd) |
| `ProvAction` | `006` | Toewijzen (geverifieerd) |

### 5.7 Connectoren

Waargenomen in zoekresultaten: `V4DCLNT100` (S/4 dev), `GRDCLNT100` en `GRPCLNT100` (GRC zelf),
`EDVCLNT100`, `EQVCLNT100`, `C4C_DEV`, `AD_PILOT`, `LDAP_PRD`, `SFDCLNTT1X`.

Landschap bij S/4: `BRM_S4_LG` ("S/4 straat").

---

## 6. API van de connector

| Route | Doel |
|---|---|
| `GET /api/health` | Configuratie, services, TLS- en identiteitsstatus |
| `GET /api/me` | Wie de server als aanvrager gebruikt, en hoe dat is vastgesteld |
| `POST /api/roles/search` | `{ searchTerm?, functionalArea?, businessProcess?, subProcess?, system?, roleType?, roleOwner? }` |
| `POST /api/requests` | Access request indienen |
| `GET /api/requests/:nr/status` | Status |
| `GET /api/requests/:nr` | Details |
| `GET /api/lookup?lists=…` | Waardelijsten |
| `GET /api/debug/wsdl?service=…` | WSDL ophalen (alleen met debug aan) |
| `POST /api/debug/soap` | Vrije SOAP-call om formaatvarianten te proberen |

`requesterId` wordt **genegeerd** als de browser het meestuurt; de server bepaalt de aanvrager
zelf. Anders kan iedereen die de API bereikt indienen namens een collega.

---

## 7. Configuratie

Alles via environment variables; zie `.env.example`.

| Variabele | Betekenis |
|---|---|
| `GRC_BASE_URL`, `GRC_CLIENT` | Systeem en client |
| `GRC_USERNAME`, `GRC_PASSWORD` | Service-account |
| `GRC_TLS_CA_FILE`, `GRC_TLS_INSECURE` | Certificaatvalidatie |
| `GRC_EP_*` | Endpointpaden uit SOAMANAGER |
| `GRC_WSDL_PREFIX` | Prefix voor de WSDL-URL |
| `GRC_REQ_TYPE`, `GRC_REQ_PRIORITY`, `GRC_PROV_ITEM_TYPE`, `GRC_PROV_ACTION` | Standaard codewaarden |
| `AUTH_MODE`, `AUTH_HEADER`, `AUTH_TRUSTED_PROXIES`, `LOCAL_USER_ID` | Identiteit |
| `ENABLE_DEBUG_ENDPOINTS` | Debugroutes aan of uit |

---

## 8. Bekend gedrag en valkuilen

- **Een nieuwe aanvraag is niet meteen op te vragen.** Direct na indienen geeft de statusservice
  *"Ongeldig aanvraagnr."* voor een nummer dat GRC net zelf teruggaf. Later bestaat hij wel.
- **Het preapproved-pad maakt gebruikers aan** die nog niet op de connector bestaan. Een aanvraag
  voor een verzonnen gebruikers-ID levert een echte gebruiker op.
- **UI en webservice hanteren verschillende regels.** Prioriteit is via de EUP-instelling uit het
  scherm gehaald en niet verplicht, waarna GRC intern `000` opslaat — precies de waarde die de
  webservice weigert.
- **Zoeken op alleen jokertekens** (`**`) vraagt om alle rollen en loopt in de time-out van
  30 seconden. De connector eist minstens twee tekens die geen `*` zijn.
- **Autorisatie faalt stil.** Ontbrekende leesrechten leveren lege lijsten op zonder foutmelding,
  niet een 403. Zie de lookup-service.

### Foutmeldingen

| Melding | Betekenis |
|---|---|
| `Hostnaam niet gevonden` | Citrix Secure Access staat niet aan |
| HTTP 401 | Wachtwoord fout of account geblokkeerd |
| HTTP 403 / `Bevoegdheid ontbreekt voor service` | `S_SERVICE`-autorisatie ontbreekt |
| HTTP 404 | Binding niet gepubliceerd, of pad klopt niet |
| `WSP Exception … config key` | Verkeerde WSDL-URL |
| `Ongeldige invoer of geen geg. beschikb.` | Filterwaarde bestaat, maar er hangen geen rollen aan |
| `Ongeldig aanvraagnr.` vlak na indienen | Nog niet verwerkt; later wel op te vragen |

---

## 9. Wat nog niet vastligt

- **Prioriteiten per aanvraagsoort.** Alleen de combinatie `029` + `010` is bewezen. Welke
  prioriteiten bij welke soort horen is niet uitgezocht.
- **Aanvraagsoorten `001`–`027`** zijn niet getest. `001` maakt een gebruiker aan in plaats van
  een rol toe te wijzen — voorzichtig mee zijn.
- **`SubProcess`** is als zoekveld beschikbaar maar niet getest; de codelijst ontbreekt.
- **Productie-GRC** (`grc.vitens.lan`) is nooit benaderd. Endpointpaden, sleutel in het
  WSDL-prefix en codewaarden kunnen daar afwijken.
