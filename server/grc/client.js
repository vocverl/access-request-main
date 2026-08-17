/**
 * HTTPS-transport naar GRD.
 *
 * Gebruikt node:https in plaats van fetch omdat we volledige controle over TLS
 * nodig hebben: het certificaat van grc-dev is uitgegeven door de interne
 * Vitens-CA, die Node niet in zijn standaard truststore heeft.
 */
import https from 'node:https';
import { config } from '../config.js';
import { buildEnvelope } from './envelopes.js';
import { parseXml, findFault } from './parse.js';

const agent = new https.Agent({
    ca: config.grc.tls.ca,
    rejectUnauthorized: !config.grc.tls.insecure,
    keepAlive: true
});

if (config.grc.tls.insecure) {
    console.warn(
        '[grc] WAARSCHUWING: GRC_TLS_INSECURE=true - certificaten worden niet ' +
        'gevalideerd. Alleen acceptabel voor lokaal testen.'
    );
}

function authHeader() {
    const raw = `${config.grc.username}:${config.grc.password}`;
    return `Basic ${Buffer.from(raw, 'utf8').toString('base64')}`;
}

/** Plakt sap-client achter het pad, zodat we op de juiste client landen. */
function withClient(pathname) {
    if (!config.grc.client) return pathname;
    const separator = pathname.includes('?') ? '&' : '?';
    return `${pathname}${separator}sap-client=${encodeURIComponent(config.grc.client)}`;
}

/**
 * Rauwe HTTPS-request naar GRD. Resolved ook bij een 4xx of 5xx: de
 * aanroeper beslist wat een fout is, want SAP stopt nuttige informatie in
 * de body van een 500.
 */
export function request({ path, method = 'GET', headers = {}, body = null, timeoutMs }) {
    if (!config.grc.baseUrl) {
        return Promise.reject(
            Object.assign(new Error('GRC_BASE_URL is niet ingesteld'), { statusCode: 503 })
        );
    }

    const url = new URL(withClient(path), config.grc.baseUrl);
    const timeout = timeoutMs ?? config.grc.timeoutMs;
    const startedAt = process.hrtime.bigint();

    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method,
                agent,
                headers: {
                    Authorization: authHeader(),
                    Accept: 'text/xml, application/xml, */*',
                    ...headers,
                    ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {})
                }
            },
            (res) => {
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
                    console.log(
                        `[grc] ${method} ${url.pathname} -> ${res.statusCode} ` +
                        `(${Math.round(durationMs)}ms)`
                    );
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: Buffer.concat(chunks).toString('utf8'),
                        durationMs
                    });
                });
            }
        );

        req.setTimeout(timeout, () => {
            req.destroy(
                Object.assign(
                    new Error(`GRD antwoordde niet binnen ${timeout}ms`),
                    { statusCode: 504 }
                )
            );
        });

        req.on('error', (err) => reject(translateNetworkError(err)));

        if (body) req.write(body);
        req.end();
    });
}

/** Netwerk- en TLS-fouten omzetten naar iets waar je wat aan hebt. */
function translateNetworkError(err) {
    const hints = {
        ENOTFOUND:
            'Hostnaam niet gevonden. Staat de Citrix Secure Access-verbinding aan?',
        ECONNREFUSED: 'Verbinding geweigerd - draait de service op deze poort?',
        ETIMEDOUT: 'Time-out bij het opzetten van de verbinding.',
        UNABLE_TO_VERIFY_LEAF_SIGNATURE:
            'Het certificaat van GRD is niet te valideren. Zet de interne ' +
            'Vitens-CA in GRC_TLS_CA_FILE.',
        SELF_SIGNED_CERT_IN_CHAIN:
            'Zelfgetekend certificaat in de keten. Zet de interne Vitens-CA ' +
            'in GRC_TLS_CA_FILE.',
        DEPTH_ZERO_SELF_SIGNED_CERT:
            'Zelfgetekend certificaat. Zet de interne Vitens-CA in GRC_TLS_CA_FILE.'
    };

    const hint = hints[err.code];
    if (hint) {
        return Object.assign(new Error(`${hint} (${err.code})`), {
            statusCode: 502,
            cause: err
        });
    }

    return Object.assign(err, { statusCode: err.statusCode ?? 502 });
}

/**
 * Voert een SOAP-call uit tegen een van de GRC-services.
 *
 * Geeft altijd de rauwe XML terug: zolang we het berichtformaat aan het
 * uitvogelen zijn, is dat het enige waar je echt op kunt varen.
 */
export async function soapCall({ service, fields }) {
    const xml = buildEnvelope({
        namespace: service.namespace,
        operation: service.operation,
        fields
    });

    const response = await request({
        path: service.endpoint,
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: `"${service.operation}"`
        },
        body: xml
    });

    const result = {
        status: response.status,
        durationMs: response.durationMs,
        requestXml: xml,
        responseXml: response.body,
        doc: null,
        fault: null
    };

    // 401/403/404 hebben zelden een SOAP-body; die vertalen we direct.
    if (response.status === 401) {
        throw Object.assign(
            new Error(
                `GRD weigert de login van ${config.grc.username}. Controleer het ` +
                `wachtwoord in .env en of het account niet geblokkeerd is.`
            ),
            { statusCode: 401, details: result }
        );
    }

    if (response.status === 403) {
        throw Object.assign(
            new Error(
                `${config.grc.username} mag deze service niet aanroepen. Meestal ` +
                `ontbreekt een autorisatie (S_SERVICE) op GRD.`
            ),
            { statusCode: 403, details: result }
        );
    }

    if (response.status === 404) {
        throw Object.assign(
            new Error(
                `Endpoint niet gevonden: ${service.endpoint}. Is de binding voor ` +
                `${service.definition} gepubliceerd in SOAMANAGER, en klopt het pad ` +
                `in .env?`
            ),
            { statusCode: 404, details: result }
        );
    }

    try {
        result.doc = parseXml(response.body);
    } catch (err) {
        throw Object.assign(
            new Error(`Antwoord van GRD is geen geldige XML: ${err.message}`),
            { statusCode: 502, details: result }
        );
    }

    result.fault = findFault(result.doc);

    if (result.fault) {
        throw Object.assign(
            new Error(`SOAP Fault van GRD: ${result.fault.message}`),
            { statusCode: 502, details: result }
        );
    }

    if (response.status >= 400) {
        throw Object.assign(
            new Error(`GRD antwoordde met HTTP ${response.status}`),
            { statusCode: 502, details: result }
        );
    }

    return result;
}

/**
 * Haalt de WSDL van een service op. Onmisbaar om het formaat te bepalen.
 *
 * Let op de URL-vorm: deze SAP-versie serveert de WSDL niet op
 * "<endpoint>?wsdl" - dat geeft een "config key"-fout - maar achter het
 * prefix uit SOAMANAGER, met het endpointpad erachter geplakt.
 */
export function fetchWsdl(service) {
    const path = config.wsdlPrefix
        ? `${config.wsdlPrefix}${service.endpoint}`
        : `${service.endpoint}?wsdl`;

    return request({ path, method: 'GET' });
}
