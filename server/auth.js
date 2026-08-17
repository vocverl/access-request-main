/**
 * Wie zit er achter de browser?
 *
 * De connector doet zelf geen Kerberos of SAML, en dat is opzet. Echte SSO
 * termineer je in een webserver of proxy die daarvoor is ingericht, met een
 * service principal in AD. Deze module consumeert dat resultaat.
 *
 * Twee modi:
 *
 *   header - achter een SSO-proxy. Die zet de aangemelde gebruiker in een
 *            header. Dit is ALLEEN veilig als de proxy de enige route naar dit
 *            proces is: een header is triviaal te vervalsen door wie er
 *            rechtstreeks bij kan. Daarom moet je expliciet opgeven welke
 *            adressen je vertrouwt.
 *
 *   local  - ontwikkelmodus. Vaste gebruiker uit .env, want op een losse Mac
 *            is er geen proxy die iets kan vaststellen.
 *
 * De identiteit die hier uitkomt bepaalt de aanvrager van een access request.
 * Die mag nooit uit de browser komen: dan kan iedereen namens een collega
 * indienen.
 */
import os from 'node:os';
import { config } from './config.js';

/** VITENS\verloopv en verloopv@vitens.nl leveren allebei VERLOOPV op. */
export function normalizeUserId(raw) {
    if (!raw) return null;

    let naam = String(raw).trim();
    if (!naam) return null;

    const backslash = naam.lastIndexOf('\\');
    if (backslash >= 0) naam = naam.slice(backslash + 1);

    // Alles voor de apenstaart. Staat die vooraan, dan is er geen
    // gebruikersnaam en levert dat dus niets op - geen halve identiteit.
    const at = naam.indexOf('@');
    if (at >= 0) naam = naam.slice(0, at);

    return naam.trim().toUpperCase() || null;
}

/**
 * Stelt de gebruiker van dit verzoek vast.
 *
 * Geeft altijd een object terug, ook als er niets bekend is - dan is userId
 * null en vertelt 'reason' waarom. Stil terugvallen op een standaardgebruiker
 * zou erger zijn dan geen antwoord: dan dient iemand ongemerkt in onder een
 * verkeerde naam.
 */
export function resolveUser(req) {
    if (config.auth.mode === 'header') {
        const afzender = req.socket?.remoteAddress ?? '';

        if (!config.auth.trustedProxies.includes(afzender)) {
            return {
                userId: null,
                source: 'header',
                trusted: false,
                reason:
                    `Verzoek komt van ${afzender || 'onbekend adres'}, dat niet in ` +
                    `AUTH_TRUSTED_PROXIES staat. De identiteitsheader wordt genegeerd.`
            };
        }

        const userId = normalizeUserId(req.headers[config.auth.header]);

        if (!userId) {
            return {
                userId: null,
                source: 'header',
                trusted: true,
                reason:
                    `De proxy stuurde geen '${config.auth.header}'. Staat SSO daar aan?`
            };
        }

        return { userId, source: 'header', trusted: true, reason: null };
    }

    // Ontwikkelmodus.
    const ingesteld = normalizeUserId(config.auth.localUserId);

    if (!ingesteld) {
        return {
            userId: null,
            source: 'local',
            trusted: false,
            reason:
                'AUTH_MODE=local maar LOCAL_USER_ID is leeg. Zet je SAP-gebruikers-ID ' +
                'in .env, anders weet de connector niet wie de aanvrager is.'
        };
    }

    return {
        userId: ingesteld,
        source: 'local',
        trusted: false,
        reason: `Ontwikkelmodus: vaste gebruiker uit .env, niet vastgesteld via SSO.`
    };
}

/** Alleen voor /api/health: waar de connector zijn identiteit vandaan haalt. */
export function describeAuth() {
    return {
        mode: config.auth.mode,
        header: config.auth.mode === 'header' ? config.auth.header : null,
        trustedProxies: config.auth.trustedProxies,
        localUserId: config.auth.mode === 'local' ? config.auth.localUserId || null : null,
        hostUser: os.userInfo().username
    };
}
