# Touch — Deployment Guide

## Play Store Deployment, API Keys & Production Setup

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [API Keys Setup](#api-keys-setup)
3. [Backend Deployment](#backend-deployment)
4. [Build Android APK/AAB](#build-android-apkaab)
5. [Play Store Submission](#play-store-submission)
6. [Push Notifications Setup](#push-notifications-setup)
7. [Post-Launch Checklist](#post-launch-checklist)

---

## Prerequisites

- Node.js 18+ and Yarn
- Python 3.10+ and pip
- An [Expo account](https://expo.dev/signup)
- A [Razorpay account](https://dashboard.razorpay.com/signup)
- A [Google Play Developer account](https://play.google.com/console/) ($25 one-time fee)
- MongoDB Atlas account (for production DB) or self-hosted MongoDB

Install the EAS CLI globally:
```bash
npm install -g eas-cli
eas login  # Login with your Expo account
```

---

## API Keys Setup

### Where to put each key:

### 1. Razorpay (Payment Gateway)
**File:** `/app/backend/.env`
```env
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXX
```

**How to get:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings → API Keys**
3. Click **Generate Key** (or use existing)
4. Copy `Key ID` and `Key Secret`

> **Test Mode:** Use keys starting with `rzp_test_` for testing.  
> **Live Mode:** Use keys starting with `rzp_live_` for production. You must complete KYC verification on Razorpay before going live.

### 2. Emergent LLM Key (AI Features)
**File:** `/app/backend/.env`
```env
EMERGENT_LLM_KEY=sk-emergent-XXXXXXXXXXXXX
```
This powers: AI conversation summaries, call prep briefs, relationship insights, conversation prompts, and calendar suggestions.

> If the key budget runs low, go to **Profile → Universal Key → Add Balance** to top up.

### 3. MongoDB (Database)
**File:** `/app/backend/.env`
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/touch_db
DB_NAME=touch_db
```

**How to get:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Click **Connect → Drivers → Python**
4. Copy the connection string and replace `<password>` with your DB password

### 4. Backend URL (Frontend config)
**File:** `/app/frontend/.env`
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

**Also update in** `/app/frontend/eas.json`:
```json
"env": {
  "EXPO_PUBLIC_BACKEND_URL": "https://your-production-backend-url.com"
}
```

---

## Backend Deployment

The backend is a FastAPI Python server. Deploy it to any of these:

### Option A: Railway.app (Recommended, easiest)
1. Push your `/app/backend` folder to a GitHub repo
2. Go to [Railway.app](https://railway.app/) → New Project → Deploy from GitHub
3. Add environment variables from `.env`
4. Railway auto-detects Python and deploys

### Option B: Render.com
1. Create a new **Web Service** on [Render](https://render.com/)
2. Connect your GitHub repo, point to `/app/backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn server:app --host 0.0.0.0 --port 8001`
5. Add environment variables

### Option C: AWS / GCP / Azure
Deploy as a Docker container or use managed services. A Dockerfile example:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Important:** After deploying, update `EXPO_PUBLIC_BACKEND_URL` in the frontend `.env` and `eas.json` with your deployed backend URL.

---

## Build Android APK/AAB

### Step 1: Configure EAS
The `eas.json` is already set up in `/app/frontend/eas.json`. Review and update:
- `EXPO_PUBLIC_BACKEND_URL` in each build profile

### Step 2: Build for Testing (APK)
```bash
cd /app/frontend
eas build --platform android --profile preview
```
This generates an APK you can install directly on Android devices.

### Step 3: Build for Play Store (AAB)
```bash
cd /app/frontend
eas build --platform android --profile production
```
This generates an Android App Bundle (.aab) required by the Play Store.

### Step 4: Download the Build
After the build completes, download the `.aab` file from:
- The EAS dashboard at https://expo.dev/
- Or the URL shown in the terminal

---

## Play Store Submission

### Step 1: Create App on Play Console
1. Go to [Google Play Console](https://play.google.com/console/)
2. Click **Create App**
3. Fill in app details:
   - **App name:** Touch
   - **Default language:** English
   - **App or game:** App
   - **Free or paid:** Free (with in-app subscriptions)

### Step 2: Store Listing
Fill in these required fields:
- **Short description:** "Stay emotionally connected with the people who matter most"
- **Full description:** "Touch is a privacy-first personal relationship CRM that helps busy people maintain meaningful connections. Track when you last connected with friends and family, get AI-powered conversation prep, and receive gentle reminders — never aggressive alerts."
- **App icon:** 512x512 PNG (use your app icon)
- **Feature graphic:** 1024x500 PNG
- **Screenshots:** At least 2 phone screenshots (take from the app)
- **Category:** Communication or Lifestyle
- **Content rating:** Complete the questionnaire (Touch has no violent/sexual content)
- **Privacy policy URL:** Host your privacy policy and link it

### Step 3: App Content Declarations
- **Data safety:** Declare what data is collected
  - Personal info: Name, email, phone (stored locally + MongoDB)
  - App activity: Interaction logs (encrypted)
  - Device info: Push token (for notifications)
  - **Data NOT shared with third parties** ✓
  - **Data encrypted in transit** ✓
  - **Users can request data deletion** ✓
- **Ads:** No ads
- **Target audience:** 18+ (relationship management)
- **Government apps:** No
- **Financial features:** In-app purchases via Razorpay

### Step 4: In-App Purchases Setup (Razorpay)
Since we use Razorpay (not Google Play Billing), note:
- Google requires digital goods to use Google Play Billing
- Razorpay is acceptable for **physical goods/services**
- For subscriptions, you may need to use Google Play Billing for compliance
- Alternative: Use Razorpay for Indian users, Google Play Billing for global

### Step 5: Upload AAB & Release
1. Go to **Production → Create new release**
2. Upload your `.aab` file
3. Add release notes: "Initial release of Touch v1.0.0"
4. Review and submit for review

### Step 6: Auto-submit via EAS (Optional)
```bash
eas submit --platform android --profile production
```
This requires a Google Service Account JSON key:
1. Go to Google Cloud Console → IAM → Service Accounts
2. Create a service account with Play Console permissions
3. Download JSON key → save as `google-service-account.json` in `/app/frontend/`
4. Update `eas.json` → `submit.production.android.serviceAccountKeyPath`

---

## Push Notifications Setup

Touch uses **Expo Push Service** for notifications — no Firebase required!

### How It Works
1. App registers an Expo Push Token on the device
2. Backend stores tokens in MongoDB
3. Backend sends notifications via `https://exp.host/--/api/v2/push/send`
4. Expo routes to the correct device (Android via FCM, iOS via APNs)

### For Android (Required for Production)
Expo handles FCM setup automatically for EAS builds. No manual Firebase config needed.

### For iOS (If deploying to App Store later)
You'll need an Apple Push Notification Key:
1. Go to Apple Developer → Keys → Create a new key
2. Enable "Apple Push Notifications service (APNs)"
3. Download the `.p8` key file
4. Upload to Expo: `eas credentials --platform ios`

### Sending Remote Push Notifications
Use the backend API:
```bash
# Send to all devices
curl -X POST https://your-backend.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{"title": "Touch Reminder", "body": "Check in with Mom today"}'

# Send reminder pushes for contacts needing attention
curl -X POST https://your-backend.com/api/push/send-reminders
```

### Setting Up Automated Reminders
For automated daily/weekly push notifications, set up a cron job:
```bash
# Every day at 9 AM
0 9 * * * curl -X POST https://your-backend.com/api/push/send-reminders
```

---

## Post-Launch Checklist

- [ ] Backend deployed and accessible
- [ ] `EXPO_PUBLIC_BACKEND_URL` updated to production URL
- [ ] Razorpay live keys set (KYC completed)
- [ ] Emergent LLM key has sufficient balance
- [ ] MongoDB Atlas cluster provisioned (not local)
- [ ] Privacy policy page hosted and linked in Play Store
- [ ] Terms of service page hosted
- [ ] App icon and splash screen finalized
- [ ] At least 2 Play Store screenshots uploaded
- [ ] Content rating questionnaire completed
- [ ] Data safety section filled out
- [ ] Push notifications tested on real device
- [ ] Payment flow tested end-to-end
- [ ] Cron job set up for daily push reminders
- [ ] Error monitoring set up (Sentry recommended)
- [ ] Analytics set up (optional — respects privacy)

---

## Environment Variables Reference

### Backend (`/app/backend/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URL` | MongoDB connection string | Yes |
| `DB_NAME` | Database name | Yes |
| `EMERGENT_LLM_KEY` | AI features (Gemini 3 Flash) | Yes |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | Yes |

### Frontend (`/app/frontend/.env`)
| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend API base URL | Yes |

### EAS Build (`/app/frontend/eas.json`)
| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | Set per build profile (dev/preview/production) |

---

## Support

- **Razorpay Docs:** https://razorpay.com/docs/
- **Expo Docs:** https://docs.expo.dev/
- **EAS Build:** https://docs.expo.dev/build/introduction/
- **Play Store Publishing:** https://support.google.com/googleplay/android-developer/answer/9859152
