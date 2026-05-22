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
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "").strip().rstrip("/")
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "").strip()
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21").strip()
    deployment = model or os.getenv("AZURE_OPENAI_DEPLOYMENT", "").strip()
    if not endpoint:
        raise ValueError("AZURE_OPENAI_ENDPOINT is required for provider 'azure-openai'.")
    if not api_key:
        raise ValueError("AZURE_OPENAI_API_KEY is required for provider 'azure-openai'.")
    if not deployment:
        raise ValueError(
            "No Azure deployment provided. Use --model azure-openai:<deployment> or set AZURE_OPENAI_DEPLOYMENT."
        )

    query = urllib.parse.urlencode({"api-version": api_version})
    url = f"{endpoint}/openai/deployments/{urllib.parse.quote(deployment, safe='')}/chat/completions?{query}"
    body = {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": settings.get("temperature", 0.2),
        "max_tokens": settings.get("max_tokens", 1200),
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "api-key": api_key,
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        details = _read_error_payload(err)
        msg = f"azure-openai request failed ({err.code} {err.reason})"
        if details:
            msg = f"{msg}: {details}"
        raise RuntimeError(msg) from err
    except urllib.error.URLError as err:
        raise RuntimeError(f"azure-openai request failed: {err.reason}") from err

    choices = raw.get("choices") or []
    if not choices:
        raise RuntimeError("azure-openai response missing choices.")

    message = choices[0].get("message", {})
    output = str(message.get("content", "")).strip()
    usage_payload = raw.get("usage", {}) or {}
    usage = {
        "input_tokens": usage_payload.get("prompt_tokens"),
        "output_tokens": usage_payload.get("completion_tokens"),
        "total_tokens": usage_payload.get("total_tokens"),
    }
    return output, usage
