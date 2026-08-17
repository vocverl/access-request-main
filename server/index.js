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
import { getService, describeServices, SERVICE_KEYS } from './grc/services.js';
import { soapCall, fetchWsdl, request as grcRequest } from './grc/client.js';
import { collectNodes, firstValue, describeShape } from './grc/parse.js';
import { toSapDate } from './grc/envelopes.js';

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
        debugEndpoints: config.debugEndpoints
    });
});

/**
 * Rollen zoeken.
 * Body: { searchTerm, system?, roleType?, applicationDomain? }
 */
app.post('/api/roles/search', async (req, res, next) => {
    try {
        const { searchTerm, system, roleType, applicationDomain } = req.body ?? {};

        if (!searchTerm || String(searchTerm).trim().length < 2) {
            return res.status(400).json({
                error: 'searchTerm is verplicht en minimaal 2 tekens'
            });
        }

        const service = getService('searchRoles');
        const result = await soapCall({
            service,
            fields: {
                SearchString: String(searchTerm).trim(),
                System: system || undefined,
                RoleType: roleType || undefined,
                ApplicationDomain: applicationDomain || undefined
            }
        });

        // Zolang het antwoordformaat niet vaststaat, zoeken we op naam in de
        // hele boom in plaats van een vast pad te volgen.
        const items = collectNodes(result.doc, 'item');
        const roles = items.map((item) => ({
            roleName: firstValue(item, ['RoleName', 'RoleId', 'Roleid', 'ROLE_NAME']),
            roleDescription: firstValue(item, ['RoleDesc', 'RoleDescription', 'Description']),
            system: firstValue(item, ['System', 'ConnectorId', 'ConnectorGroup']),
            roleType: firstValue(item, ['RoleType', 'Type']),
            applicationDomain: firstValue(item, ['ApplicationDomain', 'BusinessProcess'])
        }));

        res.json(withDebug({ roles, count: roles.length }, result));
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
            requesterId,
            userId,
            roles,
            validFrom,
            validTo,
            justification,
            refTicketNo
        } = req.body ?? {};

        const missing = [];
        if (!requesterId) missing.push('requesterId');
        if (!Array.isArray(roles) || roles.length === 0) missing.push('roles');
        if (!justification) missing.push('justification');

        if (missing.length > 0) {
            return res.status(400).json({
                error: `Verplichte velden ontbreken: ${missing.join(', ')}`
            });
        }

        const service = getService('userAccess');
        const result = await soapCall({
            service,
            fields: {
                Requestheaderdata: {
                    Requestreason: justification,
                    Requesttype: '001',
                    Priority: '003',
                    Reqinitsystem: 'ACCESS_REQUEST_PORTAL',
                    Requestorid: requesterId,
                    Email: undefined,
                    Refnumber: refTicketNo || undefined
                },
                Userinfo: {
                    item: {
                        Userid: userId || requesterId,
                        Reqinitsystem: 'ACCESS_REQUEST_PORTAL'
                    }
                },
                Roleinfo: {
                    item: roles.map((role) => ({
                        Itemname: role.roleName,
                        Connector: role.system || undefined,
                        Provitemtype: 'ROL',
                        Provaction: '006',
                        Validfrom: toSapDate(validFrom),
                        Validto: toSapDate(validTo)
                    }))
                }
            }
        });

        const requestId = firstValue(result.doc, [
            'Requestno', 'RequestNo', 'RequestId', 'REQNO', 'Reqno'
        ]);

        if (!requestId) {
            return res.status(502).json(
                withDebug(
                    {
                        error:
                            'GRD gaf geen aanvraagnummer terug. Het berichtformaat wijkt ' +
                            'waarschijnlijk af van wat we versturen - vergelijk met de WSDL.',
                        shape: Object.fromEntries(describeShape(result.doc))
                    },
                    result,
                    true
                )
            );
        }

        res.json(withDebug({ requestId }, result));
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
            fields: { Requestno: req.params.id }
        });

        res.json(
            withDebug(
                {
                    requestId: req.params.id,
                    status: firstValue(result.doc, ['Status', 'Reqstatus', 'RequestStatus']),
                    statusText: firstValue(result.doc, ['Statustext', 'StatusText', 'Description']),
                    lastUpdated: firstValue(result.doc, ['Lastchanged', 'LastUpdated', 'Changedon'])
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
            fields: { Requestno: req.params.id }
        });

        res.json(
            withDebug(
                {
                    requestId: req.params.id,
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
