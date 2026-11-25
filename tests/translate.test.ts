import test from 'node:test';
import assert from 'node:assert/strict';
import { looksTranslated } from '../src/lib/translate';

test('a verbatim echo is not a translation', () => {
  const en = 'Beauty pageant winner crowned in Jaipur city';
  assert.equal(looksTranslated(en, en), false, 'lingva.ml returns exactly this');
  assert.equal(looksTranslated(en, ''), false);
  assert.equal(looksTranslated(en, '   '), false);
});

test('a half-translated memory match is rejected', () => {
  // What MyMemory actually returned for this headline.
  assert.equal(
    looksTranslated('What is a Beauty Pageant? Complete Guide for you', 'सौंदर्य प्रतियोगिता क्या है? Complete Guide for you'),
    false
  );
});

test('a real translation is accepted', () => {
  assert.equal(
    looksTranslated('Beauty pageant winner crowned in Jaipur', 'सौंदर्य प्रतियोगिता की विजेता को जयपुर में ताज पहनाया गया'),
    true
  );
  assert.equal(
    looksTranslated(
      'For 22 years Dr Manisha Soin has been the doctor many women turn to',
      '22 वर्षों से, डॉ. मनीषा सोइन वह डॉक्टर रही हैं जिनके पास कई महिलाएँ आती हैं'
    ),
    true
  );
});

test('names and short strings are allowed to stay as they are', () => {
  assert.equal(looksTranslated('FSIA 2026', 'FSIA 2026'), false, 'identical is still identical');
  assert.equal(looksTranslated('Forever Star India', 'Forever Star India 2026'), true, 'too short to judge');
  assert.equal(looksTranslated('Mrs India', 'मिसेज इंडिया'), true);
});

test('a translation keeping some proper nouns in Latin is accepted', () => {
  assert.equal(
    looksTranslated(
      'Forever Star India announces the Miss Teen India season six auditions',
      'Forever Star India ने मिस टीन इंडिया सीज़न छह के ऑडिशन की घोषणा की'
    ),
    true
  );
});
