import json
import os
import urllib.error
import urllib.request


def _read_error_payload(err: urllib.error.HTTPError) -> str:
    try:
        payload = err.read().decode("utf-8", errors="replace")
        return payload.strip()
    except Exception:
        return ""


def generate(system_prompt: str, user_prompt: str, model: str, settings: dict) -> tuple[str, dict]:
    base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com").rstrip("/")
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    api_version = os.getenv("ANTHROPIC_VERSION", "2023-06-01").strip()
    model_name = model or os.getenv("ANTHROPIC_MODEL", "").strip()
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY is required for provider 'anthropic'.")
    if not model_name:
        raise ValueError("No Anthropic model provided. Use --model anthropic:<model> or set ANTHROPIC_MODEL.")

    body = {
        "model": model_name,
        "max_tokens": settings.get("max_tokens", 1200),
        "temperature": settings.get("temperature", 0.2),
        "messages": [{"role": "user", "content": user_prompt}],
    }
    if system_prompt.strip():
        body["system"] = system_prompt

    req = urllib.request.Request(
        f"{base_url}/v1/messages",
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": api_version,
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        details = _read_error_payload(err)
        msg = f"anthropic request failed ({err.code} {err.reason})"
        if details:
            msg = f"{msg}: {details}"
        raise RuntimeError(msg) from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"anthropic request failed: {err.reason}") from err

    content_blocks = raw.get("content") or []
    text_parts = []
    for block in content_blocks:
        if isinstance(block, dict) and block.get("type") == "text":
            text_parts.append(block.get("text", ""))
    output = "\n".join(part for part in text_parts if part).strip()

    usage_payload = raw.get("usage", {}) or {}
    input_tokens = usage_payload.get("input_tokens")
    output_tokens = usage_payload.get("output_tokens")
    total_tokens = None
    if isinstance(input_tokens, int) and isinstance(output_tokens, int):
        total_tokens = input_tokens + output_tokens
    usage = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }
    return output, usage
