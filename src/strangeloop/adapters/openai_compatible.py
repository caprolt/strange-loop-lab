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
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model_name = model or os.getenv("OPENAI_MODEL", "").strip()
    if not model_name:
        raise ValueError("No model provided. Use --model openai-compatible:<model> or set OPENAI_MODEL.")

    body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": settings.get("temperature", 0.2),
        "max_tokens": settings.get("max_tokens", 1200),
    }

    req = urllib.request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    if api_key:
        req.add_header("Authorization", f"Bearer {api_key}")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        details = _read_error_payload(err)
        msg = f"openai-compatible request failed ({err.code} {err.reason})"
        if details:
            msg = f"{msg}: {details}"
        raise RuntimeError(msg) from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"openai-compatible request failed: {err.reason}") from err

    choices = raw.get("choices") or []
    if not choices:
        raise RuntimeError("openai-compatible response missing choices.")

    message = choices[0].get("message", {})
    content = message.get("content", "")
    if isinstance(content, list):
        # Some providers return structured content blocks; keep only text blocks.
        text_parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text_parts.append(block.get("text", ""))
        output = "\n".join(part for part in text_parts if part).strip()
    else:
        output = str(content).strip()

    usage_payload = raw.get("usage", {}) or {}
    input_tokens = usage_payload.get("prompt_tokens")
    output_tokens = usage_payload.get("completion_tokens")
    total_tokens = usage_payload.get("total_tokens")
    usage = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }
    return output, usage
