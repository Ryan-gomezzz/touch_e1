# Touch

A **privacy-first personal relationship CRM** that helps busy people stay emotionally consistent with the people who matter most. Track connections, get AI-powered call prep, and receive gentle reminders — without aggressive alerts.

---

## About

Touch combines time-based relationship tracking, contextual memory assistance, AI-powered call preparation, and intelligent scheduling. It’s designed to feel like a calm, non-judgmental companion for maintaining meaningful connections with family, friends, and important contacts.

- **Mission:** Help busy people stay emotionally consistent with loved ones through a calm, minimal interface.
- **Vibe:** Calm, warm, minimal, organic, trustworthy.

---

## Features

| Area | Capabilities |
|------|----------------|
| **Home** | Connection score, Inner Circle rings, suggested contact for today, needs-attention list |
| **Contacts** | Add/edit/delete, relationship tags, custom touch frequency, pin to Inner Circle, archive |
| **Interactions** | Log calls, texts, notes, meetings; AI summaries, highlights, action items, emotional cues |
| **Memory Bank** | Searchable history per contact, AI summaries, chronological timeline |
| **Call Prep** | Last conversation recap, follow-ups, important dates, conversation starters, tone reminders |
| **Insights** | Relationship consistency score, weekly/monthly stats, AI insights, drift detection |
| **Goals** | Create and track relationship goals (e.g. “Call parents weekly”) |
| **Voice** | Record voice notes; transcription via OpenAI Whisper |
| **Calendar** | AI-suggested optimal call times per contact |
| **Reminders** | Priority-based gentle reminders; respects Low Pressure Mode |
| **Shared Mode** | Invite partner or co-parent; share selected contacts |
| **Widget** | Home screen widget with connection rings and suggested contact |
| **Freemium** | Free (5 contacts) → Plus ($4.99/mo) → Premium ($9.99/mo) with Razorpay |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Expo (React Native) + TypeScript, Expo Router, file-based routing |
| **Backend** | FastAPI (Python 3.10+) |
| **Database** | MongoDB (Motor async driver) |
| **AI** | Gemini 3 Flash via Emergent LLM; OpenAI Whisper for speech-to-text |
| **Payments** | Razorpay (orders, verification, subscriptions) |
| **Push** | Expo Push Service (no Firebase required) |

---

## Project Structure

```
touch_e1/
├── backend/                 # FastAPI server
│   ├── server.py            # Main API (contacts, interactions, AI, payments, push, etc.)
│   ├── requirements.txt
│   └── tests/               # Pytest API tests
├── frontend/                # Expo React Native app
│   ├── app/                 # Screens (file-based routing)
│   │   ├── (tabs)/          # Home, Contacts, Insights, Settings
│   │   ├── contact/         # Add, edit, detail
│   │   ├── interaction/    # Log interaction
│   │   ├── callprep/        # AI call prep
│   │   └── ...
│   ├── src/                 # API client, theme, components
│   ├── app.json             # Expo config (Touch, scheme, permissions)
│   ├── eas.json             # EAS Build profiles (dev, preview, production)
│   └── package.json
├── memory/                  # Product and spec
│   └── PRD.md               # Product Requirements Document
├── test_reports/            # Pytest / iteration reports
├── design_guidelines.json   # Design system (colors, typography, components)
├── DEPLOYMENT_README.md     # Play Store, API keys, backend deploy, EAS build
└── README.md                # This file
```

---

## Prerequisites

