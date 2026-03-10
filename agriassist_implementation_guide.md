# 🌾 AgriAssist — Complete Implementation & Deployment Guide

> **Project:** AgriAssist: Smart Fertilizer, Soil and Farm Tool Recommendation Platform  
> **Stack:** React (Vite) + Node.js (Express) + PostgreSQL/SQLite + Google Gemini AI  
> **Current State:** Backend (Express + Gemini), Frontend (React), Auth, Chat History, DB models already exist.

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1 — Project Setup & Environment](#2-phase-1--project-setup--environment)
3. [Phase 2 — Authentication (Login / Register)](#3-phase-2--authentication-login--register)
4. [Phase 3 — AI Chatbot Core (Gemini)](#4-phase-3--ai-chatbot-core-gemini)
5. [Phase 4 — Voice I/O (Default Voice Mode)](#5-phase-4--voice-io-default-voice-mode)
6. [Phase 5 — Multilingual Support (Hindi, Gujarati, English)](#6-phase-5--multilingual-support-hindi-gujarati-english)
7. [Phase 6 — Rich Output (Reports, Images, Videos)](#7-phase-6--rich-output-reports-images-videos)
8. [Phase 7 — Farmer Dashboard & Features](#8-phase-7--farmer-dashboard--features)
9. [Phase 8 — Shopkeeper Dashboard & Features](#9-phase-8--shopkeeper-dashboard--features)
10. [Phase 9 — Reminders & Notifications](#10-phase-9--reminders--notifications)
11. [Phase 10 — Weather Integration](#11-phase-10--weather-integration)
12. [Phase 11 — Deployment](#12-phase-11--deployment)
13. [Tech Stack Summary](#13-tech-stack-summary)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  Login/Register → Role-Based Dashboard (Farmer / Shopkeeper)    │
│  Chatbot UI  |  Voice I/O  |  Image Upload  |  Report View      │
│  Multilingual (hi / gu / en)  |  Reminders  |  Chat History     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP / WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                       BACKEND (Node.js / Express)               │
│  /api/auth     → JWT Auth (Login, Register, Role)               │
│  /api/chat     → Gemini AI + Context + History                  │
│  /api/voice    → Speech-to-Text / Text-to-Speech               │
│  /api/weather  → OpenWeatherMap / Google Search                 │
│  /api/reminder → Create / Update / Delete reminders             │
│  /api/shop     → Inventory CRUD for Shopkeepers                 │
│  /api/media    → Image/Video upload & analysis                  │
└──────────┬─────────────────────────────┬───────────────────────┘
           │                             │
┌──────────▼──────┐           ┌──────────▼───────────────────────┐
│  PostgreSQL      │           │       External APIs              │
│  (Supabase/      │           │  • Google Gemini AI (chat + OCR) │
│   Railway prod)  │           │  • OpenWeatherMap API            │
│  SQLite (local)  │           │  • Google Cloud TTS / STT        │
└─────────────────┘           └──────────────────────────────────┘
```

---

## 2. Phase 1 — Project Setup & Environment

### 2.1 Prerequisites
```
Node.js >= 18.x
Python >= 3.10 (for AI helpers if needed)
PostgreSQL (local or cloud: Supabase / Railway / Render)
Google Gemini API Key
Google Cloud API Key (for TTS/STT)
OpenWeatherMap API Key
```

### 2.2 Current [.env](file:///c:/cp/backend/.env) (c:\cp\backend\.env)
Your [.env](file:///c:/cp/backend/.env) already has these — just add the missing ones:

```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:1234@localhost:5432/AgriAssist

# Auth
JWT_SECRET=your-long-secret-key
JWT_ACCESS_EXPIRATION_MINUTES=10080

# AI
GEMINI_API_KEY=your-gemini-api-key

# Weather
WEATHER_API_KEY=your-openweather-api-key

# Google Cloud (for STT / TTS)
GOOGLE_CLOUD_API_KEY=your-google-cloud-key

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=20
```

### 2.3 Install Missing Packages

**Backend:**
```bash
cd c:\cp\backend
npm install multer @google-cloud/speech @google-cloud/text-to-speech node-cron sharp axios form-data
```

**Frontend:**
```bash
cd c:\cp\frontend
npm install react-router-dom axios i18next react-i18next i18next-browser-languagedetector react-speech-recognition @radix-ui/react-dialog lucide-react react-hot-toast react-markdown react-dropzone
```

---

## 3. Phase 2 — Authentication (Login / Register)

> ✅ **Already partially built** — [c:\cp\backend\routes\auth.js](file:///cp/backend/routes/auth.js) and [c:\cp\frontend\src\pages\Login.jsx](file:///cp/frontend/src/pages/Login.jsx) exist.

### 3.1 Backend — What to verify/add

**File:** [c:\cp\backend\routes\auth.js](file:///cp/backend/routes/auth.js)

Ensure these endpoints exist:
- `POST /api/auth/register` → Takes `{ name, phone, email, password, role: 'farmer'|'shopkeeper'|'admin', language: 'en'|'hi'|'gu' }`
- `POST /api/auth/login` → Returns `{ token, user: { id, name, role, language } }`
- `GET /api/auth/me` → Returns current user from JWT

**Role-based middleware** — [c:\cp\backend\middleware\auth.js](file:///cp/backend/middleware/auth.js) should check `req.user.role`.

### 3.2 Frontend — Pages needed

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Email/phone + password + language selector |
| Register | `/register` | Name, role, language preference, phone |
| Farmer Chat | `/farmer` | Opens after farmer login |
| Shopkeeper Dashboard | `/shopkeeper` | Opens after shopkeeper login |

### 3.3 Language at Login
Add a language selector on the Login/Register page:
```jsx
// In Login.jsx — add this selector
<select onChange={(e) => i18n.changeLanguage(e.target.value)}>
  <option value="en">English</option>
  <option value="hi">हिन्दी</option>
  <option value="gu">ગુજરાતી</option>
</select>
```

---

## 4. Phase 3 — AI Chatbot Core (Gemini)

> ✅ **Gemini key exists** — extend the existing chat route.

### 4.1 Backend — Chat Route Enhancement

**File:** [c:\cp\backend\routes\chat.js](file:///cp/backend/routes/chat.js)

```javascript
// POST /api/chat/message
// Body: { message, sessionId, imageBase64?, language, userRole }

const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt based on role
function getSystemPrompt(role, language) {
  const lang = language === 'hi' ? 'Hindi' : language === 'gu' ? 'Gujarati' : 'English';
  if (role === 'farmer') {
    return `You are AgriAssist, an expert agricultural AI assistant. 
    Always respond in ${lang}.
    You help farmers with:
    - Soil health analysis and fertilizer detection issues
    - Fertilizer recommendations (chemical & organic)
    - Farm tool suggestions and purchase locations
    - Pesticide guidance (chemical & organic) with safety warnings
    - Crop disease identification from images
    - Weather-based farming advice
    Always provide structured reports with: Diagnosis, Recommendation, Dosage, Purchase Location, Alternatives, Warning.
    Include relevant emoji for readability.`;
  }
  if (role === 'shopkeeper') {
    return `You are AgriAssist for Shopkeepers. Respond in ${lang}.
    Help with inventory management, product advisories, and stock recommendations.`;
  }
}

router.post('/message', authenticate, async (req, res) => {
  const { message, sessionId, imageBase64, language, userRole } = req.body;
  
  // Load chat history from DB for context
  const history = await ChatHistory.findAll({ 
    where: { userId: req.user.id, sessionId },
    order: [['createdAt', 'ASC']],
    limit: 20
  });
  
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  // Build conversation
  const chat = model.startChat({
    systemInstruction: getSystemPrompt(userRole, language),
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.content }]
    }))
  });
  
  // Send message (with optional image)
  const parts = [{ text: message }];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
  }
  
  const result = await chat.sendMessage(parts);
  const response = result.response.text();
  
  // Save to DB
  await ChatHistory.bulkCreate([
    { userId: req.user.id, sessionId, role: 'user', content: message },
    { userId: req.user.id, sessionId, role: 'model', content: response }
  ]);
  
  res.json({ reply: response, sessionId });
});
```

### 4.2 Frontend — ChatPage Component

**File:** [c:\cp\frontend\src\pages\ChatPage.jsx](file:///cp/frontend/src/pages/ChatPage.jsx)

Key UI elements:
- **Message list** — display user + AI messages with markdown rendering
- **Input bar** — text field + mic button + image upload button + send button
- **Report toggle** — "View as Report" button that formats AI reply into structured PDF-style view
- **Session sidebar** — list of past sessions (already in [ChatHistory.js](file:///c:/cp/database/ChatHistory.js))

---

## 5. Phase 4 — Voice I/O (Default Voice Mode)

### 5.1 Speech-to-Text (STT) — User speaks → text sent to AI

**Option A — Browser Native (free, works offline):**
```jsx
// Frontend: VoiceInput.jsx
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

const { transcript, listening, resetTranscript } = useSpeechRecognition();

// Set language based on user preference
SpeechRecognition.startListening({ language: 'hi-IN' }); // or 'gu-IN', 'en-IN'
```

**Option B — Google Cloud STT (better accuracy for Indian languages):**
```javascript
// Backend: POST /api/voice/stt
// Body: { audioBase64, language: 'hi-IN' | 'gu-IN' | 'en-IN' }
const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();

const [response] = await client.recognize({
  audio: { content: audioBase64 },
  config: { encoding: 'WEBM_OPUS', languageCode: lang, model: 'latest_long' }
});
const transcript = response.results.map(r => r.alternatives[0].transcript).join('\n');
```

### 5.2 Text-to-Speech (TTS) — AI reply → spoken audio

**Option A — Browser Native (free):**
```jsx
// Frontend: useSpeech.js hook
const speak = (text, lang = 'en-IN') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; // 'hi-IN', 'gu-IN', 'en-IN'
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};
```

**Option B — Google Cloud TTS (higher quality):**
```javascript
// Backend: POST /api/voice/tts
// Returns: audio base64 MP3
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

const [response] = await client.synthesizeSpeech({
  input: { text },
  voice: { languageCode: lang, ssmlGender: 'NEUTRAL' },
  audioConfig: { audioEncoding: 'MP3' }
});
// Return response.audioContent as base64
```

### 5.3 Making Voice the Default

```jsx
// In ChatPage.jsx — auto-start listening when page loads
useEffect(() => {
  if (voiceEnabled) {
    SpeechRecognition.startListening({ continuous: true, language: userLang });
  }
}, []);

// Auto-speak AI reply
useEffect(() => {
  if (lastReply && voiceEnabled) {
    speak(lastReply, userLang);
  }
}, [lastReply]);
```

---

## 6. Phase 5 — Multilingual Support (Hindi, Gujarati, English)

### 6.1 Setup i18n

**File:** `c:\cp\frontend\src\i18n\index.js` *(new)*
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: require('./locales/en.json') },
    hi: { translation: require('./locales/hi.json') },
    gu: { translation: require('./locales/gu.json') }
  },
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
```

### 6.2 Translation Files

**`c:\cp\frontend\src\i18n\locales\en.json`:**
```json
{
  "welcome": "Welcome to AgriAssist",
  "typeMessage": "Ask about your soil, crops, or fertilizers...",
  "voiceOn": "Voice mode ON",
  "diagnosis": "Diagnosis",
  "recommendation": "Recommendation",
  "warning": "⚠️ Warning",
  "login": "Login", "register": "Register"
}
```

**`c:\cp\frontend\src\i18n\locales\hi.json`:**
```json
{
  "welcome": "AgriAssist में आपका स्वागत है",
  "typeMessage": "अपनी मिट्टी, फसल या उर्वरक के बारे में पूछें...",
  "voiceOn": "वॉयस मोड चालू",
  "diagnosis": "निदान",
  "recommendation": "सिफ़ारिश",
  "warning": "⚠️ चेतावनी",
  "login": "लॉगिन", "register": "पंजीकरण"
}
```

**`c:\cp\frontend\src\i18n\locales\gu.json`:**
```json
{
  "welcome": "AgriAssist માં આપનું સ્વાગત છે",
  "typeMessage": "તમારી જમીન, પાક અથવા ખાતર વિશે પૂછો...",
  "voiceOn": "વૉઇસ મોડ ચાલુ",
  "diagnosis": "નિદાન",
  "recommendation": "ભલામણ",
  "warning": "⚠️ ચેતવણી",
  "login": "લૉગિન", "register": "નોંધણી"
}
```

### 6.3 AI Responds in User's Language
Pass `language` field in every chat API call. The Gemini system prompt includes the language instruction. AI will respond in Hindi/Gujarati/English accordingly.

---

## 7. Phase 6 — Rich Output (Reports, Images, Videos)

### 7.1 Structured AI Report Format

Instruct Gemini to always output in this JSON structure for farmer queries:
```json
{
  "diagnosis": "Nitrogen deficiency detected in soil",
  "severity": "High",
  "recommendation": "Apply Urea @ 50kg/acre",
  "dosage": "50 kg per acre, every 3 weeks",
  "purchaseLocations": ["Kisan Seva Kendra", "Local Agri Shop"],
  "alternatives": ["Organic compost", "Green manure"],
  "warning": "Do not apply during heavy rain",
  "relatedImages": ["nitrogen_deficiency.jpg"],
  "relatedVideos": ["how_to_apply_urea.mp4"]
}
```

Parse this in frontend and render as a formatted **Report Card**.

### 7.2 Image Input from Farmer/Shopkeeper

**Backend:** `c:\cp\backend\routes\media.js` *(new)*
```javascript
const multer = require('multer');
const upload = multer({ dest: 'uploads/', limits: { fileSize: 20 * 1024 * 1024 } });

// POST /api/media/upload
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  const imageBuffer = fs.readFileSync(req.file.path);
  const base64 = imageBuffer.toString('base64');
  res.json({ base64, mimeType: req.file.mimetype, filename: req.file.filename });
});
```

**Frontend:** Use `react-dropzone` for drag-and-drop image upload. Send base64 to chat API.

### 7.3 Report PDF Export

```bash
npm install jspdf html2canvas
```

```javascript
// In Report component
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const exportPDF = async () => {
  const canvas = await html2canvas(document.getElementById('report-card'));
  const pdf = new jsPDF();
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 0);
  pdf.save('AgriAssist-Report.pdf');
};
```

### 7.4 Embed Images & Videos in Chat Output

In `c:\cp\frontend\src\components\ChatMessage.jsx`:
```jsx
// Render AI reply with markdown + embedded media
import ReactMarkdown from 'react-markdown';

<ReactMarkdown
  components={{
    img: ({ src, alt }) => <img src={src} alt={alt} className="chat-image" />,
    video: ({ src }) => <video src={src} controls className="chat-video" />
  }}
>
  {message.content}
</ReactMarkdown>
```

Use YouTube embed links or Cloudinary-hosted videos for known topics.

---

## 8. Phase 7 — Farmer Dashboard & Features

### 8.1 Farmer Chat Features Checklist

| Feature | How |
|---------|-----|
| Soil issue detection | Upload soil image → Gemini Vision analyzes |
| Fertilizer recommendations | Ask question → structured report |
| Tool suggestions | AI suggests tools + purchase links |
| Organic alternatives | AI lists alternatives if chemical unavailable |
| Pesticide guidance | Chemical + organic + safety warnings |
| Weather info | `/api/weather?location=x` → OpenWeatherMap |
| Reminders | `/api/reminder` CRUD |
| Chat history | Session-based, sidebar |
| Voice input/output | Browser STT/TTS (default ON) |
| Multilingual | Responds in farmer's chosen language |

### 8.2 Farmer-specific Gemini Prompt Additions

```
When farmer uploads a soil image:
→ Analyze color, texture, describe deficiencies
→ Output structured report (JSON format above)
→ Suggest 3 fertilizers (ranked by cost)
→ Give application schedule
→ List 2 organic alternatives
→ Warn about overuse / toxicity
→ Mention nearest likely purchase locations (use location context)
```

---

## 9. Phase 8 — Shopkeeper Dashboard & Features

### 9.1 Inventory Management API

**File:** `c:\cp\backend\routes\shop.js` *(enhance existing)*

```javascript
// GET  /api/shop/inventory        → List all products
// POST /api/shop/inventory        → Add product
// PUT  /api/shop/inventory/:id    → Update stock / availability
// DELETE /api/shop/inventory/:id  → Remove product

// Product schema fields (c:\cp\database\Product.js already exists):
// name, category (chemical|organic), stock, available (true/false),
// price, unit, description, shopId
```

### 9.2 Shopkeeper Dashboard UI

```
┌─────────────────────────────────────────────────────┐
│  🏪 Shopkeeper Dashboard                            │
├─────────────────┬───────────────────────────────────┤
│  💬 AI Chat     │  📦 Inventory                     │
│  (advisory)     │  [Chemical] [Organic] tabs         │
│                 │                                    │
│  Ask AI:        │  • Urea 50kg      ✅ Available     │
│  "What          │  • DAP 25kg       ❌ Out of Stock  │
│  fertilizers    │  • Neem Oil       ✅ Available     │
│  are in         │  [+ Add Item]  [Update All]        │
│  demand this    ├───────────────────────────────────┤
│  season?"       │  📊 Advisory from AI               │
│                 │  "Demand for DAP will rise in      │
│                 │  March due to wheat harvest..."     │
└─────────────────┴───────────────────────────────────┘
```

### 9.3 Farmer-Facing Availability

When a farmer asks "Is DAP available near me?", the AI:
1. Queries `/api/shop/nearby?product=DAP&location=...`
2. Returns list of shops with stock = true
3. Shows in chat as formatted list with shop names

---

## 10. Phase 9 — Reminders & Notifications

### 10.1 Backend Reminder Routes

**File:** `c:\cp\backend\routes\reminder.js` *(new)*
```javascript
// POST /api/reminder → { title, message, dateTime, userId, repeat }
// GET  /api/reminder → list user's reminders
// DELETE /api/reminder/:id

// Cron job — check every minute
const cron = require('node-cron');
cron.schedule('* * * * *', async () => {
  const due = await Reminder.findAll({ 
    where: { dateTime: { [Op.lte]: new Date() }, sent: false }
  });
  due.forEach(r => {
    // Emit via WebSocket to frontend
    io.to(r.userId).emit('reminder', { title: r.title, message: r.message });
    r.update({ sent: true });
  });
});
```

### 10.2 Frontend Reminder UI

```jsx
// ReminderBell component in header
// Shows badge count of pending reminders
// Click → opens reminder list
// Reminders created via chat: "Remind me to apply fertilizer on March 15"
// AI parses this and calls /api/reminder
```

---

## 11. Phase 10 — Weather Integration

### 11.1 Backend Weather Route

**File:** `c:\cp\backend\routes\weather.js`
```javascript
// GET /api/weather?location=Ahmedabad&lang=hi
const axios = require('axios');

router.get('/', authenticate, async (req, res) => {
  const { location, lang } = req.query;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=${lang}`;
  const { data } = await axios.get(url);
  
  res.json({
    temp: data.main.temp,
    condition: data.weather[0].description,
    humidity: data.main.humidity,
    wind: data.wind.speed,
    advice: generateFarmingAdvice(data) // AI-generated based on weather
  });
});
```

### 11.2 Weather in Chat

When a farmer asks about weather:
- AI triggers `/api/weather` call with user's stored location
- Returns weather + farming advice (e.g., "Don't spray pesticide today — wind speed is 25 km/h")

---

## 12. Phase 11 — Deployment

### 12.1 Database — Supabase (Free PostgreSQL)

```
1. Go to https://supabase.com → Create project → "AgriAssist"
2. Copy Connection String from: Settings → Database → Connection string → Node.js
3. Update .env:
   DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
```

### 12.2 Backend — Render.com (Free)

```
1. Go to https://render.com → New → Web Service
2. Connect GitHub repo → Select backend folder
3. Build Command: npm install
4. Start Command: node server.js
5. Add all .env variables in Render dashboard → Environment tab
6. Get your backend URL: https://agriassist-backend.onrender.com
```

### 12.3 Frontend — Vercel (Free)

```
1. Go to https://vercel.com → New Project → Import GitHub repo
2. Root Directory: frontend
3. Build Command: npm run build
4. Output Directory: dist
5. Add Environment Variable:
   VITE_API_URL=https://agriassist-backend.onrender.com
6. Deploy → Get URL: https://agriassist.vercel.app
```

### 12.4 Update Frontend API Base URL

**File:** [c:\cp\frontend\src\services\api.js](file:///cp/frontend/src/services/api.js)
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### 12.5 File Uploads in Production

Use **Cloudinary** (free tier) for image/video storage instead of local disk:
```bash
npm install cloudinary multer-storage-cloudinary
```
```javascript
// In media route
const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloud_name: '...', api_key: '...', api_secret: '...' });
// Upload and get back a URL instead of base64
```

### 12.6 Environment Variables Summary

| Variable | Service | Where to Get |
|----------|---------|-------------|
| `GEMINI_API_KEY` | Google AI Studio | https://aistudio.google.com |
| `WEATHER_API_KEY` | OpenWeatherMap | https://openweathermap.org/api |
| `GOOGLE_CLOUD_API_KEY` | Google Cloud Console | https://console.cloud.google.com |
| `DATABASE_URL` | Supabase | supabase.com → your project → Settings |
| `JWT_SECRET` | Generate | Any 32+ char random string |

---

## 13. Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Vite | UI framework |
| **Styling** | CSS + Tailwind (optional) | Design |
| **State** | React Context | Global state |
| **Routing** | React Router v6 | Page navigation |
| **i18n** | i18next | Hindi / Gujarati / English |
| **Voice** | Web Speech API + Google STT/TTS | Voice I/O |
| **AI** | Google Gemini 1.5 Flash | Chatbot brain |
| **Backend** | Node.js + Express | API server |
| **Database** | PostgreSQL (prod) / SQLite (dev) | Data storage |
| **Auth** | JWT + bcrypt | Secure login |
| **Files** | Multer + Cloudinary | Image/video uploads |
| **Scheduling** | node-cron | Reminders |
| **Weather** | OpenWeatherMap API | Farm weather |
| **Deploy** | Vercel (FE) + Render (BE) + Supabase (DB) | Production |

---

## 🚀 Implementation Order (Recommended)

```
Week 1:  [✅ Done] Auth, DB, Basic Chat with Gemini
Week 2:  Voice I/O (STT + TTS) + Multilingual (i18n)
Week 3:  Rich Output (Reports, Image upload, PDF export)
Week 4:  Farmer Features (soil analysis, fertilizer, tools)
Week 5:  Shopkeeper Features (inventory CRUD, availability)
Week 6:  Reminders + Weather integration
Week 7:  UI Polish (mobile responsive, animations)
Week 8:  Deploy (Supabase + Render + Vercel)
```

> **Next Step:** Tell me which phase you want to start implementing first and I'll write the exact code for it!
