# app.py
import streamlit as st
import altair as alt
import plotly.express as px
import pandas as pd
import html, random
import requests
from pydantic import BaseModel
import time
import uuid

from chat_analysis import (
    seed_emotions, list_clients, create_client, get_client,
    get_profile, upsert_profile, list_conversations, create_conversation,
    fetch_messages, create_message, upsert_sentiment, upsert_emotions_presence,
    upsert_topics_for_conversation, sentiment_series_df, emotion_heatmap_df,
    list_agents, create_agent, get_conversation_status, pretty_status,
    mark_solved, mark_in_progress, read_messages_for_summary,
    generate_conversation_summary, upsert_conversation_summary,
    get_conversation_summary, analyze, EMO_THRESHOLD, STATUS_IN_PROGRESS,
    STATUS_SOLVED, EMOTION_KEYS
)

API_URL = "http://127.0.0.1:4001/coliving-ai-os/api/raw-user-message/"
API_KEY = "supersecretapikey123"   # 🔑 replace with your key


class RawUserMessage(BaseModel):
    mid: str
    type: str
    msg_type: str
    sender_id: str
    agent_id: int = 0
    payload: dict
    content: str
    username: str
    ts: int
    paused_diff_seconds: int = 0
    id: int = 0
    send_At: int = 0
    receive_At: int = 0
    tsDifference: int = 0


def send_raw_user_message(payload: RawUserMessage):
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY
    }
    try:
        r = requests.post(API_URL, headers=headers, json=payload.dict())
        r.raise_for_status()
        return True, r.json()
    except Exception as e:
        return False, str(e)

st.set_page_config(page_title="Chat Analysis", layout="wide")
seed_emotions()  # safe idempotent seed

st.markdown("""
<style>
.panel { border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px; background:rgba(255,255,255,0.02); }
.chat-wrap { height:520px; overflow-y:auto; padding:8px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.02); display:flex; flex-direction:column; }
.bubble{max-width:78%; padding:10px 12px; border-radius:14px; margin:6px 0; line-height:1.4; word-wrap:break-word; white-space:pre-wrap; box-shadow:0 1px 6px rgba(0,0,0,0.15);}
.user{margin-left:auto; background:rgba(59,130,246,.15); border:1px solid rgba(59,130,246,.35);}
.agent{margin-right:auto; background:rgba(34,197,94,.15); border:1px solid rgba(34,197,94,.35);}
.system{margin-right:auto; background:rgba(148,163,184,.15); border:1px solid rgba(148,163,184,.35);}
.meta{font-size:.75rem; opacity:.7; margin-top:4px;}
.badge{display:inline-block; padding:2px 6px; border-radius:999px; font-size:.7rem; border:1px solid rgba(255,255,255,0.15);}
</style>
""", unsafe_allow_html=True)

st.title("💬 Chat Analysis")

col_left, col_mid, col_right = st.columns([1.0, 1.6, 1.2])

# ----- Left: Clients & Conversations -----
with col_left:
    st.subheader("Clients")
    search = st.text_input("Search name/email", placeholder="Type to filter…")

    if st.button("➕ Add demo client"):
        demo_id = create_client(f"Client {random.randint(100,999)}", f"demo{random.randint(1000,9999)}@mail.com")
        st.session_state.sel_client_id = demo_id
        st.rerun()

    clis = list_clients(search)
    if clis:
        options = {f"{c['client_id']} — {c['name'] or '(no name)'}": c["client_id"] for c in clis}
        chosen = st.radio("Select client", options=list(options.keys()), index=0, label_visibility="collapsed")
        st.session_state.sel_client_id = options[chosen]
    else:
        st.info("No clients yet. Click **Add demo client** above.")

    st.markdown("---")
    st.markdown("**Conversations**")
    if st.session_state.get("sel_client_id"):
        convs = list_conversations(st.session_state.sel_client_id)
        if st.button("🆕 New conversation"):
            st.session_state.sel_conversation_id = create_conversation(st.session_state.sel_client_id)
            st.rerun()
        if convs:
            conv_map = {
                f"#{v['conversation_id']} • {pretty_status(v['status'])} • {v['started_at'][:19]}": v["conversation_id"]
                for v in convs
            }            
            chosen_conv = st.radio("Select conversation", list(conv_map.keys()), index=0, label_visibility="collapsed")
            st.session_state.sel_conversation_id = conv_map[chosen_conv]
        else:
            st.info("No conversations yet. Click **New conversation**.")

    # simple form to add a real agent
    with st.form("add_agent_form", clear_on_submit=True):
        a_name  = st.text_input("Name")
        a_email = st.text_input("Email (optional)")
        submitted = st.form_submit_button("Add agent")
        if submitted:
            if not a_name.strip():
                st.error("Name is required.")
            else:
                new_id = create_agent(a_name.strip(), a_email.strip() or None)
                st.success(f"Agent #{new_id} created.")
                st.rerun()

    # list existing agents
    agents = list_agents()
    if agents:
        st.caption("Existing agents")
        import pandas as pd
        st.dataframe(pd.DataFrame(
            [{"ID": a["agent_id"], "Name": a["name"], "Email": a["email"]} for a in agents]
        ), use_container_width=True, hide_index=True)
    else:
        st.info("No agents yet. Add one above.")


