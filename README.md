# مين الخاين؟ — تطبيق ويب

لعبة جماعية أونلاين، كل واحد يلعب من جواله، بدون حساب Claude.

## الملفات
| الملف | وش هو |
|---|---|
| `index.html` | اللعبة كاملة |
| `config.js` | **الملف الوحيد اللي تعدّله**: الصق فيه إعدادات Firebase |
| `fbroom.js`, `fbnet.js` | ربط اللعبة بـ Firebase (لا تعدّلها) |
| `manifest.webmanifest`, `sw.js`, الأيقونات | عشان تنثبت مثل التطبيق |
| `database.rules.json` | قواعد الحماية: انسخها في Firebase ← Realtime Database ← Rules |

## الإعداد (مرة وحدة)
1. **Firebase**: من console.firebase.google.com سوّ مشروع جديد (Analytics مو لازم).
2. **قاعدة البيانات**: Build ← Realtime Database ← Create Database ← اختر أي موقع ← Start in **locked mode**.
   بعدها من تبويب **Rules** امسح اللي فيه والصق محتوى `database.rules.json` ← Publish.
3. **الدخول المجهول**: Build ← Authentication ← Get started ← Sign-in method ← **Anonymous** ← Enable ← Save.
4. **إعدادات الويب**: ⚙️ Project settings ← Your apps ← أيقونة الويب `</>` ← سمّه أي اسم ← Register.
   انسخ القيم (apiKey, authDomain, databaseURL…) والصقها في `config.js`.
   إذا ما لقيت `databaseURL`: انسخ الرابط اللي فوق في صفحة Realtime Database ← Data.
5. **الاستضافة المجانية (GitHub Pages)**: سوّ حساب في github.com ← New repository (Public) ← Add file ← Upload files ← ارفع كل الملفات ← Commit.
   بعدها Settings ← Pages ← Source: Deploy from a branch ← Branch: `main` و `/ (root)` ← Save.
   بعد دقيقة أو دقيقتين يطلع لك رابط مثل: `https://اسمك.github.io/اسم-المستودع/`
6. **التثبيت**: افتح الرابط في Safari (آيفون) أو Chrome (أندرويد) ← مشاركة ← «إضافة إلى الشاشة الرئيسية».

## 💾 الحفظ السحابي
كل لاعب ياخذ رمز (مثل ABCD-2345) وتقدّمه يتحفظ تلقائياً في Firebase تحت `s/الرمز`. لازم قواعد قاعدة البيانات تكون نسخة `database.rules.json` الجديدة (فيها جزء `s`).

## الحدود المجانية (Firebase Spark)
تكفي لشلّة أصحاب بسهولة: حتى 100 اتصال بنفس الوقت (يعني 100 لاعب أونلاين)، و 10GB تحميل بالشهر.

## تحديث اللعبة
ارفع ملف `index.html` الجديد بنفس الطريقة (Upload files) ويستبدل القديم.
