# OUTPOST UZ v0.9.1

O‘zbek tilidagi mustaqil Rust ensiklopediyasi.

## Ishga tushirish

```bash
npm install
npm run dev
```

## v0.9.1 — Monument image hotfix
- Monument rasmlari RustHelp'ning optimallashtirilgan image endpointi orqali yuklanadi.
- Train Yard va boshqa monumentlarda CDN rasm manzili to‘g‘ridan-to‘g‘ri chaqirilmaydi.
- Airfield rasm faylining katta-kichik harf bilan yozilishidagi farq tuzatildi.
- Rasm yuklanmasa, sahifadagi gradient banner fallback sifatida qoladi.

## v0.9 — Expanded Item Database
- Wiki katalogi 78 ta noyob itemga kengaytirildi; 12 ta kategoriya.
- Itemlar nomi va Rust shortname bo‘yicha qidiriladi; A–Z yoki kategoriya bo‘yicha saralanadi.
- Craft qilinadigan buyumlarni alohida filtrlash mumkin.
- Facepunch item asset host orqali haqiqiy item ikonkalari ko‘rsatiladi.
- Rocket Launcher, Rocket, HV Rocket, Incendiary Rocket, Satchel Charge, Beancan Grenade va Metal Facemask uchun qo‘shimcha crafting, loot va identifikator ma’lumotlari kiritildi.
- Crafting tree chuqur ingredientlarga ochiladi; buyum qaysi retseptlarda ishlatilishi ham ko‘rsatiladi.
- Avvalgi Raid, Monument, Recycler va Craft bo‘limlari saqlangan.

## Ma’lumot sifati
Bu versiya to‘liq game-file dump emas, balki manbalari ko‘rsatilgan, bosqichma-bosqich kengaytiriladigan katalog. Har bir raqamli loot chance yoki retsept faqat manba bilan tasdiqlanganda kiritiladi. Server rates, modlar va keyingi Rust patchlari qiymatlarni o‘zgartirishi mumkin.


## v0.9.2 — Monument image source update
- Replaced broken RustHelp CDN image paths with direct links to real Rust in-game monument screenshots.
- Images are still loaded from their original public image hosts; internet access is required.


## v1.0 — Interactive Airfield Maps
- Airfield uchun haqiqiy aerial in-game ko‘rinish va alohida hudud sxemasi qo‘shildi.
- Hudud sxemasida terminal, hangarlar, tunnel kirishi, helipad va recycler nuqtalarini bosib izohini ko‘rish mumkin.
- Puzzle yo‘nalishi bosqichma-bosqich vizual flow ko‘rinishida berildi.
- Xarita sxemasi navigatsion yordam sifatida belgilangan; server seediga qarab joylashuv farq qilishi mumkin.

## v1.1 — Admin Control Center prototype
- Open `/admin` for the first admin dashboard UI.
- Includes content list, search/status filtering, create/edit, Draft/Publish/Unpublish and delete interactions.
- Demo content is stored in the current browser's localStorage only.
- IMPORTANT: this is a UI prototype, not production authentication or a secure CMS. Do not publish `/admin` as a real admin system until Supabase Auth, database tables, Row Level Security and server-backed content publishing are implemented.
- Public website content is not yet connected to the admin demo records. Supabase integration is the next implementation stage.


## v1.3 — Supabase Content CRUD

- Admin dashboard now loads `content_entries` from Supabase instead of browser demo storage.
- Create and edit content records in PostgreSQL.
- Draft / Publish / Unpublish actions write to Supabase and respect the configured RLS policies.
- Delete is available only to `admin` and `super_admin` roles.
- The public Wiki still uses the bundled catalogue in this release; wiring published database entries into public pages is the next integration step.

### Setup

1. Copy `.env.example` to `.env.local`.
2. Add your Supabase Project URL and Publishable key to `.env.local`.
3. In Supabase SQL Editor, run `supabase/v1.3_migration.sql` once (the v1.2 `schema.sql` should already have been applied).
4. Run `npm.cmd install`, then `npm.cmd run dev`.
5. Open `/admin` and sign in with your Supabase Auth account.

Never put a Supabase secret/service-role key in a Vite frontend environment file.


## v1.4 — Live catalog and import

- Public Wiki and Monument pages now load published `item`, `weapon`, and `monument` entries from Supabase.
- Existing static catalog remains as a fallback, so the site still works if Supabase is temporarily unavailable.
- Existing item/monument records are merged by title to avoid duplicate cards.
- `supabase/v1.4_import_catalog.sql` imports the original 84 Wiki items and 19 monuments (103 records total) as published entries.
- The import is idempotent by slug and does not overwrite existing records or delete the `Test Item` used for the CMS test.

