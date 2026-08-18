/**
 * Access Request Portal - server.
 *
 * Doet twee dingen:
 *   1. de statische app uitleveren (index.html en vrienden)
 *   2. een JSON-API aanbieden die intern met GRD praat via SOAP
 *
 * Punt 1 en 2 op dezelfde origin zetten is precies waarom dit bestaat: de
 * browser ziet geen cross-origin request meer, dus CORS speelt geen rol.
 * En het service account blijft in dit proces, buiten bereik van de browser.
 */
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config, configProblems, endpointStatus } from './config.js';
import { resolveUser, describeAuth } from './auth.js';
import { getService, describeServices, SERVICE_KEYS } from './grc/services.js';
import { soapCall, fetchWsdl, request as grcRequest } from './grc/client.js';
import { collectNodes, firstValue, describeShape } from './grc/parse.js';
import { toSapDate } from './grc/envelopes.js';
import {
    REQUEST_HEADER_FIELDS,
    LINE_ITEM_FIELDS,
    USER_INFO_FIELDS,
    LOOKUP_FLAGS,
    LOOKUP_FIELD_ORDER,
    inSchemaOrder
} from './grc/schema.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

const app = express();
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------- API ------

app.get('/api/health', (req, res) => {
    const problems = configProblems();
    res.json({
        ok: problems.length === 0,
        problems,
        grc: {
            baseUrl: config.grc.baseUrl || null,
            client: config.grc.client || null,
            username: config.grc.username || null,
            tlsValidation: config.grc.tls.insecure ? 'UITGESCHAKELD' : 'aan',
            caLoaded: Boolean(config.grc.tls.ca)
        },
        endpoints: endpointStatus(),
        services: describeServices(),
        auth: describeAuth(),
        debugEndpoints: config.debugEndpoints
    });
});

/**
 * Wie ben ik volgens de connector?
 *
 * De pagina vult hiermee het blok Gebruikersinformatie. Belangrijker: dit is
 * ook wat de server als aanvrager gebruikt - de browser mag dat niet bepalen.
 */
app.get('/api/me', (req, res) => {
    const gebruiker = resolveUser(req);

    res.json({
        userId: gebruiker.userId,
        source: gebruiker.source,
        trusted: gebruiker.trusted,
        reason: gebruiker.reason
    });
});

/**
 * Rollen zoeken.
 *
 * Body: { searchTerm, system?, roleType?, businessProcess?, roleOwner?,
 *         connectorGroup?, landscape?, language? }
 *
 * Het veldenschema komt uit de WSDL van GRAC_SEARCH_ROLES_WS: alle velden zijn
 * optioneel en werken als filter. Er is geen algemeen zoekveld - een zoekterm
 * gaat dus op RoleName, waar SAP het jokerteken * accepteert.
 */
app.post('/api/roles/search', async (req, res, next) => {
    try {
        const {
            searchTerm,
            system,
            roleType,
            businessProcess,
            subProcess,
            functionalArea,
            roleOwner,
            connectorGroup,
            landscape,
            language
        } = req.body ?? {};

        // Zoeken op alleen een filter is legitiem: "alle rollen van
        // functiegebied FM" is een zinnige vraag zonder zoekterm.
        const heeftFilter = Boolean(
            businessProcess || subProcess || functionalArea || roleOwner || system
        );

        // Minimaal twee tekens die geen jokerteken zijn. "**" telt anders mee
        // als geldige zoekterm, en dat vraagt GRC om alles: die zoekopdracht
        // loopt gegarandeerd in de time-out van 30 seconden.
        const betekenisvol = String(searchTerm ?? '').replace(/[*\s]/g, '');

        if (!heeftFilter && betekenisvol.length < 2) {
            return res.status(400).json({
                error:
                    'Geef minstens twee letters om op te zoeken, of kies een ' +
                    'filter. Alleen jokertekens vraagt om alle rollen tegelijk, ' +
                    'en daar komt geen antwoord op binnen de tijd.'
            });
        }

        // GRC doet geen impliciete jokertekens: zoeken op "servicedesk" levert
        // niets op, terwijl "*servicedesk*" de rol FR:V_ICT_MDW_SERVICEDESK
        // vindt. Wie zelf een * meegeeft houdt de controle.
        const ruwe = String(searchTerm ?? '').trim();
        const zoekterm = ruwe
            ? (ruwe.includes('*') ? ruwe : `*${ruwe}*`)
            : undefined;

        const service = getService('searchRoles');
        const result = await soapCall({
            service,
            fields: {
                RoleName: zoekterm,
                System: system || undefined,
                RoleType: roleType || undefined,
                BusinessProcess: businessProcess || undefined,
                SubProcess: subProcess || undefined,
                FunctionalArea: functionalArea || undefined,
                RoleOwner: roleOwner || undefined,
                ConnectorGroup: connectorGroup || undefined,
                Landscape: landscape || undefined,
                Language: language || undefined
            }
        });

        // Altijd null in plaats van undefined: een ontbrekend veld moet een
        // lege waarde worden, geen verdwenen sleutel. Anders moet elke
        // consument op afwezigheid controleren in plaats van op leegte.
        const items = collectNodes(result.doc, 'item');
        const roles = items.map((item) => ({
            roleName: firstValue(item, ['RoleName']) ?? null,
            roleDescription: firstValue(item, ['RoleDesc']) ?? null,
            system: firstValue(item, ['System']) ?? null,
            roleType: firstValue(item, ['RoleType']) ?? null,
            roleTypeDescription: firstValue(item, ['RoleTypeDesc']) ?? null,
            landscape: firstValue(item, ['Landscape']) ?? null,
            landscapeDescription: firstValue(item, ['LandscapeDesc']) ?? null,
            roleOwner: firstValue(item, ['RoleOwner']) ?? null
        }));

        // MsgReturn vertelt of GRC iets te melden had, ook bij nul resultaten.
        const message = {
            number: firstValue(result.doc, ['MsgNo']) ?? null,
            type: firstValue(result.doc, ['MsgType']) ?? null,
            text: firstValue(result.doc, ['MsgStatement']) ?? null
        };

        res.json(withDebug({ roles, count: roles.length, message }, result));
    } catch (err) {
        next(err);
    }
});

