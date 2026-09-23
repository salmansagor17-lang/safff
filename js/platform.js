(async function () {
  const questionBankCount = document.getElementById("questionBankCount");

  try {
    const payload = await window.PlatformContent.loadGame("family-challenge");
    const total = payload.categories.reduce((sum, category) => sum + category.questions.length, 0);
    questionBankCount.textContent = total.toLocaleString("ar-SA");
  } catch (error) {
    console.error("Supabase load failed:", error);

    try {
      const response = await fetch("data/question-bank-v0.8.1.json", { cache: "no-store" });
      const rows = await response.json();
      questionBankCount.textContent = Array.isArray(rows) ? rows.length.toLocaleString("ar-SA") : "1500";
    } catch {
      questionBankCount.textContent = "1500";
    }

  }
})();
