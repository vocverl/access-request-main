/**
 * SOAP-envelopes bouwen.
 *
 * Bewust met de hand in plaats van via een WSDL-bibliotheek: we weten het
 * exacte berichtformaat nog niet, en handmatige XML is makkelijker te
 * inspecteren en bij te stellen dan een gegenereerde client.
 */

/** Maakt tekst veilig voor XML. */
export function escapeXml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Zet een veldstructuur om naar XML.
 *
 * - primitieve waarde  -> <Naam>waarde</Naam>
 * - object             -> <Naam>...genest...</Naam>
 * - array              -> <Naam> per element herhaald
 * - null of undefined  -> overgeslagen
 */
export function fieldsToXml(fields, indent = '            ') {
    if (!fields || typeof fields !== 'object') return '';

    const lines = [];

    for (const [name, value] of Object.entries(fields)) {
        if (value === null || value === undefined) continue;

        if (Array.isArray(value)) {
            for (const entry of value) {
                lines.push(renderNode(name, entry, indent));
            }
        } else {
            lines.push(renderNode(name, value, indent));
        }
    }

    return lines.filter(Boolean).join('\n');
}

function renderNode(name, value, indent) {
    if (value === null || value === undefined) return '';

    if (typeof value === 'object') {
        const inner = fieldsToXml(value, indent + '    ');
        if (!inner) return `${indent}<${name}/>`;
        return `${indent}<${name}>\n${inner}\n${indent}</${name}>`;
    }

    return `${indent}<${name}>${escapeXml(value)}</${name}>`;
}

/**
 * Bouwt een complete SOAP 1.1 envelope.
 */
export function buildEnvelope({ namespace, operation, fields }) {
    if (!operation) {
        throw new Error('buildEnvelope: operation is verplicht');
    }

    const body = fieldsToXml(fields);
    const inner = body ? `\n${body}\n        ` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="${namespace}">
    <soapenv:Header/>
    <soapenv:Body>
        <urn:${operation}>${inner}</urn:${operation}>
    </soapenv:Body>
</soapenv:Envelope>`;
}

/** Datum naar het formaat dat SAP verwacht (YYYY-MM-DD). */
export function toSapDate(value) {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString().slice(0, 10);

    const text = String(value).trim();

    // DD-MM-YYYY (zoals de UI het toont) omzetten naar YYYY-MM-DD
    const dutch = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dutch) return `${dutch[3]}-${dutch[2]}-${dutch[1]}`;

    return text;
}
