import sqlite3, json, datetime, ollama

DB_PATH = "json.db"
MODEL = "gpt-oss:20b"   # or the model you pulled into Ollama, e.g., "mistral", "gemma", etc.

# -------------------------------
# OLLAMA HELPERS
# -------------------------------

def call_ollama_message(msg_text: str) -> dict:
    """
    Lightweight analysis for individual messages:
    Sentiment, Emotions, Topics.
    """
    PROMPT = f"""
You are a text analytics model for chat messages. Analyze the MESSAGE and return STRICT JSON:
{{
  "sentiment": "SP|MP|WP|N|MN|WN|SN",
  "emotions": {{"joy":0..1,"anger":0..1,"sadness":0..1,"fear":0..1,"surprise":0..1,"disgust":0..1,"neutral":0..1}},
  "topics": ["lowercase","keywords","1-5 items"]
}}
Rules: JSON only, no markdown. If empty, use "sentiment":"N", emotions.neutral=1.0, topics=[].
MESSAGE: \"\"\"{msg_text}\"\"\" 
"""
    response = ollama.generate(model=MODEL, prompt=PROMPT)
    try:
        return json.loads(response["response"])
    except Exception:
        return {"sentiment":"N","emotions":{"neutral":1.0},"topics":[]}


def call_ollama_conversation(transcript: str) -> dict:
    """
    Heavy analysis for whole conversation: Summary + Personality.
    """
    PROMPT = f"""
You are a support-chat analyzer. Analyze the TRANSCRIPT and return STRICT JSON:
{{
  "summary": "plain english, <=35 words",
  "personality": {{"openness":0..1,"conscientiousness":0..1,"extraversion":0..1,"agreeableness":0..1,"neuroticism":0..1}}
}}
Rules: JSON only, no markdown, neutral tone.
TRANSCRIPT:
\"\"\"{transcript}\"\"\" 
"""
    response = ollama.generate(model=MODEL, prompt=PROMPT)
    try:
        return json.loads(response["response"])
    except Exception:
        return {"summary":"No summary","personality":{}}

# -------------------------------
# MAIN INSERT LOGIC
# -------------------------------

