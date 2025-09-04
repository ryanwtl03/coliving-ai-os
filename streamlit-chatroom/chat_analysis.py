# chat_analysis.py
import os, re, json, random, requests, sqlite3
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd

# ===== Gemini config =====
GEMINI_MODEL = "gemini-2.0-flash"
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "AIzaSyC7qV9g4sj3G5u-ViSIICcFr4QAWbkoAFQ")

# ===== Constants =====
DB_PATH = os.environ.get(
    "CHAT_DB_PATH",
    r"C:\Users\User\TARUMT\project\coliving-ai-os\database\database\analysis.db"
)

SENT_BUCKETS  = ["SP","MP","WP","N","MN","WN","SN"]
SENT_TO_SCORE = {"SP": 3, "MP": 2, "WP": 1, "N": 0, "MN": -2, "WN": -1, "SN": -3}
EMOTION_KEYS  = ["joy","anger","sadness","fear","surprise","disgust","neutral"]
EMO_THRESHOLD = 0.20

# ------------------------------------------------------
# DB Helpers
# ------------------------------------------------------
def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def seed_emotions():
    with db() as conn:
        for e in EMOTION_KEYS:
            conn.execute("INSERT OR IGNORE INTO Emotion(emotion) VALUES (?)", (e,))

# ------------------------------------------------------
# CRUD: Client, Agent, Conversation, Message
# ------------------------------------------------------
def create_client(name: str, email: Optional[str]) -> int:
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO Client (name, email, created_at) VALUES (?,?,?)",
            (name or "Unnamed", email, datetime.utcnow().isoformat()),
        )
        return cur.lastrowid

def list_clients(q: str="") -> List[sqlite3.Row]:
    with db() as conn:
        if q.strip():
            like = f"%{q.lower()}%"
            return conn.execute("""
                SELECT * FROM Client
                 WHERE lower(name) LIKE ? OR lower(email) LIKE ?
                 ORDER BY created_at DESC
            """, (like, like)).fetchall()
        return conn.execute("SELECT * FROM Client ORDER BY created_at DESC").fetchall()

def get_client(client_id:int) -> Optional[sqlite3.Row]:
    with db() as conn:
        return conn.execute("SELECT * FROM Client WHERE client_id=?", (client_id,)).fetchone()

# Profile (OCEAN)
def get_profile(client_id:int) -> Optional[sqlite3.Row]:
    with db() as conn:
        return conn.execute("SELECT * FROM Client_Profile WHERE client_id=?", (client_id,)).fetchone()

def upsert_profile(client_id:int, ocean:Dict[str,float]):
    with db() as conn:
        conn.execute("""
            INSERT INTO Client_Profile
              (client_id, openness, conscientiousness, extraversion, agreeableness, neuroticism, last_updated_at)
            VALUES (?,?,?,?,?,?,?)
            ON CONFLICT(client_id) DO UPDATE SET
              openness=excluded.openness,
              conscientiousness=excluded.conscientiousness,
              extraversion=excluded.extraversion,
              agreeableness=excluded.agreeableness,
              neuroticism=excluded.neuroticism,
              last_updated_at=excluded.last_updated_at
        """, (
            client_id,
            float(ocean.get("openness",0.0)),
            float(ocean.get("conscientiousness",0.0)),
            float(ocean.get("extraversion",0.0)),
            float(ocean.get("agreeableness",0.0)),
            float(ocean.get("neuroticism",0.0)),
            datetime.utcnow().isoformat()
        ))

# Conversation
STATUS_IN_PROGRESS = "in_progress"
STATUS_SOLVED = "solved"

def create_conversation(client_id: int) -> int:
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO Conversation (client_id, started_at, ended_at, status) VALUES (?,?,NULL,?)",
            (client_id, datetime.utcnow().isoformat(), STATUS_IN_PROGRESS)
        )
        return cur.lastrowid

def list_conversations(client_id:int) -> List[sqlite3.Row]:
    with db() as conn:
        return conn.execute("""
            SELECT * FROM Conversation
             WHERE client_id=?
             ORDER BY conversation_id DESC
        """, (client_id,)).fetchall()

def mark_solved(conversation_id: int):
    with db() as conn:
        conn.execute(
            "UPDATE Conversation SET status=?, ended_at=? WHERE conversation_id=?",
            (STATUS_SOLVED, datetime.utcnow().isoformat(), conversation_id)
        )

