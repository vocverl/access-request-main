# Van PoC naar productie — Access Request Portal

> Stand van 18 augustus 2026. Technische naslag over de GRC-koppeling zelf staat in
> [`server/README.md`](../server/README.md).

Een werkende koppeling met SAP GRC is er. Wat er niet is: alles wat een tweede gebruiker,
een tweede ontwikkelaar en een auditor nodig hebben.

## Wat de PoC heeft bewezen — en wat niet

**Bewezen.** Het SOAP-contract met GRC klopt. Zoeken, indienen, status en details werken alle
vier tegen GRD. Aanvraag 15328 is via de app aangemaakt én uitgevoerd; de rol is toegewezen op
`V4DCLNT100`. Protocol, veldvolgorde en codewaarden zijn geverifieerd tegen de echte WSDL, niet
tegen documentatie.

**Niet bewezen.** Dat het veilig is, dat het meerdere gebruikers aankan, dat het zich netjes
gedraagt als GRC traag is of plat ligt, en dat een tweede ontwikkelaar erin kan werken zonder de
hele geschiedenis te kennen.

| | |
|---|---|
| Regels `index.html` | 3358, waarvan 1817 inline JavaScript in één `<script>` |
| Functies in dat ene bestand | 55 |
| Serverside code | ~1400 regels, 2 npm-afhankelijkheden |
| Unittests | 16 |
| Integratietests | 0 |

Twee afhankelijkheden is een pluspunt: weinig aanvalsoppervlak, weinig onderhoud. Nul
integratietests is het grootste gat — alle kennis over hoe GRC zich gedraagt zit in commentaar en
commits, niet in iets dat afgaat als het verandert.

## De beslissing die alles bepaalt

GRC staat on-prem achter Citrix. Waar de netwerkgrens valt, stuurt de hele architectuur.

| Optie | Frontend | Connector | Netwerkgrens | Oordeel |
|---|---|---|---|---|
| **A** | on-prem | on-prem | geen | werkt, maar het dev team werkt niet waar het thuis is |
| **B** | AWS (S3 + CloudFront) | on-prem | tussen browser en connector | **aanbevolen tussenstap** |
| **C** | AWS | AWS (ECS/Lambda) | tussen connector en GRD, over VPN | eindbeeld |

**B** laat het team meteen in AWS werken aan wat het kent — statische hosting, CI/CD, CloudFront —
terwijl het SAP-verkeer binnen het netwerk blijft waar het nu ook al is. Dat vermijdt de discussie
over een tunnel op het moment dat je nog niets bewezen hebt.

**C** is beter op termijn maar hangt op iets waar het dev team niet over gaat: een Site-to-Site
VPN of Direct Connect naar het datacenter, met firewallregels naar `grc-dev.vitens.lan` en later
productie. Begin dat gesprek vroeg; het is meestal de langste doorlooptijd.

De connector is bewust saai: Node, Express, één externe library voor XML, geen state, geen
database. Stateless, dus ECS Fargate en Lambda achter API Gateway zijn allebei prima. Kies op
basis van de VPN-eis en koude start, niet op basis van de app.

## Vijf gaten tussen nu en productie

| Onderwerp | Nu | Nodig | Ernst |
|---|---|---|---|
| **Identiteit** | Vaste gebruiker uit `.env`; iedereen die de API bereikt is die gebruiker | Entra ID via ALB/OIDC of Cognito. De connector heeft er een haak voor: `AUTH_MODE=header` met vertrouwde-proxy-lijst | Blokkerend |
| **Geheimen** | Wachtwoord GRC-service-account in `.env` | Secrets Manager met rotatie. Code leest alles al uit environment variables | Blokkerend |
| **TLS** | `GRC_TLS_INSECURE=true`, certificaten niet gevalideerd | Interne Vitens-root-CA in de truststore; `scripts/build-ca-bundle.mjs` controleert de keten | Blokkerend |
| **Testen** | 16 unittests op pure functies, niets dat GRC raakt | Contracttests tegen opgenomen WSDL-fixtures plus een rooktest tegen GRD in de pipeline | Groot risico |
| **Waarneembaarheid** | `console.log`, geen correlatie, geen metrics, geen alerting | Gestructureerde logs met een request-id dat meereist naar GRC; alerting op foutratio en latency | Groot risico |

### Waar het meest voor te waken

Deze applicatie kende drie keer een fout die zich voordeed als een normaal antwoord:

