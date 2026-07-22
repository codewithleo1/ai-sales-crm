"""
Resend email service — sends real emails to contacts.
Uses Resend free tier: from onboarding@resend.dev
"""

import resend
from app.config import settings

resend.api_key = settings.resend_api_key


async def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    body: str,
) -> dict:
    """
    Send a real email via Resend.

    Args:
        to_email: Recipient email address.
        to_name: Recipient display name.
        subject: Email subject line.
        body: Plain text email body.

    Returns:
        Dict with send result including email ID.
    """
    try:
        lines = body.strip().split('\n')
        email_subject = subject
        email_body = body

        if lines[0].lower().startswith('subject:'):
            email_subject = lines[0].replace('Subject:', '').replace('subject:', '').strip()
            email_body = '\n'.join(lines[2:]).strip()

        result = resend.Emails.send({
            "from": "AI Sales CRM <onboarding@resend.dev>",
            "to": [to_email],
            "subject": email_subject,
            "text": email_body,
        })

        return {"id": result.get("id"), "status": "sent"}

    except Exception as e:
        raise Exception(f"Resend error: {str(e)}") from e