# Touch — Product Requirements Document (PRD)

## Overview
Touch is a privacy-first personal relationship CRM designed to help busy people stay emotionally consistent with the people who matter most. It combines time-based relationship tracking, contextual memory assistance, AI-powered call preparation, and intelligent scheduling.

## Tech Stack
- **Frontend**: Expo React Native (TypeScript)
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI**: Gemini 3 Flash via emergentintegrations (Emergent LLM Key)
- **Voice**: OpenAI Whisper (whisper-1) for speech-to-text

## Core Features (MVP)

### 1. Onboarding Flow
- 4-step welcome wizard (Stay Present → Track Naturally → AI Memory → Privacy First)
- Seeds sample contacts for demo
- Skip option available

### 2. Home Dashboard
- Connection score with weekly/monthly stats
- Inner Circle connection rings (pinned contacts)
- Suggested contact for today (lowest health)
- Needs attention list
- Quick actions (Log Interaction, Goals, Insights)

### 3. Contact Management
- Add/Edit/Delete contacts
- Relationship tags: Family, Friend, Mentor, Partner, Colleague, Other
- Custom touch frequency (Daily, 3 days, Weekly, Bi-weekly, Monthly, Quarterly)
- Pin to Inner Circle
- Archive inactive contacts
- Connection health tracking (time-based)

### 4. Interaction Logging
- Text notes with AI analysis
- Interaction types: Call, Text, Note, Meeting
- Contact picker for general logging
- AI extracts: summaries, key highlights, action items, emotional cues, promises, important dates

### 5. Memory Bank
- Searchable conversation history per contact
- AI-generated summaries with emotional context
- Chronological interaction timeline
- Highlights and follow-up tracking

### 6. AI Call Preparation
- Last conversation recap
- Follow-up suggestions
- Upcoming important dates
- Conversation starters
- Emotional tone reminders
- Deep/Light conversation prompt modes

### 7. Connection Score Dashboard
- Overall relationship consistency score
- Weekly and monthly interaction counts
- Category breakdown (Family, Friends, etc.)
- AI-powered relationship insights
- Drift detection and suggestions

### 8. Emotional Goals
- Create relationship goals
- Track progress
- Complete/Delete goals
- Examples: "Call parents weekly", "Reconnect with old friends"

### 9. Settings
- Privacy Mode toggle
- Data Encryption toggle
- Low Pressure Mode (reduce reminder frequency)
- Notification intensity control
- Theme selection (System/Light/Dark)
- Data Export (JSON)
- Delete All Data
- Privacy Policy & Terms of Service links

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/ | Health check |
| POST | /api/seed | Seed sample data |
| GET/POST | /api/contacts | List/Create contacts |
| GET/PUT/DELETE | /api/contacts/{id} | Get/Update/Delete contact |
| POST | /api/interactions | Log interaction with AI analysis |
| GET | /api/interactions/{contact_id} | Get interaction history |
| POST | /api/voice/transcribe | Voice-to-text (Whisper) |
| GET | /api/ai/call-prep/{id} | AI call preparation brief |
| GET | /api/ai/insights | AI relationship insights |
| GET | /api/ai/prompts/{id} | AI conversation prompts |
| GET | /api/dashboard | Dashboard stats |
| GET/POST | /api/goals | List/Create goals |
| PUT/DELETE | /api/goals/{id} | Update/Delete goal |
| GET/PUT | /api/settings | Get/Update settings |
| GET | /api/data/export | Export all data |
| DELETE | /api/data/delete-all | Delete all data |

## Design System
- **Theme**: Calm, warm, minimal ("Cozy Wellness Haven")
- **Colors**: Sage Green (#2D6A4F) primary, Cream (#F9F7F2) background
- **Health indicators**: Green (healthy) → Amber (fading) → Burnt Orange (urgent)
- **Typography**: Lora (headings), Nunito (body)
- **Icons**: Feather from @expo/vector-icons

## Privacy & Compliance
- Local-first architecture
- Data encryption support
- Data export (GDPR-ready)
- Complete data deletion
- No user tracking or telemetry
- Transparent permissions (Microphone, Contacts, Calendar)

## Business Enhancement
- **Freemium model potential**: Free tier with 5 contacts, Premium with unlimited contacts + advanced AI insights
- **Subscription opportunity**: $4.99/month for AI call prep, relationship insights, and unlimited memory bank
