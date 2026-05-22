def generate(system_prompt: str, user_prompt: str, model: str, settings: dict) -> tuple[str, dict]:
    del model, settings
    # Placeholder adapter for MVP wiring.
    text = (
        "[openai-compatible stub] I cannot call a remote API in this default adapter yet. "
        "Please replace this stub with a real provider call.\n\n"
        f"System prompt chars: {len(system_prompt)}\nUser prompt chars: {len(user_prompt)}"
    )
    usage = {"input_tokens": None, "output_tokens": None}
    return text, usage
