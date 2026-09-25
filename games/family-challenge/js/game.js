const GAME_ID = "family-challenge";

let gameQuestions = [];
let sessionCategories = [];
let gameConfig = {
  timerSeconds: 30,
  deductWrong: true,
  allowSteal: true,
  soundEnabled: true,
  selectedCategoryIds: []
};

let teams = [];
let currentTeamIndex = 0;
let currentRound = 1;
const totalRounds = 1;
let currentQuestion = null;
let currentQuestionCard = null;
let answeredQuestionIds = [];
let specialQuestionIds = { 1: null, 2: null };
let currentMultiplier = 1;
let gameEnded = false;

const setupScreen = document.getElementById("setupScreen");
const gameScreen = document.getElementById("gameScreen");
const categoriesContainer = document.getElementById("categories");
const questionModal = document.getElementById("questionModal");
const scoreboard = document.getElementById("scoreboard");
const startButton = document.getElementById("startButton");

bootstrap();

async function bootstrap() {
  try {
    const payload = await window.PlatformContent.loadGame(GAME_ID);
    gameQuestions = payload.categories.filter(category => category.questions.length);
  } catch (error) {
    console.error("Supabase content load failed:", error);

    try {
      gameQuestions = await loadLocalQuestionBank();
    } catch (localError) {
      console.error("Local question bank load failed:", localError);
      gameQuestions = normalizeFallbackQuestions(defaultQuestions);
    }

  }

  gameQuestions = gameQuestions.filter(window.SessionQuestions.isPlayable);
  setRounds();
  buildCategorySelector();
  startButton.disabled = gameQuestions.length < 2;
  startButton.textContent = gameQuestions.length < 2 ? "لا توجد أسئلة كافية" : "ابدأ التحدي";
}


async function loadLocalQuestionBank() {
  const response = await fetch("../../data/question-bank-v0.9.0.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Local bank HTTP ${response.status}`);

  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length < 1) throw new Error("Local bank is empty.");

  const grouped = new Map();

  rows.forEach(row => {
    const categoryId = row.category_id;
    if (!categoryId) return;

    if (!grouped.has(categoryId)) {
      grouped.set(categoryId, {
        id: categoryId,
        category: row.category || categoryId,
        imagePath: row.category_image_path || null,
        imageAlt: row.category_image_alt || "",
        questions: []
      });
    }

    grouped.get(categoryId).questions.push({
      id: row.id,
      points: Number(row.points),
      type: row.type || "text",
      question: row.question,
      answer: row.answer,
      options: Array.isArray(row.options) ? row.options : [],
      media: {
        type: row.media_type || "none",
        path: row.media_path || null,
        alt: row.media_alt || ""
      },
      metadata: row.metadata || {}
    });
  });

  return Array.from(grouped.values());
}

function normalizeFallbackQuestions(source) {
  return (source || []).map((category, categoryIndex) => ({
    id: category.id || `fallback-category-${categoryIndex + 1}`,
    category: category.category,
    imagePath: category.imagePath || null,
    imageAlt: category.imageAlt || "",
    questions: (category.questions || []).map((question, questionIndex) => ({
      id: question.id || `fallback-${categoryIndex + 1}-${questionIndex + 1}`,
      ...question,
      media: question.media || { type: "none", path: null, alt: "" }
    }))
  }));
}

function setRounds() {
  gameQuestions.forEach(category => {
    category.questions.forEach(question => {
      question.round = 1;
    });
  });
}

function categoryImage(category) {
  const image = document.createElement("img");
  image.className = "category-cover";
  image.src = category.imagePath ? window.PlatformContent.getPublicMediaUrl(category.imagePath) : `../../media/categories/${category.id}.svg`;
  image.alt = category.imageAlt || "";
  image.loading = "lazy";
  image.addEventListener("error", () => {
    if (!image.dataset.fallback) {
      image.dataset.fallback = "true";
      image.src = "../../media/categories/fc-general.svg";
    }
  });
  return image;
}

function buildCategorySelector() {
  const selector = document.getElementById("categorySelector");
  selector.innerHTML = "";

  gameQuestions.forEach((category, index) => {
    const label = document.createElement("label");
    label.className = "category-select-card";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = category.id;
    input.checked = index < 5;
    input.addEventListener("change", updateSessionSize);

    const text = document.createElement("span");
    text.className = "category-select-text";
    const name = document.createElement("strong");
    name.textContent = category.category;
    const count = document.createElement("small");
    count.textContent = `${category.questions.length.toLocaleString("ar-SA")} سؤال`;
    text.append(name, count);

    label.append(input, categoryImage(category), text);
    selector.appendChild(label);
  });
  updateSessionSize();
}

