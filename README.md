# بيت سيدو — 0.14.1

لعبة عربية لفريقين على شاشة مشتركة، بأسئلة نصية وصور وألغاز رموز.

- الموقع: https://family-challenge-lemon.vercel.app
- المستودع: https://github.com/salmansagor17-lang/safff
- النشر: Vercel / salman-4992/family-challenge، تلقائيًا من main.
- المحتوى: Supabase؛ 3286 سؤال في 20 تصنيفًا نشطًا.
- الجلسة: سؤالان لكل مستوى، و6 أسئلة لكل تصنيف. من تصنيفين إلى خمسة، ومستويات 100 و300 و500 معًا.
- الصور: فواكه، حيوانات، معالم وأعلام؛ 1050 سؤال صور. ألغاز الرموز: 50 لغزًا.

## مرجع المالك

- [المنهجية الكاملة بالعربية](docs/PLATFORM-METHODOLOGY.ar.md)
- [التقرير التنفيذي للإصدار](docs/EXECUTIVE-REPORT-0.9.0.ar.md)

ملفات الإدارة مستبعدة من النشر بواسطة .vercelignore.

## التشغيل والاختبار

افتح هذا المجلد في VS Code وشغّل index.html باستخدام Live Server. التطبيق HTML/CSS/JavaScript ولا يحتاج تثبيت حزم npm للتشغيل.

اختبارات المنطق باستخدام Node.js:

```powershell
node --test scripts/test-content-store.cjs scripts/test-session-questions.cjs scripts/test-game-flow.cjs scripts/test-setup-flow.cjs scripts/test-topic-expansion.cjs
```

## البيانات

إعداد Supabase العام في js/config.js. تحميل الأسئلة على دفعات في shared/js/contentStore.js والسحب في shared/js/sessionQuestions.js.

البنك الاحتياطي الكامل: data/question-bank-v0.9.0.json. نسخة 0.8.1 القديمة مرجع تاريخي لا تستخدمه اللعبة الجديدة. تعديل Supabase لا يحدث البنك المحلي تلقائيًا.

الأعلام ملفات SVG من [flag-icons](https://github.com/lipis/flag-icons) إصدار 7.3.2، وترخيصها في media/flags/LICENSE.txt. الصور الأصلية في Supabase Storage وتحافظ على مصادرها وتراخيصها.

## تحديث المحتوى والرجوع

scripts/visual-expansion.sql معاملة تحديث محتوى 0.9.0، وscripts/rollback-visual-expansion.sql لعكسها بعد مراجعة الأثر. SQL لا ينفذ تلقائيًا عند النشر. سكربت التجهيز مخصص لهذه التوسعة، وليس أداة مزامنة عامة.

أسماء الفرق والنقاط مؤقتة في ذاكرة الصفحة. المفتاح العام مخصص للواجهة والحماية الفعلية عبر RLS. لا ترفع ملفات البيئة أو مفاتيح الإدارة؛ .local-backups مستبعدة من Git والنشر.

أضيف باب الحارة بـ100 سؤال، وصور جميع التصنيفات وشعار بيت سيدو، وزر الليل والنهار.

تحديث 0.14.0: مزامنة Supabase بتاريخ 2026-09-25، واعتماد ثلاث درجات للصعوبة، و500 سؤال ميكاب مصور، وإضافة 300 سؤال Prison Break وغلافه من Storage. تصنيف القرآن السابق غير موجود في البنك الحالي؛ حافظنا على محتوى المصدر كما هو. التفاصيل في [تقرير الربط](docs/INTEGRATION-REPORT-0.14.0.ar.md).

لتحديث النسخ المحلية من Supabase دون الكتابة إلى قاعدة البيانات:

```powershell
node --use-system-ca scripts/sync-content.cjs
node --test scripts/test-content-store.cjs scripts/test-session-questions.cjs scripts/test-game-flow.cjs scripts/test-setup-flow.cjs scripts/test-topic-expansion.cjs
node --use-system-ca scripts/verify-production.cjs
```

سكربت المزامنة يحفظ نسخة رجوع في `.local-backups` ويحدث البنك الكامل والمصغر وإحصائيات التصنيفات. بعد مراجعة التغييرات ورفعها إلى GitHub، انتظر نشر Vercel ثم شغّل فحص الإنتاج. إصدار Node.js المستخدم: 24. التطبيق ثابت، ويقرأ الإعداد العام من `js/config.js`؛ لا يحتاج متغيرات بيئة على Vercel.

تحديث 0.14.1: مزامنة صور الميكاب الـ500 إلى مسارات المصدر الحالية وأوصافها وبياناتها الجديدة. [تقرير التحقق الجديد](docs/INTEGRATION-REPORT-0.14.1.ar.md).
