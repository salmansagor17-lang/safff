const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

const source = fs.readFileSync(path.join(__dirname, "../shared/js/contentStore.js"), "utf8");

function fixture(size, cap = 1000, failAt = Infinity) {
  const rows = Array.from({ length: size }, (_, i) => ({
    id: `q-${i}`, category_id: "images", points: 100,
    media_type: "image", media_path: `image-${i}.jpg`
  }));
  const orders = [];
  const client = { from(table) {
    const query = {
      select() { return this; }, eq() { return this; },
      order(column) {
        if (table === "game_questions") orders.push(column);
        return this;
      },
      maybeSingle() { return Promise.resolve({ data: { id: "family-challenge" } }); },
      range(from, to) {
        return Promise.resolve(from >= failAt
          ? { error: new Error("Page failed") }
          : { data: rows.slice(from, Math.min(to + 1, from + cap)), count: size });
      },
      then(resolve, reject) {
        return Promise.resolve({ data: [{ id: "images", title: "Images", image_path: "categories/test.jpg", image_alt: "Cover" }] }).then(resolve, reject);
      }
    };
    return query;
  } };
  const context = { window: { AppSupabase: { getClient: () => client } } };
  vm.runInNewContext(source, context);
  return { load: () => context.window.PlatformContent.loadGame("family-challenge"), orders };
}

for (const size of [0, 500, 2000, 2001]) {
  test(`loads all ${size} questions without duplicates`, async () => {
    const { load, orders } = fixture(size);
    const result = await load();
    const questions = result.categories[0].questions;
    assert.equal(result.categories[0].imagePath, "categories/test.jpg");
    assert.equal(result.categories[0].imageAlt, "Cover");
    assert.equal(questions.length, size);
    assert.equal(new Set(questions.map(q => q.id)).size, size);
    for (let i = 0; i < orders.length; i += 2) assert.deepEqual(orders.slice(i, i + 2), ["sort_order", "id"]);
  });
}

test("handles a server limit smaller than the requested page", async () => {
  const result = await fixture(1200, 100).load();
  assert.equal(result.categories[0].questions.length, 1200);
});

test("rejects a later page failure instead of returning a partial bank", async () => {
  await assert.rejects(fixture(2000, 1000, 500).load(), /Page failed/);
});
