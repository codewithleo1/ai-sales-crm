"""
Email drafting service.
Uses Groq to generate personalized follow-up emails for deals.
Supports three tones: professional, urgent, friendly.
"""

from app.models.contact import Contact
from app.models.deal import Deal
from app.services.groq_service import chat_completion

TONE_INSTRUCTIONS = {
    "professional": (
        "Write a formal, professional follow-up email. "
        "Be respectful of their time, reference the deal context, "
        "and end with a clear call to action."
    ),
    "urgent": (
        "Write an urgent but respectful follow-up email. "
        "Emphasize time sensitivity and the value at stake. "
        "Create a sense of urgency without being pushy."
    ),
    "friendly": (
        "Write a warm, friendly follow-up email. "
        "Use a casual tone, show genuine interest in helping them, "
        "and keep it conversational."
    ),
}


async def draft_follow_up_email(
    deal: Deal,
    contact: Contact,
    tone: str = "professional",
) -> str:
    """
    Draft a personalized follow-up email for a deal using Groq.

    Args:
        deal: The Deal ORM object containing pipeline context.
        contact: The Contact ORM object for personalization.
        tone: One of 'professional', 'urgent', or 'friendly'.

    Returns:
        A complete email as a string (subject line + body).

    Raises:
        ValueError: If tone is not one of the supported options.
    """
    if tone not in TONE_INSTRUCTIONS:
        raise ValueError(
            f"Invalid tone '{tone}'. Choose from: {list(TONE_INSTRUCTIONS.keys())}"
        )

    tone_instruction = TONE_INSTRUCTIONS[tone]

    system_prompt = (
        "You are an expert B2B sales representative. "
        f"{tone_instruction} "
        "Format your response as:\n"
        "Subject: [subject line]\n\n"
        "[email body]\n\n"
        "Keep the email concise — under 150 words. "
        "Sign off as 'The Sales Team'."
    )

    user_message = (
        f"Write a follow-up email for this deal:\n\n"
        f"Contact name: {contact.name}\n"
        f"Contact title: {contact.title or 'Decision Maker'}\n"
        f"Company: {contact.company or 'their company'}\n"
        f"Deal title: {deal.title}\n"
        f"Deal stage: {deal.stage}\n"
        f"Deal value: ${deal.value or 0:,.2f}\n"
        f"Win probability: {deal.probability or 0}%\n"
        f"Days in current stage: {deal.days_in_stage or 0}\n"
        f"Notes: {deal.notes or 'No additional notes'}\n"
    )

    try:
        return await chat_completion(
            system_prompt=system_prompt,
            user_message=user_message,
            max_tokens=500,
            temperature=0.3,
        )
    except Exception as e:
        raise Exception(f"Failed to draft email: {str(e)}") from e