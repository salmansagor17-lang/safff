(async function () {
  const sourceStatus = document.getElementById("sourceStatus");
  const questionBankCount = document.getElementById("questionBankCount");

  try {
    const payload = await window.PlatformContent.loadGame("family-challenge");
    const total = payload.categories.reduce((sum, category) => sum + category.questions.length, 0);
    questionBankCount.textContent = total.toLocaleString("ar-SA");
    sourceStatus.textContent = "بنك الأسئلة متصل بـ Supabase";
    sourceStatus.className = "cloud-status online";
  } catch (error) {
    console.error("Supabase load failed:", error);

    try {
      const response = await fetch("data/question-bank-v0.8.1.json", { cache: "no-store" });
      const rows = await response.json();
      questionBankCount.textContent = Array.isArray(rows) ? rows.length.toLocaleString("ar-SA") : "1500";
      sourceStatus.textContent = "بنك محلي احتياطي (الأسئلة النصية)";
    } catch {
      questionBankCount.textContent = "1500";
      sourceStatus.textContent = "وضع احتياطي";
    }

    sourceStatus.className = "cloud-status offline";
  }
})();
