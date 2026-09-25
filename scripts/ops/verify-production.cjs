const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const expected = JSON.parse(fs.readFileSync(path.join(root,'data/generated/question-bank.json'),'utf8'));
const expectedCategories = new Set(expected.filter(q=>q.active).map(q => q.category_id));
const localConfig = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/config.js'), 'utf8'), localConfig);
const expectedVersion = localConfig.window.APP_CONFIG.version;
const useLocalFiles = process.argv.includes('--local');
const base = (process.argv.slice(2).find(arg => arg !== '--local') || 'https://family-challenge-lemon.vercel.app').replace(/\/+$/, '');
const fetchWithTimeout = globalThis.fetch;
const fetch = (url, options = {}) => fetchWithTimeout(url, { ...options, signal: AbortSignal.timeout(30000) });

async function main() {
  const read = async file => {
    if (useLocalFiles) return fs.readFileSync(path.join(root, file), 'utf8');
    const r = await fetch(base + file); assert.equal(r.status, 200, file); return r.text();
  };
  const deployedConfig = { window: {} };
  vm.runInNewContext(await read('/js/config.js'), deployedConfig);
  assert.equal(deployedConfig.window.APP_CONFIG.version, expectedVersion, 'Deployed version must match local js/config.js');
  const home = await read('/index.html');
  const game = await read('/games/family-challenge/index.html');
  assert.ok(home.includes('categoryCount') && game.includes('questionSymbols') && game.includes('answerMedia'));
  assert.ok(game.includes('questionsPerLevelSelect') && game.includes('questionsPerCategorySelect') && game.includes('id="timerOptions"'));
  for (const html of [home, game]) {
    assert.ok(html.includes('theme-toggle') && html.includes('beit-sido.png'));
    assert.ok(html.includes('shared/styles/tokens.css') || html.includes('../../shared/styles/tokens.css'));
  }
  assert.ok(!game.includes('roundModal'));
  assert.ok(home.includes('id="games"') && home.includes('games/family-challenge/index.html#teams'));
  assert.ok(home.includes('id="homeCategoryGrid"'));
  assert.ok((await read('/shared/styles/beat-seedo.css')).trim().length > 0);
  for (const step of ['teams','settings','categories']) assert.ok(game.includes(`data-setup-panel="${step}"`));
  assert.ok((await read('/games/family-challenge/js/setupFlow.js')).includes('popstate'));

  const local = JSON.parse(await read('/data/generated/question-bank.json'));
  assert.equal(local.length, expected.length);
  assert.equal(new Set(local.filter(q=>q.active).map(q=>q.category_id)).size, expectedCategories.size);
  assert.equal(local.filter(q=>q.active && q.category_id==='fc-image-fruits' && q.answer.includes('—')).length,125);
  assert.equal(local.filter(q=>q.active && q.category_id==='fc-image-animals' && q.answer.includes('—')).length,245);
  assert.equal(local.filter(q=>q.active && q.category_id==='fc-disney' && q.media_type!=='none').length,0);
  assert.equal(local.filter(q=>q.active && q.category_id==='fc-disney' && q.answer_media).length,250);

  const ctx = { window: {}, console, fetch, URL, URLSearchParams, Headers, Request, Response, WebSocket,
    setTimeout, clearTimeout, setInterval, clearInterval, AbortController, AbortSignal, TextEncoder, TextDecoder,
    document: { querySelector: () => ({ src: base + '/shared/js/contentStore.js' }) } };
  ctx.globalThis = ctx; vm.createContext(ctx);
  const sdk = await fetch('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0'); assert.equal(sdk.status, 200);
  vm.runInContext(await sdk.text(), ctx); ctx.window.supabase = ctx.supabase;
  for (const file of ['/js/config.js','/shared/js/supabaseClient.js','/shared/js/contentStore.js','/shared/js/sessionQuestions.js']) vm.runInContext(await read(file), ctx);
  const payload = await ctx.window.PlatformContent.loadGame('family-challenge');
  assert.equal(payload.categories.length, expectedCategories.size);
  assert.equal(payload.categories.reduce((n,c)=>n+c.questions.length,0), expected.filter(q=>q.active).length);
  const disney = payload.categories.find(c=>c.id==='fc-disney');
  assert.ok(disney && disney.questions.length===250);
  assert.ok(disney.questions.every(q=>q.media.type==='none'));
  assert.ok(disney.questions.every(q=>q.answerMedia?.provider==='wikipedia-search'));
  assert.equal(ctx.window.APP_CONFIG.version, expectedVersion, 'Deployed version must match local js/config.js');
  assert.ok(payload.sessionSettings?.timerOptions?.includes(0));
  assert.ok(Array.isArray(payload.sessionSettings?.questionsPerLevelOptions));
  assert.deepEqual(Array.from(payload.sessionSettings.questionsPerLevelOptions), [1,2,3,4]);
  console.log(JSON.stringify({ok:true,source:useLocalFiles ? 'local files + live Supabase' : 'deployment + live Supabase',base,categories:payload.categories.length,questions:payload.categories.reduce((n,c)=>n+c.questions.length,0),version:ctx.window.APP_CONFIG.version},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
