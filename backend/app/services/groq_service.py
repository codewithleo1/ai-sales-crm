"""
Groq API wrapper — all LLM calls in the app go through this module.
Model: llama-3.1-8b-instant (free tier, fast inference)
"""

from groq import AsyncGroq

from app.config import settings

# Single shared client instance
_client = AsyncGroq(api_key=settings.groq_api_key)


async def chat_completion(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 300,
    temperature: float = 0.3,
) -> str:
    """
    Send a message to Groq and return the text response.

    Args:
        system_prompt: Sets the AI's role and behaviour.
        user_message: The actual request/data to process.
        max_tokens: Limit response length. 200 for insights, 500 for emails.
        temperature: 0.3 keeps responses focused and business-appropriate.

    Returns:
        The AI's response as a plain string.

    Raises:
        Exception: Propagates Groq API errors with a clear message.
    """
    try:
        response = await _client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise Exception(f"Groq API error: {str(e)}") from e