import test from 'node:test';
import assert from 'node:assert/strict';

import {
    escapeXml,
    fieldsToXml,
    buildEnvelope,
    toSapDate
} from '../server/grc/envelopes.js';

test('escapeXml maakt XML-tekens onschadelijk', () => {
    assert.equal(escapeXml('a & b'), 'a &amp; b');
    assert.equal(escapeXml('<script>'), '&lt;script&gt;');
    assert.equal(escapeXml('"quoted"'), '&quot;quoted&quot;');
    assert.equal(escapeXml(null), '');
});

test('een rolnaam met een ampersand breekt de envelope niet', () => {
    const xml = buildEnvelope({
        namespace: 'urn:test',
        operation: 'Zoek',
        fields: { SearchString: 'R&D_ADMIN' }
    });

    assert.match(xml, /<SearchString>R&amp;D_ADMIN<\/SearchString>/);
    assert.doesNotMatch(xml, /R&D_ADMIN/);
});

test('lege velden worden overgeslagen in plaats van leeg meegestuurd', () => {
    const xml = fieldsToXml({ Gevuld: 'ja', Leeg: undefined, Null: null });

    assert.match(xml, /<Gevuld>ja<\/Gevuld>/);
    assert.doesNotMatch(xml, /Leeg/);
    assert.doesNotMatch(xml, /Null/);
});

test('een array wordt herhaald onder dezelfde tagnaam', () => {
    const xml = fieldsToXml({
        item: [{ Itemname: 'ROL_A' }, { Itemname: 'ROL_B' }]
    });

    assert.equal((xml.match(/<item>/g) ?? []).length, 2);
    assert.match(xml, /ROL_A/);
    assert.match(xml, /ROL_B/);
});

test('geneste objecten worden als geneste XML weergegeven', () => {
    const xml = fieldsToXml({
        Requestheaderdata: { Requestreason: 'Nodig voor project' }
    });

    assert.match(xml, /<Requestheaderdata>[\s\S]*<Requestreason>Nodig voor project<\/Requestreason>[\s\S]*<\/Requestheaderdata>/);
});

test('buildEnvelope eist een operatienaam', () => {
    assert.throws(
        () => buildEnvelope({ namespace: 'urn:test', fields: {} }),
        /operation is verplicht/
    );
});

test('toSapDate zet de Nederlandse notatie om naar het SAP-formaat', () => {
    assert.equal(toSapDate('17-08-2026'), '2026-08-17');
    assert.equal(toSapDate('2026-08-17'), '2026-08-17');
    assert.equal(toSapDate(new Date('2026-08-17T12:00:00Z')), '2026-08-17');
    assert.equal(toSapDate(''), undefined);
});