def mark_in_progress(conversation_id: int):
    with db() as conn:
        conn.execute(
            "UPDATE Conversation SET status=?, ended_at=NULL WHERE conversation_id=?",
            (STATUS_IN_PROGRESS, conversation_id)
        )

def get_conversation_status(conversation_id: int) -> str:
    with db() as conn:
        row = conn.execute("SELECT status FROM Conversation WHERE conversation_id=?", (conversation_id,)).fetchone()
        return row["status"] if row else None

def pretty_status(s: str) -> str:
    return "in progress" if s == "in_progress" else "solved"

# Message
def create_message(conversation_id:int, *, text:str, language:str="en",
                   client_id:Optional[int]=None, agent_id:Optional[int]=None) -> int:
    with db() as conn:
        cur = conn.execute("""
            INSERT INTO Message (content, language, client_id, agent_id, timestamp, conversation_id)
            VALUES (?,?,?,?,?,?)
        """, (text, language, client_id, agent_id, datetime.utcnow().isoformat(), conversation_id))
        return cur.lastrowid

def fetch_messages(conversation_id:int, limit:int=500) -> List[sqlite3.Row]:
    with db() as conn:
        return conn.execute("""
            SELECT m.*, s.sentiment
              FROM Message m
         LEFT JOIN Sentiment_Analysis s ON s.message_id=m.message_id
             WHERE m.conversation_id=?
          ORDER BY m.message_id ASC
             LIMIT ?
        """, (conversation_id, limit)).fetchall()
    
# Sentiment (label only per your schema)
def upsert_sentiment(message_id:int, label:str):
    with db() as conn:
        conn.execute("""
            INSERT INTO Sentiment_Analysis (message_id, sentiment, created_at)
            VALUES (?,?,?)
            ON CONFLICT(message_id) DO UPDATE SET
              sentiment=excluded.sentiment,
              created_at=excluded.created_at
        """, (message_id, label, datetime.utcnow().isoformat()))

# Emotions (presence-only per your schema)
def upsert_emotions_presence(message_id:int, emotions:Dict[str,float], threshold:float=EMO_THRESHOLD):
    with db() as conn:
        # remove previous rows then insert presence for above-threshold emotions
        conn.execute("DELETE FROM Emotion_Analysis WHERE message_id=?", (message_id,))
        for emo, val in (emotions or {}).items():
            try:
                v = float(val)
            except Exception:
                v = 0.0
            if v >= threshold:
                # ensure emotion exists in dictionary table
                conn.execute("INSERT OR IGNORE INTO Emotion(emotion) VALUES (?)", (emo,))
                conn.execute("INSERT OR IGNORE INTO Emotion_Analysis (message_id, emotion) VALUES (?,?)",
                             (message_id, emo))

# Topics (conversation-level per your schema)
def upsert_topics_for_conversation(conversation_id:int, topics:List[str]):
    if not topics: return
    clean = []
    seen = set()
    for t in topics:
        t = (t or "").strip().lower()
        if not t or len(t) > 64 or t in seen: continue
        seen.add(t); clean.append(t)
    if not clean: return
    with db() as conn:
        for t in clean:
            conn.execute("INSERT OR IGNORE INTO Topic(topic) VALUES (?)", (t,))
            conn.execute("INSERT OR IGNORE INTO Topic_Analysis (conversation_id, topic) VALUES (?,?)",
                         (conversation_id, t))

# ------------------------------------------------------
# Analytics helpers (sentiment, emotion heatmap, topics)
# ------------------------------------------------------
def sentiment_series_df(conversation_id:int) -> pd.DataFrame:
    with db() as conn:
        rows = conn.execute("""
            SELECT m.message_id, m.timestamp, s.sentiment
              FROM Message m
              JOIN Sentiment_Analysis s ON s.message_id=m.message_id
             WHERE m.conversation_id=? AND m.client_id IS NOT NULL
          ORDER BY m.message_id ASC
        """, (conversation_id,)).fetchall()
    if not rows:
        return pd.DataFrame(columns=["idx","timestamp","label","score"])
    df = pd.DataFrame(rows, columns=["message_id","timestamp","label"])
    df["score"] = df["label"].map(SENT_TO_SCORE).fillna(0).astype(int)
    df["idx"]   = range(1, len(df)+1)
    return df[["idx","timestamp","label","score"]]

