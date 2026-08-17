import test from 'node:test';
import assert from 'node:assert/strict';

import {
    parseXml,
    findFault,
    collectNodes,
    firstValue,
    describeShape,
    asText
} from '../server/grc/parse.js';

// Zoals GRD het werkelijk terugstuurt: faultstring met een taalattribuut.
// Hierdoor maakt de XML-parser er een object van in plaats van tekst.
const FAULT_MET_TAAL = `<?xml version="1.0"?>
<soap-env:Envelope xmlns:soap-env="http://schemas.xmlsoap.org/soap/envelope/">
  <soap-env:Body>
    <soap-env:Fault>
      <faultcode>soap-env:Server</faultcode>
      <faultstring xml:lang="nl">Fout bij webserviceverwerking</faultstring>
    </soap-env:Fault>
  </soap-env:Body>
</soap-env:Envelope>`;

test('een faultstring met taalattribuut levert wel een leesbare melding', () => {
    const fault = findFault(parseXml(FAULT_MET_TAAL));

    assert.ok(fault);
    assert.equal(fault.message, 'Fout bij webserviceverwerking');
});

test('asText pelt de tekst uit een element met attributen', () => {
    assert.equal(asText({ '#text': 'hallo', '@_xml:lang': 'nl' }), 'hallo');
    assert.equal(asText('kaal'), 'kaal');
    assert.equal(asText({ '@_alleen': 'attribuut' }), undefined);
    assert.equal(asText(''), undefined);
    assert.equal(asText(null), undefined);
});

const FAULT = `<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Server</faultcode>
      <faultstring>Function module not found</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;

const ROLES = `<?xml version="1.0"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <n0:GracSearchRolesResponse xmlns:n0="urn:sap-com:document:sap:soap:functions:mc-style">
      <Roles>
        <item>
          <RoleName>Z_SD_ORDER_CREATE</RoleName>
          <RoleDesc>Verkooporder aanmaken</RoleDesc>
          <System>S4D</System>
        </item>
        <item>
          <RoleName>Z_FI_INVOICE_VIEW</RoleName>
          <RoleDesc>Factuur inzien</RoleDesc>
          <System>S4D</System>
        </item>
      </Roles>
    </n0:GracSearchRolesResponse>
  </soap:Body>
</soap:Envelope>`;

test('findFault haalt een SOAP Fault eruit', () => {
    const fault = findFault(parseXml(FAULT));

    assert.ok(fault);
    assert.equal(fault.message, 'Function module not found');
    assert.match(fault.code, /Server/);
});

test('findFault geeft null bij een geslaagd antwoord', () => {
    assert.equal(findFault(parseXml(ROLES)), null);
});

test('collectNodes vindt items ongeacht hoe diep ze zitten', () => {
    const items = collectNodes(parseXml(ROLES), 'item');

    assert.equal(items.length, 2);
    assert.equal(items[0].RoleName, 'Z_SD_ORDER_CREATE');
});

test('firstValue accepteert meerdere mogelijke veldnamen', () => {
    const items = collectNodes(parseXml(ROLES), 'item');

    // Eerste naam bestaat niet, tweede wel - zo vangen we formaatverschillen op.
    assert.equal(firstValue(items[1], ['RoleId', 'RoleName']), 'Z_FI_INVOICE_VIEW');
    assert.equal(firstValue(items[1], ['BestaatNiet']), undefined);
});

test('describeShape somt de velden van een onbekend antwoord op', () => {
    const shape = describeShape(parseXml(ROLES));

    assert.ok(shape.has('RoleName'));
    assert.ok(shape.has('System'));
});
