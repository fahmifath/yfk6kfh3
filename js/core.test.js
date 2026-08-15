// @ts-check
import {
  generateId, validateChoreName, addChore, removeChore,
  selectRandomChore, assignSegmentColor, formatChoreCount,
  loadChores, saveChores
} from './core.js';

let n = 0, p = 0;
/** @param {boolean} c @param {string} m */
const ok = (c, m) => { n++; if (c) p++; else console.error(`✗ ${m}`); };

// generateId
const a = generateId(), b = generateId();
ok(a !== b, 'generateId unique');
ok(typeof a === 'string' && a.length > 0, 'generateId non-empty');

// validateChoreName
ok(validateChoreName('Dishes').valid, 'validate: valid name');
ok(!validateChoreName('').valid, 'validate: empty fails');
ok(!validateChoreName('   ').valid, 'validate: whitespace fails');
ok(!validateChoreName('x'.repeat(51)).valid, 'validate: >50 fails');
ok(validateChoreName('x'.repeat(50)).valid, 'validate: 50 chars ok');
ok(validateChoreName('x'.repeat(51)).error.includes('50'), 'validate: error mentions 50');

// addChore
const r1 = addChore([], 'Vacuum');
ok(r1.error === '', 'addChore: valid succeeds');
ok(r1.chores.length === 1, 'addChore: adds one');
ok(r1.chores[0].name === 'Vacuum', 'addChore: stores name');
ok(typeof r1.chores[0].id === 'string', 'addChore: assigns id');
ok(addChore([], '  Dishes  ').chores[0].name === 'Dishes', 'addChore: trims');
ok(addChore([], '').error.length > 0, 'addChore: rejects empty');
const full = Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, name: `C${i}` }));
ok(addChore(full, 'x').error.length > 0, 'addChore: rejects at max');
const orig = [{ id: '1', name: 'O' }]; addChore(orig, 'N');
ok(orig.length === 1, 'addChore: no mutation');

// removeChore
const c3 = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
const rem = removeChore(c3, 'b');
ok(rem.length === 2, 'removeChore: removes one');
ok(!rem.find(c => c.id === 'b'), 'removeChore: correct item removed');
ok(c3.length === 3, 'removeChore: no mutation');
ok(removeChore(c3, 'zzz').length === 3, 'removeChore: bad id ok');

// selectRandomChore
ok(selectRandomChore([]) === null, 'selectRandom: empty → null');
ok(selectRandomChore([{ id: '1', name: 'X' }])?.name === 'X', 'selectRandom: single item');
const pool = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }];
const h = /** @type {{ [k: string]: number }} */ ({ A: 0, B: 0, C: 0 });
for (let i = 0; i < 90; i++) { const s = selectRandomChore(pool); if (s && s.name in h) h[s.name]++; }
ok(h.A > 0 && h.B > 0 && h.C > 0, 'selectRandom: distributes');

// assignSegmentColor
ok(assignSegmentColor(0) !== assignSegmentColor(1), 'color: indices differ');
ok(assignSegmentColor(0).startsWith('#'), 'color: is hex');
ok(assignSegmentColor(8) === assignSegmentColor(0), 'color: wraps at 8');

// formatChoreCount
ok(formatChoreCount(1) === '1 chore', 'format: singular');
ok(formatChoreCount(2) === '2 chores', 'format: plural');
ok(formatChoreCount(0) === '0 chores', 'format: zero');

// mock storage
const mk = () => ({
  data: /** @type {string} */ (''),
  /** @param {string} _k */ getItem(_k) { return this.data; },
  /** @param {string} _k @param {string} v */ setItem(_k, v) { this.data = v; },
  removeItem() { this.data = ''; }
});

// loadChores
const ms = mk();
ok(loadChores(ms).length === 0, 'load: empty → []');
ms.data = JSON.stringify([{ id: '1', name: 'T' }]);
const ld = loadChores(ms);
ok(ld.length === 1 && ld[0].name === 'T', 'load: parses valid');
ms.data = 'bad json';
ok(loadChores(ms).length === 0, 'load: bad json → []');
ms.data = JSON.stringify({ x: 1 });
ok(loadChores(ms).length === 0, 'load: non-array → []');
ms.data = JSON.stringify([{ id: '1', name: 'G' }, { id: '2', name: '' }, { id: '3', name: 'x'.repeat(51) }]);
const filt = loadChores(ms);
ok(filt.length === 1 && filt[0].name === 'G', 'load: filters invalid entries');
ms.data = JSON.stringify(Array.from({ length: 25 }, (_, i) => ({ id: `${i}`, name: `C${i}` })));
ok(loadChores(ms).length === 20, 'load: caps at 20');

// saveChores
const ms2 = mk();
saveChores([{ id: '1', name: 'T' }], ms2);
const sv = JSON.parse(ms2.data);
ok(Array.isArray(sv) && sv[0].name === 'T', 'save: persists data');

// validation-persistence
ok(validateChoreName('').error.length > 0, 'validation-persistence: empty error stays');
ok(validateChoreName('x'.repeat(51)).error.length > 0, 'validation-persistence: long error stays');

// init-failure
const bad = { getItem() { throw new Error('x'); }, setItem() {}, removeItem() {} };
ok(loadChores(bad).length === 0, 'init-failure: storage error → []');

console.log(`${p}/${n} tests passed`);
if (typeof process !== 'undefined' && p !== n) process.exit(1);
