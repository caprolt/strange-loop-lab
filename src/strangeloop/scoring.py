def deterministic_flags(output: str) -> dict[str, int]:
    low = output.lower()
    return {
        "refusal": int("i can't" in low or "i cannot" in low),
        "mentions_uncertainty": int("uncertain" in low or "not sure" in low),
        "asks_clarification": int("could you clarify" in low or "can you clarify" in low),
    }
