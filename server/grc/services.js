/**
 * De GRC-webservices die we gebruiken.
 *
 * De servicedefinities komen uit pakket GRAC_DIRECTORY_SERVICES op GRD
 * (transactie SE80). De endpointpaden komen uit SOAMANAGER en staan in .env.
 *
 * ONGEVERIFIEERD: de operatienamen en de namespace hieronder zijn een
 * onderbouwde gok. SAP publiceert via SOAMANAGER gegenereerde services
 * doorgaans in de mc-style namespace met CamelCase-operatienamen, maar dat
 * is per service niet hetzelfde. Controleer ze met:
 *
 *     GET /api/debug/wsdl?service=searchRoles
 *
 * en overschrijf zo nodig via GRC_OP_* in .env - dan hoeft er geen code aan.
 */
import { config } from '../config.js';

export const MC_STYLE_NS = 'urn:sap-com:document:sap:soap:functions:mc-style';

const DEFINITIONS = {
    searchRoles: {
        definition: 'GRAC_SEARCH_ROLES_WS',
        description: 'Rollen zoeken',
        defaultOperation: 'GracSearchRoles'
    },
    userAccess: {
        definition: 'GRAC_USER_ACCES_WS',
        description: 'Access request indienen',
        defaultOperation: 'GracIdmUserAccessWs'
    },
    requestStatus: {
        definition: 'GRAC_REQUEST_STATUS_WS',
        description: 'Status van een aanvraag',
        defaultOperation: 'GracRequestStatusWs'
    },
    requestDetails: {
        definition: 'GRAC_REQUEST_DETAILS_WS',
        description: 'Details van een aanvraag',
        defaultOperation: 'GracRequestDetailsWs'
    }
};

/** Alle servicekeys die we kennen. */
export const SERVICE_KEYS = Object.keys(DEFINITIONS);

/**
 * Haalt een service op, met endpoint en operatienaam zoals die nu geldig zijn.
 * Gooit een duidelijke fout als het endpoint nog niet in .env staat.
 */
export function getService(key) {
    const def = DEFINITIONS[key];
    if (!def) {
        throw Object.assign(new Error(`Onbekende service '${key}'`), { statusCode: 400 });
    }

    const endpoint = config.endpoints[key];
    if (!endpoint) {
        throw Object.assign(
            new Error(
                `Endpoint voor ${def.definition} is nog niet ingesteld. Publiceer de ` +
                `service in SOAMANAGER op GRD en zet het pad in .env.`
            ),
            { statusCode: 503 }
        );
    }

    return {
        key,
        definition: def.definition,
        description: def.description,
        endpoint,
        namespace: MC_STYLE_NS,
        operation: config.operations[key] || def.defaultOperation,
        operationConfirmed: Boolean(config.operations[key])
    };
}

/** Overzicht voor /api/health, zonder te gooien op ontbrekende endpoints. */
export function describeServices() {
    return SERVICE_KEYS.map((key) => ({
        key,
        definition: DEFINITIONS[key].definition,
        description: DEFINITIONS[key].description,
        endpointConfigured: Boolean(config.endpoints[key]),
        operation: config.operations[key] || DEFINITIONS[key].defaultOperation,
        operationConfirmed: Boolean(config.operations[key])
    }));
}
