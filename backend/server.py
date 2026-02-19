from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import tempfile
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship_tag: str = "Friend"
    frequency_days: int = 7
    is_pinned: bool = False
    avatar_color: Optional[str] = None
    notes: Optional[str] = None

class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship_tag: Optional[str] = None
    frequency_days: Optional[int] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None
    avatar_color: Optional[str] = None
    notes: Optional[str] = None

class ContactResponse(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    relationship_tag: str = "Friend"
    frequency_days: int = 7
    is_pinned: bool = False
    is_archived: bool = False
    avatar_color: str = "#40916C"
    notes: Optional[str] = None
    last_interaction_at: Optional[str] = None
    interaction_count: int = 0
    connection_health: float = 100.0
    created_at: str
    updated_at: str

class InteractionCreate(BaseModel):
    contact_id: str
    interaction_type: str = "note"
    notes: Optional[str] = None
    voice_transcript: Optional[str] = None
    duration_minutes: Optional[int] = None

class InteractionResponse(BaseModel):
    id: str
    contact_id: str
    interaction_type: str
    notes: Optional[str] = None
    voice_transcript: Optional[str] = None
    ai_summary: Optional[str] = None
    key_highlights: List[str] = []
    action_items: List[str] = []
    emotional_cues: List[str] = []
    promises: List[str] = []
    important_dates: List[str] = []
    duration_minutes: Optional[int] = None
    created_at: str

class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_contact_ids: List[str] = []
    target_date: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    target_contact_ids: List[str] = []
    progress: float = 0.0
    status: str = "active"
    target_date: Optional[str] = None
    created_at: str

class SettingsResponse(BaseModel):
    notification_intensity: int = 50
    low_pressure_mode: bool = False
    theme_mode: str = "system"
    onboarding_completed: bool = False
    privacy_mode: bool = True
    data_encryption: bool = True

class SettingsUpdate(BaseModel):
    notification_intensity: Optional[int] = None
    low_pressure_mode: Optional[bool] = None
    theme_mode: Optional[str] = None
    onboarding_completed: Optional[bool] = None
    privacy_mode: Optional[bool] = None
    data_encryption: Optional[bool] = None

# ===================== HELPERS =====================

AVATAR_COLORS = ["#2D6A4F", "#40916C", "#52B788", "#95D5B2", "#457B9D", "#E9C46A", "#F4A261", "#E76F51", "#264653", "#A8DADC"]

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def calc_connection_health(last_interaction_at: Optional[str], frequency_days: int) -> float:
    if not last_interaction_at:
        return 0.0
    try:
        last = datetime.fromisoformat(last_interaction_at.replace('Z', '+00:00'))
        elapsed = (datetime.now(timezone.utc) - last).total_seconds() / 86400
        health = max(0.0, min(100.0, (1.0 - elapsed / frequency_days) * 100))
        return round(health, 1)
    except Exception:
        return 0.0

async def ai_summarize(text: str) -> dict:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"summarize-{uuid.uuid4()}",
            system_message="""You are an empathetic AI assistant for a personal relationship CRM called Touch.
Analyze the conversation/interaction notes and return a JSON object with:
- "summary": A brief 1-2 sentence summary of the interaction
- "key_highlights": Array of 2-3 key points discussed
- "action_items": Array of any follow-up actions or promises made
- "emotional_cues": Array of emotional tones detected (e.g., "happy", "concerned", "excited")
- "promises": Array of any promises or commitments mentioned
- "important_dates": Array of any dates or events mentioned
Return ONLY valid JSON, no markdown formatting."""
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        response = await chat.send_message(UserMessage(text=f"Analyze this interaction: {text}"))
        try:
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
            result = json.loads(cleaned)
            return result
        except json.JSONDecodeError:
            return {"summary": response[:200], "key_highlights": [], "action_items": [], "emotional_cues": [], "promises": [], "important_dates": []}
    except Exception as e:
        logger.error(f"AI summarize error: {e}")
        return {"summary": text[:200] if text else "", "key_highlights": [], "action_items": [], "emotional_cues": [], "promises": [], "important_dates": []}

async def ai_call_prep(contact_name: str, interactions: list) -> dict:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        interaction_text = "\n".join([
            f"[{i.get('created_at', 'unknown')}] {i.get('notes', '')} {i.get('ai_summary', '')}"
            for i in interactions[:5]
        ])
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"callprep-{uuid.uuid4()}",
            system_message="""You are a warm, empathetic AI assistant for Touch, a personal relationship CRM.
Generate a call preparation brief. Return a JSON object with:
- "recap": Brief recap of the last conversation (1-2 sentences)
- "follow_ups": Array of 2-3 suggested follow-up topics
- "important_dates": Array of upcoming important dates/events
- "conversation_starters": Array of 2-3 warm conversation starters
- "emotional_note": A brief note about the emotional context
Return ONLY valid JSON, no markdown formatting."""
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        prompt = f"Prepare a call brief for {contact_name}. Recent interactions:\n{interaction_text}"
        response = await chat.send_message(UserMessage(text=prompt))
        try:
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"recap": response[:200], "follow_ups": [], "important_dates": [], "conversation_starters": [], "emotional_note": ""}
    except Exception as e:
        logger.error(f"AI call prep error: {e}")
        return {"recap": "Unable to generate prep", "follow_ups": [], "important_dates": [], "conversation_starters": ["How have you been?"], "emotional_note": ""}

