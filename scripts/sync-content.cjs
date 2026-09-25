// Read-only Supabase export. No database writes or administrator credentials.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/config.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(root, 'shared/js/sessionQuestions.js'), 'utf8'), ctx);
const config = ctx.window.APP_CONFIG;
async function read(table) {
  const rows = [];
  let total;
  do {
    const url = new URL(`/rest/v1/${table}`, config.supabaseUrl);
    url.search = new URLSearchParams({select: '*', game_id: 'eq.family-challenge', active: 'eq.true', order: 'sort_order.asc,id.asc', offset: rows.length, limit: 500});
    const response = await fetch(url, { headers: { apikey: config.supabasePublishableKey, Prefer: 'count=exact' }, signal: AbortSignal.timeout(30000) });
    assert.ok(response.ok, `${table}: HTTP ${response.status}`);
    const count = Number(response.headers.get('content-range')?.split('/')[1]);
    assert.ok(Number.isInteger(count), 'Missing exact count');
    if (total !== undefined) assert.equal(count, total, 'Content changed during export; retry');
    total = count;
    const page = await response.json();
    assert.ok(page.length || rows.length === total, 'Incomplete response');
    rows.push(...page);
  } while (rows.length < total);
  assert.equal(rows.length, total);
  assert.equal(new Set(rows.map(r => r.id)).size, total);
  return rows;
}
async function main() {
  const [categories, questions] = await Promise.all([read('game_categories'), read('game_questions')]);
  const byId = new Map(categories.map(c => [c.id, c]));
  const rows = questions.map(({ updated_at, ...q }) => {
    const c = byId.get(q.category_id);
    assert.ok(c, `Question in inactive or missing category: ${q.id}`);
    assert.ok(ctx.window.SessionQuestions.levels.includes(q.points), `Unexpected difficulty: ${q.id}`);
    return {...q, category: c.title, category_image_path: c.image_path, category_image_alt: c.image_alt};
  });
  const audit = categories.map(c => {
    const pool = rows.filter(q => q.category_id === c.id);
    assert.ok(ctx.window.SessionQuestions.isPlayable({questions: pool}), `Unplayable: ${c.id}`);
    return {id:c.id, title:c.title, image_path:c.image_path, image_alt:c.image_alt, count:pool.length, levels:Object.fromEntries(ctx.window.SessionQuestions.levels.map(p => [p, pool.filter(q => q.points === p).length]))};
  });
  const mini = audit.map(c => ({id:c.id, category:c.title, imagePath:c.image_path, imageAlt:c.image_alt, questions:ctx.window.SessionQuestions.levels.flatMap(p => rows.filter(q => q.category_id === c.id && q.points === p).slice(0,2)).map(q => ({id:q.id, points:q.points, type:q.type, question:q.question, answer:q.answer, options:q.options, media:{type:q.media_type,path:q.media_path,alt:q.media_alt},metadata:q.metadata}))}));
  const outputs = {'data/question-bank-v0.9.0.json': JSON.stringify(rows,null,2)+'\n', 'data/content-audit.json':JSON.stringify(audit,null,2)+'\n', 'games/family-challenge/js/defaultQuestions.js':'const defaultQuestions = '+JSON.stringify(mini,null,2)+';\n'};
  const backup = path.join(root,'.local-backups','content-sync-'+Date.now());
  fs.mkdirSync(backup,{recursive:true});
  for (const [file,content] of Object.entries(outputs)) {
    const target=path.join(root,file);
    fs.copyFileSync(target,path.join(backup,path.basename(file)));
    fs.writeFileSync(target,content);
  }
  console.log(JSON.stringify({questions:rows.length,categories:audit.length,images:rows.filter(q=>q.media_type==='image').length,levels:ctx.window.SessionQuestions.levels,backup},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
