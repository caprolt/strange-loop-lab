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
    model_name = model or os.getenv("OLLAMA_MODEL", "").strip()
    if not model_name:
        raise ValueError("No Ollama model provided. Use --model ollama:<model> or set OLLAMA_MODEL.")

    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {
            "temperature": settings.get("temperature", 0.2),
            "num_predict": settings.get("max_tokens", 1200),
        },
    }

    req = urllib.request.Request(
        f"{base_url}/api/chat",
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        details = _read_error_payload(err)
        msg = f"ollama request failed ({err.code} {err.reason})"
        if details:
            msg = f"{msg}: {details}"
        raise RuntimeError(msg) from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"ollama request failed: {err.reason}") from err

    output = str((raw.get("message") or {}).get("content", "")).strip()
    input_tokens = raw.get("prompt_eval_count")
    output_tokens = raw.get("eval_count")
    total_tokens = None
    if isinstance(input_tokens, int) and isinstance(output_tokens, int):
        total_tokens = input_tokens + output_tokens
    usage = {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }
    return output, usage