# ----- Middle: Chatroom -----
with col_mid:
    st.subheader("Chat")
    if not st.session_state.get("sel_conversation_id"):
        st.info("Select a client & conversation on the left.")
    else:
        conv_id = st.session_state.sel_conversation_id
        msgs = fetch_messages(conv_id, 500)

        chat_html = ['<div class="chat-wrap">']
        for m in msgs:
            # infer sender type
            css = "user" if m["client_id"] is not None else ("agent" if m["agent_id"] is not None else "system")
            badge_val = m["sentiment"] if (m["client_id"] is not None and m["sentiment"]) else "—"
            chat_html.append(
                f'<div class="bubble {css}">'
                f'{html.escape(m["content"])}'
                f'<div class="meta">conv {m["conversation_id"]} • {(m["timestamp"] or "")[:19]} • '
                f'<span class="badge">{badge_val}</span></div>'
                f'</div>'
            )
        chat_html.append('</div>')
        st.markdown("".join(chat_html), unsafe_allow_html=True)

        # --- Status chip + Close/Reopen buttons + auto-summarize on close ---
        curr_status = get_conversation_status(conv_id)
        chip = "🟡 in progress" if curr_status == STATUS_IN_PROGRESS else "🟢 solved"
        c1, c2 = st.columns([2, 2])
        with c1:
            st.caption(f"Status: **{chip}**")

        with c2:
            if curr_status == STATUS_IN_PROGRESS:
                if st.button("Close & summarize ✅", key=f"close_{conv_id}"):
                    msgs_for_llm = read_messages_for_summary(conv_id)
                    if not msgs_for_llm:
                        st.warning("No messages to summarize.")
                    else:
                        summary = generate_conversation_summary(msgs_for_llm)
                        upsert_conversation_summary(conv_id, summary)
                        mark_solved(conv_id)
                        st.success("Conversation closed and summarized.")
                        with st.expander("🔎 Summary"):
                            st.markdown(summary)
                        st.rerun()
            else:
                if st.button("Reopen ↩️", key=f"reopen_{conv_id}"):
                    mark_in_progress(conv_id)
                    st.info("Conversation reopened.")
                    st.rerun()

        # Optionally show summary when already solved
        if curr_status == STATUS_SOLVED:
            existing = get_conversation_summary(conv_id)
            if existing:
                with st.expander("🔎 Summary", expanded=False):
                    st.markdown(existing)


        st.markdown("##### Send a message")

        # two columns: left (sender + conditional agent), right (message)
        left, right = st.columns([2, 6])

        with left:
            sender = st.selectbox("Sender", ["user", "agent", "system"], index=0)

            # Only show this when "agent" is chosen
            selected_agent_id = None
            if sender == "agent":
                rows = list_agents()  # <-- uses the helper we added earlier
                if not rows:
                    st.warning("No agents in DB. Add one in the left → Agents panel.")
                else:
                    agent_map = {f"#{a['agent_id']} · {a['name'] or '(no name)'}": a["agent_id"] for a in rows}
                    choice = st.selectbox("Agent", list(agent_map.keys()))
                    selected_agent_id = agent_map[choice]

        with right:
            txt = st.text_area("Message", height=120, placeholder="Type your message…")

        # Button spans full width
        disable_send = (not txt.strip()) or (sender == "agent" and selected_agent_id is None)
        if st.button("Send", type="primary", use_container_width=True, disabled=disable_send):
            is_user  = (sender == "user")
            is_agent = (sender == "agent")
            cid = st.session_state.sel_client_id if is_user else None
            aid = selected_agent_id if is_agent else None

            # analyze only user messages
            if is_user:
                analysis    = analyze(txt.strip())
                sentiment   = analysis.get("sentiment", "N")
                emotions    = analysis.get("emotions", {})
                topics      = [t.strip() for t in (analysis.get("topics") or []) if t and t.strip()]
                personality = analysis.get("personality", {})
            else:
                sentiment, emotions, topics, personality = None, {}, [], {}

            mid = create_message(
                conversation_id=st.session_state.sel_conversation_id,
                text=txt.strip(),
                language="en",
                client_id=cid,
                agent_id=aid
            )

            # --- build RawUserMessage payload ---
            # raw_msg = RawUserMessage(
            #     mid=str(uuid.uuid4()),
            #     type="chat",
            #     msg_type=sender,   # "user" | "agent" | "system"
            #     sender_id=str(cid or aid or "system"),
            #     agent_id=aid or 0,
            #     payload={
            #         "conversation_id": st.session_state.sel_conversation_id,
            #         "sentiment": sentiment,
            #         "emotions": emotions,
            #         "topics": topics,
            #         "personality": personality
            #     },
            #     content=txt.strip(),
            #     username=sender,
            #     ts=int(time.time())
            # )

            raw_msg = RawUserMessage(
                mid=str(uuid.uuid4()),
                type="chat",
                msg_type=sender,   # "user" | "agent" | "system"
                sender_id=str(cid or aid or "system"),
                agent_id=aid or 0,
                payload={"text": txt.strip()},
                content=txt.strip(),
                username=sender,
                ts=int(time.time()),              # seconds
                paused_diff_seconds=0,
                id=0,                             # server expects int
                send_At=int(time.time() * 1000),  # ms
            )

            raw_msg=raw_msg.dict()
            print(raw_msg)

            try:
                headers = {
                    "Content-Type": "application/json",
                    "X-API-KEY": API_KEY
                } 
                res = requests.post(
                    API_URL,
                    headers=headers,
                    json=raw_msg
                )
                if res.status_code == 200:
                    st.success(f"✅ Sent to API (message_id {mid})")
                else:
                    st.error(f"❌ API error {res.status_code}: {res.text}")
                
                if res.status_code != 200:
                    st.error(f"❌ API error {res.status_code}: {res.text}")
                    try:
                        st.json(res.json())   # show FastAPI validation error details
                    except:
                        pass
            except Exception as e:
                st.error(f"⚠️ Failed to call API: {e}")

            # continue with DB upserts if user
            if is_user:
                upsert_sentiment(mid, sentiment)
                upsert_emotions_presence(mid, emotions, threshold=EMO_THRESHOLD)
                upsert_topics_for_conversation(st.session_state.sel_conversation_id, topics)
                if personality and all(k in personality for k in ("openness","conscientiousness","extraversion","agreeableness","neuroticism")):
                    upsert_profile(cid, personality)

            st.rerun()