function updateSessionSize() {
  const count = document.querySelectorAll("#categorySelector input:checked").length;
  document.querySelectorAll("#categorySelector input").forEach(input => {
    input.disabled = !input.checked && count >= 5;
  });
  startButton.disabled = count < 2 || count > 5;
  document.getElementById("sessionSize").textContent = `${count} / 5 تصنيفات · ${count * window.SessionQuestions.levels.length * window.SessionQuestions.perLevel} سؤالًا · جميع المستويات معًا`;
}

document.querySelectorAll(".timer-option").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".timer-option").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    gameConfig.timerSeconds = Number(button.dataset.time);
  });
});

startButton.addEventListener("click", startNewGame);

function startNewGame() {
  const selected = Array.from(document.querySelectorAll("#categorySelector input:checked"));

  if (selected.length > 5) {
    alert("اختر خمسة تصنيفات كحد أقصى.");
    return;
  }

  if (selected.length < 2) {
    alert("اختر تصنيفين على الأقل.");
    return;
  }

  teams = [
    {
      name: cleanTeamName(document.getElementById("team1Input").value, "الفريق الأول"),
      avatar: document.getElementById("team1Avatar").value,
      score: 0
    },
    {
      name: cleanTeamName(document.getElementById("team2Input").value, "الفريق الثاني"),
      avatar: document.getElementById("team2Avatar").value,
      score: 0
    }
  ];

  gameConfig.selectedCategoryIds = selected.map(item => item.value);
  gameConfig.deductWrong = document.getElementById("deductWrong").checked;
  gameConfig.allowSteal = document.getElementById("allowSteal").checked;
  gameConfig.soundEnabled = document.getElementById("soundEnabled").checked;

  sessionCategories = buildSessionCategories(gameConfig.selectedCategoryIds);

  if (sessionCategories.length < 2) {
    alert("التصنيفات المختارة لا تحتوي على مستويات أسئلة كافية.");
    return;
  }

  currentRound = 1;
  answeredQuestionIds = [];
  currentTeamIndex = Math.floor(Math.random() * 2);
  gameEnded = false;



  selectSpecialQuestions();
  openGameScreen();
}

function cleanTeamName(value, fallback) {
  const result = String(value || "").trim().slice(0, 30);
  return result || fallback;
}

function buildSessionCategories(selectedIds) {
  return window.SessionQuestions.build(gameQuestions, selectedIds);
}

function getSelectedCategories() {
  if (sessionCategories.length) return sessionCategories;
  return gameQuestions.filter(category => gameConfig.selectedCategoryIds.includes(category.id));
}

function selectSpecialQuestions() {
  specialQuestionIds = { 1: null, 2: null };

  for (let round = 1; round <= totalRounds; round++) {
    const available = [];
    getSelectedCategories().forEach(category => {
      category.questions
        .filter(question => question.round === round)
        .forEach(question => available.push(question));
    });

    if (available.length) {
      specialQuestionIds[round] = available[Math.floor(Math.random() * available.length)].id;
    }
  }
}

function openGameScreen() {
  window.SetupFlow?.begin();
  setupScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  scoreboard.classList.remove("hidden");
  document.getElementById("gameInfo").classList.remove("hidden");

  renderScoreboard();
  createGameBoard();
  updateCurrentTurn();
  updateProgress();
}

function renderScoreboard() {
  scoreboard.innerHTML = "";

  teams.forEach((team, index) => {
    const panel = document.createElement("div");
    panel.className = `team-panel ${index === currentTeamIndex ? "active" : ""}`;

    const avatar = document.createElement("div");
    avatar.className = "team-avatar";
    avatar.textContent = team.avatar;

    const name = document.createElement("h2");
    name.textContent = team.name;

    const score = document.createElement("div");
    score.className = "score";
    score.textContent = team.score;

    panel.append(avatar, name, score);
    scoreboard.appendChild(panel);
  });
}

function getCurrentRoundQuestions() {
  const result = [];
  getSelectedCategories().forEach(category => {
    category.questions
      .filter(question => question.round === currentRound)
      .forEach(question => result.push(question));
  });
  return result;
}

function createGameBoard() {
  categoriesContainer.innerHTML = "";
  const selectedCategories = getSelectedCategories();

  categoriesContainer.style.gridTemplateColumns =
    `repeat(${Math.max(1, Math.min(5, selectedCategories.length))}, minmax(0,1fr))`;

  selectedCategories.forEach(categoryData => {
    const category = document.createElement("div");
    category.className = "category";

    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = categoryData.category;
    category.appendChild(categoryImage(categoryData));
    category.appendChild(title);

    const list = document.createElement("div");
    list.className = "questions";

    categoryData.questions
      .filter(question => question.round === currentRound)
      .forEach((question, index) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = `question-card level-${question.points}`;
        const pointValue = document.createElement("strong");
        pointValue.textContent = question.points;
        const difficulty = document.createElement("span");
        difficulty.textContent = `${getDifficultyLabel(question.points)} · ${(index % 2) + 1} / 2`;
        card.setAttribute("aria-label", `${categoryData.category}، ${question.points} نقطة، السؤال ${(index % 2) + 1} من 2`);
        card.append(pointValue, difficulty);

        if (answeredQuestionIds.includes(question.id)) card.classList.add("used");

        card.addEventListener("click", () => {
          if (!answeredQuestionIds.includes(question.id)) {
            openQuestion(question, card, categoryData.category);
          }
        });

        list.appendChild(card);
      });

    category.appendChild(list);
    categoriesContainer.appendChild(category);
  });
}

