"""Email delivery via Resend (async wrapper)."""
import asyncio
import os


async def send_email(to: str, subject: str, body_text: str) -> tuple[bool, str | None]:
    if not to:
        return False, "no recipient"
    key = os.environ.get("RESEND_API_KEY", "")
    if not key:
        return False, "email not configured (demo mode)"

    def _send():
        import resend
        resend.api_key = key
        resend.Emails.send({
            "from": "Northwind CRM <onboarding@resend.dev>",
            "to": [to],
            "subject": subject,
            "html": body_text.replace("\n", "<br>"),
        })

    try:
        await asyncio.to_thread(_send)
        return True, None
    except Exception as e:
        return False, str(e)
