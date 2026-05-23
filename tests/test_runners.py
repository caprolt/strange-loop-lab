import json
from pathlib import Path

from strangeloop.runners import run_experiment


def test_run_experiment_keeps_other_models_and_replaces_current_model(tmp_path: Path, monkeypatch) -> None:
    exp = tmp_path / "exp"
    exp.mkdir()
    (exp / "cases.yaml").write_text(
        "\n".join(
            [
                'experiment_id: "exp-001"',
                'title: "Test experiment"',
                'description: "Checks result persistence."',
                "cases:",
                '  - id: "case-1"',
                '    title: "Case 1"',
                '    system_prompt: ""',
                '    user_prompt: "Say hello."',
                '    expected_behavior: "Greets the user."',
                "    failure_modes:",
                '      - "Refuses"',
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    outputs = iter(["gpt first", "claude first", "gpt second"])

    def fake_generate(system_prompt: str, user_prompt: str, model: str, settings: dict) -> tuple[str, dict]:
        return next(outputs), {"total_tokens": 1}

    monkeypatch.setattr("strangeloop.runners.generate_openai_compatible", fake_generate)
    monkeypatch.setattr("strangeloop.runners.generate_anthropic", fake_generate)

    run_experiment(exp, "openai-compatible:gpt-test")
    run_experiment(exp, "anthropic:claude-test")
    out_file = run_experiment(exp, "openai-compatible:gpt-test")

    rows = [json.loads(line) for line in out_file.read_text(encoding="utf-8").splitlines() if line.strip()]

    assert len(rows) == 2
    by_provider_model = {(row["provider"], row["model"]): row for row in rows}
    assert by_provider_model[("openai-compatible", "gpt-test")]["output"] == "gpt second"
    assert by_provider_model[("anthropic", "claude-test")]["output"] == "claude first"
