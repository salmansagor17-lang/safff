(function () {
  const levels = [100, 300, 500];
  const defaultPerLevel = 2;
  const defaultMaxCategories = 5;

  function sample(pool, count, random) {
    const shuffled = [...pool];
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(random() * (shuffled.length - i));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  function poolsFor(category) {
    const unique = [...new Map(category.questions.map(q => [q.id, q])).values()];
    return levels.map(points => unique.filter(q => Number(q.points) === points));
  }

  function normalizePositiveInteger(value, fallback) {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : fallback;
  }

  function isPlayable(category, perLevel = defaultPerLevel, arrayCallbackSource) {
    // Array.prototype.every passes (item, index, array). Ignore that index so
    // older callers using categories.every(isPlayable) keep the default rule.
    const requested = Array.isArray(arrayCallbackSource) ? defaultPerLevel : perLevel;
    const required = normalizePositiveInteger(requested, defaultPerLevel);
    return poolsFor(category).every(pool => pool.length >= required);
  }

  function build(categories, selectedIds, options = {}, random = Math.random) {
    // Backwards compatibility with the old build(categories, ids, random) signature.
    if (typeof options === "function") {
      random = options;
      options = {};
    }

    const perLevel = normalizePositiveInteger(options.perLevel, defaultPerLevel);
    const maxCategories = normalizePositiveInteger(options.maxCategories, defaultMaxCategories);

    if (new Set(selectedIds).size > maxCategories) {
      const label = maxCategories === 5 ? "خمسة" : String(maxCategories);
      throw new RangeError(`اختر ${label} تصنيفات كحد أقصى.`);
    }

    return categories
      .filter(category => selectedIds.includes(category.id) && isPlayable(category, perLevel))
      .map(category => ({
        ...category,
        questions: poolsFor(category).flatMap(pool => {
          // Prefer different pictured subjects when the bank has multiple photos of each.
          const groups = new Map();
          for (const q of pool) {
            const key = q.metadata?.subject_slug || q.id;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(q);
          }

          const distinct = [...groups.values()].map(group => sample(group, 1, random)[0]);
          const chosen = sample(distinct, Math.min(perLevel, distinct.length), random);

          if (chosen.length < perLevel) {
            const ids = new Set(chosen.map(q => q.id));
            chosen.push(...sample(pool.filter(q => !ids.has(q.id)), perLevel - chosen.length, random));
          }

          return chosen.map(q => ({ ...q, round: 1 }));
        })
      }));
  }

  window.SessionQuestions = Object.freeze({
    build,
    isPlayable,
    poolsFor,
    levels,
    defaultPerLevel,
    defaultMaxCategories,
    // Kept for older code/tests that read these properties.
    perLevel: defaultPerLevel,
    maxCategories: defaultMaxCategories
  });
})();
