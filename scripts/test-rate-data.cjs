const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real TypeScript helpers without a server runtime or credentials.
const source = fs.readFileSync(path.join(__dirname, '../app/lib/rate-data.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const { parseOfficialRates, preservePriceChangeDate } = exportsObject;
const rows = (gold = 305400, silver = 4790, prevGold = 301900, prevSilver = 4690) => [
  { rateType: 'छापावाल सुन (१ तोला)', todayBaseRatePerGram: gold, yestardayBaseRatePerGram: prevGold, todayDate: '2026-09-08T04:54:40Z', yestardayDate: '2026-09-07T05:00:08Z' },
  { rateType: 'असली चाँदी दर (१ तोला)', todayBaseRatePerGram: silver, yestardayBaseRatePerGram: prevSilver, todayDate: '2026-09-08T04:54:40Z', yestardayDate: '2026-09-07T05:00:08Z' },
];
test('calculates increases from official previous prices', () => {
  const quote = parseOfficialRates(rows());
  assert.equal(quote.goldChange, 3500);
  assert.equal(quote.silverChange, 100);
});
test('calculates decreases and unchanged rates', () => {
  const quote = parseOfficialRates(rows(301900, 4690, 304300, 4690));
  assert.equal(quote.goldChange, -2400);
  assert.equal(quote.silverChange, 0);
});
test('missing comparison is unknown, never a fabricated increase', () => {
  const data = rows();
  delete data[0].yestardayBaseRatePerGram;
  assert.equal(parseOfficialRates(data).goldChange, null);
  data[1].yestardayDate = '2026-09-06T05:00:08Z';
  assert.equal(parseOfficialRates(data).silverChange, null);
});
test('rejects invalid, zero, and mismatched current quotes', () => {
  for (const data of [null, [], rows(0), rows(-1), rows(NaN), rows(null), rows('')]) assert.throws(() => parseOfficialRates(data));
  const data = rows();
  data[1].todayDate = '2026-09-07T04:54:40Z';
  assert.throws(() => parseOfficialRates(data));
});
test('ignores ten-gram rows and accepts numeric strings', () => {
  const data = rows('305400');
  data.unshift({ ...data[0], rateType: 'छापावाल सुन (१० ग्राम)', todayBaseRatePerGram: 261830 });
  assert.equal(parseOfficialRates(data).gold, 305400);
});
test('unchanged price preserves change date but refreshes comparison and check time', () => {
  const stored = { isLive: true, fineGoldNumeric: 305400, silverNumeric: 4790, updatedAt: 'old', dateBs: 'old BS', dateBsNp: 'old NP', dateAd: 'old AD', fineGoldChange: 3500 };
  const fresh = { ...stored, updatedAt: 'new', checkedAt: 'new', fineGoldChange: 0 };
  const merged = preservePriceChangeDate(stored, fresh);
  assert.equal(merged.updatedAt, 'old');
  assert.equal(merged.checkedAt, 'new');
  assert.equal(merged.fineGoldChange, 0);
  assert.equal(preservePriceChangeDate(stored, { ...fresh, silverNumeric: 4800 }).updatedAt, 'new');
  assert.equal(preservePriceChangeDate(null, fresh), fresh);
});