- **Node.js** 18+ and **Yarn**
- **Python** 3.10+ and **pip**
- **MongoDB** (local or [MongoDB Atlas](https://cloud.mongodb.com/))
- (Optional) [Expo account](https://expo.dev/signup) for EAS Build
- (Optional) [Razorpay account](https://dashboard.razorpay.com/) for payments

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ryan-gomezzz/touch_e1.git
cd touch_e1
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env` with:

```env
MONGO_URL=mongodb://localhost:27017
# Or: mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=touch_db
EMERGENT_LLM_KEY=sk-emergent-...        # For AI features (call prep, insights, etc.)
RAZORPAY_KEY_ID=rzp_test_...             # Optional; for payments
RAZORPAY_KEY_SECRET=...                 # Optional
```

Start the API:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

API base: `http://localhost:8001`. Health check: `GET http://localhost:8001/api/`.

### 3. Frontend setup

```bash
cd frontend
yarn install
```

Create `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

For a physical device, use your machine’s LAN IP (e.g. `http://192.168.1.10:8001`) so the app can reach the backend.

Start the app:

```bash
yarn start
# or: npx expo start
```

Then choose iOS simulator, Android emulator, or Expo Go. For Android emulator, use `http://10.0.2.2:8001` as backend URL.

---

## Environment Variables

| Location | Variable | Description |
|----------|----------|-------------|
| **backend/.env** | `MONGO_URL` | MongoDB connection string |
| | `DB_NAME` | Database name (e.g. `touch_db`) |
| | `EMERGENT_LLM_KEY` | Emergent LLM key for AI features |
| | `RAZORPAY_KEY_ID` | Razorpay key ID (optional) |
| | `RAZORPAY_KEY_SECRET` | Razorpay secret (optional) |
| **frontend/.env** | `EXPO_PUBLIC_BACKEND_URL` | Backend API base URL |

Full list and production notes: see [DEPLOYMENT_README.md](./DEPLOYMENT_README.md).

---

## Testing

Backend tests use **pytest** and hit the running API (set `BACKEND_URL` or `EXPO_PUBLIC_BACKEND_URL` if not using the default in `conftest.py`).

```bash
cd backend
pip install -r requirements.txt
# Start server (e.g. uvicorn server:app --host 0.0.0.0 --port 8001) in another terminal, then:
pytest tests/ -v
```

Test modules include: `test_touch_api.py`, `test_iteration2_new_features.py`, `test_iteration3_smoke.py`, `test_iteration4_payment_push.py`.

---

## Design System

- **Theme:** Calm, warm, minimal (“Cozy Wellness Haven”).
- **Primary:** Sage green `#2D6A4F`; background cream `#F9F7F2`.
- **Health:** Green (healthy) → Amber (fading) → Burnt orange (urgent).
- **Typography:** Lora (headings), Nunito (body), Inter (data).
- **Icons:** Feather (`@expo/vector-icons`).

Details: [design_guidelines.json](./design_guidelines.json).

---

## Documentation

- **[DEPLOYMENT_README.md](./DEPLOYMENT_README.md)** — API keys, backend deployment (Railway/Render/AWS), EAS Build (APK/AAB), Play Store submission, push notifications, env reference.
- **[memory/PRD.md](./memory/PRD.md)** — Product requirements, API endpoints, permissions, payment and EAS notes.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |
| POST | `/api/seed` | Seed sample data |
| GET/POST | `/api/contacts` | List / create contacts |
| GET/PUT/DELETE | `/api/contacts/{id}` | Get / update / delete contact |
| POST | `/api/interactions` | Log interaction (with optional AI analysis) |
| GET | `/api/interactions/{contact_id}` | Interaction history |
| POST | `/api/voice/transcribe` | Voice → text (Whisper) |
| GET | `/api/ai/call-prep/{id}` | AI call prep brief |
| GET | `/api/ai/insights` | AI relationship insights |
| GET | `/api/ai/prompts/{id}` | Conversation prompts |
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/goals` | List / create goals |
| PUT/DELETE | `/api/goals/{id}` | Update / delete goal |
| GET/PUT | `/api/settings` | Get / update settings |
| GET | `/api/notifications/pending` | Pending reminders |
| POST | `/api/push/register` | Register Expo push token |
| POST | `/api/push/send-reminders` | Send reminder pushes |
| GET | `/api/calendar/suggest-times/{id}` | AI-suggested call times |
| GET | `/api/premium/status` | Premium tier status |
| POST | `/api/razorpay/order` | Create Razorpay order |
| POST | `/api/razorpay/verify` | Verify payment |
| GET | `/api/widget/data` | Widget data |
| GET | `/api/data/export` | Export all data |
| DELETE | `/api/data/delete-all` | Delete all data |

---

## License & Repository

- **Repository:** [github.com/Ryan-gomezzz/touch_e1](https://github.com/Ryan-gomezzz/touch_e1)

No license file is present in the repo; check the repository for current terms.
