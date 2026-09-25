const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../..');

test('dynamic question count supports 1-4 questions per level', () => {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'shared/js/sessionQuestions.js'), 'utf8'), ctx);
  const api = ctx.window.SessionQuestions;
  const rows = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/question-bank.json'), 'utf8'));
  const ids = ['fc-general', 'fc-geography'];
  const categories = ids.map(id => ({ id, questions: rows.filter(q => q.category_id === id) }));

  for (const perLevel of [1, 2, 3, 4]) {
    const result = api.build(categories, ids, { perLevel, maxCategories: 5 }, () => 0.25);
    assert.equal(result.length, 2);
    for (const category of result) {
      assert.equal(category.questions.length, perLevel * 3);
      for (const points of [100, 300, 500]) {
        assert.equal(category.questions.filter(q => q.points === points).length, perLevel);
      }
    }
  }
});

test('zero-second timer means no timer and never starts an interval', () => {
  let intervalStarted = false;
  const timerValue = {
    textContent: '',
    classList: { toggle() {} },
    closest() { return { classList: { toggle() {} }, setAttribute() {} }; }
  };
  const ctx = {
    document: { getElementById(id) { return id === 'timerValue' ? timerValue : null; } },
    setInterval() { intervalStarted = true; return 1; },
    clearInterval() {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'games/family-challenge/js/timer.js'), 'utf8'), ctx);
  ctx.startTimer(0, () => { throw new Error('timeout should not fire'); });
  assert.equal(intervalStarted, false);
  assert.equal(timerValue.textContent, '∞');
});

test('settings UI and makeup text safety layer are present', () => {
  const html = fs.readFileSync(path.join(root, 'games/family-challenge/index.html'), 'utf8');
  const game = fs.readFileSync(path.join(root, 'games/family-challenge/js/game.js'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'games/family-challenge/style.css'), 'utf8');

  assert.match(html, /questionsPerLevelSelect/);
  assert.match(html, /questionsPerCategorySelect/);
  assert.match(html, /id="timerOptions"/);
  assert.match(game, /makeup-text-mask/);
  assert.match(game, /for \(let index = 0; index < 7; index\+\+\)/);
  assert.match(css, /backdrop-filter:blur\(18px\)/);
  assert.match(css, /max-width:min\(100%,1200px\)/);
});
