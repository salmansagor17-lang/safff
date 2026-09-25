// Read-only Supabase snapshot. No database writes and no administrator credentials.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { isDeepStrictEqual } = require('node:util');
const root = path.resolve(__dirname, '../..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/config.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'shared/js/sessionQuestions.js'), 'utf8'), ctx);
const config = ctx.window.APP_CONFIG;

async function read(table, { active = true, order = 'sort_order.asc,id.asc' } = {}) {
  const rows = [];
  let total;
  do {
    const url = new URL(`/rest/v1/${table}`, config.supabaseUrl);
    const params = { select: '*', game_id: 'eq.family-challenge', order, offset: String(rows.length), limit: '500' };
    if (active) params.active = 'eq.true';
    url.search = new URLSearchParams(params);
    const response = await fetch(url, { headers: { apikey: config.supabasePublishableKey, Prefer: 'count=exact' }, signal: AbortSignal.timeout(30000) });
    assert.ok(response.ok, `${table}: HTTP ${response.status}`);
    const count = Number(response.headers.get('content-range')?.split('/')[1]);
    assert.ok(Number.isInteger(count), `${table}: missing exact count`);
    if (total !== undefined) assert.equal(count, total, `${table}: changed during export; retry`);
    total = count;
    const page = await response.json();
    assert.ok(page.length || rows.length === total, `${table}: incomplete response`);
    rows.push(...page);
  } while (rows.length < total);
  assert.equal(rows.length, total);
  return rows;
}

function toAnswerMedia(row) {
  if (!row) return null;
  return {
    type: row.media_type || 'image', provider: row.provider || 'supabase', path: row.media_path || null,
    externalUrl: row.external_url || null, lookupQuery: row.lookup_query || null,
    fallbackQuery: row.fallback_query || null, alt: row.alt || '', sourceUrl: row.source_url || null,
    metadata: row.metadata || {}
  };
}

async function snapshot() {
  return Promise.all([
    read('game_categories'),
    read('game_questions'),
    read('question_media'),
    read('question_answers', { active: false, order: 'category_id.asc,question_id.asc,sort_order.asc,id.asc' })
  ]);
}

async function main() {
  const [categories, questions, mediaRows, answerRows] = await snapshot();
  const byId = new Map(categories.map(c => [c.id, c]));
  const answerMedia = new Map(mediaRows.filter(m => m.stage === 'answer').map(m => [m.question_id, toAnswerMedia(m)]));
  const rows = questions.map(({ updated_at, ...q }) => {
    const c = byId.get(q.category_id);
    assert.ok(c, `Question in inactive or missing category: ${q.id}`);
    assert.ok(ctx.window.SessionQuestions.levels.includes(q.points), `Unexpected difficulty: ${q.id}`);
    return { ...q, answer_media: answerMedia.get(q.id) || null, category: c.title, category_image_path: c.image_path, category_image_alt: c.image_alt };
  });
  const audit = categories.map(c => {
    const pool = rows.filter(q => q.category_id === c.id);
    assert.ok(ctx.window.SessionQuestions.isPlayable({ questions: pool }), `Unplayable: ${c.id}`);
    return { id:c.id, title:c.title, image_path:c.image_path, image_alt:c.image_alt, count:pool.length,
      levels:Object.fromEntries(ctx.window.SessionQuestions.levels.map(p => [p, pool.filter(q => q.points === p).length])) };
  });
  const mini = audit.map(c => ({ id:c.id, category:c.title, imagePath:c.image_path, imageAlt:c.image_alt,
    questions:ctx.window.SessionQuestions.levels.flatMap(p => rows.filter(q => q.category_id === c.id && q.points === p).slice(0,2))
      .map(q => ({ id:q.id, points:q.points, type:q.type, question:q.question, answer:q.answer, options:q.options,
        media:{type:q.media_type,path:q.media_path,alt:q.media_alt}, answerMedia:q.answer_media, metadata:q.metadata })) }));

  const [cc, cq, cm, ca] = await snapshot();
  assert.ok(isDeepStrictEqual(cc, categories) && isDeepStrictEqual(cq, questions) && isDeepStrictEqual(cm, mediaRows) && isDeepStrictEqual(ca, answerRows),
    'Content changed during export; retry after updates finish');

  const outputs = {
    'data/generated/question-bank.json': JSON.stringify(rows,null,2)+'\n',
    'data/generated/content-audit.json': JSON.stringify(audit,null,2)+'\n',
    'data/generated/question-answers.json': JSON.stringify(answerRows,null,2)+'\n',
    'data/generated/answer-media.json': JSON.stringify(mediaRows,null,2)+'\n',
    'games/family-challenge/js/defaultQuestions.js': 'const defaultQuestions = '+JSON.stringify(mini,null,2)+';\n'
  };
  const backup = path.join(root,'.local-backups','content-sync-'+Date.now());
  fs.mkdirSync(backup,{recursive:true});
  for (const [file,content] of Object.entries(outputs)) {
    const target=path.join(root,file); fs.mkdirSync(path.dirname(target),{recursive:true});
    if (fs.existsSync(target)) fs.copyFileSync(target,path.join(backup,path.basename(target)));
    fs.writeFileSync(target,content);
  }
  console.log(JSON.stringify({questions:rows.length,categories:audit.length,questionMedia:mediaRows.length,answers:answerRows.length,
    images:rows.filter(q=>q.media_type==='image').length,levels:ctx.window.SessionQuestions.levels,backup},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