def emotion_heatmap_df(conversation_id:int) -> pd.DataFrame:
    with db() as conn:
        mids = [r["message_id"] for r in conn.execute("""
            SELECT message_id
              FROM Message
             WHERE conversation_id=? AND client_id IS NOT NULL
          ORDER BY message_id ASC
        """, (conversation_id,)).fetchall()]
        if not mids:
            return pd.DataFrame(columns=["idx","emotion","value"])
        idx_map = {mid: i+1 for i, mid in enumerate(mids)}
        placeholders = ",".join("?" * len(mids))
        present = conn.execute(f"""
            SELECT message_id, emotion
              FROM Emotion_Analysis
             WHERE message_id IN ({placeholders})
        """, tuple(mids)).fetchall()
    present_set = {(row["message_id"], row["emotion"]) for row in present}
    rows = []
    for mid in mids:
        for emo in EMOTION_KEYS:
            rows.append({
                "idx": idx_map[mid],
                "emotion": emo,
                "value": 1.0 if (mid, emo) in present_set else 0.0
            })
    return pd.DataFrame(rows)

# --- Agents ---
def list_agents() -> List[sqlite3.Row]:
    with db() as conn:
        return conn.execute(
            "SELECT agent_id, name, email FROM Agent ORDER BY agent_id"
        ).fetchall()

def create_agent(name: str, email: Optional[str] = None, date_of_birth: Optional[str] = None) -> int:
    with db() as conn:
        cur = conn.execute(
            "INSERT INTO Agent (name, date_of_birth, email, created_at) VALUES (?,?,?,?)",
            (name or "Agent", date_of_birth, email, datetime.utcnow().isoformat()),
        )
        return cur.lastrowid

# ------------------------------------------------------
# LLM Analysis
# ------------------------------------------------------
PROMPT = """
You are a text analytics model for chat messages. Analyze the MESSAGE and return STRICT JSON:
{
  "sentiment": "SP|MP|WP|N|MN|WN|SN",
  "emotions": {"joy":0..1,"anger":0..1,"sadness":0..1,"fear":0..1,"surprise":0..1,"disgust":0..1,"neutral":0..1},
  "personality": {"openness":0..1,"conscientiousness":0..1,"extraversion":0..1,"agreeableness":0..1,"neuroticism":0..1},
  "topics": ["lowercase","keywords", "1-5 items"]
}
Rules: JSON only, no markdown. If empty, neutral with neutral=1.0 and empty topics.
"""
SUMMARY_PROMPT = """
You are a support-chat summarizer. In <= 35 words, write a plain summary of the conversation.

Rules:
- One or two sentences, no markdown, no bullets, no headings.
- Neutral tone, no PII, do not invent facts.
Transcript:
"""
STOP = set("a an the i you he she it we they me my your our their is are was were be been being to of in on at by for with about from and or but if then so than as this that these those here there".split())


POS = set("love great awesome happy good amazing fantastic delighted wonderful excellent".split())
NEG = set("bad sad angry terrible awful worst frustrated upset hate horrible".split())


def analyze(text: str) -> Dict:
    try:
        if not GOOGLE_API_KEY: raise RuntimeError("No API key set")
        res = call_gemini(text)
        res["engine"] = "gemini"
    except Exception as e:
        print(f"Gemini error → using fallback: {e}")
        res = fallback_heuristic(text)
        res["engine"] = "fallback"
    res["emotions"] = normalize_emotions(res.get("emotions", {}))
    return res

def normalize_emotions(e: Dict[str, float]) -> Dict[str, float]:
    out = {k: float(max(0.0, min(1.0, e.get(k, 0.0)))) for k in EMOTION_KEYS}
    non_neutral_sum = sum(out[k] for k in EMOTION_KEYS if k != "neutral")
    out["neutral"] = max(0.0, min(1.0, 1.0 - non_neutral_sum))
    return {k: round(out[k], 3) for k in EMOTION_KEYS}

