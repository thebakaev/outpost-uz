# OUTPOST UZ v1.2 — Supabase ulash (UZ)

## 1. Muhit o‘zgaruvchilari
`.env.local` tayyorlangan. Unda Project URL va Publishable key bor. Publishable key frontendda ishlatish uchun mo‘ljallangan; `service_role`/secret key hech qachon frontendga qo‘yilmaydi.

## 2. Database sxemasi
Supabase Dashboard → SQL Editor → New query. `supabase/schema.sql` faylining hamma matnini joylashtirib Run bosing.

## 3. Birinchi Super Admin
1. Supabase → Authentication → Users → Add user orqali o‘zingizning email va kuchli parolingiz bilan foydalanuvchi yarating (yoki invite yuboring).
2. Yaratilgan user UUID'ni nusxalang.
3. SQL Editor'da quyidagini o‘zingizning UUID bilan bajaring:

```sql
update public.profiles set role = 'super_admin' where id = 'PASTE_AUTH_USER_UUID_HERE';
```

Faqat o‘zingiz nazorat qiladigan hisobni Super Admin qiling. Ochiq sign-up'ni yoqmang; boshqa adminlarni keyin Auth panelidan taklif qiling.

## 4. Lokal ishga tushirish
```bash
npm.cmd install
npm.cmd run dev
```
`http://localhost:5173/admin` manziliga kiring. Login Supabase Auth orqali ishlaydi. Profile'da ruxsatli rol bo‘lmasa admin panel ochilmaydi.

## Hozirgi bosqich chegarasi
v1.2 Supabase Auth, profil/rol tekshiruvi va boshlang‘ich RLS sxemasini qo‘shadi. Admin kontent jadvali UI bilan hali sinxron emas: mavjud Wiki va admin CRUD demo holatida qoladi. Keyingi bosqichda kontentni `content_entries` jadvalidan o‘qish/yozish, Draft/Publish va eski katalogni import qilish ulanadi.


## v1.5 — Rasm yuklash uchun Storage
Supabase Dashboard → SQL Editor → New query oynasida `supabase/v1.5_media_storage.sql` faylining barcha SQL kodini joylashtiring va Run bosing. Bu `outpost-media` nomli public bucket yaratadi. Faqat autentifikatsiyadan o‘tgan staff rasm yuklaydi; saytga kirganlar rasmlarni ko‘ra oladi. Rasm limiti 5 MB.


## v1.6 — Raid / Craft / Recycler ma’lumotlarini boshqarish

1. Supabase Dashboard → SQL Editor → New query bo‘limini oching.
2. `supabase/v1.6_game_data_manager.sql` faylining barcha SQL kodini joylashtiring va Run bosing.
3. SQL `public.game_data` jadvalini yaratadi va mavjud katalogdagi boshlang‘ich Raid, Craft va Recycler ma’lumotlarini `ON CONFLICT DO NOTHING` orqali xavfsiz seed qiladi. Oldindan mavjud sozlamalar ustidan yozmaydi.
4. Sayt admin paneliga kiring → **O‘yin ma’lumotlari**.
5. Kerakli to‘plamni tanlang, JSON qiymatlarini tahrirlang va **O‘zgarishlarni saqlash** tugmasini bosing.
6. Ommaviy saytni yangilang. Raid Calculator, Craft va Recycler Supabase'dan yangi qiymatlarni oladi.

Eslatma: JSON muharririda faqat to‘g‘ri JSON array saqlanadi. Katta o‘zgarishdan oldin matnni alohida nusxalab qo‘ying. `contributor` roli o‘yin ma’lumotlarini o‘zgartira olmaydi.
