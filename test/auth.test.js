import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeUserId } from '../server/auth.js';

test('normalizeUserId pelt het domein van een AD-naam', () => {
    assert.equal(normalizeUserId('VITENS\\verloopv'), 'VERLOOPV');
    assert.equal(normalizeUserId('verloopv@vitens.nl'), 'VERLOOPV');
    assert.equal(normalizeUserId('  verloopv  '), 'VERLOOPV');
});

test('normalizeUserId geeft null bij niets bruikbaars', () => {
    assert.equal(normalizeUserId(''), null);
    assert.equal(normalizeUserId('   '), null);
    assert.equal(normalizeUserId(null), null);
    assert.equal(normalizeUserId(undefined), null);
    // Alleen een domein zonder gebruikersnaam levert geen identiteit op.
    assert.equal(normalizeUserId('VITENS\\'), null);
    assert.equal(normalizeUserId('@vitens.nl'), null);
});
