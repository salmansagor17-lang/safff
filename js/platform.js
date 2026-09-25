(async function () {
  const questionBankCount = document.getElementById("questionBankCount");
  const categoryCount = document.getElementById("categoryCount");
  const categoryGrid = document.getElementById("homeCategoryGrid");

  const categoryColors = ["#6366F1", "#06B6D4", "#F59E0B", "#EC4899", "#22C55E", "#A78BFA", "#38BDF8", "#FB7185", "#FCD34D", "#4ADE80"];

  try {
    const payload = await window.PlatformContent.loadGame("family-challenge");
    renderSummary(payload.categories);
    renderCategories(payload.categories);
  } catch (error) {
    console.error("Supabase load failed:", error);

    try {
      const response = await fetch("data/generated/question-bank.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Question bank unavailable");
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid question bank");
      const fallbackCategories = buildFallbackCategories(rows);
      renderSummary(fallbackCategories);
      renderCategories(fallbackCategories);
    } catch {
      if (questionBankCount) questionBankCount.textContent = "—";
      if (categoryCount) categoryCount.textContent = "—";
      if (categoryGrid) categoryGrid.innerHTML = '<div class="category-loading">تعذر تحميل التصنيفات حاليًا.</div>';
    }
  }

  function renderSummary(categories) {
    const total = categories.reduce((sum, category) => sum + category.questions.length, 0);
    if (questionBankCount) questionBankCount.textContent = total.toLocaleString("ar-SA");
    if (categoryCount) categoryCount.textContent = categories.length.toLocaleString("ar-SA");
  }

  function renderCategories(categories) {
    if (!categoryGrid) return;
    categoryGrid.replaceChildren();

    categories.forEach((category, index) => {
      const card = document.createElement("a");
      card.className = "home-category-card";
      card.href = "games/family-challenge/index.html#categories";
      card.style.setProperty("--cat-color", categoryColors[index % categoryColors.length]);

      const image = document.createElement("img");
      const fallback = `media/categories/${category.id}.svg`;
      image.src = category.imagePath ? window.PlatformContent.getPublicMediaUrl(category.imagePath) : fallback;
      image.alt = category.imageAlt || category.category || "";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        if (image.src.endsWith(fallback)) return;
        image.src = fallback;
      });

      const overlay = document.createElement("span");
      overlay.className = "category-overlay";
      const title = document.createElement("strong");
      title.textContent = category.category;
      const count = document.createElement("small");
      count.textContent = `${category.questions.length.toLocaleString("ar-SA")} سؤال`;
      overlay.append(title, count);
      card.append(image, overlay);
      categoryGrid.appendChild(card);
    });
  }

  function buildFallbackCategories(rows) {
    const groups = new Map();
    rows.filter(row => row.active !== false).forEach(row => {
      const id = row.category_id;
      if (!groups.has(id)) {
        groups.set(id, {
          id,
          category: row.category || id,
          imagePath: row.category_image_path || `site:media/categories/${id}.svg`,
          imageAlt: row.category_image_alt || row.category || id,
          questions: []
        });
      }
      groups.get(id).questions.push(row);
    });
    return [...groups.values()];
  }
})();