1. Een zoekopdracht die "geen resultaten" meldde terwijl de verbinding stuk was
2. Een indiening die "geen verbinding" zei ongeacht wat GRC antwoordde
3. Een knop die niets deed, zonder enige melding

Alle drie gevonden door te klikken, geen enkele door een test. In een access-managementtool is dat
de gevaarlijkste soort bug: iemand denkt toegang te hebben aangevraagd terwijl er niets gebeurde,
of andersom. Maak **"een fout mag nooit als geruststelling verschijnen"** een expliciete
review-regel.

## De route

### Fase 1 — Fundament, zonder één feature toe te voegen

- Echte SSO via Entra ID, met de bestaande `AUTH_MODE=header`-haak
- Geheimen naar Secrets Manager
- Interne CA in de truststore, `GRC_TLS_INSECURE` eruit
- Pipeline: lint, test, build, deploy naar een omgeving

### Fase 2 — De GRC-kennis vastleggen in code

Het meest onderschatte werk en het meest waardevolle. Commentaar gaat niet af als iemand een
binding verandert.

- Contracttests met opgenomen SOAP-antwoorden als fixture
- Hardgecodeerde codelijsten (`GRC_FUNCTIEGEBIEDEN`, `GRC_BEDRIJFSPROCESSEN`) vervangen door
  `GRAC_LOOKUP_WS` — vraagt één autorisatie op de configuratietabellen voor het service-account
- Rooktest tegen GRD vóór elke release

### Fase 3 — De frontend uit elkaar trekken

Ná fase 1 en 2, niet ervoor: een herbouw zonder contracttests is een herbouw zonder vangnet.

- Modules en een build-stap; framework alleen als het team er al een gebruikt
- Branding via runtime-configuratie in plaats van een branch per klant. De huidige
  `main`/`profilus`/`vitens`-structuur vraagt bij elke wijziging drie merges en heeft al twee keer
  een conflict opgeleverd

### Fase 4 — Productiewaardig gedrag

- Eigen audit trail: wie vroeg wat aan, wanneer, met welk resultaat. GRC houdt zijn eigen log bij,
  maar niet wat er in het portaal gebeurde
- Nette afhandeling van trage of onbereikbare GRC; met een timeout van 30 seconden is een
  wachtrij of achtergrondverwerking het overwegen waard
- Toegang tot productie-GRC, met een apart service-account en eigen autorisaties

## Overdracht: wat GRC anders doet dan je verwacht

- **De WSDL zit niet op `?wsdl`.** Die geeft een misleidende fout over een "config key" die op een
  kapotte binding lijkt. De echte URL staat in SOAMANAGER, met een per-systeem gegenereerde sleutel.
- **Alle vijf operatienamen wijken af** van wat de SAP-note suggereert. Haal ze uit de WSDL.
- **Codes zijn driecijferig.** `029` werkt, `29` geeft "ongeldig aanvraagtype".
- **De veldvolgorde is bindend** en geen enkel veld binnen die structuren is optioneel. Een veld
  weglaten is iets anders dan het leeg meesturen.
- **Een nieuwe aanvraag is niet meteen op te vragen.** Direct na indienen geeft de statusservice
  "ongeldig aanvraagnummer" voor een nummer dat GRC net zelf teruggaf. Later bestaat hij wel.
- **Het preapproved-pad maakt gebruikers aan** die nog niet op de connector bestaan.
- **UI en webservice hanteren verschillende regels.** Prioriteit is in het scherm verwijderd en
  niet verplicht, waarna GRC intern `000` opslaat — precies de waarde die de webservice weigert.

## Wat niet te doen

- **Niet herbouwen omdat het een PoC heet.** De connector is klein, saai en geverifieerd tegen het
  echte systeem. Vervangen betekent alle bovenstaande valkuilen opnieuw ontdekken.
- **Geen microservices.** Eén integratie met één systeem. Een tweede service levert netwerkgrenzen
  en deployment-volgorde op zonder dat er iets te ontkoppelen valt.
- **Niet eerst mooi maken.** Zolang de identiteit uit een `.env`-bestand komt en TLS-validatie uit
  staat, is een mooiere zoekbalk niet waar het risico zit.

## Eerste gesprek

Twee vragen bepalen het meeste, en beide hangen op mensen buiten het dev team:

1. Wie regelt de netwerkverbinding tussen AWS en het Vitens-datacenter?
2. Welk identity-platform is de standaard?

Beide blokkeren fase 1. De rest is werk dat het team zelf kan plannen.
