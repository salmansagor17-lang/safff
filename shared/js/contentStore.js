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


  async function loadAnswerMedia(client, gameId) {
    const { data, error } = await client.from("question_media")
      .select("question_id,stage,media_type,provider,media_path,external_url,lookup_query,fallback_query,alt,source_url,sort_order,metadata")
      .eq("game_id", gameId)
      .eq("stage", "answer")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("Optional answer media load failed:", error);
      return new Map();
    }

    const byQuestion = new Map();
    for (const item of data || []) {
      if (!byQuestion.has(item.question_id)) {
        byQuestion.set(item.question_id, {
          type: item.media_type || "image",
          provider: item.provider || "supabase",
          path: item.media_path || null,
          externalUrl: item.external_url || null,
          lookupQuery: item.lookup_query || null,
          fallbackQuery: item.fallback_query || null,
          alt: item.alt || "",
          sourceUrl: item.source_url || null,
          metadata: item.metadata || {}
        });
      }
    }
    return byQuestion;
  }
  async function loadSessionSettings(client, gameId) {
    const { data, error } = await client.from("game_session_settings")
      .select("game_id,default_timer_seconds,allow_no_timer,timer_options,default_questions_per_level,questions_per_level_options,default_questions_per_category,questions_per_category_options,min_categories,max_categories")
      .eq("game_id", gameId)
      .maybeSingle();

    if (error) {
      console.warn("Optional session settings load failed:", error);
      return null;
    }

    return data ? {
      defaultTimerSeconds: Number(data.default_timer_seconds ?? 30),
      allowNoTimer: data.allow_no_timer !== false,
      timerOptions: Array.isArray(data.timer_options) ? data.timer_options.map(Number) : [0, 15, 30, 45, 60],
      defaultQuestionsPerLevel: Number(data.default_questions_per_level ?? 2),
      questionsPerLevelOptions: Array.isArray(data.questions_per_level_options) ? data.questions_per_level_options.map(Number) : [1, 2, 3, 4],
      defaultQuestionsPerCategory: Number(data.default_questions_per_category ?? 6),
      questionsPerCategoryOptions: Array.isArray(data.questions_per_category_options) ? data.questions_per_category_options.map(Number) : [3, 6, 9, 12],
      minCategories: Number(data.min_categories ?? 2),
      maxCategories: Number(data.max_categories ?? 5)
    } : null;
  }

  async function loadDifficultyLevels(client, gameId) {
    const { data, error } = await client.from("game_difficulty_levels")
      .select("points,label_ar,label_en,sort_order,active")
      .eq("game_id", gameId)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("Optional difficulty levels load failed:", error);
      return [];
    }

    return (data || []).map(item => ({
      points: Number(item.points),
      labelAr: item.label_ar || String(item.points),
      labelEn: item.label_en || "",
      sortOrder: Number(item.sort_order || 0)
    }));
  }


  async function loadGame(gameId) {
    const client = getClient();

    const [gameResult, categoriesResult, questions, answerMediaByQuestion, sessionSettings, difficultyLevels] = await Promise.all([
      client.from("games").select("id,title,description,icon,status,settings").eq("id", gameId).maybeSingle(),
      client.from("game_categories").select("id,game_id,title,sort_order,active,image_path,image_alt").eq("game_id", gameId).eq("active", true).order("sort_order", { ascending: true }),
      loadQuestions(client, gameId),
      loadAnswerMedia(client, gameId),
      loadSessionSettings(client, gameId),
      loadDifficultyLevels(client, gameId)
    ]);

    if (gameResult.error) throw gameResult.error;
    if (categoriesResult.error) throw categoriesResult.error;

    const questionsByCategory = new Map();
    for (const question of questions) {
      if (!questionsByCategory.has(question.category_id)) questionsByCategory.set(question.category_id, []);
      questionsByCategory.get(question.category_id).push({
        id: question.id,
        categoryId: question.category_id,
        points: Number(question.points),
        type: question.type,
        question: question.question,
        answer: question.answer,
        options: Array.isArray(question.options) ? question.options : [],
        media: { type: question.media_type || "none", path: question.media_path || null, alt: question.media_alt || "" },
        answerMedia: answerMediaByQuestion.get(question.id) || null,
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

    return { game: gameResult.data, categories, sessionSettings, difficultyLevels };
  }

  function getPublicMediaUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith("site:")) {
      const script = document.querySelector('script[src$="shared/js/contentStore.js"]');
      return new URL(path.slice(5), new URL("../../", script.src)).href;
    }
    const { data } = getClient().storage.from(window.APP_CONFIG.mediaBucket).getPublicUrl(path);
    return data?.publicUrl || null;
  }



  const wikipediaImageCache = new Map();

  async function resolveWikipediaImage(searchQuery) {
    const query = String(searchQuery || "").trim();
    if (!query) return null;
    if (wikipediaImageCache.has(query)) return wikipediaImageCache.get(query);

    const task = (async () => {
      const url = new URL("https://en.wikipedia.org/w/api.php");
      url.search = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: query,
        gsrnamespace: "0",
        gsrlimit: "3",
        prop: "pageimages|info",
        inprop: "url",
        piprop: "thumbnail",
        pithumbsize: "1000",
        format: "json",
        origin: "*"
      });

      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error(`Wikipedia image HTTP ${response.status}`);
      const payload = await response.json();
      const pages = Object.values(payload?.query?.pages || {});
      const page = pages.find(item => item?.thumbnail?.source);
      if (!page) return null;
      return {
        url: page.thumbnail.source,
        sourceUrl: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(String(page.title || "").replaceAll(" ", "_"))}`,
        title: page.title || query
      };
    })().catch(error => {
      console.warn("Wikipedia answer image lookup failed:", query, error);
      return null;
    });

    wikipediaImageCache.set(query, task);
    return task;
  }

  async function resolveAnswerMedia(media) {
    if (!media || media.type !== "image") return null;

    if (media.provider === "supabase" && media.path) {
      return { url: getPublicMediaUrl(media.path), sourceUrl: media.sourceUrl || null, alt: media.alt || "صورة الإجابة" };
    }
    if (media.provider === "external" && media.externalUrl) {
      return { url: media.externalUrl, sourceUrl: media.sourceUrl || media.externalUrl, alt: media.alt || "صورة الإجابة" };
    }
    if (media.provider === "wikipedia-search") {
      const primary = await resolveWikipediaImage(media.lookupQuery);
      const resolved = primary || await resolveWikipediaImage(media.fallbackQuery);
      return resolved ? { ...resolved, alt: media.alt || resolved.title || "صورة الإجابة" } : null;
    }
    return null;
  }

  window.PlatformContent = Object.freeze({ loadGame, getPublicMediaUrl, resolveAnswerMedia });
})();
