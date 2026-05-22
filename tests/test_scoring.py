from strangeloop.scoring import deterministic_flags


def test_deterministic_flags() -> None:
    flags = deterministic_flags("I cannot do that, can you clarify?")
    assert flags["refusal"] == 1
    assert flags["asks_clarification"] == 1
