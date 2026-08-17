/**
 * Bouwt het CA-bestand waarmee de connector het certificaat van GRD valideert.
 *
 *   node scripts/build-ca-bundle.mjs <pad-naar-Vitens-RootCA.crt>
 *
 * Waarom dit een script is en geen handmatige stap: de root komt van buiten
 * (PKI-distributiepunt, IT, of een Windows-machine op het netwerk) en je wilt
 * niet blind vertrouwen wat er in dat bestand zit. Dit script controleert
 * daarom drie dingen voordat het iets wegschrijft:
 *
 *   1. is de root zelfondertekend - een root die dat niet is, is geen root
 *   2. heeft die root de Vitens-IssuingCA daadwerkelijk ondertekend
 *   3. valideert grc-dev.vitens.lan daarna tegen de complete keten
 *
 * De IssuingCA haalt het uit de live verbinding; die stuurt GRD zelf mee.
 * Vergelijk de getoonde vingerafdrukken met wat Vitens publiceert.
 */
import fs from 'node:fs';
import tls from 'node:tls';
import crypto from 'node:crypto';

const HOST = process.env.GRC_TLS_HOST ?? 'grc-dev.vitens.lan';
const UITVOER = process.env.GRC_TLS_CA_FILE || 'vitens-ca.pem';

/**
 * Maakt er PEM van, of het nu PEM of DER binnenkomt.
 *
 * Niet alleen naar het begin van het bestand kijken: een PEM mag commentaar
 * boven het certificaat hebben staan, en dan zou je het ten onrechte als
 * binair behandelen.
 */
function naarPem(buffer) {
    const tekst = buffer.toString('latin1');
    const blokken = tekst.match(
        /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g
    );

    if (blokken) return blokken.join('\n') + '\n';

    const base64 = buffer.toString('base64').match(/.{1,64}/g).join('\n');
    return `-----BEGIN CERTIFICATE-----\n${base64}\n-----END CERTIFICATE-----\n`;
}

/** Inlezen met een leesbare fout in plaats van een stacktrace. */
function leesCertificaat(pad) {
    let pem;
    try {
        pem = naarPem(fs.readFileSync(pad));
    } catch (err) {
        console.error(`✗ Kan ${pad} niet lezen: ${err.message}`);
        process.exit(1);
    }

    try {
        return { pem, cert: new crypto.X509Certificate(pem) };
    } catch {
        console.error(`✗ ${pad} bevat geen bruikbaar certificaat.`);
        console.error('  Verwacht een .crt of .pem met een X.509-certificaat erin.');
        process.exit(1);
    }
}

function haalIssuingCa(host) {
    return new Promise((resolve, reject) => {
        const socket = tls.connect(
            { host, port: 443, servername: host, rejectUnauthorized: false },
            () => {
                let cert = socket.getPeerCertificate(true);
                const gezien = new Set();

                while (cert && !gezien.has(cert.fingerprint256)) {
                    gezien.add(cert.fingerprint256);
                    if (cert.subject.CN !== host) {
                        socket.end();
                        resolve(naarPem(cert.raw));
                        return;
                    }
                    cert = cert.issuerCertificate?.fingerprint256 !== cert.fingerprint256
                        ? cert.issuerCertificate
                        : null;
                }

                socket.end();
                reject(new Error(`${host} stuurde geen tussenliggende CA mee`));
            }
        );
        socket.on('error', reject);
    });
}

const rootPad = process.argv[2];

if (!rootPad) {
    console.error('Geef het pad naar het root-certificaat mee.');
    console.error('  node scripts/build-ca-bundle.mjs ~/Downloads/Vitens-RootCA.crt');
    process.exit(1);
}

const { pem: rootPem, cert: root } = leesCertificaat(rootPad);

console.log('Root:');
console.log('  subject :', root.subject.replace(/\n/g, ' '));
console.log('  SHA-256 :', root.fingerprint256);
console.log('  geldig tot:', root.validTo);

if (!root.verify(root.publicKey)) {
    console.error('\n✗ Dit certificaat is niet zelfondertekend, dus geen root-CA.');
    process.exit(1);
}

const issuingPem = await haalIssuingCa(HOST);
const issuing = new crypto.X509Certificate(issuingPem);

console.log('\nTussenliggende CA (uit de verbinding met ' + HOST + '):');
console.log('  subject :', issuing.subject.replace(/\n/g, ' '));
console.log('  SHA-256 :', issuing.fingerprint256);

if (!issuing.verify(root.publicKey)) {
    console.error('\n✗ De root heeft deze tussenliggende CA niet ondertekend.');
    console.error('  Verkeerde root, of de keten van GRD is veranderd.');
    process.exit(1);
}

fs.writeFileSync(UITVOER, `${issuingPem.trim()}\n${rootPem.trim()}\n`);

// Pas als de echte verbinding valideert is het bestand bruikbaar.
await new Promise((resolve, reject) => {
    const socket = tls.connect(
        {
            host: HOST,
            port: 443,
            servername: HOST,
            ca: fs.readFileSync(UITVOER),
            rejectUnauthorized: true
        },
        () => {
            socket.end();
            resolve();
        }
    );
    socket.on('error', reject);
});

console.log(`\n✓ ${UITVOER} geschreven en gecontroleerd tegen ${HOST}.`);
console.log('\nZet in .env:');
console.log(`  GRC_TLS_CA_FILE=${UITVOER}`);
console.log('  GRC_TLS_INSECURE=false');
