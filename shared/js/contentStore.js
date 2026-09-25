(function () {
  function getClient() {
    return window.AppSupabase.getClient();
  }

  async function loadQuestions(client, gameId) {
    const questions = [];
    const pageSize = 500;
    let total = null;

    do {
      const { data, error, count } = await client.from("game_questions")
        .select("id,game_id,category_id,points,type,question,answer,options,media_type,media_path,media_alt,sort_order,active,metadata", { count: "exact" })
        .eq("game_id", gameId).eq("active", true)
        .order("sort_order", { ascending: true }).order("id", { ascending: true })
        .range(questions.length, questions.length + pageSize - 1);

      if (error) throw error;
      total = count;
      if (!data?.length) {
        if (total !== null && questions.length < total) throw new Error("Question bank response is incomplete.");
        break;
      }
      questions.push(...data);
    } while (total === null || questions.length < total);

    return questions;
  }

  async function loadGame(gameId) {
    const client = getClient();

    const [gameResult, categoriesResult, questions] = await Promise.all([
      client.from("games").select("id,title,description,icon,status,settings").eq("id", gameId).maybeSingle(),
      client.from("game_categories").select("id,game_id,title,sort_order,active,image_path,image_alt").eq("game_id", gameId).eq("active", true).order("sort_order", { ascending: true }),
      loadQuestions(client, gameId)
    ]);

    if (gameResult.error) throw gameResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    const questionsByCategory = new Map();
    for (const question of questions) {
      if (!questionsByCategory.has(question.category_id)) questionsByCategory.set(question.category_id, []);
      questionsByCategory.get(question.category_id).push({
        id: question.id,
        points: Number(question.points),
        type: question.type,
        question: question.question,
        answer: question.answer,
        options: Array.isArray(question.options) ? question.options : [],
        media: { type: question.media_type || "none", path: question.media_path || null, alt: question.media_alt || "" },
        metadata: question.metadata || {}
      });
    }

    const categories = (categoriesResult.data || []).map(category => ({
      id: category.id,
      category: category.title,
      imagePath: category.image_path || null,
      imageAlt: category.image_alt || "",
      questions: questionsByCategory.get(category.id) || []
    }));

    return { game: gameResult.data, categories };
  }

  function getPublicMediaUrl(path) {
    if (!path) return null;
    if (/^site:media\/flags\/[a-z]{2}\.svg$/.test(path)) {
      const script = document.querySelector('script[src$="shared/js/contentStore.js"]');
      return new URL(path.slice(5), new URL("../../", script.src)).href;
    }
    const { data } = getClient().storage.from(window.APP_CONFIG.mediaBucket).getPublicUrl(path);
    return data?.publicUrl || null;
  }

  window.PlatformContent = Object.freeze({ loadGame, getPublicMediaUrl });
})();