function getDifficultyLabel(points) {
  const labels = { 100: "سهل", 300: "متوسط", 500: "صعب" };
  return labels[Number(points)] || "";
}

function openQuestion(question, card, categoryName) {
  currentQuestion = question;
  currentQuestionCard = card;

  const isSpecial = specialQuestionIds[currentRound] === question.id;
  currentMultiplier = isSpecial ? 2 : 1;
  const actualPoints = Number(question.points) * currentMultiplier;

  document.getElementById("questionCategory").textContent = categoryName;
  document.getElementById("questionPoints").textContent = `${actualPoints} نقطة`;
  document.getElementById("questionText").textContent = question.question;
  const symbols = document.getElementById("questionSymbols");
  symbols.textContent = question.metadata?.symbols || "";
  symbols.classList.toggle("hidden", !question.metadata?.symbols);
  const hint = document.getElementById("questionHint");
  hint.textContent = question.metadata?.hint || "";
  hint.classList.toggle("hidden", !question.metadata?.hint);
  document.getElementById("answerText").textContent = question.answer;
  document.getElementById("specialQuestion").classList.toggle("hidden", !isSpecial);

  const team = teams[currentTeamIndex];
  document.getElementById("playingTeam").textContent = `${team.avatar} السؤال لـ ${team.name}`;

  renderQuestionMedia(question);
  renderQuestionOptions(question);

  document.getElementById("answerArea").classList.add("hidden");
  document.getElementById("showAnswerButton").classList.remove("hidden");

  updateResultButtons();
  questionModal.classList.remove("hidden");
  startTimer(gameConfig.timerSeconds, handleTimeout);
}

function renderQuestionMedia(question) {
  const container = document.getElementById("questionMedia");
  container.innerHTML = "";
  container.classList.add("hidden");

  const media = question.media || { type: "none", path: null, alt: "" };
  if (!media.path || media.type === "none") return;

  const url = window.PlatformContent.getPublicMediaUrl(media.path);
  if (!url) return;

  if (media.type === "image") {
    const image = document.createElement("img");
    image.src = url;
    image.alt = media.alt || "صورة السؤال";
    image.loading = "eager";
    image.decoding = "async";
    container.appendChild(image);

    const sourceUrl = question.metadata?.source_url;
    if (sourceUrl) {
      const credit = document.createElement("div");
      credit.className = "media-credit";

      const sourceLink = document.createElement("a");
      sourceLink.href = sourceUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noopener noreferrer";
      sourceLink.textContent = "مصدر الصورة";
      credit.appendChild(sourceLink);

      const author = String(question.metadata?.author || "").trim();
      const license = String(question.metadata?.license || "").trim();
      if (author) {
        const authorText = document.createElement("span");
        authorText.textContent = `المصور/المصدر: ${author}`;
        credit.appendChild(authorText);
      }

      if (license) {
        const licenseUrl = question.metadata?.license_url;
        if (licenseUrl) {
          const licenseLink = document.createElement("a");
          licenseLink.href = licenseUrl;
          licenseLink.target = "_blank";
          licenseLink.rel = "noopener noreferrer";
          licenseLink.textContent = license;
          credit.appendChild(licenseLink);
        } else {
          const licenseText = document.createElement("span");
          licenseText.textContent = license;
          credit.appendChild(licenseText);
        }
      }

      container.appendChild(credit);
    }
  } else if (media.type === "audio") {
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    audio.preload = "metadata";
    container.appendChild(audio);
  }

  if (container.children.length) container.classList.remove("hidden");
}

function renderQuestionOptions(question) {
  const container = document.getElementById("questionOptions");
  container.innerHTML = "";

  if (!question.options || !question.options.length) return;

  question.options.forEach(option => {
    const item = document.createElement("div");
    item.className = "question-option";
    item.textContent = option;
    container.appendChild(item);
  });
}

document.getElementById("showAnswerButton").addEventListener("click", revealAnswer);

function revealAnswer() {
  stopTimer();
  document.getElementById("showAnswerButton").classList.add("hidden");
  document.getElementById("answerArea").classList.remove("hidden");
}

function getOtherTeamIndex() {
  return currentTeamIndex === 0 ? 1 : 0;
}

