const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'shared/js/sessionQuestions.js'), 'utf8'), ctx);
const api = ctx.window.SessionQuestions;
const rows = JSON.parse(fs.readFileSync(path.join(root, 'data/question-bank-v0.9.0.json'), 'utf8'));
const categories = [...new Set(rows.map(q => q.category_id))].map(id => ({ id, questions: rows.filter(q => q.category_id === id) }));

test('rejects more than five categories and accepts exactly five', () => {
  assert.throws(() => api.build(categories, categories.slice(0,6).map(c => c.id)), /خمسة/);
  assert.equal(api.build(categories, categories.slice(0,5).map(c => c.id)).length, 5);
});

test('Bab Al Hara preserves 100 questions, four options and 40/20/40 questions across three levels', () => {
  const imported = rows.filter(q => q.category_id === 'fc-bab-al-hara');
  assert.equal(imported.length, 100);
  for (const points of api.levels) assert.equal(imported.filter(q => q.points === points).length, points === 300 ? 20 : 40);
  for (const q of imported) {
    assert.equal(q.options.length, 4);
    assert.ok(q.options.includes(q.answer));
  }
  for (const c of categories) assert.ok(rows.find(q => q.category_id === c.id).category_image_path || fs.existsSync(path.join(root, 'media/categories', c.id + '.svg')));
});

test('all categories provide exactly 2 unique questions per level on one board', () => {
  for (let run = 0; run < 20; run++) {
    const result = api.build(categories, categories.slice(run % (categories.length - 4), run % (categories.length - 4) + 5).map(c => c.id));
    assert.equal(result.length, 5);
    assert.equal(result.flatMap(c => c.questions).length, 30);
    for (const category of result) {
      assert.equal(category.questions.length, 6);
      assert.equal(new Set(category.questions.map(q => q.id)).size, 6);
      for (const points of api.levels) {
        const selected = category.questions.filter(q => q.points === points);
        assert.equal(selected.length, 2);
        if (selected[0].metadata?.subject_slug) assert.equal(new Set(selected.map(q => q.metadata.subject_slug)).size, 2);
      }
      assert.equal(category.questions.filter(q => q.round === 1).length, 6);
      assert.equal(category.questions.filter(q => q.round === 2).length, 0);
    }
  }
});
test('sampling respects selected categories and does not mutate the bank', () => {
  const before = JSON.stringify(categories);
  const result = api.build(categories, ['fc-symbols', 'fc-image-flags'], () => 0);
  assert.equal(result.length, 2);
  assert.equal(result.flatMap(c => c.questions).length, 12);
  assert.equal(JSON.stringify(categories), before);
});
test('incomplete categories and duplicated question IDs cannot fill a session', () => {
  const incomplete = { id: 'bad', questions: rows.filter(q => q.category_id === 'fc-symbols' && q.points !== 500) };
  assert.equal(api.isPlayable(incomplete), false);
  assert.equal(api.build([incomplete], ['bad']).length, 0);
  const duplicates = { id: 'dup', questions: api.levels.flatMap(points => Array(3).fill({ id: `q-${points}`, points })) };
  assert.equal(api.isPlayable(duplicates), false);
});
test('miniature fallback supports the same 2-per-level rule', () => {
  vm.runInNewContext(fs.readFileSync(path.join(root, 'games/family-challenge/js/defaultQuestions.js'), 'utf8') + '\nwindow.mini = defaultQuestions;', ctx);
  assert.equal(ctx.window.mini.length, categories.length);
  assert.deepEqual(new Set(ctx.window.mini.map(c => c.id)), new Set(categories.map(c => c.id)));
  assert.ok(ctx.window.mini.every(api.isPlayable));
});
test('new content has 50 valid local flags and 50 unique symbol puzzles', () => {
  const flags = rows.filter(q => q.category_id === 'fc-image-flags');
  const symbols = rows.filter(q => q.category_id === 'fc-symbols');
  assert.equal(flags.length, 50); assert.equal(symbols.length, 50);
  assert.equal(new Set(symbols.map(q => q.metadata.symbols)).size, 50);
  for (const q of flags) {
    assert.match(q.media_path, /^site:media\/flags\/[a-z]{2}\.svg$/);
    assert.match(fs.readFileSync(path.join(root, q.media_path.slice(5)), 'utf8'), /<svg/);
  }
  for (const q of symbols) assert.ok(q.metadata.symbols && q.metadata.hint && q.answer);
});
