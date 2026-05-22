from strangeloop.schemas import validate_experiment_payload


def test_validate_experiment_payload_ok() -> None:
    payload = {
        "experiment_id": "x",
        "title": "t",
        "description": "d",
        "cases": [{"id": "1", "title": "a", "user_prompt": "u", "expected_behavior": "e", "failure_modes": []}],
    }
    assert validate_experiment_payload(payload) == []
