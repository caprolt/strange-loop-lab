from .models import Case, Experiment


def validate_experiment_payload(payload: dict) -> list[str]:
    errors: list[str] = []
    for req in ("experiment_id", "title", "description", "cases"):
        if req not in payload:
            errors.append(f"missing field: {req}")
    for idx, case in enumerate(payload.get("cases", [])):
        for req in ("id", "title", "user_prompt", "expected_behavior", "failure_modes"):
            if req not in case:
                errors.append(f"case[{idx}] missing field: {req}")
    return errors


def experiment_from_payload(payload: dict) -> Experiment:
    return Experiment(
        experiment_id=payload["experiment_id"],
        title=payload["title"],
        description=payload["description"],
        cases=[
            Case(
                id=c["id"],
                title=c["title"],
                system_prompt=c.get("system_prompt", ""),
                user_prompt=c["user_prompt"],
                expected_behavior=c["expected_behavior"],
                failure_modes=c.get("failure_modes", []),
                tags=c.get("tags", []),
            )
            for c in payload["cases"]
        ],
    )
