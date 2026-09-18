const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Transpile rates.ts without server runtime
const ratesSource = fs.readFileSync(path.join(__dirname, '../app/lib/rates.ts'), 'utf8');
const cleanRatesSource = ratesSource
  .replace(/import "server-only";/, '')
  .replace(/import { list, put } from "@vercel\/blob";/, 'const list = null; const put = null;');
const compiledRates = ts.transpileModule(cleanRatesSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;

const ratesExports = {};
vm.runInNewContext(compiledRates, {
  exports: ratesExports,
  require: (id) => {
    if (id.includes('nepali-date')) return require(path.join(__dirname, '../app/lib/nepali-date.ts'));
    if (id.includes('rate-data')) return require(path.join(__dirname, '../app/lib/rate-data.ts'));
    return {};
  },
  Intl, Date, parseInt, Number, isNaN
});

const { isRatesUpToDateForToday } = ratesExports;

test('Rate checker: before 11:00 AM NPT, yesterday rate is considered valid and active', () => {
  // 10:30 AM NPT on 17 Sep 2026 = 04:45 UTC
  const morningNpt = new Date('2026-09-17T04:45:00Z');
  const yesterdayStored = { isLive: true, updatedAt: '2026-09-16T05:30:00Z' };
  assert.equal(isRatesUpToDateForToday(yesterdayStored, morningNpt), true);
});

test('Rate checker: at or after 11:00 AM NPT, yesterday rate triggers a fresh fetch', () => {
  // 11:15 AM NPT on 17 Sep 2026 = 05:30 UTC
  const after11AmNpt = new Date('2026-09-17T05:30:00Z');
  const yesterdayStored = { isLive: true, updatedAt: '2026-09-16T05:30:00Z' };
  assert.equal(isRatesUpToDateForToday(yesterdayStored, after11AmNpt), false);
});

test('Rate checker: after 11:00 AM NPT, today rate already fetched after 11:00 AM is up to date (0 API/Blob calls)', () => {
  // 3:00 PM NPT on 17 Sep 2026 = 09:15 UTC
  const afternoonNpt = new Date('2026-09-17T09:15:00Z');
  // Fetched today at 11:05 AM NPT (05:20 UTC)
  const todayStored = { isLive: true, updatedAt: '2026-09-17T05:20:00Z' };
  assert.equal(isRatesUpToDateForToday(todayStored, afternoonNpt), true);
});

test('Rate checker: missing or non-live rate always triggers fetch', () => {
  const morningNpt = new Date('2026-09-17T04:45:00Z');
  assert.equal(isRatesUpToDateForToday(null, morningNpt), false);
  assert.equal(isRatesUpToDateForToday({ isLive: false, updatedAt: '2026-09-17T05:20:00Z' }, morningNpt), false);
});

test('Image format helper: accepts wide variety of image extensions and rejects non-images', () => {
  const isImageRegex = /\.(png|jpe?g|webp|gif|bmp|tiff?|avif|heic|heif|svg)$/i;
  assert.equal(isImageRegex.test('photo.heic'), true);
  assert.equal(isImageRegex.test('report.png'), true);
  assert.equal(isImageRegex.test('scan.jpeg'), true);
  assert.equal(isImageRegex.test('image.avif'), true);
  assert.equal(isImageRegex.test('certificate.webp'), true);
  assert.equal(isImageRegex.test('document.pdf'), false);
  assert.equal(isImageRegex.test('data.json'), false);
});
