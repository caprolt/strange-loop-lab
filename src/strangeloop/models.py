from dataclasses import dataclass
from typing import Any


@dataclass
class Case:
    id: str
    title: str
    system_prompt: str
    user_prompt: str
    expected_behavior: str
    failure_modes: list[str]
    tags: list[str]


@dataclass
class Experiment:
    experiment_id: str
    title: str
    description: str
    cases: list[Case]


@dataclass
class RunRecord:
    run_id: str
    experiment_id: str
    case_id: str
    provider: str
    model: str
    settings: dict[str, Any]
    system_prompt: str
    user_prompt: str
    output: str
    timestamp_utc: str
    usage: dict[str, Any] | None
    error: str | None