function updateResultButtons() {
  const current = teams[currentTeamIndex];
  const other = teams[getOtherTeamIndex()];

  document.getElementById("currentTeamCorrect").textContent =
    `✓ ${current.avatar} ${current.name}`;

  const stealButton = document.getElementById("otherTeamCorrect");
  stealButton.textContent = `⚡ ${other.avatar} ${other.name}`;
  stealButton.classList.toggle("hidden", !gameConfig.allowSteal);
}

document.getElementById("currentTeamCorrect").addEventListener("click", () => {
  teams[currentTeamIndex].score += Number(currentQuestion.points) * currentMultiplier;
  playCorrectSound();
  finishQuestion();
});

document.getElementById("otherTeamCorrect").addEventListener("click", () => {
  teams[getOtherTeamIndex()].score += Number(currentQuestion.points) * currentMultiplier;
  playCorrectSound();
  finishQuestion();
});

document.getElementById("nobodyCorrect").addEventListener("click", () => {
  if (gameConfig.deductWrong) {
    teams[currentTeamIndex].score -= Number(currentQuestion.points) * currentMultiplier;
  }
  playWrongSound();
  finishQuestion();
});

function handleTimeout() {
  playTimeoutSound();
  revealAnswer();
}

function finishQuestion() {
  stopTimer();

  if (!answeredQuestionIds.includes(currentQuestion.id)) {
    answeredQuestionIds.push(currentQuestion.id);
  }

  currentQuestionCard?.classList.add("used");
  questionModal.classList.add("hidden");
  currentTeamIndex = getOtherTeamIndex();

  renderScoreboard();
  updateCurrentTurn();
  updateProgress();

  if (isRoundComplete()) handleRoundComplete();
}

function isRoundComplete() {
  const roundQuestions = getCurrentRoundQuestions();
  return roundQuestions.length > 0 &&
    roundQuestions.every(question => answeredQuestionIds.includes(question.id));
}

function handleRoundComplete() {
  showWinner();
}

function updateCurrentTurn() {
  const team = teams[currentTeamIndex];
  if (!team) return;

  document.getElementById("currentTurn").textContent = `${team.avatar} ${team.name}`;
  document.getElementById("roundInfo").textContent = "كل المستويات · 100–500";
}

function updateProgress() {
  const roundQuestions = getCurrentRoundQuestions();
  const answered = roundQuestions.filter(question => answeredQuestionIds.includes(question.id)).length;
  document.getElementById("questionProgress").textContent = `${answered} / ${roundQuestions.length}`;
}

function showWinner() {
  stopTimer();
  gameEnded = true;

  const [team1, team2] = teams;
  const winnerTitle = document.getElementById("winnerName");

  if (team1.score === team2.score) {
    winnerTitle.textContent = "تعادل 🤝";
  } else {
    const winner = team1.score > team2.score ? team1 : team2;
    winnerTitle.textContent = `${winner.avatar} الفائز: ${winner.name}`;
  }

  const finalScores = document.getElementById("finalScores");
  finalScores.innerHTML = "";

  teams.forEach(team => {
    const item = document.createElement("div");

    const label = document.createElement("span");
    label.textContent = `${team.avatar} ${team.name}`;

    const score = document.createElement("strong");
    score.textContent = team.score;

    item.append(label, score);
    finalScores.appendChild(item);
  });

  document.getElementById("winnerModal").classList.remove("hidden");

  // The winner screen already contains the rendered result. Remove ephemeral player data from JS memory.
  teams = [];
  sessionCategories = [];
  currentQuestion = null;
  currentQuestionCard = null;
}

document.getElementById("playAgainButton").addEventListener("click", resetEphemeralSession);
document.getElementById("resetButton").addEventListener("click", () => {
  if (confirm("إنهاء الجولة الحالية والبدء من جديد؟")) resetEphemeralSession();
});

function resetEphemeralSession() {
  window.SetupFlow?.reset();
  stopTimer();

  teams = [];
  sessionCategories = [];
  currentQuestion = null;
  currentQuestionCard = null;
  answeredQuestionIds = [];
  specialQuestionIds = { 1: null, 2: null };
  currentMultiplier = 1;
  currentTeamIndex = 0;
  currentRound = 1;
  gameEnded = false;

  document.getElementById("team1Input").value = "";
  document.getElementById("team2Input").value = "";
  document.getElementById("winnerModal").classList.add("hidden");
  questionModal.classList.add("hidden");
  scoreboard.classList.add("hidden");
  document.getElementById("gameInfo").classList.add("hidden");
  gameScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");

  buildCategorySelector();
}

document.getElementById("fullscreenButton").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

window.addEventListener("beforeunload", () => {
  // Intentionally no persistence: names, scores and progress die with the page.
  stopTimer();
});
