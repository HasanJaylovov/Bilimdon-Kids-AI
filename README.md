# Bilimdon Kids — MVP 0.1

Bolalar uchun 7–10 yoshga mo'ljallangan ta'lim platformasining dastlabki ishlaydigan prototipi.

## Ishga tushirish (macOS)
1. Node.js 18+ o'rnatilgan bo'lsin.
2. Terminalda loyiha papkasiga kiring:
   `cd bilimdon-kids`
3. Paketlarni o'rnating:
   `npm install`
4. `.env.example` faylidan `.env` nusxa oling:
   `cp .env.example .env`
5. `.env` ichida `JWT_SECRET` ni uzun tasodifiy qiymatga almashtiring.
6. Gemini API kalitingizni `GEMINI_API_KEY=` qatoriga kiriting. Kalitni hech qachon frontendga yozmang.
7. Serverni ishga tushiring:
   `npm start`
8. Brauzerda `http://localhost:3000` ni oching.

## MVP ichida
- Ro'yxatdan o'tish va login (parol bcrypt bilan xeshlanadi).
- 7–10 yosh tekshiruvi.
- Profil va fanlar bo'yicha progressni serverdagi `data.json` faylida saqlash.
- Matematika, ingliz tili, o'qish va yozish uchun demo mashqlar.
- Ota-ona panelining dastlabki ko'rinishi.
- Gemini API server-proxy chat endpointi; API kaliti bo'lmasa demo javob.
- Brauzerda matnni ovoz chiqarib o'qish va qo'llab-quvvatlansa nutqni matnga aylantirish.

## Muhim cheklovlar
Bu ishlab chiqish prototipi, production tizim emas. `data.json` bir serverli demo uchun; real ishga tushirishda PostgreSQL, HTTPS, rate limiting, audit log, zaxira nusxa, ota-ona roziligi, ma'lumotlarni saqlash siyosati va kuchli ota-ona autentifikatsiyasi kerak. Hozirgi emoji/CSS ustoz 3D rigged avatar emas. Keyingi bosqichda GLB/VRM model, Three.js/Babylon.js, lip-sync va gesture animation qo'shiladi. Android APK uchun keyingi bosqichda Capacitor wrapper va Android Studio build sozlanadi.

## API
- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `PATCH /api/progress`
- `POST /api/chat`
- `GET /api/health`