/**
 * Access request indienen.
 * Body: { requesterId, userId?, roles: [{ roleName, system? }], validFrom?,
 *         validTo?, justification, refTicketNo? }
 */
app.post('/api/requests', async (req, res, next) => {
    try {
        const {
            userId,
            roles,
            validFrom,
            validTo,
            justification: rawJustification,
            refTicketNo,
            email,
            firstName,
            lastName,
            department,
            manager,
            managerEmail,
            requestType,
            priority,
            dueDate,
            initSystem
        } = req.body ?? {};

        // GracSWsReqhdr heeft geen veld voor een extern ticketnummer. De
        // referentie hoort wel bij de aanvraag, dus die zetten we voor de
        // reden - daar is hij zichtbaar voor iedere goedkeurder.
        const justification = refTicketNo
            ? `[${refTicketNo}] ${rawJustification ?? ''}`.trim()
            : rawJustification;

        // De aanvrager komt van de server, niet uit de body. Zou de browser dat
        // mogen bepalen, dan kan iedereen die deze API bereikt een aanvraag
        // indienen namens een willekeurige collega.
        const gebruiker = resolveUser(req);

        if (!gebruiker.userId) {
            return res.status(401).json({
                error: `Aanvrager niet vast te stellen. ${gebruiker.reason}`,
                auth: { source: gebruiker.source, trusted: gebruiker.trusted }
            });
        }

        const requesterId = gebruiker.userId;

        const missing = [];
        if (!Array.isArray(roles) || roles.length === 0) missing.push('roles');
        // Op rawJustification controleren, niet op justification: die laatste
        // is altijd gevuld zodra er een ticketnummer is meegegeven.
        if (!rawJustification) missing.push('justification');

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Verplichte velden ontbreken: ${missing.join(', ')}`
            });
        }

        const defaults = config.requestDefaults;
        const service = getService('userAccess');

        // Volgorde en volledigheid komen uit schema.js - zie de toelichting
        // daar waarom lege velden wel meegestuurd moeten worden.
        const result = await soapCall({
            service,
            fields: {
                RequestHeaderData: inSchemaOrder(REQUEST_HEADER_FIELDS, {
                    // ?? en niet ||: een expliciet meegegeven lege waarde is
                    // een keuze van de aanroeper, geen ontbrekende waarde.
                    Reqtype: requestType ?? defaults.requestType,
                    Priority: priority ?? defaults.priority,
                    ReqDueDate: toSapDate(dueDate),
                    ReqInitSystem:
                        initSystem || defaults.initSystem || roles[0]?.system,
                    Requestorid: requesterId,
                    Email: email,
                    RequestReason: justification
                }),
                RequestedLineItem: {
                    item: roles.map((role) =>
                        inSchemaOrder(LINE_ITEM_FIELDS, {
                            ItemName: role.roleName,
                            Connector: role.system,
                            ProvItemType: role.provItemType || defaults.provItemType,
                            ValidFrom: toSapDate(validFrom),
                            ValidTo: toSapDate(validTo),
                            Comments: role.comments,
                            ProvAction: role.provAction || defaults.provAction,
                            RoleType: role.roleType
                        })
                    )
                },
                UserInfo: {
                    item: inSchemaOrder(USER_INFO_FIELDS, {
                        Userid: userId || requesterId,
                        Fname: firstName,
                        Lname: lastName,
                        ValidFrom: toSapDate(validFrom),
                        ValidTo: toSapDate(validTo),
                        Email: email,
                        Department: department,
                        Manager: manager,
                        ManagerEmail: managerEmail
                    })
                }
            }
        });

        const requestNo = firstValue(result.doc, ['RequestNo']) ?? null;
        const requestId = firstValue(result.doc, ['RequestId']) ?? null;
        const message = {
            number: firstValue(result.doc, ['MsgNo']) ?? null,
            type: firstValue(result.doc, ['MsgType']) ?? null,
            text: firstValue(result.doc, ['MsgStatement']) ?? null
        };

        // GRC antwoordt met HTTP 200 ook als het de aanvraag heeft geweigerd;
        // dan komt de reden in MsgReturn en blijven de nummers leeg.
        if (!requestNo && !requestId) {
            return res.status(502).json(
                withDebug(
                    {
                        error:
                            message.text ||
                            'GRD gaf geen aanvraagnummer terug en ook geen reden.',
                        message,
                        shape: Object.fromEntries(describeShape(result.doc))
                    },
                    result,
                    true
                )
            );
        }

        res.json(withDebug({ requestNo, requestId, message }, result));
    } catch (err) {
        next(err);
    }
});

/**
 * Geldige waardelijsten opvragen bij GRC.
 *
 * Query: ?lists=priorityType,requestType  (komma-gescheiden, zie LOOKUP_FLAGS)
 *
 * Hiermee hoeven codewaarden niet geraden of hardgecodeerd te worden: GRC
 * vertelt zelf wat er in deze inrichting geldig is.
 */
app.get('/api/lookup', async (req, res, next) => {
    try {
        const gevraagd = String(req.query.lists ?? '')
            .split(',')
            .map((naam) => naam.trim())
            .filter(Boolean);

        const onbekend = gevraagd.filter((naam) => !(naam in LOOKUP_FLAGS));
        if (gevraagd.length === 0 || onbekend.length > 0) {
            return res.status(400).json({
                error:
                    onbekend.length > 0
                        ? `Onbekende lijst(en): ${onbekend.join(', ')}`
                        : 'Geef minstens een lijst op via ?lists=',
                beschikbaar: Object.keys(LOOKUP_FLAGS)
            });
        }

        // Volgorde aanhouden zoals in het schema. Language hoort ertussen: de
        // lijsten bestaan uit teksten, dus zonder taal heeft GRC niets terug
        // te geven.
        const taal = String(req.query.language ?? 'NL').trim();
        const wilElement = new Set(gevraagd.map((naam) => LOOKUP_FLAGS[naam]));

        const fields = {};
        for (const element of LOOKUP_FIELD_ORDER) {
            if (element === 'Language') fields.Language = taal;
            else if (wilElement.has(element)) fields[element] = 'X';
        }

        const service = getService('lookup');
        const result = await soapCall({ service, fields });

        // Elke lijst komt terug als <XxxList><item>...</item></XxxList>.
        const lijsten = {};
        for (const naam of gevraagd) {
            const wrapper = `${LOOKUP_FLAGS[naam]}List`;
            const knopen = collectNodes(result.doc, wrapper);
            lijsten[naam] = collectNodes(knopen, 'item').map((item) => ({
                code: firstValue(item, ['Id', 'Code', 'Key', 'Value']) ?? null,
                omschrijving: firstValue(item, ['Desc', 'Description', 'Text', 'Name']) ?? null,
                velden: Object.fromEntries(describeShape(item))
            }));
        }

        res.json(withDebug({ lijsten }, result));
    } catch (err) {
        next(err);
    }
});

/** Status van een aanvraag. */
app.get('/api/requests/:id/status', async (req, res, next) => {
    try {
        const service = getService('requestStatus');
        const result = await soapCall({
            service,
            fields: { ReqNo: req.params.id }
        });

        res.json(
            withDebug(
                {
                    requestNo: req.params.id,
                    status: firstValue(result.doc, ['Status', 'ReqStatus']) ?? null,
                    statusText: firstValue(result.doc, ['StatusText', 'Statustext']) ?? null,
                    message: {
                        number: firstValue(result.doc, ['MsgNo']) ?? null,
                        type: firstValue(result.doc, ['MsgType']) ?? null,
                        text: firstValue(result.doc, ['MsgStatement']) ?? null
                    },
                    // Zolang we geen echte statusrespons hebben gezien, geven
                    // we ook de veldnamen terug die GRC daadwerkelijk stuurde.
                    shape: Object.fromEntries(describeShape(result.doc))
                },
                result
            )
        );
    } catch (err) {
        next(err);
    }
});

/** Details van een aanvraag. */
app.get('/api/requests/:id', async (req, res, next) => {
    try {
        const service = getService('requestDetails');
        const result = await soapCall({
            service,
            fields: { RequestNumber: req.params.id }
        });

        res.json(
            withDebug(
                {
                    requestNo: req.params.id,
                    message: {
                        number: firstValue(result.doc, ['MsgNo']) ?? null,
                        type: firstValue(result.doc, ['MsgType']) ?? null,
                        text: firstValue(result.doc, ['MsgStatement']) ?? null
                    },
                    shape: Object.fromEntries(describeShape(result.doc))
                },
                result
            )
        );
    } catch (err) {
        next(err);
    }
});

// -------------------------------------------------------- ontwikkelhulp ----

if (config.debugEndpoints) {
    /** WSDL ophalen - hiermee bepalen we de echte operatienamen en velden. */
    app.get('/api/debug/wsdl', async (req, res, next) => {
        try {
            const key = String(req.query.service ?? '');
            if (!SERVICE_KEYS.includes(key)) {
                return res.status(400).json({
                    error: `Kies een service uit: ${SERVICE_KEYS.join(', ')}`
                });
            }

            const service = getService(key);
            const response = await fetchWsdl(service);

            res.status(response.status)
                .type(response.headers['content-type'] ?? 'text/plain')
                .send(response.body);
        } catch (err) {
            next(err);
        }
    });

    /** Vrije SOAP-call, om formaatvarianten uit te proberen. */
    app.post('/api/debug/soap', async (req, res, next) => {
        try {
            const { path: rawPath, xml, soapAction } = req.body ?? {};
            if (!rawPath || !xml) {
                return res.status(400).json({ error: 'path en xml zijn verplicht' });
            }

            const response = await grcRequest({
                path: rawPath,
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    SOAPAction: soapAction ? `"${soapAction}"` : '""'
                },
                body: xml
            });

            res.json({
                status: response.status,
                durationMs: Math.round(response.durationMs),
                headers: response.headers,
                body: response.body
            });
        } catch (err) {
            next(err);
        }
    });

    /** Rauwe GET, om te kijken wat er op een pad zit. */
    app.get('/api/debug/probe', async (req, res, next) => {
        try {
            const target = String(req.query.path ?? '/');
            const response = await grcRequest({ path: target, method: 'GET' });

            res.json({
                status: response.status,
                durationMs: Math.round(response.durationMs),
                headers: response.headers,
                bodyPreview: response.body.slice(0, 4000)
            });
        } catch (err) {
            next(err);
        }
    });
}

// ------------------------------------------------------- statische app -----

app.use(express.static(appRoot, { extensions: ['html'] }));

// ------------------------------------------------------ foutafhandeling ----

app.use((err, req, res, next) => {
    const status = err.statusCode ?? 500;

    // Niet loggen: het wachtwoord. Wel: alles wat helpt bij diagnose.
    console.error(`[api] ${req.method} ${req.path} -> ${status}: ${err.message}`);

    const payload = { error: err.message };

    if (config.debugEndpoints && err.details) {
        payload.debug = {
            grcStatus: err.details.status,
            requestXml: err.details.requestXml,
            responseXml: err.details.responseXml?.slice(0, 8000),
            fault: err.details.fault
        };
    }

    res.status(status).json(payload);
});

/** Voegt diagnose-informatie toe zolang de debugroutes aan staan. */
function withDebug(payload, result, always = false) {
    if (!config.debugEndpoints && !always) return payload;

    return {
        ...payload,
        debug: {
            grcStatus: result.status,
            durationMs: Math.round(result.durationMs),
            requestXml: result.requestXml,
            responseXml: result.responseXml?.slice(0, 8000)
        }
    };
}

// -------------------------------------------------------------- start ------

app.listen(config.port, config.host, () => {
    console.log(`\nAccess Request Portal -> http://${config.host}:${config.port}`);

    const problems = configProblems();
    if (problems.length === 0) {
        console.log('[config] compleet\n');
    } else {
        console.log('\n[config] nog te doen:');
        problems.forEach((problem) => console.log(`  - ${problem}`));
    }

    const zonderEndpoint = Object.entries(endpointStatus())
        .filter(([, configured]) => !configured)
        .map(([key]) => key);

    if (zonderEndpoint.length > 0) {
        console.log(`[config] endpoints nog leeg: ${zonderEndpoint.join(', ')}`);
    }

    console.log('');
});
