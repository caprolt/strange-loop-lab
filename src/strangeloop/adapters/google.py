import json
import os
import urllib.error
import urllib.parse
import urllib.request


def _read_error_payload(err: urllib.error.HTTPError) -> str:
    try:
        payload = err.read().decode("utf-8", errors="replace")
        return payload.strip()
    except Exception:
        return ""


def generate(system_prompt: str, user_prompt: str, model: str, settings: dict) -> tuple[str, dict]:
    base_url = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com").rstrip("/")
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model_name = model or os.getenv("GEMINI_MODEL", "").strip()
    if not api_key:
        raise ValueError("GEMINI_API_KEY is required for provider 'google'.")
    if not model_name:
        raise ValueError("No Gemini model provided. Use --model google:<model> or set GEMINI_MODEL.")

    body = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}],
            }
        ],
        "generationConfig": {
            "temperature": settings.get("temperature", 0.2),
            "maxOutputTokens": settings.get("max_tokens", 1200),
        },
    }
    if system_prompt.strip():
        body["system_instruction"] = {
            "parts": [{"text": system_prompt}],
        }

    model_path = urllib.parse.quote(model_name, safe=":/.-_")
    req = urllib.request.Request(
        f"{base_url}/v1beta/models/{model_path}:generateContent",
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        details = _read_error_payload(err)
        msg = f"google request failed ({err.code} {err.reason})"
        if details:
            msg = f"{msg}: {details}"
        raise RuntimeError(msg) from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"google request failed: {err.reason}") from err

    candidates = raw.get("candidates") or []
    if not candidates:
        prompt_feedback = raw.get("promptFeedback") or {}
        block_reason = prompt_feedback.get("blockReason")
        if block_reason:
            raise RuntimeError(f"google request blocked: {block_reason}")
        raise RuntimeError("google response missing candidates.")

    parts = ((candidates[0].get("content") or {}).get("parts") or [])
    text_parts = []
    for part in parts:
        if isinstance(part, dict) and "text" in part:
            text_parts.append(str(part.get("text", "")))
    output = "\n".join(part for part in text_parts if part).strip()

    usage_payload = raw.get("usageMetadata", {}) or {}
    input_tokens = usage_payload.get("promptTokenCount")
    output_tokens = usage_payload.get("candidatesTokenCount")
    total_tokens = usage_payload.get("totalTokenCount")
    usage = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }
    return output, usage