async def ai_insights(contacts_data: list) -> dict:
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        summary_text = "\n".join([
            f"- {c['name']} ({c['relationship_tag']}): last contact {c.get('last_interaction_at', 'never')}, frequency: every {c['frequency_days']} days, health: {c.get('connection_health', 0)}%"
            for c in contacts_data[:20]
        ])
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"insights-{uuid.uuid4()}",
            system_message="""You are a warm, empathetic AI for Touch relationship CRM.
Analyze the user's relationship data and return a JSON object with:
- "overall_insight": A warm, encouraging 2-sentence overview
- "drift_alerts": Array of objects with "contact_name" and "message" for contacts showing drift
- "category_balance": Object showing balance across relationship categories
- "suggestions": Array of 3 actionable, gentle suggestions
- "encouragement": A warm, non-judgmental encouragement message
Return ONLY valid JSON, no markdown formatting."""
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        response = await chat.send_message(UserMessage(text=f"Analyze these relationships:\n{summary_text}"))
        try:
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return {"overall_insight": response[:300], "drift_alerts": [], "category_balance": {}, "suggestions": [], "encouragement": ""}
    except Exception as e:
        logger.error(f"AI insights error: {e}")
        return {"overall_insight": "Keep nurturing your relationships!", "drift_alerts": [], "category_balance": {}, "suggestions": ["Reach out to someone today"], "encouragement": "You're doing great!"}

# ===================== ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "Touch API is running", "version": "1.0"}

# --- CONTACTS ---
@api_router.post("/contacts", response_model=ContactResponse)
async def create_contact(data: ContactCreate):
    import random
    contact = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "phone": data.phone,
        "email": data.email,
        "relationship_tag": data.relationship_tag,
        "frequency_days": data.frequency_days,
        "is_pinned": data.is_pinned,
        "is_archived": False,
        "avatar_color": data.avatar_color or random.choice(AVATAR_COLORS),
        "notes": data.notes,
        "last_interaction_at": None,
        "interaction_count": 0,
        "connection_health": 0.0,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.contacts.insert_one({**contact, "_id": contact["id"]})
    return ContactResponse(**contact)

@api_router.get("/contacts", response_model=List[ContactResponse])
async def get_contacts(archived: bool = False, tag: Optional[str] = None):
    query = {"is_archived": archived}
    if tag:
        query["relationship_tag"] = tag
    contacts = await db.contacts.find(query, {"_id": 0}).sort("is_pinned", -1).to_list(500)
    for c in contacts:
        c["connection_health"] = calc_connection_health(c.get("last_interaction_at"), c.get("frequency_days", 7))
    return [ContactResponse(**c) for c in contacts]

@api_router.get("/contacts/{contact_id}", response_model=ContactResponse)
async def get_contact(contact_id: str):
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact["connection_health"] = calc_connection_health(contact.get("last_interaction_at"), contact.get("frequency_days", 7))
    return ContactResponse(**contact)

