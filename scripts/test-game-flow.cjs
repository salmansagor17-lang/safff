// Exercises actual game.js with a minimal DOM; this is not a visual browser test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const bank = JSON.parse(read('data/question-bank-v0.9.0.json'));

class Element {
  constructor(tag = 'div') {
    this.tag = tag; this.children = []; this.listeners = {}; this.style = {}; this.dataset = {};
    this.textContent = ''; this.value = ''; this.checked = true;
    const classes = new Set();
    this.classList = { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c),
      toggle: (c, force) => { if (force ?? !classes.has(c)) classes.add(c); else classes.delete(c); } };
  }
  set innerHTML(value) { this.children = []; }
  append(...elements) { this.children.push(...elements); }
  appendChild(element) { this.append(element); }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  setAttribute(name, value) { this[name] = value; }
}

async function setup(mode) {
  const elements = new Map();
  const get = id => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
  const walk = el => el.children.flatMap(child => [child, ...walk(child)]);
  const categories = [...new Set(bank.map(q => q.category_id))].map(id => ({ id, category: bank.find(q => q.category_id === id).category,
    questions: bank.filter(q => q.category_id === id).map(q => ({ ...q, media: { type: q.media_type, path: q.media_path, alt: q.media_alt } })) }));
  const context = { console, URL, setTimeout, clearTimeout, alert: message => { throw new Error(message); }, confirm: () => true,
    document: { getElementById: get, createElement: tag => new Element(tag),
      querySelectorAll: selector => selector === '#categorySelector input:checked'
        ? walk(get('categorySelector')).filter(el => el.tag === 'input' && el.checked) : [] },
    fetch: async () => { if (mode === 'mini') throw new Error('Simulated local failure'); return { ok: true, json: async () => bank }; },
    startTimer: () => {}, stopTimer: () => {}, playCorrectSound: () => {}, playWrongSound: () => {}, playTimeoutSound: () => {},
    window: { addEventListener: () => {}, PlatformContent: {
      loadGame: async () => { if (mode !== 'online') throw new Error('Simulated network failure'); return { categories }; },
      getPublicMediaUrl: p => p.startsWith('site:') ? '/' + p.slice(5) : 'https://example.test/' + p
    } } };
  vm.createContext(context);
  for (const file of ['shared/js/sessionQuestions.js','games/family-challenge/js/defaultQuestions.js','games/family-challenge/js/game.js']) vm.runInContext(read(file), context);
  await new Promise(resolve => setImmediate(resolve));
  return { context, get, walk };
}

for (const mode of ['online','local','mini']) test(`complete 30-question flags/symbols game using ${mode} content`, async () => {
  const { context, get, walk } = await setup(mode);
  assert.equal(get('startButton').disabled, false);
  for (const input of walk(get('categorySelector')).filter(el => el.tag === 'input')) input.checked = ['fc-image-flags','fc-symbols'].includes(input.value);
  get('startButton').listeners.click();
  assert.equal(vm.runInContext('sessionCategories.flatMap(c => c.questions).length', context), 30);
  assert.equal(vm.runInContext('getCurrentRoundQuestions().length', context), 18);
  let symbolSeen = false, flagSeen = false;
  for (const round of [1,2]) {
    if (round === 2) get('nextRoundButton').listeners.click();
    const questions = vm.runInContext('getCurrentRoundQuestions()', context);
    assert.equal(questions.length, round === 1 ? 18 : 12);
    for (const q of questions) {
      context.testQuestion = q; context.testCard = new Element('button');
      vm.runInContext('openQuestion(testQuestion, testCard, "Test")', context);
      if (q.metadata?.symbols) { symbolSeen = true; assert.equal(get('questionSymbols').textContent, q.metadata.symbols); }
      if (q.media.path?.startsWith('site:')) { flagSeen = true; assert.ok(get('questionMedia').children.some(el => el.tag === 'img')); }
      get('currentTeamCorrect').listeners.click();
    }
  }
  assert.ok(symbolSeen && flagSeen);
  assert.equal(vm.runInContext('gameEnded', context), true);
  assert.equal(get('finalScores').children.length, 2);
  get('playAgainButton').listeners.click();
  assert.equal(vm.runInContext('gameEnded', context), false);
  assert.equal(vm.runInContext('sessionCategories.length', context), 0);
});
