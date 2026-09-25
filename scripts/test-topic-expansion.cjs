const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(root,'data/question-bank-v0.9.0.json'),'utf8'));
const audit = JSON.parse(fs.readFileSync(path.join(root,'data/content-audit.json'),'utf8'));
test('current makeup has 500 obscured images and Prison Break has 300 questions', () => {
  const makeup = rows.filter(q => q.category_id === 'fc-makeup');
  assert.equal(makeup.length,500);
  for (const q of makeup) {
    assert.equal(q.media_type,'image');
    assert.ok(q.media_path && q.question && q.answer);
    assert.equal(q.metadata.brand_obscured,true);
  }
  assert.equal(rows.filter(q => q.category_id === 'fc-prison-break').length,300);
  assert.equal(rows.filter(q => q.category_id === 'fc-disney').length,250);
  assert.equal(rows.filter(q => q.category_id === 'fc-quran').length,0);
});
test('audit, covers, IDs and three playable levels match the complete bank', () => {
  assert.equal(new Set(rows.map(q=>q.id)).size,rows.length);
  assert.equal(audit.length,20);
  assert.equal(audit.reduce((sum,c)=>sum+c.count,0),rows.length);
  for(const c of audit) {
    const pool=rows.filter(q=>q.category_id===c.id);
    assert.equal(c.count,pool.length);
    assert.ok(pool.every(q => [100,300,500].includes(q.points) && q.category === c.title && q.category_image_path === c.image_path));
    for(const p of [100,300,500]) {
      assert.equal(c.levels[p],pool.filter(q=>q.points===p).length);
      assert.ok(c.levels[p]>=2,`${c.id}/${p}`);
    }
    assert.ok(c.image_path || fs.existsSync(path.join(root,'media/categories',c.id+'.svg')));
  }
});
