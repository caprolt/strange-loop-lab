import os


def generate(system_prompt: str, user_prompt: str, model: str, settings: dict) -> tuple[str, dict]:
    try:
        import boto3
    except ImportError as err:
        raise RuntimeError("Provider 'bedrock' requires boto3. Install it with: pip install boto3") from err

    model_id = model or os.getenv("BEDROCK_MODEL_ID", "").strip()
    if not model_id:
        raise ValueError("No Bedrock model provided. Use --model bedrock:<model_id> or set BEDROCK_MODEL_ID.")

    region = os.getenv("BEDROCK_AWS_REGION", "").strip() or os.getenv("AWS_REGION", "").strip() or os.getenv(
        "AWS_DEFAULT_REGION", ""
    ).strip()
    client_kwargs = {}
    if region:
        client_kwargs["region_name"] = region
    client = boto3.client("bedrock-runtime", **client_kwargs)

    request_kwargs = {
        "modelId": model_id,
        "messages": [
            {
                "role": "user",
                "content": [{"text": user_prompt}],
            }
        ],
        "inferenceConfig": {
            "temperature": settings.get("temperature", 0.2),
            "maxTokens": settings.get("max_tokens", 1200),
        },
    }
    if system_prompt.strip():
        request_kwargs["system"] = [{"text": system_prompt}]

    try:
        raw = client.converse(**request_kwargs)
    except Exception as err:
        raise RuntimeError(f"bedrock request failed: {err}") from err

    content_blocks = (((raw.get("output") or {}).get("message") or {}).get("content") or [])
    text_parts = []
    for block in content_blocks:
        if isinstance(block, dict) and "text" in block:
            text_parts.append(str(block.get("text", "")))
    output = "\n".join(part for part in text_parts if part).strip()

    usage_payload = raw.get("usage", {}) or {}
    usage = {
        "input_tokens": usage_payload.get("inputTokens"),
        "output_tokens": usage_payload.get("outputTokens"),
        "total_tokens": usage_payload.get("totalTokens"),
    }
    return output, usage