@api_router.put("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact(contact_id: str, data: ContactUpdate):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = now_iso()
    await db.contacts.update_one({"id": contact_id}, {"$set": update_data})
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact["connection_health"] = calc_connection_health(contact.get("last_interaction_at"), contact.get("frequency_days", 7))
    return ContactResponse(**contact)

@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    result = await db.contacts.delete_one({"id": contact_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    await db.interactions.delete_many({"contact_id": contact_id})
    return {"message": "Contact deleted"}

# --- INTERACTIONS ---
@api_router.post("/interactions", response_model=InteractionResponse)
async def create_interaction(data: InteractionCreate):
    text_to_analyze = data.notes or data.voice_transcript or ""
    ai_result = {}
    if text_to_analyze and len(text_to_analyze) > 10:
        ai_result = await ai_summarize(text_to_analyze)

    interaction = {
        "id": str(uuid.uuid4()),
        "contact_id": data.contact_id,
        "interaction_type": data.interaction_type,
        "notes": data.notes,
        "voice_transcript": data.voice_transcript,
        "ai_summary": ai_result.get("summary", ""),
        "key_highlights": ai_result.get("key_highlights", []),
        "action_items": ai_result.get("action_items", []),
        "emotional_cues": ai_result.get("emotional_cues", []),
        "promises": ai_result.get("promises", []),
        "important_dates": ai_result.get("important_dates", []),
        "duration_minutes": data.duration_minutes,
        "created_at": now_iso(),
    }
    await db.interactions.insert_one({**interaction, "_id": interaction["id"]})
    await db.contacts.update_one(
        {"id": data.contact_id},
        {"$set": {"last_interaction_at": now_iso(), "updated_at": now_iso()}, "$inc": {"interaction_count": 1}}
    )
    return InteractionResponse(**interaction)

@api_router.get("/interactions/{contact_id}", response_model=List[InteractionResponse])
async def get_interactions(contact_id: str, limit: int = 20):
    interactions = await db.interactions.find(
        {"contact_id": contact_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return [InteractionResponse(**i) for i in interactions]

# --- VOICE TRANSCRIPTION ---
@api_router.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    try:
        from emergentintegrations.llm.openai import OpenAISpeechToText
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        contents = await file.read()
        suffix = Path(file.filename).suffix if file.filename else ".wav"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        with open(tmp_path, "rb") as audio_file:
            response = await stt.transcribe(file=audio_file, model="whisper-1", response_format="json", language="en")
        os.unlink(tmp_path)
        return {"transcript": response.text}
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

# --- AI CALL PREP ---
@api_router.get("/ai/call-prep/{contact_id}")
async def get_call_prep(contact_id: str):
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    interactions = await db.interactions.find(
        {"contact_id": contact_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(5)
    if not interactions:
        return {
            "contact_name": contact["name"],
            "recap": "No previous interactions recorded yet.",
            "follow_ups": ["Get to know them better", "Ask about their day"],
            "important_dates": [],
            "conversation_starters": ["How have you been?", "What's new with you?"],
            "emotional_note": "This is a fresh connection — be warm and open!"
        }
    prep = await ai_call_prep(contact["name"], interactions)
    prep["contact_name"] = contact["name"]
    return prep

# --- AI INSIGHTS ---
@api_router.get("/ai/insights")
async def get_insights():
    contacts = await db.contacts.find({"is_archived": False}, {"_id": 0}).to_list(100)
    for c in contacts:
        c["connection_health"] = calc_connection_health(c.get("last_interaction_at"), c.get("frequency_days", 7))
    if not contacts:
        return {
            "overall_insight": "Add some contacts to start tracking your relationships!",
            "drift_alerts": [],
            "category_balance": {},
            "suggestions": ["Add your first contact to get started"],
            "encouragement": "Every journey begins with a single step!"
        }
    insights = await ai_insights(contacts)
    return insights

# --- CONVERSATION PROMPTS ---
@api_router.get("/ai/prompts/{contact_id}")
async def get_prompts(contact_id: str, mode: str = "deep"):
    contact = await db.contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    interactions = await db.interactions.find(
        {"contact_id": contact_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(3)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        context = "\n".join([i.get("notes", "") or i.get("ai_summary", "") for i in interactions]) if interactions else "No previous interactions"
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"prompts-{uuid.uuid4()}",
            system_message=f"""Generate {mode} conversation prompts for reaching out to {contact['name']} ({contact['relationship_tag']}).
Return a JSON array of 5 strings, each a warm conversation prompt.
Return ONLY a JSON array, no other text."""
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        response = await chat.send_message(UserMessage(text=f"Recent context: {context}"))
        cleaned = response.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()
        prompts = json.loads(cleaned)
        return {"prompts": prompts, "mode": mode}
    except Exception as e:
        logger.error(f"Prompts error: {e}")
        return {"prompts": ["How have you been?", "What's been on your mind lately?", "I've been thinking about you!"], "mode": mode}

# --- DASHBOARD ---
@api_router.get("/dashboard")
async def get_dashboard():
    contacts = await db.contacts.find({"is_archived": False}, {"_id": 0}).to_list(500)
    total = len(contacts)
    if total == 0:
        return {
            "overall_score": 0,
            "total_contacts": 0,
            "needs_attention": [],
            "suggested_contact": None,
            "weekly_interactions": 0,
            "monthly_interactions": 0,
            "category_breakdown": {},
        }

    scores = []
    needs_attention = []
    for c in contacts:
        health = calc_connection_health(c.get("last_interaction_at"), c.get("frequency_days", 7))
        c["connection_health"] = health
        scores.append(health)
        if health < 30:
            needs_attention.append({"id": c["id"], "name": c["name"], "health": health, "relationship_tag": c["relationship_tag"]})

    overall_score = round(sum(scores) / len(scores), 1) if scores else 0

    needs_attention.sort(key=lambda x: x["health"])
    needs_attention = needs_attention[:5]

    # Suggested contact: lowest health pinned first, then lowest health
    pinned = [c for c in contacts if c.get("is_pinned")]
    pool = pinned if pinned else contacts
    suggested = min(pool, key=lambda c: c.get("connection_health", 0)) if pool else None
    suggested_contact = None
    if suggested:
        suggested_contact = {"id": suggested["id"], "name": suggested["name"], "health": suggested.get("connection_health", 0), "relationship_tag": suggested["relationship_tag"]}

    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    month_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    weekly_count = await db.interactions.count_documents({"created_at": {"$gte": week_ago}})
    monthly_count = await db.interactions.count_documents({"created_at": {"$gte": month_ago}})

    categories = {}
    for c in contacts:
        tag = c.get("relationship_tag", "Other")
        categories[tag] = categories.get(tag, 0) + 1

    return {
        "overall_score": overall_score,
        "total_contacts": total,
        "needs_attention": needs_attention,
        "suggested_contact": suggested_contact,
        "weekly_interactions": weekly_count,
        "monthly_interactions": monthly_count,
        "category_breakdown": categories,
    }

# --- GOALS ---
@api_router.post("/goals", response_model=GoalResponse)
async def create_goal(data: GoalCreate):
    goal = {
        "id": str(uuid.uuid4()),
        "title": data.title,
        "description": data.description,
        "target_contact_ids": data.target_contact_ids,
        "progress": 0.0,
        "status": "active",
        "target_date": data.target_date,
        "created_at": now_iso(),
    }
    await db.goals.insert_one({**goal, "_id": goal["id"]})
    return GoalResponse(**goal)

@api_router.get("/goals", response_model=List[GoalResponse])
async def get_goals(status: str = "active"):
    goals = await db.goals.find({"status": status}, {"_id": 0}).to_list(100)
    return [GoalResponse(**g) for g in goals]

@api_router.put("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: str, progress: Optional[float] = None, status: Optional[str] = None):
    update = {}
    if progress is not None:
        update["progress"] = progress
    if status is not None:
        update["status"] = status
    if update:
        await db.goals.update_one({"id": goal_id}, {"$set": update})
    goal = await db.goals.find_one({"id": goal_id}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return GoalResponse(**goal)

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    result = await db.goals.delete_one({"id": goal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}

# --- SETTINGS ---
@api_router.get("/settings", response_model=SettingsResponse)
async def get_settings():
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        default_settings = {
            "id": "default",
            "notification_intensity": 50,
            "low_pressure_mode": False,
            "theme_mode": "system",
            "onboarding_completed": False,
            "privacy_mode": True,
            "data_encryption": True,
        }
        await db.settings.insert_one({**default_settings, "_id": "default"})
        return SettingsResponse(**default_settings)
    return SettingsResponse(**settings)

@api_router.put("/settings", response_model=SettingsResponse)
async def update_settings(data: SettingsUpdate):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    await db.settings.update_one(
        {"id": "default"},
        {"$set": update_data},
        upsert=True,
    )
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    return SettingsResponse(**settings)

# --- DATA EXPORT & DELETE ---
@api_router.get("/data/export")
async def export_data():
    contacts = await db.contacts.find({}, {"_id": 0}).to_list(1000)
    interactions = await db.interactions.find({}, {"_id": 0}).to_list(5000)
    goals = await db.goals.find({}, {"_id": 0}).to_list(100)
    settings = await db.settings.find_one({"id": "default"}, {"_id": 0})
    return {
        "contacts": contacts,
        "interactions": interactions,
        "goals": goals,
        "settings": settings,
        "exported_at": now_iso(),
    }

@api_router.delete("/data/delete-all")
async def delete_all_data():
    await db.contacts.delete_many({})
    await db.interactions.delete_many({})
    await db.goals.delete_many({})
    await db.settings.delete_many({})
    return {"message": "All data deleted"}

# --- SEED DATA ---
@api_router.post("/seed")
async def seed_data():
    existing = await db.contacts.count_documents({})
    if existing > 0:
        return {"message": "Data already seeded", "count": existing}

    import random
    sample_contacts = [
        {"name": "Mom", "relationship_tag": "Family", "frequency_days": 3, "is_pinned": True, "phone": "+1234567890"},
        {"name": "Dad", "relationship_tag": "Family", "frequency_days": 5, "is_pinned": True, "phone": "+1234567891"},
        {"name": "Sarah", "relationship_tag": "Friend", "frequency_days": 7, "is_pinned": True, "phone": "+1234567892"},
        {"name": "Alex", "relationship_tag": "Friend", "frequency_days": 14, "is_pinned": False, "phone": "+1234567893"},
        {"name": "Dr. Williams", "relationship_tag": "Mentor", "frequency_days": 30, "is_pinned": False, "phone": "+1234567894"},
        {"name": "Jamie", "relationship_tag": "Partner", "frequency_days": 1, "is_pinned": True, "phone": "+1234567895"},
    ]

    created = []
    for sc in sample_contacts:
        days_ago = random.randint(0, sc["frequency_days"] * 2)
        last_dt = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
        contact = {
            "id": str(uuid.uuid4()),
            "name": sc["name"],
            "phone": sc.get("phone"),
            "email": None,
            "relationship_tag": sc["relationship_tag"],
            "frequency_days": sc["frequency_days"],
            "is_pinned": sc["is_pinned"],
            "is_archived": False,
            "avatar_color": random.choice(AVATAR_COLORS),
            "notes": None,
            "last_interaction_at": last_dt,
            "interaction_count": random.randint(1, 15),
            "connection_health": 0,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        contact["connection_health"] = calc_connection_health(contact["last_interaction_at"], contact["frequency_days"])
        await db.contacts.insert_one({**contact, "_id": contact["id"]})
        created.append(contact["id"])

        # Seed some interactions
        for _ in range(random.randint(1, 3)):
            inter_days_ago = random.randint(0, 30)
            interaction = {
                "id": str(uuid.uuid4()),
                "contact_id": contact["id"],
                "interaction_type": random.choice(["call", "text", "note"]),
                "notes": random.choice([
                    "Had a great chat about their weekend plans.",
                    "Quick check-in, they seemed happy.",
                    "Talked about upcoming birthday celebration.",
                    "Discussed their new job, very excited.",
                    "They mentioned feeling stressed about work.",
                ]),
                "voice_transcript": None,
                "ai_summary": "A warm conversation covering recent updates.",
                "key_highlights": ["Caught up on recent news"],
                "action_items": [],
                "emotional_cues": ["warm", "connected"],
                "promises": [],
                "important_dates": [],
                "duration_minutes": random.randint(5, 45),
                "created_at": (datetime.now(timezone.utc) - timedelta(days=inter_days_ago)).isoformat(),
            }
            await db.interactions.insert_one({**interaction, "_id": interaction["id"]})

    # Set onboarding as not completed
    await db.settings.update_one(
        {"id": "default"},
        {"$set": {"onboarding_completed": False}},
        upsert=True,
    )

    return {"message": f"Seeded {len(created)} contacts with interactions", "contact_ids": created}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
