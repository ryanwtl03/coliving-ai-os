from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uvicorn
import json

from typing import List, Dict
import sqlite3
from collections import defaultdict
from datetime import datetime, date

DB_PATH = [
    "database/chat_analysis_history_data.db",
    "database/chat_analysis.db",
    "database/analysis.db",
    "database/test.db"
]


app = FastAPI(title="Conversation Analytics API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_URL = "coliving-ai-os/chat-analysis"

# ----------------------------
# DB helper
# ----------------------------
def query_db(query: str, params=()) -> List[Dict]:
    with sqlite3.connect(DB_PATH[3]) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(query, params)
        return [dict(row) for row in cur.fetchall()]

# ----------------------------
# Routes
# ----------------------------

@app.get(f"/{BASE_URL}/kpis")
def get_kpis():
    total = query_db("SELECT COUNT(*) as count FROM Conversation")[0]["count"]
    in_progress = query_db("SELECT COUNT(*) as count FROM Conversation WHERE status = 'in_progress'")[0]["count"]
    solved = query_db("SELECT COUNT(*) as count FROM Conversation WHERE status = 'solved'")[0]["count"]
    negative = query_db("""
        SELECT COUNT(*) as count 
        FROM Sentiment_Analysis sa
        JOIN Message m ON sa.message_id = m.message_id
        WHERE sentiment = 'negative'
    """)[0]["count"]
    urgent = query_db("SELECT COUNT(*) as count FROM Conversation WHERE status = 'urgent'")[0]["count"]

    return {
        "total": total,
        "inProgress": in_progress,
        "solved": solved,
        "negative": negative,
        "urgent": urgent
    }

@app.get(f"/{BASE_URL}/conversations")
def get_conversations():
    rows = query_db("""
        SELECT json_object(
            'id', 'CONV-' || c.conversation_id,
            'tenantId', c.client_id,
            'agentIds', (
                SELECT json_group_array(DISTINCT m2.agent_id)
                FROM Message m2
                WHERE m2.conversation_id = c.conversation_id
                  AND m2.agent_id IS NOT NULL
            ),
            'status', CASE c.status
                        WHEN 'in_progress' THEN 'In Progress'
                        ELSE c.status
                      END,
            'sentiment', (
                SELECT CASE
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 1
                         THEN 'strong positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 0
                         THEN 'moderate positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < -1
                         THEN 'strong negative'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < 0
                         THEN 'moderate negative'
                    ELSE 'neutral'
                END
                FROM Message m3
                JOIN Sentiment_Analysis sa ON sa.message_id = m3.message_id
                WHERE m3.conversation_id = c.conversation_id
            ),
            'emotions', (
                SELECT json_group_array(DISTINCT ea.emotion)
                FROM Message m4
                JOIN Emotion_Analysis ea ON ea.message_id = m4.message_id
                WHERE m4.conversation_id = c.conversation_id
            ),
            'topics', (
                SELECT json_group_array(DISTINCT ta.topic)
                FROM Topic_Analysis ta
                WHERE ta.conversation_id = c.conversation_id
            ),
            'summary', (
                SELECT cs.summary_text
                FROM Conversation_Summary cs
                WHERE cs.conversation_id = c.conversation_id
            ),
            'messages', (
                SELECT json_group_array(
                    json_object(
                        'id', m.message_id,
                        'senderId', COALESCE(m.client_id, m.agent_id),
                        'senderType', CASE
                            WHEN m.client_id IS NOT NULL THEN 'tenant'
                            WHEN m.agent_id IS NOT NULL THEN 'agent'
                            ELSE 'system'
                        END,
                        'content', m.content,
                        'timestamp', m.timestamp,
                        'sentiment', (
                            SELECT CASE sa.sentiment
                                WHEN 'positive' THEN 1
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END
                            FROM Sentiment_Analysis sa
                            WHERE sa.message_id = m.message_id
                        ),
                        'emotions', (
                            SELECT json_group_array(DISTINCT ea.emotion)
                            FROM Emotion_Analysis ea
                            WHERE ea.message_id = m.message_id
                        )
                    )
                )
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
                ORDER BY m.timestamp ASC
            ),
            'lastUpdated', (
                SELECT MAX(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'startedAt', (
                SELECT MIN(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            )
        ) AS conversation
        FROM Conversation c;
    """)

    conversations = [json.loads(row["conversation"]) for row in rows]

    # Convert all timestamps to ISO 8601 (UTC) for TypeScript compatibility
    def to_iso(dt_str: str | None) -> str | None:
        if not dt_str:
            return None
        try:
            # parse whatever SQLite gave you
            dt = datetime.fromisoformat(dt_str)
            return dt.isoformat() + "Z"
        except Exception:
            return dt_str  # fallback if format is already okay

    for conv in conversations:
        conv["startedAt"] = to_iso(conv.get("startedAt"))
        conv["lastUpdated"] = to_iso(conv.get("lastUpdated"))
        for msg in conv.get("messages", []):
            msg["timestamp"] = to_iso(msg.get("timestamp"))

    return conversations

@app.get(f"/{BASE_URL}/sentiment-distribution")
def get_conversations_for_sentiment_distribution():
    rows = query_db("""
        SELECT json_object(
            'id', 'CONV-' || c.conversation_id,
            'tenantId', c.client_id,
            'agentIds', (
                SELECT json_group_array(DISTINCT m2.agent_id)
                FROM Message m2
                WHERE m2.conversation_id = c.conversation_id
                  AND m2.agent_id IS NOT NULL
            ),
            'status', CASE c.status
                        WHEN 'in_progress' THEN 'In Progress'
                        ELSE c.status
                      END,
            'sentiment', (
                SELECT CASE
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 1
                         THEN 'strong positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 0
                         THEN 'moderate positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < -1
                         THEN 'strong negative'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < 0
                         THEN 'moderate negative'
                    ELSE 'neutral'
                END
                FROM Message m3
                JOIN Sentiment_Analysis sa ON sa.message_id = m3.message_id
                WHERE m3.conversation_id = c.conversation_id
            ),
            'emotions', (
                SELECT json_group_array(DISTINCT ea.emotion)
                FROM Message m4
                JOIN Emotion_Analysis ea ON ea.message_id = m4.message_id
                WHERE m4.conversation_id = c.conversation_id
            ),
            'topics', (
                SELECT json_group_array(DISTINCT ta.topic)
                FROM Topic_Analysis ta
                WHERE ta.conversation_id = c.conversation_id
            ),
            'summary', (
                SELECT cs.summary_text
                FROM Conversation_Summary cs
                WHERE cs.conversation_id = c.conversation_id
            ),
            'messages', (
                SELECT json_group_array(
                    json_object(
                        'id', m.message_id,
                        'senderId', COALESCE(m.client_id, m.agent_id),
                        'senderType', CASE
                            WHEN m.client_id IS NOT NULL THEN 'tenant'
                            WHEN m.agent_id IS NOT NULL THEN 'agent'
                            ELSE 'system'
                        END,
                        'content', m.content,
                        'timestamp', m.timestamp,
                        'sentiment', (
                            SELECT CASE sa.sentiment
                                WHEN 'positive' THEN 1
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END
                            FROM Sentiment_Analysis sa
                            WHERE sa.message_id = m.message_id
                        ),
                        'emotions', (
                            SELECT json_group_array(DISTINCT ea.emotion)
                            FROM Emotion_Analysis ea
                            WHERE ea.message_id = m.message_id
                        )
                    )
                )
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'lastUpdated', (
                SELECT MAX(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'startedAt', (
                SELECT MIN(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            )
        ) AS conversation
        FROM Conversation c;
    """)

    conversations = [json.loads(row["conversation"]) for row in rows]

    # Convert all timestamps to ISO 8601 (UTC) for TypeScript compatibility
    def to_iso(dt_str: str | None) -> str | None:
        if not dt_str:
            return None
        try:
            # parse whatever SQLite gave you
            dt = datetime.fromisoformat(dt_str)
            return dt.isoformat() + "Z"
        except Exception:
            return dt_str  # fallback if format is already okay

    for conv in conversations:
        conv["startedAt"] = to_iso(conv.get("startedAt"))
        conv["lastUpdated"] = to_iso(conv.get("lastUpdated"))
        for msg in conv.get("messages", []):
            msg["timestamp"] = to_iso(msg.get("timestamp"))

    return conversations

@app.get(f"/{BASE_URL}/emotion-distribution")
def get_conversations_for_emotion_distribution():
    rows = query_db("""
        SELECT json_object(
            'id', 'CONV-' || c.conversation_id,
            'tenantId', c.client_id,
            'agentIds', (
                SELECT json_group_array(DISTINCT m2.agent_id)
                FROM Message m2
                WHERE m2.conversation_id = c.conversation_id
                  AND m2.agent_id IS NOT NULL
            ),
            'status', CASE c.status
                        WHEN 'in_progress' THEN 'In Progress'
                        ELSE c.status
                      END,
            'sentiment', (
                SELECT CASE
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 1
                         THEN 'strong positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 0
                         THEN 'moderate positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < -1
                         THEN 'strong negative'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < 0
                         THEN 'moderate negative'
                    ELSE 'neutral'
                END
                FROM Message m3
                JOIN Sentiment_Analysis sa ON sa.message_id = m3.message_id
                WHERE m3.conversation_id = c.conversation_id
            ),
            'emotions', (
                SELECT json_group_array(DISTINCT ea.emotion)
                FROM Message m4
                JOIN Emotion_Analysis ea ON ea.message_id = m4.message_id
                WHERE m4.conversation_id = c.conversation_id
            ),
            'topics', (
                SELECT json_group_array(DISTINCT ta.topic)
                FROM Topic_Analysis ta
                WHERE ta.conversation_id = c.conversation_id
            ),
            'summary', (
                SELECT cs.summary_text
                FROM Conversation_Summary cs
                WHERE cs.conversation_id = c.conversation_id
            ),
            'messages', (
                SELECT json_group_array(
                    json_object(
                        'id', m.message_id,
                        'senderId', COALESCE(m.client_id, m.agent_id),
                        'senderType', CASE
                            WHEN m.client_id IS NOT NULL THEN 'tenant'
                            WHEN m.agent_id IS NOT NULL THEN 'agent'
                            ELSE 'system'
                        END,
                        'content', m.content,
                        'timestamp', m.timestamp,
                        'sentiment', (
                            SELECT CASE sa.sentiment
                                WHEN 'positive' THEN 1
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END
                            FROM Sentiment_Analysis sa
                            WHERE sa.message_id = m.message_id
                        ),
                        'emotions', (
                            SELECT json_group_array(DISTINCT ea.emotion)
                            FROM Emotion_Analysis ea
                            WHERE ea.message_id = m.message_id
                        )
                    )
                )
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'lastUpdated', (
                SELECT MAX(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'startedAt', (
                SELECT MIN(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            )
        ) AS conversation
        FROM Conversation c;
    """)

    conversations = [json.loads(row["conversation"]) for row in rows]

    # Convert all timestamps to ISO 8601 (UTC) for TypeScript compatibility
    def to_iso(dt_str: str | None) -> str | None:
        if not dt_str:
            return None
        try:
            # parse whatever SQLite gave you
            dt = datetime.fromisoformat(dt_str)
            return dt.isoformat() + "Z"
        except Exception:
            return dt_str  # fallback if format is already okay

    for conv in conversations:
        conv["startedAt"] = to_iso(conv.get("startedAt"))
        conv["lastUpdated"] = to_iso(conv.get("lastUpdated"))
        for msg in conv.get("messages", []):
            msg["timestamp"] = to_iso(msg.get("timestamp"))

    return conversations

@app.get(f"/{BASE_URL}/sentiment-trend")
def get_conversations_for_emotion_distribution():
    rows = query_db("""
        SELECT json_object(
            'id', 'CONV-' || c.conversation_id,
            'tenantId', c.client_id,
            'agentIds', (
                SELECT json_group_array(DISTINCT m2.agent_id)
                FROM Message m2
                WHERE m2.conversation_id = c.conversation_id
                  AND m2.agent_id IS NOT NULL
            ),
            'status', CASE c.status
                        WHEN 'in_progress' THEN 'In Progress'
                        ELSE c.status
                      END,
            'sentiment', (
                SELECT CASE
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 1
                         THEN 'strong positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 0
                         THEN 'moderate positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < -1
                         THEN 'strong negative'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < 0
                         THEN 'moderate negative'
                    ELSE 'neutral'
                END
                FROM Message m3
                JOIN Sentiment_Analysis sa ON sa.message_id = m3.message_id
                WHERE m3.conversation_id = c.conversation_id
            ),
            'emotions', (
                SELECT json_group_array(DISTINCT ea.emotion)
                FROM Message m4
                JOIN Emotion_Analysis ea ON ea.message_id = m4.message_id
                WHERE m4.conversation_id = c.conversation_id
            ),
            'topics', (
                SELECT json_group_array(DISTINCT ta.topic)
                FROM Topic_Analysis ta
                WHERE ta.conversation_id = c.conversation_id
            ),
            'summary', (
                SELECT cs.summary_text
                FROM Conversation_Summary cs
                WHERE cs.conversation_id = c.conversation_id
            ),
            'messages', (
                SELECT json_group_array(
                    json_object(
                        'id', m.message_id,
                        'senderId', COALESCE(m.client_id, m.agent_id),
                        'senderType', CASE
                            WHEN m.client_id IS NOT NULL THEN 'tenant'
                            WHEN m.agent_id IS NOT NULL THEN 'agent'
                            ELSE 'system'
                        END,
                        'content', m.content,
                        'timestamp', m.timestamp,
                        'sentiment', (
                            SELECT CASE sa.sentiment
                                WHEN 'positive' THEN 1
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END
                            FROM Sentiment_Analysis sa
                            WHERE sa.message_id = m.message_id
                        ),
                        'emotions', (
                            SELECT json_group_array(DISTINCT ea.emotion)
                            FROM Emotion_Analysis ea
                            WHERE ea.message_id = m.message_id
                        )
                    )
                )
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'lastUpdated', (
                SELECT MAX(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'startedAt', (
                SELECT MIN(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            )
        ) AS conversation
        FROM Conversation c;
    """)

    conversations = [json.loads(row["conversation"]) for row in rows]

    # Convert all timestamps to ISO 8601 (UTC) for TypeScript compatibility
    def to_iso(dt_str: str | None) -> str | None:
        if not dt_str:
            return None
        try:
            # parse whatever SQLite gave you
            dt = datetime.fromisoformat(dt_str)
            return dt.isoformat() + "Z"
        except Exception:
            return dt_str  # fallback if format is already okay

    for conv in conversations:
        conv["startedAt"] = to_iso(conv.get("startedAt"))
        conv["lastUpdated"] = to_iso(conv.get("lastUpdated"))
        for msg in conv.get("messages", []):
            msg["timestamp"] = to_iso(msg.get("timestamp"))

    return conversations

@app.get(f"/{BASE_URL}/emotion-trend")
def get_conversations_for_emotion_distribution():
    rows = query_db("""
        SELECT json_object(
            'id', 'CONV-' || c.conversation_id,
            'tenantId', c.client_id,
            'agentIds', (
                SELECT json_group_array(DISTINCT m2.agent_id)
                FROM Message m2
                WHERE m2.conversation_id = c.conversation_id
                  AND m2.agent_id IS NOT NULL
            ),
            'status', CASE c.status
                        WHEN 'in_progress' THEN 'In Progress'
                        ELSE c.status
                      END,
            'sentiment', (
                SELECT CASE
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 1
                         THEN 'strong positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) > 0
                         THEN 'moderate positive'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < -1
                         THEN 'strong negative'
                    WHEN AVG(CASE sa.sentiment
                                WHEN 'positive' THEN 2
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END) < 0
                         THEN 'moderate negative'
                    ELSE 'neutral'
                END
                FROM Message m3
                JOIN Sentiment_Analysis sa ON sa.message_id = m3.message_id
                WHERE m3.conversation_id = c.conversation_id
            ),
            'emotions', (
                SELECT json_group_array(DISTINCT ea.emotion)
                FROM Message m4
                JOIN Emotion_Analysis ea ON ea.message_id = m4.message_id
                WHERE m4.conversation_id = c.conversation_id
            ),
            'topics', (
                SELECT json_group_array(DISTINCT ta.topic)
                FROM Topic_Analysis ta
                WHERE ta.conversation_id = c.conversation_id
            ),
            'summary', (
                SELECT cs.summary_text
                FROM Conversation_Summary cs
                WHERE cs.conversation_id = c.conversation_id
            ),
            'messages', (
                SELECT json_group_array(
                    json_object(
                        'id', m.message_id,
                        'senderId', COALESCE(m.client_id, m.agent_id),
                        'senderType', CASE
                            WHEN m.client_id IS NOT NULL THEN 'tenant'
                            WHEN m.agent_id IS NOT NULL THEN 'agent'
                            ELSE 'system'
                        END,
                        'content', m.content,
                        'timestamp', m.timestamp,
                        'sentiment', (
                            SELECT CASE sa.sentiment
                                WHEN 'positive' THEN 1
                                WHEN 'negative' THEN -2
                                WHEN 'neutral'  THEN 0
                                ELSE 0 END
                            FROM Sentiment_Analysis sa
                            WHERE sa.message_id = m.message_id
                        ),
                        'emotions', (
                            SELECT json_group_array(DISTINCT ea.emotion)
                            FROM Emotion_Analysis ea
                            WHERE ea.message_id = m.message_id
                        )
                    )
                )
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'lastUpdated', (
                SELECT MAX(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            ),
            'startedAt', (
                SELECT MIN(m.timestamp)
                FROM Message m
                WHERE m.conversation_id = c.conversation_id
            )
        ) AS conversation
        FROM Conversation c;
    """)

    conversations = [json.loads(row["conversation"]) for row in rows]

    # Convert all timestamps to ISO 8601 (UTC) for TypeScript compatibility
    def to_iso(dt_str: str | None) -> str | None:
        if not dt_str:
            return None
        try:
            # parse whatever SQLite gave you
            dt = datetime.fromisoformat(dt_str)
            return dt.isoformat() + "Z"
        except Exception:
            return dt_str  # fallback if format is already okay

    for conv in conversations:
        conv["startedAt"] = to_iso(conv.get("startedAt"))
        conv["lastUpdated"] = to_iso(conv.get("lastUpdated"))
        for msg in conv.get("messages", []):
            msg["timestamp"] = to_iso(msg.get("timestamp"))

    return conversations

@app.get(f"/{BASE_URL}/sentiment-by-service")
def get_sentiment_by_service():
    return query_db("""
        SELECT 'General' as serviceArea, sa.sentiment, COUNT(*) as count
        FROM Sentiment_Analysis sa
        JOIN Message m ON m.message_id = sa.message_id
        GROUP BY sa.sentiment
    """)

@app.get(f"/{BASE_URL}/emotion-by-service")
def get_emotion_by_service():
    return query_db("""
        SELECT 'General' as serviceArea, ea.emotion, COUNT(*) as count
        FROM Emotion_Analysis ea
        JOIN Message m ON m.message_id = ea.message_id
        GROUP BY ea.emotion
    """)

@app.get(f"/{BASE_URL}/trending-topics")
def get_trending_topics():
    return query_db("""
        SELECT topic, COUNT(*) as count
        FROM Topic_Analysis
        GROUP BY topic
        ORDER BY count DESC
    """)

@app.get(f"/{BASE_URL}/summary")
def get_summary():
    rows = query_db("SELECT summary_text FROM Conversation_Summary")
    return {"summary": " ".join(r["summary_text"] for r in rows if r["summary_text"])}

@app.get(f"/{BASE_URL}/tenants")
def get_tenants():
    rows = query_db("""
        SELECT 
            c.client_id AS id,
            c.name,
            c.date_of_birth,
            c.email,
            cp.openness,
            cp.conscientiousness,
            cp.extraversion,
            cp.agreeableness,
            cp.neuroticism
        FROM Client c
        LEFT JOIN Client_Profile cp ON cp.client_id = c.client_id;
    """)

    def calculate_age(dob_str: str | None) -> int | None:
        if not dob_str:
            return None
        try:
            dob = datetime.fromisoformat(dob_str).date()
        except ValueError:
            return None
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    tenants = []
    for row in rows:
        tenants.append({
            "id": str(row["id"]),
            "name": row["name"],
            "age": calculate_age(row["date_of_birth"]),
            "gender": None,  # not in schema
            "property": "Malaysia",  # default
            "bigFivePersonality": {
                "openness": row["openness"],
                "conscientiousness": row["conscientiousness"],
                "extraversion": row["extraversion"],
                "agreeableness": row["agreeableness"],
                "neuroticism": row["neuroticism"]
            }
        })
    return tenants


@app.get(f"/{BASE_URL}/agents")
def get_agents():
    rows = query_db("""
        SELECT 
            a.agent_id AS id,
            a.name,
            a.date_of_birth,
            a.email
        FROM Agent a;
    """)

    agents = []
    for row in rows:
        agents.append({
            "id": str(row["id"]),
            "name": row["name"],
            "role": "Customer Service"  # default
        })
    return agents


if __name__ == "__main__":
    # Read port from environment variable or fallback to 8000
    port = int(os.environ.get("PORT", 4000))
    host = os.environ.get("HOST", f"127.0.0.1")

    uvicorn.run("main:app", host=host, port=port, reload=True)