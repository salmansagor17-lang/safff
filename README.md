# بيت سيدو | Beat Seedo — v0.16.0

منصة ألعاب عائلية عربية. اللعبة الحالية هي **تحدي العائلة** وتعمل كواجهة Vanilla HTML/CSS/JavaScript مرتبطة مباشرة بـSupabase.

## هيكل المشروع

```text
.
├── index.html                     # الصفحة الرئيسية
├── style.css                      # تنسيق الصفحة الرئيسية فقط
├── js/
│   ├── config.js                  # إصدار التطبيق وربط Supabase
│   └── platform.js                # بيانات الصفحة الرئيسية
├── games/family-challenge/
│   ├── index.html                 # واجهة اللعبة
│   ├── style.css                  # تنسيق اللعبة
│   └── js/                        # منطق اللعبة والإعداد والمؤقت والصوت
├── shared/
│   ├── js/                        # Supabase/content/theme/feedback/session
│   └── styles/                    # Design System: tokens/components/palette
├── data/generated/                # Snapshot محلي مولّد من Supabase
├── media/                         # أصول محلية ثابتة فقط
├── scripts/
│   ├── content/                   # مزامنة المحتوى
│   ├── tests/                     # اختبارات Node
│   ├── ops/                       # تحقق ما بعد النشر
│   └── maintenance/               # أدوات صيانة اختيارية
├── supabase/                      # توثيق Schema التطبيق
└── docs/
    ├── architecture/              # هندسة المشروع وقاعدة البيانات
    └── releases/                  # تقارير الإصدارات
```

## مصدر الحقيقة

- **الكود والتصميم:** ملفات المشروع / Git.
- **المحتوى الحي:** Supabase (`game_questions`, `question_answers`, `question_media`).
- **الصور الأساسية:** Supabase Storage `game-media`.
- **صور إجابات ديزني:** تُجلب عند كشف الإجابة فقط عبر Wikipedia/MediaWiki، ولا تُخزّن داخل المشروع.
- **Fallback:** `data/generated/question-bank.json` ثم `defaultQuestions.js`.

## قاعدة البيانات

الجداول الرئيسية:
- `games`
- `game_categories`
- `game_questions`
- `game_difficulty_levels`
- `game_session_settings`
- `question_answers` — إجابات منظمة متعددة اللغات.
- `question_media` — يفصل وسائط السؤال عن وسائط الإجابة.
- `feedback`

يوجد **20 View آمنًا** للتصنيفات (`vw_questions_*`) بدل إنشاء 20 جدولًا مكررًا. التفاصيل: [DATABASE-STRUCTURE.ar.md](docs/architecture/DATABASE-STRUCTURE.ar.md).

## إعدادات الجلسة

الإعدادات الحية تُقرأ من `game_session_settings` في Supabase:
- الوقت: بدون وقت، 15، 30، 45، 60 ثانية.
- الأسئلة من كل مستوى: 1–4.
- الأسئلة من كل تصنيف: 3 / 6 / 9 / 12، ومتزامنة مع اختيار عدد الأسئلة من كل مستوى.

## Design System

- العربية: **Cairo**.
- الإنجليزية والعناصر اللاتينية: **Poppins**.
- الهوية الرسمية: Indigo / Cyan / Amber / Pink / Green على خلفية `#0F172A`.
- واجهة Home/Game Hub، إعدادات، سؤال، كشف إجابة، ونتائج بهوية موحدة.
- الملفات: `shared/styles/tokens.css`, `components.css`, `palette.css`, `beat-seedo.css`.

## مزامنة المحتوى

```bash
node --use-system-ca scripts/content/sync-content.cjs
```

ينتج:
- `data/generated/question-bank.json`
- `data/generated/question-answers.json`
- `data/generated/answer-media.json`
- `data/generated/content-audit.json`
- `games/family-challenge/js/defaultQuestions.js`

## الاختبارات

```bash
node --test scripts/tests/*.cjs
```

## Vercel والتحقق بعد النشر

لفحص ملفات النسخة المحلية مع اتصال حقيقي ببيانات Supabase قبل النشر:

```bash
node --use-system-ca scripts/ops/verify-production.cjs --local
```

أداة التحقق تقارن إصدار الموقع مع `js/config.js` المحلي، وتفشل إذا كانت النسخة المنشورة أقدم.

المشروع Static Web App وجاهز لـVercel عبر `vercel.json`. رابط الإنتاج المسجل في أداة التحقق هو:

```text
https://family-challenge-lemon.vercel.app
```

بعد نشر النسخة على مشروع Vercel نفسه:

```bash
node --use-system-ca scripts/ops/verify-production.cjs https://family-challenge-lemon.vercel.app
```

## ملاحظات أمنية

واجهة المتصفح تستخدم **Supabase Publishable Key فقط**. لا تضع `service_role` أو Database Password داخل ملفات المشروع. جميع جداول `public` المستخدمة من العميل محمية بـRLS.
