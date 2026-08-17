"""AI services powered by Groq (Qwen). Churn, lead scoring, email drafting, insights."""
import json
import os
import re
from datetime import date, datetime

from groq import AsyncGroq

_client: AsyncGroq | None = None


def _groq() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])
    return _client


def _model() -> str:
    return os.environ.get("GROQ_MODEL", "qwen/qwen3.6-27b")


async def chat(system: str, user: str, max_tokens: int = 350, temperature: float = 0.4) -> str:
    resp = await _groq().chat.completions.create(
        model=_model(),
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        max_tokens=max_tokens,
        temperature=temperature,
        reasoning_effort="none",
    )
    return (resp.choices[0].message.content or "").strip()


def _days_inactive(deal: dict) -> int:
    lad = deal.get("last_activity_date")
    if not lad:
        return 0
    try:
        d = date.fromisoformat(lad[:10])
    except Exception:
        return 0
    return (date.today() - d).days


def calculate_churn_score(deal: dict) -> float:
    score = 0.0
    di = _days_inactive(deal)
    if di > 30:
        score += 0.4
    elif di > 14:
        score += 0.2
    elif di > 7:
        score += 0.1
    dis = deal.get("days_in_stage") or 0
    if dis > 30:
        score += 0.4
    elif dis > 21:
        score += 0.25
    elif dis > 14:
        score += 0.1
    prob = deal.get("probability") or 0
    if prob < 20:
        score += 0.2
    elif prob < 30:
        score += 0.1
    if deal.get("stage") in ("closed_won", "closed_lost"):
        return 0.0
    return round(min(score, 1.0), 2)


def calculate_lead_score(deal: dict) -> int:
    """0-100 heuristic: probability, deal value, recency, stage momentum."""
    prob = deal.get("probability") or 0
    score = prob * 0.5
    value = float(deal.get("value") or 0)
    score += min(value / 200000, 1.0) * 25
    di = _days_inactive(deal)
    score += max(0, 15 - di * 0.5)
    stage_bonus = {"lead": 0, "contacted": 3, "proposal": 6,
                   "negotiation": 10, "closed_won": 10, "closed_lost": 0}
    score += stage_bonus.get(deal.get("stage"), 0)
    return int(max(0, min(100, round(score))))


async def explain_churn(deal: dict, score: float) -> str:
    try:
        return await chat(
            "You are a senior sales analyst. In 1-2 sentences, explain why this deal is "
            "at risk and the single next action the rep should take. Be specific, no bullet points.",
            f"Deal: {deal.get('title')}\nStage: {deal.get('stage')}\n"
            f"Value: ${float(deal.get('value') or 0):,.0f}\nWin probability: {deal.get('probability')}%\n"
            f"Days since last activity: {_days_inactive(deal)}\n"
            f"Days in stage: {deal.get('days_in_stage')}\nChurn score: {score}/1.0",
            max_tokens=160)
    except Exception:
        return (f"Churn risk {int(score*100)}%. Inactive for {_days_inactive(deal)} days — "
                "reach out with a personalized follow-up today.")


async def draft_email(deal: dict, contact: dict, tone: str) -> dict:
    tone_map = {
        "professional": "professional, concise, and respectful",
        "persuasive": "persuasive and value-driven with a clear call to action",
        "casual": "warm, friendly, and conversational",
    }
    style = tone_map.get(tone, tone_map["professional"])
    try:
        body = await chat(
            f"You are an expert B2B sales rep. Write a {style} follow-up email. "
            "Return ONLY the email body (no subject line, no placeholders like [Name] — "
            "use the real names given). Keep it under 130 words.",
            f"Contact: {contact.get('name')} ({contact.get('title')} at {contact.get('company')})\n"
            f"Deal: {deal.get('title')} worth ${float(deal.get('value') or 0):,.0f}\n"
            f"Stage: {deal.get('stage')}\nDays inactive: {_days_inactive(deal)}\n"
            f"My name: Alex Rivera, Account Executive",
            max_tokens=320)
        subject = await chat(
            "Write a single short email subject line (max 8 words). Return only the subject text.",
            f"Follow-up about deal '{deal.get('title')}' with {contact.get('name')}",
            max_tokens=40)
        return {"subject": subject.strip().strip('"'), "body": body}
    except Exception as e:
        return {"subject": f"Following up on {deal.get('title')}",
                "body": f"Hi {contact.get('name')},\n\nI wanted to follow up on {deal.get('title')}. "
                        "Do you have 15 minutes this week to connect?\n\nBest,\nAlex Rivera",
                "error": str(e)}


