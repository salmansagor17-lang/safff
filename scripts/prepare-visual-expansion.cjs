// Prepares content files and a reviewable SQL transaction. Does not write to Supabase.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const write = (file, text) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
const ctx = { window: {} }; vm.runInNewContext(read('js/config.js'), ctx);
const config = ctx.window.APP_CONFIG;
const curated = JSON.parse(read('data/visual-expansion.json'));
const titles = {
  'fc-image-fruits': 'صور الفواكه 🍎', 'fc-image-animals': 'صور الحيوانات 🐾',
  'fc-image-landmarks': 'صور المعالم 🏛️', 'fc-image-flags': 'أعلام الدول 🏳️', 'fc-symbols': 'فك الرموز 🧩'
};

async function main() {
  const backupFile = '.local-backups/before-visual-expansion.json';
  let backup;
  if (fs.existsSync(path.join(root, backupFile))) backup = JSON.parse(read(backupFile));
  else {
    const get = async route => {
      const r = await fetch(`${config.supabaseUrl}/rest/v1/${route}`, { headers: { apikey: config.supabasePublishableKey } });
      assert.equal(r.status, 200); return r.json();
    };
    const categories = await get('game_categories?select=*&game_id=eq.family-challenge');
    const questions = [];
    for (let offset = 0; ; offset += 500) {
      const batch = await get(`game_questions?select=*&game_id=eq.family-challenge&order=id&limit=500&offset=${offset}`);
      questions.push(...batch); if (batch.length < 500) break;
    }
    backup = { categories, questions };
    write(backupFile, JSON.stringify(backup, null, 2));
  }
  assert.equal(backup.questions.length, 2000, 'Expected the original bank snapshot');
  const rows = [];
  const flagVersion = '7.3.2';
  const flagBase = `https://cdn.jsdelivr.net/npm/flag-icons@${flagVersion}`;
  for (const [points, entries] of Object.entries(curated.flags)) {
    for (const [code, answer] of entries) {
      const r = await fetch(`${flagBase}/flags/4x3/${code}.svg`);
      assert.equal(r.status, 200);
      const svg = await r.text();
      assert.match(svg, /<svg/); assert.doesNotMatch(svg, /<script|<foreignObject|\bonload\s*=/i);
      write(`media/flags/${code}.svg`, svg);
      rows.push({ id: `fc-flags-${code}`, game_id: 'family-challenge', category_id: 'fc-image-flags', points: Number(points),
        type: 'text', question: 'لأي دولة هذا العلم؟', answer, options: [], media_type: 'image',
        media_path: `site:media/flags/${code}.svg`, media_alt: 'علم دولة — ما اسمها؟', sort_order: 21000 + rows.length, active: true,
        metadata: { subject_slug: code, subject_type: 'flag', source: 'flag-icons', license: 'MIT', bank_version: '0.9.0', source_url: 'https://github.com/lipis/flag-icons', asset_version: flagVersion } });
    }
  }
  const license = await fetch(`${flagBase}/LICENSE`); assert.equal(license.status, 200);
  write('media/flags/LICENSE.txt', await license.text());
  for (const [points, entries] of Object.entries(curated.symbols)) {
    entries.forEach(([symbols, answer, hint], index) => rows.push({
      id: `fc-symbols-${points}-${String(index + 1).padStart(2, '0')}`, game_id: 'family-challenge', category_id: 'fc-symbols', points: Number(points),
      type: 'text', question: 'فك الرموز: ما الكلمة أو العبارة المقصودة؟', answer, options: [], media_type: 'none', media_path: null, media_alt: '',
      sort_order: 22000 + Number(points) + index, active: true, metadata: { symbols, hint, puzzle_type: 'symbols', bank_version: '0.9.0' }
    }));
  }
  assert.equal(rows.length, 100);
  const categories = Object.entries(titles).map(([id, title], i) => ({ id, title, game_id: 'family-challenge', sort_order: i + 7, active: true }));
  const mapping = { fruit: 'fc-image-fruits', animal: 'fc-image-animals', landmark: 'fc-image-landmarks' };
  const allCategories = [...backup.categories.filter(c => c.id !== 'fc-images'), ...categories];
  const bank = backup.questions.map(q => {
    const category_id = q.category_id === 'fc-images' ? mapping[q.metadata.subject_type] : q.category_id;
    assert.ok(category_id);
    return { ...q, category_id, category: allCategories.find(c => c.id === category_id).title };
  }).concat(rows.map(q => ({ ...q, category: titles[q.category_id] })));
  // Full fallback bank matches the online categories; existing photos still need Storage access.
  write('data/question-bank-v0.9.0.json', JSON.stringify(bank));
  const miniature = allCategories.map(c => ({ id: c.id, category: c.title,
    questions: [100,200,300,400,500].flatMap(points => {
      const candidates = bank.filter(q => q.category_id === c.id && q.points === points);
      const distinct = [...new Map(candidates.map(q => [q.metadata?.subject_slug || q.id, q])).values()];
      assert.ok(distinct.length >= 3);
      return distinct.slice(0,3).map(q => ({ id: q.id, points: q.points, type: q.type, question: q.question, answer: q.answer,
        options: q.options, metadata: q.metadata, media: { type: q.media_type, path: q.media_path, alt: q.media_alt } }));
    }) }));
  write('games/family-challenge/js/defaultQuestions.js', 'const defaultQuestions = ' + JSON.stringify(miniature) + ';\n');
  write('data/visual-expansion-rows.json', JSON.stringify(rows, null, 2));
  write('scripts/visual-expansion.sql', `BEGIN;
INSERT INTO public.game_categories (id,game_id,title,sort_order,active)
SELECT id,game_id,title,sort_order,active FROM jsonb_populate_recordset(null::public.game_categories, $categories$${JSON.stringify(categories)}$categories$::jsonb)
ON CONFLICT (id) DO UPDATE SET title=excluded.title,sort_order=excluded.sort_order,active=excluded.active;
UPDATE public.game_questions SET category_id=CASE metadata->>'subject_type' WHEN 'fruit' THEN 'fc-image-fruits' WHEN 'animal' THEN 'fc-image-animals' WHEN 'landmark' THEN 'fc-image-landmarks' END,updated_at=now()
WHERE game_id='family-challenge' AND category_id='fc-images' AND metadata->>'subject_type' IN ('fruit','animal','landmark');
INSERT INTO public.game_questions (id,game_id,category_id,points,type,question,answer,options,media_type,media_path,media_alt,sort_order,active,metadata)
SELECT id,game_id,category_id,points,type,question,answer,options,media_type,media_path,media_alt,sort_order,active,metadata
FROM jsonb_populate_recordset(null::public.game_questions, $questions$${JSON.stringify(rows)}$questions$::jsonb)
ON CONFLICT (id) DO UPDATE SET category_id=excluded.category_id,points=excluded.points,question=excluded.question,answer=excluded.answer,media_type=excluded.media_type,media_path=excluded.media_path,media_alt=excluded.media_alt,metadata=excluded.metadata,active=excluded.active,updated_at=now();
UPDATE public.game_categories SET active=false WHERE id='fc-images' AND game_id='family-challenge';
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM public.game_categories c CROSS JOIN (VALUES (100),(200),(300),(400),(500)) p(points)
LEFT JOIN public.game_questions q ON q.category_id=c.id AND q.points=p.points AND q.active
WHERE c.game_id='family-challenge' AND c.active GROUP BY c.id,p.points HAVING count(q.id)<3)
THEN RAISE EXCEPTION 'A category has fewer than three questions per level'; END IF;
END $$;
COMMIT;\n`);
  // Rollback changes only this expansion; preserve all original questions and stored photos.
  write('scripts/rollback-visual-expansion.sql', `BEGIN;
DELETE FROM public.game_questions WHERE id IN (SELECT id FROM jsonb_to_recordset($rows$${JSON.stringify(rows.map(q => ({ id: q.id })))}$rows$::jsonb) AS r(id text));
UPDATE public.game_questions SET category_id='fc-images',updated_at=now() WHERE game_id='family-challenge' AND category_id IN ('fc-image-fruits','fc-image-animals','fc-image-landmarks');
UPDATE public.game_categories SET active=false WHERE id IN ('fc-image-fruits','fc-image-animals','fc-image-landmarks','fc-image-flags','fc-symbols');
UPDATE public.game_categories SET active=true WHERE id='fc-images';
COMMIT;\n`);
  console.log(JSON.stringify({ questions: bank.length, categories: allCategories.map(c => ({ title: c.title, count: bank.filter(q => q.category_id === c.id).length })), flags: 50, symbols: 50 }));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
