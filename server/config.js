/**
 * Configuratie van de GRC-connector.
 *
 * Alles komt uit environment variables. Daardoor draait dezelfde code lokaal
 * op de Mac en later ongewijzigd op een server - je verandert alleen .env.
 */
import fs from 'node:fs';
import path from 'node:path';

function str(name, fallback = '') {
    const value = process.env[name];
    return value === undefined ? fallback : value.trim();
}

function num(name, fallback) {
    const raw = str(name);
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function bool(name) {
    return str(name).toLowerCase() === 'true';
}

// Fouten bij het lezen van de CA laten we het proces niet slopen: dan kan
// /api/health nog vertellen wat er mis is.
let caError = null;

function loadCa(file) {
    if (!file) return undefined;
    try {
        return fs.readFileSync(path.resolve(file));
    } catch (err) {
        caError = `GRC_TLS_CA_FILE kon niet gelezen worden: ${err.message}`;
        return undefined;
    }
}

export const config = {
    port: num('PORT', 8086),

    // Uitsluitend localhost. Dit proces heeft een service account met toegang
    // tot GRD in handen; dat mag niet vanaf het netwerk bereikbaar zijn.
    host: '127.0.0.1',

    debugEndpoints: bool('ENABLE_DEBUG_ENDPOINTS'),

    grc: {
        baseUrl: str('GRC_BASE_URL').replace(/\/+$/, ''),
        client: str('GRC_CLIENT'),
        username: str('GRC_USERNAME'),
        // Niet trimmen: leidende of volgende spaties kunnen deel van het
        // wachtwoord zijn.
        password: process.env.GRC_PASSWORD ?? '',
        timeoutMs: num('GRC_TIMEOUT_MS', 30000),
        tls: {
            ca: loadCa(str('GRC_TLS_CA_FILE')),
            insecure: bool('GRC_TLS_INSECURE')
        }
    },

    // Paden uit SOAMANAGER ("Berekende toegangs-URL", alleen het pad).
    endpoints: {
        searchRoles: str('GRC_EP_SEARCH_ROLES'),
        userAccess: str('GRC_EP_USER_ACCESS'),
        requestStatus: str('GRC_EP_REQUEST_STATUS'),
        requestDetails: str('GRC_EP_REQUEST_DETAILS')
    },

    // Operatienamen uit de WSDL. Zie server/grc/services.js.
    operations: {
        searchRoles: str('GRC_OP_SEARCH_ROLES'),
        userAccess: str('GRC_OP_USER_ACCESS'),
        requestStatus: str('GRC_OP_REQUEST_STATUS'),
        requestDetails: str('GRC_OP_REQUEST_DETAILS')
    }
};

/**
 * Wat er nog ontbreekt voordat de connector echt kan praten met GRD.
 * Lege lijst = klaar voor gebruik.
 */
export function configProblems() {
    const problems = [];

    if (!config.grc.baseUrl) problems.push('GRC_BASE_URL ontbreekt');
    if (!config.grc.client) problems.push('GRC_CLIENT ontbreekt');
    if (!config.grc.username) problems.push('GRC_USERNAME ontbreekt');
    if (!config.grc.password) problems.push('GRC_PASSWORD ontbreekt');

    if (caError) problems.push(caError);

    if (!config.grc.tls.ca && !config.grc.tls.insecure) {
        problems.push(
            'Geen GRC_TLS_CA_FILE ingesteld. Node vertrouwt de interne Vitens-CA ' +
            'niet, dus TLS zal falen. Zet GRC_TLS_INSECURE=true om validatie ' +
            'tijdelijk uit te schakelen.'
        );
    }

    return problems;
}

/** Welke endpoints al gevuld zijn - handig voor /api/health. */
export function endpointStatus() {
    return Object.fromEntries(
        Object.entries(config.endpoints).map(([key, value]) => [key, Boolean(value)])
    );
}
