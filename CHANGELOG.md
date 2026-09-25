# Changelog

## 0.15.1 — 2026-09-25

- Session settings now load from Supabase `game_session_settings`.
- Added 1–4 questions per level, synchronized to 3/6/9/12 questions per category.
- Added a no-timer (`∞`) answer mode.
- Added an extra makeup-only text-concealment layer while keeping product images large and sharp.
- Added regression tests for dynamic session sizing, no-timer mode, and makeup masking.


## 0.15.0 — 2026-09-25
- Reorganized project files into generated data, content/tests/ops/maintenance scripts, architecture/release docs.
- Added `question_answers`, `question_media`, 20 category views, and `vw_content_overview` in Supabase.
- Fruits and animals now use Arabic + English answers in live and fallback content.
- Disney questions are text-only; answer images are resolved from Wikipedia only after answer reveal.
- Introduced centralized typography and a four-color Coral/Mint/Sky/Plum design system.
- Added Disney answer-media flow test.

## 0.14.1 — 2026-09-25

مزامنة صور الميكاب الـ500 إلى مسارات المصدر الحالية مع الأوصاف والبيانات الوصفية الجديدة في البنك الكامل والمصغر. الأعداد والدرجات وقواعد اللعب ثابتة. تحديث اختبار المحتوى ليتحقق من النسخة الجديدة.

## 0.14.0 — 2026-09-25

مزامنة بنك Supabase الحالي: 3286 سؤالًا و20 تصنيفًا و1050 سؤال صور. إصلاح استبعاد التصنيفات بعد الانتقال إلى مستويات 100 و300 و500، وتحديث الجلسة إلى 6 أسئلة لكل تصنيف. دعم غلاف Prison Break من Storage وتحديث البنك الكامل والمصغر. إضافة أداة مزامنة للقراءة فقط وتوسيع فحص الإنتاج ليشمل كل صور الأسئلة.

## 0.11.0

قائمة ألعاب، إعداد متدرج بخمس شاشات، هوية نهارية وليلية هادئة من الشعار، ولوحة للجوال بالعرض.

## 0.10.0 — 2026-09-24

باب الحارة: 100 سؤال؛ صور 12 تصنيفًا؛ شعار بيت سيدو؛ وضع نهاري وليلي؛ لوحة واحدة 100–500، سؤالان لكل مستوى وخمسة تصنيفات كحد أقصى.

## v0.8.1 Beta — Image Challenge Update
- Added `تحدي الصور 🖼️` as the seventh Family Challenge category.
- Added 500 image questions stored in Supabase Storage.
- Image difficulty distribution: 100 questions at each of 100/200/300/400/500.
- Added Wikimedia Commons source/author/license metadata and in-game attribution links.
- Supabase question bank total is now 2,000 questions.
- Version number remains v0.8.1 Beta as requested.

# Changelog

## v0.8.1 Beta
- أصبحت النسخة مخصصة للعبة تحدي العائلة فقط.
- حذف لعبة صح أو خطأ وكل مساراتها من النسخة.
- إعادة تصميم الواجهة لتكون أوضح على الجوال واللابتوب والتلفزيون و4K.
- بنك Supabase: 1,500 سؤال، 250 لكل تصنيف، 50 لكل مستوى صعوبة.
- معايرة الصعوبة من 100 (سهل جدًا) إلى 500 (صعب جدًا).
- اختيار عشوائي لسؤال واحد من كل مستوى في كل جلسة.
- إضافة بنك محلي احتياطي مكوّن من 1,500 سؤال عند تعذر الاتصال بـSupabase.
- لا حسابات مستخدمين ولا تخزين لأسماء الفرق أو النتائج.
- Feedback مجهول فقط.
- إضافة إعدادات `vercel.json` للنشر كـStatic Web App.

## 0.14.2
- Curated makeup category to 300 active Supabase questions across 35 brands.
- Increased question image display size and explicitly removed full-image CSS blur.
- Synced local fallback/audit/mini fallback to the same 300 makeup questions.
- Added Supabase public schema snapshot and removed local Vercel session secrets from distributable package.
