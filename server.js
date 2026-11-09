
require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, "data.json");
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-change-me";
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { users: [] }; }
}
function writeDB(db) {
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}
function tokenFor(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "14d" });
}
function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}
function auth(req, res, next) {
  const raw = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    const payload = jwt.verify(raw, JWT_SECRET);
    const user = readDB().users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ error: "Sessiya topilmadi." });
    req.user = user; next();
  } catch { return res.status(401).json({ error: "Qayta tizimga kiring." }); }
}
app.post("/api/register", async (req, res) => {
  const { name, age, username, password, language = "uz" } = req.body || {};
  if (!name || !username || !password || !age) return res.status(400).json({ error: "Barcha maydonlarni to'ldiring." });
  if (!Number.isInteger(Number(age)) || Number(age) < 7 || Number(age) > 10) return res.status(400).json({ error: "Yosh 7–10 oralig'ida bo'lishi kerak." });
  if (String(password).length < 8) return res.status(400).json({ error: "Parol kamida 8 belgidan iborat bo'lsin." });
  const db = readDB();
  const normalized = String(username).trim().toLowerCase();
  if (db.users.some(u => u.username === normalized)) return res.status(409).json({ error: "Bu login band. Boshqasini tanlang." });
  const user = {
    id: crypto.randomUUID(), name: String(name).trim().slice(0, 50), age: Number(age),
    username: normalized, passwordHash: await bcrypt.hash(String(password), 12),
    language, createdAt: new Date().toISOString(),
    progress: { math: 0, english: 0, reading: 0, writing: 0 },
    lessons: {}, stars: 0, parentPin: null
  };
  db.users.push(user); writeDB(db);
  res.json({ token: tokenFor(user), user: publicUser(user) });
});
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = readDB().users.find(u => u.username === String(username || "").trim().toLowerCase());
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) return res.status(401).json({ error: "Login yoki parol noto'g'ri." });
  res.json({ token: tokenFor(user), user: publicUser(user) });
});
app.get("/api/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));
app.patch("/api/progress", auth, (req, res) => {
  const { subject, score, lesson } = req.body || {};
  const allowed = ["math", "english", "reading", "writing"];
  if (!allowed.includes(subject)) return res.status(400).json({ error: "Fan noto'g'ri." });
  const db = readDB(), user = db.users.find(u => u.id === req.user.id);
  user.progress[subject] = Math.max(user.progress[subject] || 0, Math.min(100, Math.max(0, Number(score) || 0)));
  user.lessons[subject] = Math.max(user.lessons[subject] || 0, Number(lesson) || 0);
  user.stars = (user.stars || 0) + 1;
  writeDB(db); res.json({ user: publicUser(user) });
});
app.post("/api/chat", auth, async (req, res) => {
  const { message, subject, language = "uz" } = req.body || {};
  if (!message || String(message).length > 1500) return res.status(400).json({ error: "Xabar bo'sh yoki juda uzun." });
  if (!process.env.GEMINI_API_KEY) {
    return res.json({ reply: "Ajoyib savol! Hozir demo rejimidaman. Gemini API kaliti serverga ulangach, men sen bilan shu mavzuda jonli suhbatlashaman. Hozircha dars kartalaridan mashqni tanla! 🌟", demo: true });
  }
  const system = `Sen Bilimdon Kids nomli ta'lim platformasining mehribon, quvnoq AI ustozisan. Auditoriya 7–10 yoshli bolalar. Faqat yoshga mos, xavfsiz va sodda tilda javob ber. Bolani kamsitma; xatolarni muloyim tushuntir. Maxfiy ma'lumot so'rama. Til: ${language}. Fan: ${subject || "umumiy"}. Javobni qisqa, qiziqarli va savol bilan yakunla.`;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL || "gemini-2.5-flash")}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`;
    const response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: String(message) }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 350 } })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Gemini API xatosi");
    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "Keling, yana bir bor urinib ko'ramiz!";
    res.json({ reply, demo: false });
  } catch (e) { res.status(502).json({ error: "AI bilan bog'lanishda xatolik. Server sozlamalarini tekshiring." }); }
});
app.get("/api/health", (_, res) => res.json({ ok: true, app: "Bilimdon Kids", geminiConfigured: Boolean(process.env.GEMINI_API_KEY) }));
app.listen(PORT, () => console.log(`Bilimdon Kids: http://localhost:${PORT}`));
