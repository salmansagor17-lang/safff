(async function () {
  const questionBankCount = document.getElementById("questionBankCount");
  const categoryCount = document.getElementById("categoryCount");

  try {
    const payload = await window.PlatformContent.loadGame("family-challenge");
    const total = payload.categories.reduce((sum, category) => sum + category.questions.length, 0);
    questionBankCount.textContent = total.toLocaleString("ar-SA");
    categoryCount.textContent = payload.categories.length.toLocaleString("ar-SA");
  } catch (error) {
    console.error("Supabase load failed:", error);

    try {
      const response = await fetch("data/generated/question-bank.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Question bank unavailable");
      const rows = await response.json();
      if (!Array.isArray(rows)) throw new Error("Invalid question bank");
      questionBankCount.textContent = rows.length.toLocaleString("ar-SA");
      categoryCount.textContent = new Set(rows.map(row => row.category_id)).size.toLocaleString("ar-SA");
    } catch {
      questionBankCount.textContent = "—";
      categoryCount.textContent = "—";
    }

  }
})();
