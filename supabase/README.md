# Supabase داخل المشروع

هذا المجلد يوثق **Schema التطبيق** فقط، ولا يحتوي أسرارًا أو ملفات Storage.

- `schema.snapshot.sql`: لقطة قابلة للمراجعة للجداول والفهارس والـViews الحالية.
- المشروع الحي: `uqbgbznxisouyjpphvfi` (الـProject Ref ليس سرًا).
- الاتصال من المتصفح موجود في `js/config.js` باستخدام Publishable Key فقط.

قاعدة البيانات الحية تحتوي أيضًا على schemas يديرها Supabase مثل `auth` و`storage`; لا يتم نسخها هنا.

للمحتوى المحلي استخدم `../data/generated/`. لمزامنة المحتوى الحي إلى الملفات شغّل:

```bash
node --use-system-ca scripts/content/sync-content.cjs
```

لا تضع `service_role`, Database Password أو Access Token داخل Git.