# ----- Right: Client Info & Analytics -----
with col_right:
    st.subheader("Client Info")
    sel_id = st.session_state.get("sel_client_id")
    if not sel_id:
        st.info("Pick a client to view details.")
    else:
        cli  = get_client(sel_id)
        prof = get_profile(sel_id)

        with st.container():
            st.markdown('<div class="panel">', unsafe_allow_html=True)
            st.markdown(f"**ID:** {cli['client_id']}")
            st.markdown(f"**Name:** {cli['name'] or '—'}")
            st.markdown(f"**Email:** {cli['email'] or '—'}")
            created = cli['created_at'] or ''
            st.markdown(f"**Created:** {created[:19] if created else '—'}")
            st.markdown('</div>', unsafe_allow_html=True)

        st.markdown("###### Personality (OCEAN)")
        if prof:
            trait_keys   = ["openness","conscientiousness","extraversion","agreeableness","neuroticism"]
            trait_labels = ["Openness","Conscientiousness","Extraversion","Agreeableness","Neuroticism"]
            values = [float(prof[k] or 0) for k in trait_keys]
            df_ocean = pd.DataFrame({"Trait": trait_labels, "Score": values})
            fig = px.line_polar(df_ocean, r="Score", theta="Trait", line_close=True, range_r=[0,1])
            fig.update_traces(fill="toself")
            fig.update_layout(showlegend=False, height=320, margin=dict(l=10,r=10,t=10,b=10),
                              polar=dict(radialaxis=dict(tick0=0, dtick=0.2, range=[0,1])))
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No profile yet. Send a **user** message to auto-populate from analysis.")

        st.markdown("---")
        st.markdown("###### This conversation — analytics (user msgs only)")
        if st.session_state.get("sel_conversation_id"):
            conv_id = st.session_state.sel_conversation_id

            # Sentiment trend (derive score from label)
            df_sent = sentiment_series_df(conv_id)
            if df_sent.empty:
                st.caption("No analyzed user messages yet.")
            else:
                st.markdown("**Sentiment trend**")
                chart = (
                    alt.Chart(df_sent)
                    .mark_line(point=True)
                    .encode(
                        x=alt.X("idx:Q", title="Message #"),
                        y=alt.Y("score:Q", title="Sentiment score", scale=alt.Scale(domain=(-3,3))),
                        tooltip=["idx","timestamp","label","score"]
                    )
                    .properties(height=220)
                )
                st.altair_chart(chart, use_container_width=True)

            # Emotion dynamics (binary heatmap from presence)
            df_heat = emotion_heatmap_df(conv_id)
            if not df_heat.empty:
                st.markdown("**Emotion dynamics (presence ≥ threshold)**")
                heat = (
                    alt.Chart(df_heat)
                    .mark_rect()
                    .encode(
                        x=alt.X("idx:O", title="Message #"),
                        y=alt.Y("emotion:N", sort=EMOTION_KEYS, title=None),
                        color=alt.Color("value:Q", title="Present", scale=alt.Scale(domain=(0,1))),
                        tooltip=["idx","emotion","value"]
                    )
                    .properties(height=240)
                )
                st.altair_chart(heat, use_container_width=True)
            else:
                st.caption("No emotions saved yet.")