/**
 * SOAP-antwoorden ontleden.
 *
 * Omdat we het exacte berichtformaat nog niet kennen, zoeken de helpers
 * hieronder op naam door de hele boom in plaats van een vast pad te volgen.
 * Dat is robuust tegen een structuur die anders blijkt te zijn dan verwacht.
 */
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    trimValues: true
});

export function parseXml(xml) {
    return parser.parse(xml);
}

/**
 * Zoekt een SOAP Fault. Geeft null als er geen fout in het antwoord zit.
 */
export function findFault(doc) {
    const faults = collectNodes(doc, 'Fault');
    if (faults.length === 0) return null;

    const fault = faults[0];

    return {
        code: firstValue(fault, ['faultcode', 'Code', 'Value']) ?? 'onbekend',
        message:
            firstValue(fault, ['faultstring', 'Reason', 'Text']) ??
            'SOAP Fault zonder leesbare melding',
        detail: fault.detail ?? fault.Detail ?? null
    };
}

/**
 * Verzamelt alle knopen met een bepaalde naam, ongeacht hoe diep ze zitten.
 */
export function collectNodes(node, name) {
    const found = [];

    const walk = (current) => {
        if (current === null || typeof current !== 'object') return;

        if (Array.isArray(current)) {
            current.forEach(walk);
            return;
        }

        for (const [key, value] of Object.entries(current)) {
            if (key === name) {
                if (Array.isArray(value)) found.push(...value);
                else found.push(value);
            }
            walk(value);
        }
    };

    walk(node);
    return found;
}

/**
 * Eerste gevulde waarde voor een van de opgegeven namen.
 */
export function firstValue(node, names) {
    for (const name of names) {
        const hits = collectNodes(node, name);
        for (const hit of hits) {
            if (hit === null || hit === undefined) continue;
            if (typeof hit === 'object') continue;
            const text = String(hit).trim();
            if (text) return text;
        }
    }
    return undefined;
}

/**
 * Alle namen van bladknopen in het antwoord, met een voorbeeldwaarde.
 * Hiermee kun je in een onbekend antwoord snel zien welke velden er zijn.
 */
export function describeShape(node, depth = 0, seen = new Map()) {
    if (depth > 12 || node === null || typeof node !== 'object') return seen;

    if (Array.isArray(node)) {
        node.forEach((entry) => describeShape(entry, depth + 1, seen));
        return seen;
    }

    for (const [key, value] of Object.entries(node)) {
        if (value !== null && typeof value === 'object') {
            describeShape(value, depth + 1, seen);
        } else if (!seen.has(key)) {
            seen.set(key, value);
        }
    }

    return seen;
}
