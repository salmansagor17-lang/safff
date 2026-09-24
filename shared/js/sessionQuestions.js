(function () {
  const levels = [100, 200, 300, 400, 500];
  const perLevel = 2;
  const maxCategories = 5;

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

  function isPlayable(category) {
    return poolsFor(category).every(pool => pool.length >= perLevel);
  }

  function build(categories, selectedIds, random = Math.random) {
    if (new Set(selectedIds).size > maxCategories) throw new RangeError('اختر خمسة تصنيفات كحد أقصى.');
    return categories.filter(c => selectedIds.includes(c.id) && isPlayable(c)).map(category => ({
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

  window.SessionQuestions = Object.freeze({ build, isPlayable, perLevel, levels, maxCategories });
})();
