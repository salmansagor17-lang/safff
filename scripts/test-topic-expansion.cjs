const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const rows = JSON.parse(fs.readFileSync(path.join(root,'data/question-bank-v0.9.0.json'),'utf8'));
const audit = JSON.parse(fs.readFileSync(path.join(root,'data/content-audit.json'),'utf8'));
test('imports every makeup and Disney row at its supplied difficulty', () => {
  for (const [cid,total,perLevel] of [['fc-makeup',300,60],['fc-disney',250,50]]) {
    const pool=rows.filter(q=>q.category_id===cid);
    assert.equal(pool.length,total);
    assert.equal(new Set(pool.map(q=>q.metadata.source_id)).size,total);
    for (const p of [100,200,300,400,500]) assert.equal(pool.filter(q=>q.points===p).length,perLevel);
    for (const q of pool) {
      assert.equal(q.points,q.metadata.original_level);
      assert.ok(q.question.length>15 && q.answer);
      assert.equal(q.media_type,'none'); // archive supplied no product photos
      assert.equal(q.media_path,null);
    }
  }
});
test('arithmetic leaves riddles, sport and general knowledge; Islamic topics are separate', () => {
  for(const q of rows.filter(q=>['generated-math','generated-logic','generated-sports'].includes(q.metadata.source))) assert.equal(q.category_id,'fc-math');
  for(const q of rows.filter(q=>['fc-islamic','fc-seerah','fc-quran-stories'].includes(q.category_id))) assert.doesNotMatch(q.question,/ما ترتيب سورة|كم عدد آيات سورة/);
  assert.ok(rows.filter(q=>q.category_id==='fc-quran').length>200);
  for(const cid of ['fc-seerah','fc-quran-stories','fc-islamic','fc-currencies']) assert.ok(rows.filter(q=>q.category_id===cid).length>=50);
});
test('audit, covers, IDs and all five playable levels match the complete bank', () => {
  assert.equal(new Set(rows.map(q=>q.id)).size,rows.length);
  assert.equal(audit.length,20);
  assert.equal(audit.reduce((sum,c)=>sum+c.count,0),rows.length);
  for(const c of audit) {
    assert.equal(c.count,rows.filter(q=>q.category_id===c.id).length);
    for(const p of [100,200,300,400,500]) {
      assert.equal(c.levels[p],rows.filter(q=>q.category_id===c.id && q.points===p).length);
      assert.ok(c.levels[p]>=10,`${c.id}/${p}`);
    }
    assert.ok(fs.existsSync(path.join(root,'media/categories',c.id+'.svg')));
  }
});
