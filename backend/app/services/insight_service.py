"""
Pipeline insights service.
Sends a summary of all active deals to Groq and returns
actionable insights for the sales dashboard.
"""

from app.models.deal import Deal
from app.services.groq_service import chat_completion


def _format_deals_summary(deals: list[Deal]) -> str:
    """
    Format a list of deals into a compact text summary for the LLM.

    Args:
        deals: List of Deal ORM objects.

    Returns:
        A formatted string summarising all active deals.
    """
    if not deals:
        return "No active deals in the pipeline."

    lines = [f"Total active deals: {len(deals)}\n"]

    for deal in deals:
        lines.append(
            f"- {deal.title} | Stage: {deal.stage} | "
            f"Value: ${deal.value or 0:,.0f} | "
            f"Probability: {deal.probability or 0}% | "
            f"Churn score: {deal.churn_score} | "
            f"Days in stage: {deal.days_in_stage or 0}"
        )

    return "\n".join(lines)


async def generate_pipeline_insights(deals: list[Deal]) -> str:
    """
    Generate AI-powered insights for the entire sales pipeline.

    Args:
        deals: All active deals from the database.

    Returns:
        A structured insight summary as plain text.

    Raises:
        Exception: Propagates Groq API errors.
    """
    system_prompt = (
        "You are a senior sales operations analyst. "
        "Analyse the pipeline data and provide exactly:\n"
        "1. TOP RISKS: The 3 deals most likely to be lost and why.\n"
        "2. OPPORTUNITIES: The 3 deals most likely to close soon.\n"
        "3. ACTION: One immediate action the team should take today.\n"
        "Be specific, use deal names, keep total response under 200 words."
    )

    deals_summary = _format_deals_summary(deals)

    try:
        return await chat_completion(
            system_prompt=system_prompt,
            user_message=f"Here is the current pipeline:\n\n{deals_summary}",
            max_tokens=300,
            temperature=0.3,
        )
    except Exception as e:
        raise Exception(f"Failed to generate insights: {str(e)}") from e


async def generate_deal_insight(deal: Deal) -> str:
    """
    Generate a single focused insight for one specific deal.

    Args:
        deal: A single Deal ORM object.

    Returns:
        A one or two sentence insight about this deal.
    """
    system_prompt = (
        "You are a sales coach. In 1-2 sentences, give one specific, "
        "actionable recommendation for this deal. Be direct."
    )

    user_message = (
        f"Deal: {deal.title}\n"
        f"Stage: {deal.stage}\n"
        f"Value: ${deal.value or 0:,.0f}\n"
        f"Probability: {deal.probability or 0}%\n"
        f"Days in stage: {deal.days_in_stage or 0}\n"
        f"Churn score: {deal.churn_score}\n"
        f"Notes: {deal.notes or 'None'}"
    )

    try:
        return await chat_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=150,
            temperature=0.3,
        )
    except Exception as e:
        raise Exception(f"Failed to generate deal insight: {str(e)}") from e