async def generate_insights(deals: list[dict]) -> str:
    active = [d for d in deals if d.get("stage") not in ("closed_won", "closed_lost")]
    active.sort(key=lambda d: d.get("churn_score", 0), reverse=True)
    summary = "\n".join(
        f"- {d.get('title')} | stage {d.get('stage')} | ${float(d.get('value') or 0):,.0f} "
        f"| prob {d.get('probability')}% | churn {d.get('churn_score')} | lead {d.get('lead_score')}"
        for d in active[:15])
    try:
        return await chat(
            "You are a VP of Sales. Given active pipeline deals, produce a crisp briefing with exactly "
            "three short sections using these headers: 'Top Risks', 'Best Opportunities', 'Do This Today'. "
            "1-2 lines each, reference deals by name. No markdown symbols.",
            f"Active deals:\n{summary}", max_tokens=400)
    except Exception:
        return ("Top Risks: Several deals show high churn scores — prioritize outreach.\n"
                "Best Opportunities: Focus on high-probability negotiation-stage deals.\n"
                "Do This Today: Send follow-ups to your three most inactive deals.")



def build_pipeline_context(stats: dict, deals: list[dict]) -> str:
    active = [d for d in deals if d.get("stage") not in ("closed_won", "closed_lost")]
    active.sort(key=lambda d: float(d.get("value") or 0), reverse=True)
    top = "\n".join(
        f"- {d.get('title')} | {d.get('stage')} | ${float(d.get('value') or 0):,.0f} "
        f"| {d.get('probability')}% win | churn {int((d.get('churn_score') or 0)*100)}% "
        f"| lead {d.get('lead_score')}"
        for d in active[:20])
    return (
        f"Pipeline snapshot:\n"
        f"- Open pipeline value: ${float(stats.get('total_pipeline') or 0):,.0f}\n"
        f"- Closed revenue: ${float(stats.get('arr') or 0):,.0f}\n"
        f"- Win rate: {stats.get('win_rate')}%\n"
        f"- Active deals: {stats.get('active_deals')} | At-risk: {stats.get('at_risk_count')}\n"
        f"- Contacts: {stats.get('contacts_count')}\n\n"
        f"Top active deals:\n{top if top else '(none)'}"
    )


async def assistant_answer(context: str, message: str, history: list[dict]) -> str:
    convo = "\n".join(f"{h.get('role')}: {h.get('content')}" for h in (history or [])[-6:])
    system = (
        "You are an AI sales assistant embedded in a CRM. Answer questions about the user's pipeline "
        "using ONLY the provided snapshot. Be concise and specific, reference deals by name, and give "
        "actionable advice. If data is missing, say so briefly. No markdown symbols or bullet characters."
    )
    user = f"{context}\n\nConversation so far:\n{convo}\n\nUser question: {message}"
    try:
        return await chat(system, user, max_tokens=450, temperature=0.5)
    except Exception:
        return "I couldn't reach the AI service just now. Please try again in a moment."


async def draft_sequence_step(deal: dict, contact: dict, step_no: int, tone: str, total_steps: int) -> dict:
    context_note = {1: "first outreach", 2: "second follow-up (no reply yet)",
                    3: "final check-in before pausing"}.get(step_no, f"follow-up #{step_no}")
    result = await draft_email(deal, contact, tone)
    result["step_context"] = context_note
    return result



async def classify_action(message: str) -> dict:
    """Detect if the user is asking the assistant to perform an action.
    Returns {"action": one of create_deal|start_sequence|log_activity|none, "params": {...}}.
    """
    system = (
        "You classify a sales rep's message into a CRM action. Respond with ONLY compact JSON, no prose.\n"
        'Schema: {"action":"create_deal|start_sequence|log_activity|none","params":{...}}\n'
        '- create_deal params: {"title": str, "value": number optional, "stage": one of '
        'lead|contacted|proposal|negotiation optional}\n'
        '- start_sequence params: {"deal_query": str}  (text to match an existing deal title)\n'
        '- log_activity params: {"deal_query": str, "note": str}\n'
        '- If the message is a question or general chat, use {"action":"none","params":{}}.\n'
        "Only choose an action when the user clearly requests to DO something."
    )
    try:
        raw = await chat(system, f"Message: {message}", max_tokens=180, temperature=0.0)
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if not m:
            return {"action": "none", "params": {}}
        data = json.loads(m.group(0))
        if data.get("action") not in ("create_deal", "start_sequence", "log_activity"):
            return {"action": "none", "params": {}}
        return {"action": data["action"], "params": data.get("params", {}) or {}}
    except Exception:
        return {"action": "none", "params": {}}
