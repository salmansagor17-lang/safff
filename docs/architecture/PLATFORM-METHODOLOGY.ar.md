# منهجية إدارة بيت سيدو — v0.15.0

## 1. طبقات المنصة

```text
Browser UI
  ↓
contentStore.js
  ↓
Supabase Database + Storage
  ↓ (عند التعذر)
data/generated/question-bank.json
  ↓ (عند التعذر)
defaultQuestions.js
```

## 2. أين أعدل؟

- تصميم عام وثيم: `shared/styles/`.
- الصفحة الرئيسية: `index.html` + `style.css`.
- منطق تحدي العائلة: `games/family-challenge/js/game.js`.
- اختيار الأسئلة: `shared/js/sessionQuestions.js`.
- تحميل Supabase ووسائط الإجابة: `shared/js/contentStore.js`.
- المحتوى: Supabase أولًا، ثم شغّل `scripts/content/sync-content.cjs` لتحديث الـfallback.

## 3. قاعدة البيانات

لا تنشئ جدولًا جديدًا عند كل تصنيف. أضف التصنيف في `game_categories` والأسئلة في `game_questions`، ثم أضف View للتصنيف عند الحاجة الإدارية. الإجابات متعددة اللغات في `question_answers`، والوسائط في `question_media`.

## 4. دورة العمل المقترحة

1. أنشئ Branch في Git.
2. عدّل الكود أو Supabase.
3. عند تعديل المحتوى: شغّل مزامنة المحتوى.
4. شغّل جميع الاختبارات.
5. راجع `git diff`.
6. Commit ثم Push.
7. بعد Vercel، شغّل `verify-production.cjs`.

## 5. الصور

- الصور الدائمة للعبة: Supabase Storage.
- الصور المحلية الصغيرة/الأعلام/الأغلفة: `media/`.
- ديزني: السؤال بلا صورة. صورة الإجابة تُحل ديناميكيًا من Wikipedia بعد كشف الحل، مع fallback إلى صفحة الفيلم.

## 6. التصميم

Design System مركزي في:
- `tokens.css`: الخطوط، المقاسات، الألوان والمسافات.
- `components.css`: الأزرار والعناصر المشتركة.
- `palette.css`: توزيع الألوان على أجزاء المنصة.

الألوان الجديدة: Coral, Mint, Sky, Plum. لتغيير الهوية مستقبلًا، ابدأ من `tokens.css` بدل تعديل عشرات الملفات.
