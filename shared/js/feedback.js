(function () {
  let modal = null;

  function ensureModal() {
    if (modal) return modal;

    modal = document.createElement("div");
    modal.className = "feedback-modal hidden";
    modal.innerHTML = `
      <div class="feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedbackTitle">
        <button class="feedback-close" type="button" aria-label="إغلاق">×</button>
        <h2 id="feedbackTitle">كيف كانت التجربة؟</h2>
        <p>شاركنا تقييمك واقتراحاتك لتكون اللعبة أجمل.</p>

        <div class="feedback-stars" aria-label="التقييم">
          ${[1,2,3,4,5].map(v => `<button type="button" data-rating="${v}" aria-label="${v} من 5">★</button>`).join("")}
        </div>

        <textarea class="feedback-comment" maxlength="1200" rows="4" placeholder="ملاحظة اختيارية…"></textarea>

        <div class="feedback-actions">
          <button type="button" class="feedback-submit">إرسال</button>
          <span class="feedback-message"></span>
        </div>
      </div>
    `;

    const style = document.createElement("style");
    style.textContent = `
      .feedback-modal{position:fixed;inset:0;z-index:3000;background:rgba(2,6,23,.88);display:flex;align-items:center;justify-content:center;padding:20px}
      .feedback-modal.hidden{display:none!important}
      .feedback-dialog{position:relative;width:min(520px,96%);background:#0f172a;border:1px solid #334155;border-radius:22px;padding:26px;color:#fff;box-shadow:0 30px 80px rgba(0,0,0,.35)}
      .feedback-close{position:absolute;left:16px;top:14px;border:0;background:#1e293b;color:#fff;width:36px;height:36px;border-radius:9px;font-size:22px}
      .feedback-badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#172554;border:1px solid #1d4ed8;color:#bfdbfe;font-size:12px;margin-bottom:12px}
      .feedback-dialog h2{margin-bottom:8px}.feedback-dialog p{color:#94a3b8;line-height:1.7}
      .feedback-stars{display:flex;gap:8px;margin:20px 0}
      .feedback-stars button{border:0;background:#1e293b;color:#64748b;border-radius:10px;width:48px;height:48px;font-size:26px}
      .feedback-stars button.active{color:#facc15;background:#422006}
      .feedback-comment{width:100%;resize:vertical;background:#020617;border:1px solid #334155;color:#fff;border-radius:10px;padding:12px;font:inherit}
      .feedback-actions{display:flex;align-items:center;gap:12px;margin-top:14px}
      .feedback-submit{border:0;background:#2563eb;color:#fff;border-radius:10px;padding:11px 18px;font-weight:700}
      .feedback-submit:disabled{opacity:.5;cursor:not-allowed}
      .feedback-message{font-size:13px;color:#94a3b8}
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    modal.querySelector(".feedback-close").addEventListener("click", close);
    modal.addEventListener("click", event => {
      if (event.target === modal) close();
    });

    let rating = 0;
    modal.querySelectorAll("[data-rating]").forEach(button => {
      button.addEventListener("click", () => {
        rating = Number(button.dataset.rating);
        modal.querySelectorAll("[data-rating]").forEach(star => {
          star.classList.toggle("active", Number(star.dataset.rating) <= rating);
        });
      });
    });

    modal.querySelector(".feedback-submit").addEventListener("click", async () => {
      const message = modal.querySelector(".feedback-message");
      const submit = modal.querySelector(".feedback-submit");
      const gameId = modal.dataset.gameId || null;
      const comment = modal.querySelector(".feedback-comment").value.trim();

      if (!rating) {
        message.textContent = "اختر تقييمًا من 1 إلى 5.";
        return;
      }

      submit.disabled = true;
      message.textContent = "جاري الإرسال…";

      try {
        const client = window.AppSupabase.getClient();
        const { error } = await client.from("feedback").insert({
          game_id: gameId || null,
          rating,
          comment,
          app_version: window.APP_CONFIG?.version || "0.8"
        });

        if (error) throw error;

        message.textContent = "شكرًا، وصلت ملاحظتك.";
        setTimeout(close, 900);
      } catch (error) {
        console.error(error);
        message.textContent = "تعذر الإرسال الآن.";
      } finally {
        submit.disabled = false;
      }
    });

    modal._reset = () => {
      rating = 0;
      modal.querySelectorAll("[data-rating]").forEach(star => star.classList.remove("active"));
      modal.querySelector(".feedback-comment").value = "";
      modal.querySelector(".feedback-message").textContent = "";
    };

    return modal;
  }

  function open(gameId = "") {
    const dialog = ensureModal();
    dialog.dataset.gameId = gameId || "";
    dialog._reset();
    dialog.classList.remove("hidden");
  }

  function close() {
    if (modal) modal.classList.add("hidden");
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-feedback-game]");
    if (!trigger) return;
    open(trigger.dataset.feedbackGame || "");
  });

  window.PlatformFeedback = Object.freeze({ open, close });
})();