### Import the existing catalog

1. Keep the current `.env.local` file; do not upload it or share its values.
2. In Supabase SQL Editor, open `supabase/v1.4_import_catalog.sql`, paste the complete SQL and click Run once.
3. Open `content_entries` and confirm the 103 imported rows plus your existing test row.
4. Refresh the public site. Published records are loaded from Supabase and merged with the built-in catalog.

Note: The current admin form edits title, slug, category and description. Rich item/monument body fields are preserved during edits but are not yet exposed as visual editor fields; a dedicated rich editor is a later step.


## v1.4.1 — Duplicate catalog hotfix

- When a published item or monument is renamed in Admin, the public catalog now matches the database entry to its original imported identity (`body.name`) and replaces the legacy catalog record instead of displaying both.
- No database migration is required; existing Supabase records remain unchanged.


## v1.5 — Media Library and image editing
- Admin content editor supports image upload (PNG/JPG/WEBP/GIF, max 5 MB), image URL, preview, and removal.
- Uploaded images are stored in the Supabase Storage bucket `outpost-media`.
- Public catalog item cards, item details, and monument pages use the saved `body.image_url`.
- Media Library lists uploaded public images and allows copying their URLs.
- Before using uploads, run `supabase/v1.5_media_storage.sql` once in Supabase SQL Editor.


## v1.6 — Game Data Manager
- Added Supabase-backed editable datasets for Raid Calculator targets and methods, Craft recipes, Recycler yields and recycler rate profiles.
- Admin panel includes an O‘yin ma’lumotlari JSON editor with validation and role-gated save.
- Public app loads game data from `public.game_data`, retaining bundled defaults if the table is unavailable.
- Run `supabase/v1.6_game_data_manager.sql` once in Supabase SQL Editor to create and seed the table.


## v1.7 — Admin Control Center
- Adminlar va rollar: mavjud Supabase foydalanuvchilariga rollarni biriktirish (Super Admin).
- Faoliyat tarixi: content_entries, game_data, profiles va site_settings jadvalidagi INSERT/UPDATE/DELETE amallari audit logga yoziladi.
- Sozlamalar: sayt nomi, tavsifi, logo URL, aloqa emaili va SEO qiymatlarini boshqarish.
- Supabase SQL Editor’da `supabase/v1.7_admin_control_center.sql` migratsiyasini bir marta ishga tushiring.
- Yangi adminni Supabase Authentication → Users orqali Invite qiling; foydalanuvchi birinchi marta kirgach Adminlar va rollar sahifasida rolini belgilang.


## v1.7.1 — Public site settings connection
- Public website now loads `site_settings` from Supabase.
- Site name, logo URL, hero description, contact email, SEO title and SEO description are applied on the public site.
- Browser document title and meta description update from Supabase settings.
- Existing defaults remain as fallbacks if Supabase is not configured or settings are empty.

## v1.8 — Reklama boshqaruvi

- Admin panelda yangi **Reklamalar** bo‘limi: banner qo‘shish/tahrirlash, rasmni URL yoki `outpost-media` Storage bucket orqali yuklash, joylashuv va jadvalni sozlash.
- Ommaviy saytda `home_top`, `wiki_inline` va `footer` banner joylari mavjud.
- Ko‘rishlar va bosishlar Supabase RPC orqali hisoblanadi.
- Yangi bannerlar standart holatda o‘chiq; reklama ko‘rinishi uchun admin ularni faollashtirishi kerak.

### Supabase migratsiyasi

`supabase/v1.8_advertising_system.sql` faylini Supabase Dashboard → SQL Editor’da bir marta ishga tushiring. Migratsiya `advertisements` jadvali, RLS siyosatlari va reklama statistikasi RPC funksiyalarini yaratadi. Banner faylini yuklash uchun avvalgi `outpost-media` Storage bucket sozlangan bo‘lishi kerak.


## v1.8.1 — Banner image fit and upload improvement
- Public ad banners preserve their original aspect ratio and show the full image on desktop and mobile.
- Admin banner previews also preserve the full image.
- Banner file uploads accept JPG, PNG, WEBP, and GIF up to 20 MB.
- The v1.8 advertising SQL updates the `outpost-media` bucket limit to 20 MB.
