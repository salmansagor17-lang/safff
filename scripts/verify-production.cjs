const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const expected = JSON.parse(fs.readFileSync(path.join(__dirname,'../data/question-bank-v0.9.0.json'),'utf8'));
const expectedCategories = new Set(expected.map(q => q.category_id));
const base = process.argv[2] || 'https://family-challenge-lemon.vercel.app';
const localServer = /^http:\/\/(localhost|127\.0\.0\.1):/.test(base);

async function main() {
  const read = async file => {
    const r = await fetch(base + file); assert.equal(r.status, 200, file); return r.text();
  };
  const home = await read('/index.html');
  const game = await read('/games/family-challenge/index.html');
  assert.ok(home.includes('categoryCount') && game.includes('questionSymbols') && game.includes('sessionSize'));
  for (const html of [home, game]) assert.ok(html.includes('theme-toggle') && html.includes('beit-sido.png'));
  assert.ok(!game.includes('roundModal'));
  assert.ok(home.includes('games-menu') && home.includes('#teams'));
  for (const step of ['teams','settings','categories']) assert.ok(game.includes(`data-setup-panel="${step}"`));
  assert.ok((await read('/games/family-challenge/js/setupFlow.js')).includes('popstate'));
  for (const html of [home, game]) {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '');
    assert.doesNotMatch(text, /Supabase|نسخة تجريبية|بيانات اللعب مؤقتة/);
  }
  const ctx = { window: {}, console, fetch, URL, URLSearchParams, Headers, Request, Response, WebSocket,
    setTimeout, clearTimeout, setInterval, clearInterval, AbortController, TextEncoder, TextDecoder,
    document: { querySelector: () => ({ src: base + '/shared/js/contentStore.js' }) } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  const sdk = await fetch('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0'); assert.equal(sdk.status, 200);
  vm.runInContext(await sdk.text(), ctx); ctx.window.supabase = ctx.supabase;
  for (const file of ['/js/config.js','/shared/js/supabaseClient.js','/shared/js/contentStore.js','/shared/js/sessionQuestions.js']) vm.runInContext(await read(file), ctx);
  const payload = await ctx.window.PlatformContent.loadGame('family-challenge');
  const questions = payload.categories.flatMap(c => c.questions);
  assert.equal(payload.categories.length, expectedCategories.size); assert.equal(questions.length, expected.length);
  assert.equal(new Set(questions.map(q => q.id)).size, expected.length);
  const actualById = new Map(payload.categories.flatMap(c => c.questions.map(q => [q.id,{...q,category_id:c.id}])));
  for (const q of expected) {
    const actual = actualById.get(q.id);
    assert.ok(actual, q.id);
    for (const field of ['category_id','question','answer','points','type']) assert.equal(actual[field],q[field],`${q.id}/${field}`);
  }
  for (const q of expected) { const actual = actualById.get(q.id); assert.equal(actual.media.type, q.media_type, q.id); assert.equal(actual.media.path, q.media_path, q.id); assert.deepEqual(JSON.parse(JSON.stringify(actual.options)), q.options, q.id); assert.deepEqual(JSON.parse(JSON.stringify(actual.metadata)), q.metadata, q.id); }
  assert.equal(questions.filter(q => q.media.type === 'image').length, expected.filter(q => q.media_type === 'image').length);
  assert.equal(questions.filter(q => q.metadata.symbols).length, 50);
  assert.ok(payload.categories.every(ctx.window.SessionQuestions.isPlayable));
  const bab = payload.categories.find(c => c.id === 'fc-bab-al-hara');
  assert.equal(bab.questions.length, 100);
  for (const points of [100,300,500]) assert.equal(bab.questions.filter(q => q.points === points).length, points === 300 ? 20 : 40);
  for (const category of payload.categories) {
    const response = await fetch(category.imagePath ? ctx.window.PlatformContent.getPublicMediaUrl(category.imagePath) : base + '/media/categories/' + category.id + '.svg');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^image\//);
  }
  const logo = await fetch(base + '/media/beit-sido.png');
  assert.equal(logo.status, 200);
  assert.match(logo.headers.get('content-type'), /image\/png/);
  const session = ctx.window.SessionQuestions.build(payload.categories, payload.categories.slice(0,5).map(c => c.id));
  assert.equal(session.flatMap(c => c.questions).length, 30);
  for (const category of session) for (const points of [100,300,500]) assert.equal(category.questions.filter(q => q.points === points).length, 2);
  const images = [...new Map(questions.filter(q => q.media.type === 'image').map(q => [q.media.path, q])).values()];
  for (let i = 0; i < images.length; i += 8) {
    await Promise.all(images.slice(i,i+8).map(async q => {
      const r = await fetch(ctx.window.PlatformContent.getPublicMediaUrl(q.media.path), { method: 'HEAD' });
      assert.equal(r.status, 200, q.id); assert.match(r.headers.get('content-type'), /^image\//, q.id);
    }));
  }
  const local = JSON.parse(await read('/data/question-bank-v0.9.0.json'));
  assert.equal(local.length, expected.length);
  assert.deepEqual(local, expected);
  assert.deepEqual(new Set(local.map(q => q.id)), new Set(questions.map(q => q.id)));
  for (const file of localServer ? [] : ['/docs/PLATFORM-METHODOLOGY.ar.md','/scripts/visual-expansion.sql','/.local-backups/before-visual-expansion.json']) {
    const r = await fetch(base + file); assert.equal(r.status, 404, 'Admin file should not be deployed: ' + file);
  }
  console.log(JSON.stringify({ status: 'PASS', base, categories: payload.categories.map(c => ({ name: c.category, count: c.questions.length })),
    total: questions.length, images: questions.filter(q => q.media.type === "image").length, symbols: 50, sessionQuestions: 30, mediaUrlsChecked: images.length, localBank: 'matched', adminFiles: localServer ? 'deployment-only check' : '404' }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
