"""
Churn scoring service.
Step 1: Rule-based score (0.0 - 1.0)
Step 2: Groq explains the risk in plain English.
"""

from datetime import date

from app.models.deal import Deal
from app.services.groq_service import chat_completion


def calculate_churn_score(deal: Deal) -> float:
    """
    Calculate a churn risk score between 0.0 and 1.0 using rule-based logic.

    Signals and weights:
    - Days since last activity (40% weight): > 14 days is risky
    - Days stuck in stage (40% weight): > 21 days is risky
    - Low probability (20% weight): < 30% win probability is risky

    Returns:
        Float between 0.0 (no risk) and 1.0 (certain churn).
    """
    score = 0.0

    # Signal 1: Days since last activity (weight: 0.4)
    if deal.last_activity_date:
        days_inactive = (date.today() - deal.last_activity_date).days
        if days_inactive > 30:
            score += 0.4
        elif days_inactive > 14:
            score += 0.2
        elif days_inactive > 7:
            score += 0.1

    # Signal 2: Days stuck in same stage (weight: 0.4)
    days_in_stage = deal.days_in_stage or 0
    if days_in_stage > 30:
        score += 0.4
    elif days_in_stage > 21:
        score += 0.25
    elif days_in_stage > 14:
        score += 0.1

    # Signal 3: Low win probability (weight: 0.2)
    probability = deal.probability or 0
    if probability < 20:
        score += 0.2
    elif probability < 30:
        score += 0.1

    # Cap at 1.0
    return round(min(score, 1.0), 2)


async def explain_churn_risk(deal: Deal, churn_score: float) -> str:
    """
    Ask Groq to explain why a deal is at risk in plain English.

    Args:
        deal: The Deal ORM object.
        churn_score: The calculated risk score (0.0 - 1.0).

    Returns:
        A one or two sentence plain English explanation.
    """
    system_prompt = (
        "You are a senior sales analyst. "
        "Given a deal's data and churn risk score, explain in 1-2 sentences "
        "why this deal is at risk and what the sales rep should do. "
        "Be specific and actionable. No bullet points."
    )

    days_inactive = 0
    if deal.last_activity_date:
        days_inactive = (date.today() - deal.last_activity_date).days

    user_message = (
        f"Deal: {deal.title}\n"
        f"Stage: {deal.stage}\n"
        f"Value: ${deal.value or 0:,.2f}\n"
        f"Win probability: {deal.probability or 0}%\n"
        f"Days since last activity: {days_inactive}\n"
        f"Days stuck in current stage: {deal.days_in_stage or 0}\n"
        f"Churn risk score: {churn_score} / 1.0\n\n"
        f"Explain the risk and recommend next action."
    )

    try:
        return await chat_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=200,
            temperature=0.3,
        )
    except Exception:
        return f"Deal has a churn risk score of {churn_score}. Review activity and follow up promptly."


async def score_and_explain(deal: Deal) -> tuple[float, str]:
    """
    Convenience function — scores a deal and returns both score and explanation.

    Returns:
        Tuple of (churn_score, explanation_text)
    """
    score = calculate_churn_score(deal)
    explanation = await explain_churn_risk(deal, score)
    return score, explanation