def fallback_heuristic(text: str) -> Dict:
    words = re.findall(r"[a-zA-Z']+", text.lower())
    score = sum(w in POS for w in words) - sum(w in NEG for w in words)
    if score >= 3:   sent = "SP"
    elif score == 2: sent = "MP"
    elif score == 1: sent = "WP"
    elif score == 0: sent = "N"
    elif score == -1: sent = "WN"
    elif score == -2: sent = "MN"
    else:            sent = "SN"
    base = {"joy":0.22,"anger":0.06,"sadness":0.06,"fear":0.06,"surprise":0.08,"disgust":0.02}
    emo = normalize_emotions(base)
    toks = [w for w in words if w not in STOP and len(w)>2][:5]
    return {"sentiment":sent,"emotions":emo,
            "personality":{"openness":0.6,"conscientiousness":0.55,"extraversion":0.5,"agreeableness":0.6,"neuroticism":0.4},
            "topics":toks}

def call_gemini(message: str) -> Dict:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GOOGLE_API_KEY}
    data = {"contents": [{"parts": [{"text": PROMPT.strip()}, {"text": f"\nMESSAGE:\n{message}"}]}]}
    r = requests.post(url, headers=headers, json=data, timeout=8)
    r.raise_for_status()
    txt = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip().strip("`")
    start, end = txt.find("{"), txt.rfind("}")
    if start != -1 and end != -1:
        txt = txt[start:end+1]
    return json.loads(txt)

def _build_transcript(messages: list[dict], max_chars: int = 6000) -> str:
    # "User: hi\nAgent: hello\n..."
    parts = [f"{m['role']}: {m['text']}" for m in messages if m.get("text")]
    transcript = "\n".join(parts)
    return transcript[-max_chars:]

def summarize_with_gemini(messages: list[dict]) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GOOGLE_API_KEY}
    transcript = _build_transcript(messages)
    data = {"contents": [{"parts": [{"text": SUMMARY_PROMPT.strip() + "\n" + transcript}]}]}
    r = requests.post(url, headers=headers, json=data, timeout=12)
    r.raise_for_status()
    txt = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    return txt

def fallback_summary(messages: list[dict]) -> str:
    # Tiny heuristic: use first user line as issue, last agent line as outcome.
    issue = next((m["text"] for m in messages if m["role"]=="User" and m.get("text")), "User reported an issue.")
    outcome = next((m["text"] for m in reversed(messages) if m["role"]=="Agent" and m.get("text")), "Agent provided guidance.")
    return (
        "• Issue: " + (issue[:160]) + "\n"
        "• Context: Conversation involved multiple back-and-forth messages.\n"
        "• Actions: Agent investigated and responded with steps.\n"
        "• Outcome: " + (outcome[:160]) + "\n"
        "• Tone: Mixed; varied from concern to resolution."
    )

def generate_conversation_summary(messages: list[dict]) -> str:
    try:
        if not GOOGLE_API_KEY:
            raise RuntimeError("Missing GOOGLE_API_KEY")
        return summarize_with_gemini(messages)
    except Exception:
        return fallback_summary(messages)
    
def read_messages_for_summary(conversation_id: int, limit: int = 500) -> list[dict]:
    """Oldest → newest. Includes a computed role label."""
    with db() as conn:
        rows = conn.execute("""
            SELECT message_id, content, client_id, agent_id, timestamp
            FROM Message
            WHERE conversation_id=?
            ORDER BY message_id ASC
            LIMIT ?
        """, (conversation_id, limit)).fetchall()
    def role(r):
        if r["client_id"] is not None: return "User"
        if r["agent_id"]  is not None: return "Agent"
        return "System"
    return [dict(id=r["message_id"], role=role(r), text=r["content"], ts=r["timestamp"]) for r in rows]

def upsert_conversation_summary(conversation_id: int, summary_text: str):
    with db() as conn:
        conn.execute("""INSERT OR REPLACE INTO Conversation_Summary
                        (conversation_id, summary_text, created_at)
                        VALUES (?,?,?)""",
                     (conversation_id, summary_text, datetime.utcnow().isoformat(timespec="seconds")))

def get_conversation_summary(conversation_id: int) -> str | None:
    with db() as conn:
        row = conn.execute("SELECT summary_text FROM Conversation_Summary WHERE conversation_id=?",
                           (conversation_id,)).fetchone()
        return row["summary_text"] if row else None