def insert_conversation(json_file: str):
    with open(json_file) as f:
        data = json.load(f)
    conversations = data if isinstance(data, list) else [data]

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    for raw in conversations: # each dictionary in the list, in this case user_ns
        raw["chat_history"].sort(key=lambda x: x["ts"]) #sort by timestamp

        user_ns = raw["user_ns"]
        chat_history = raw["chat_history"]

        # Skip if no messages
        if not chat_history or len(chat_history) == 0:
            print(f"Skipped conversation for {user_ns} (no messages)")
            continue

        # --- Insert Client ---
        client_name = None
        for m in chat_history:
            if m["type"] == "in":  # first incoming user msg = client
                client_name = m.get("username")
                break
        if not client_name:
            client_name = f"Unknown-{user_ns}"

        cur.execute("""
            INSERT OR IGNORE INTO Client (client_id, name, created_at)
            VALUES (?, ?, ?)
        """, (user_ns, client_name, datetime.datetime.utcnow().isoformat()))
        client_id = user_ns

        # --- Conversation timestamps ---
        timestamps = [m.get("ts") for m in chat_history if m.get("ts")]
        started_at = datetime.datetime.fromtimestamp(min(timestamps)).isoformat() if timestamps else None
        ended_at   = datetime.datetime.fromtimestamp(max(timestamps)).isoformat() if timestamps else None
        status = "solved" if any("close" in (m.get("payload",{}).get("text","").lower()) for m in chat_history) else "in_progress"

        # --- Insert Conversation ---
        cur.execute("""INSERT INTO Conversation (client_id, started_at, ended_at, status)
                       VALUES (?,?,?,?)""", (client_id, started_at, ended_at, status))
        conv_id = cur.lastrowid

        # --- Insert Messages ---
        for i, m in enumerate(chat_history):
            ts = m.get("ts")
            created_at = datetime.datetime.fromtimestamp(ts).isoformat() if ts else None
            msg_text = ""
            if isinstance(m.get("payload"), dict):
                if m["msg_type"] == "postback" and "title" in m["payload"]:
                    msg_text = m["payload"].get("title") or ""
                else:
                    msg_text = m["payload"].get("text") or m["payload"].get("url") or ""

            if not msg_text.strip():
                continue  

            # insert Agent if needed
            agent_id = None
            if m["type"] == "agent":
                agent_id = str(m.get("agent_id"))  # take agent_id from JSON, ensure it's a string
                agent_name = m.get("username") or f"Agent-{agent_id}"

                cur.execute("""
                    INSERT OR IGNORE INTO Agent (agent_id, name, created_at)
                    VALUES (?, ?, ?)
                """, (agent_id, agent_name, datetime.datetime.utcnow().isoformat()))
            else:
                agent_id = None

            cur.execute("""INSERT INTO Message (content, client_id, agent_id, timestamp, conversation_id)
                        VALUES (?,?,?,?,?)""",
                        (msg_text, client_id if m["type"]=="in" else None,
                        agent_id, created_at, conv_id))
            msg_id = cur.lastrowid

            # ---- Analyze only client text messages ----
            if m["type"]=="in" and m["msg_type"]=="text" and msg_text.strip():
                analysis = call_ollama_message(msg_text)

                # Sentiment
                cur.execute("INSERT INTO Sentiment_Analysis (message_id, sentiment) VALUES (?,?)",
                            (msg_id, analysis.get("sentiment","N")))

                # Emotions
                for emo, val in analysis.get("emotions", {}).items():
                    if val > 0:
                        cur.execute("INSERT OR IGNORE INTO Emotion (emotion) VALUES (?)", (emo,))
                        cur.execute("INSERT INTO Emotion_Analysis (message_id, emotion) VALUES (?,?)",
                                    (msg_id, emo))

                # Topics
                for topic in analysis.get("topics", []):
                    cur.execute("INSERT OR IGNORE INTO Topic (topic) VALUES (?)", (topic,))
                    cur.execute("INSERT OR IGNORE INTO Topic_Analysis (conversation_id, topic) VALUES (?,?)",
                                (conv_id, topic))

            # --- Handle conversation closing and end/start conversation ---
            if "close the ticket" in msg_text:
                # Check the next message (if any)
                if i + 1 < len(chat_history):
                    next_msg = chat_history[i + 1]
                    if next_msg.get("msg_type") == "postback":
                        # Include this message in the conversation and end it.
                        status = "solved"
                        print(f"Detected close convo phrase with postback. Ending current conversation {conv_id}.")
                    else:
                        # End current conversation and start a new one.
                        status = "solved"
                        print(f"Detected close convo phrase without postback. Ending current conversation {conv_id}.")
                        # Create a new conversation
                        cur.execute("""INSERT INTO Conversation (client_id, started_at, ended_at, status)
                                    VALUES (?,?,?,?)""", (client_id, started_at, datetime.datetime.utcnow().isoformat(), "in_progress"))
                        conv_id = cur.lastrowid  # Assign new conversation ID
                        print(f"Started new conversation {conv_id}.")

            # If conversation is solved, we run summary and personality analysis
            if status == "solved":
                cur.execute("SELECT content FROM Message WHERE conversation_id=? AND client_id IS NOT NULL", (conv_id,))
                messages = [r[0] for r in cur.fetchall() if r[0]]
                transcript = "\n".join(messages)

                analysis = call_ollama_conversation(transcript)

                # Save summary
                cur.execute("""INSERT OR REPLACE INTO Conversation_Summary (conversation_id, summary_text)
                            VALUES (?,?)""", (conv_id, analysis.get("summary","")))

                # Save personality
                p = analysis.get("personality", {})
                cur.execute("""INSERT OR REPLACE INTO Client_Profile
                                (client_id, openness, conscientiousness, extraversion, agreeableness, neuroticism, last_updated_at)
                                VALUES (?,?,?,?,?,?,datetime('now'))""",
                            (client_id,
                            float(p.get("openness",0.0) or 0),
                            float(p.get("conscientiousness",0.0) or 0),
                            float(p.get("extraversion",0.0) or 0),
                            float(p.get("agreeableness",0.0) or 0),
                            float(p.get("neuroticism",0.0) or 0)))

            conn.commit()
            print(f"Inserted conversation {conv_id} with {len(chat_history)} messages.")

            cur.execute("""
                DELETE FROM Message
                WHERE content IS NULL
                OR TRIM(content) = '';
            """)

    conn.close()

if __name__ == "__main__":
    insert_conversation("chat_history.json")