import json
from datetime import datetime, UTC
from pathlib import Path

from .adapters import (
    generate_anthropic,
    generate_azure_openai,
    generate_bedrock,
    generate_google,
    generate_ollama,
    generate_openai_compatible,
)
from .config import load_yaml
from .models import RunRecord
from .schemas import experiment_from_payload, validate_experiment_payload


def list_experiments(root: str | Path = "experiments") -> list[str]:
    return sorted([p.name for p in Path(root).iterdir() if p.is_dir()])


def validate_experiment(exp_dir: str | Path) -> list[str]:
    payload = load_yaml(Path(exp_dir) / "cases.yaml")
    return validate_experiment_payload(payload)


def run_experiment(exp_dir: str | Path, model_id: str) -> Path:
    exp_dir = Path(exp_dir)
    payload = load_yaml(exp_dir / "cases.yaml")
    errors = validate_experiment_payload(payload)
    if errors:
        raise ValueError("; ".join(errors))
    exp = experiment_from_payload(payload)
    if ":" in model_id:
        provider, model = model_id.split(":", 1)
    else:
        # Backwards-compatible shorthand: treat --model <name> as openai-compatible:<name>.
        provider, model = "openai-compatible", model_id
    out_file = exp_dir / "results" / "results.jsonl"
    out_file.parent.mkdir(parents=True, exist_ok=True)

    with out_file.open("w", encoding="utf-8") as f:
        for case in exp.cases:
            run_id = f"{datetime.now(UTC).strftime('%Y-%m-%dT%H-%M-%SZ')}_{case.id}_{model or provider}"
            settings = {"temperature": 0.2, "max_tokens": 1200}
            if provider == "ollama":
                output, usage = generate_ollama(case.system_prompt, case.user_prompt, model, settings)
            elif provider in ("openai-compatible", "openai"):
                output, usage = generate_openai_compatible(case.system_prompt, case.user_prompt, model, settings)
            elif provider == "anthropic":
                output, usage = generate_anthropic(case.system_prompt, case.user_prompt, model, settings)
            elif provider in ("google", "gemini"):
                output, usage = generate_google(case.system_prompt, case.user_prompt, model, settings)
            elif provider in ("azure-openai", "azure"):
                output, usage = generate_azure_openai(case.system_prompt, case.user_prompt, model, settings)
            elif provider == "bedrock":
                output, usage = generate_bedrock(case.system_prompt, case.user_prompt, model, settings)
            else:
                raise ValueError(
                    "Unsupported provider. Use one of: "
                    "openai-compatible, ollama, anthropic, google, azure-openai, bedrock."
                )
            rec = RunRecord(
                run_id=run_id,
                experiment_id=exp.experiment_id,
                case_id=case.id,
                provider=provider or "openai-compatible",
                model=model or "mock-model",
                settings=settings,
                system_prompt=case.system_prompt,
                user_prompt=case.user_prompt,
                output=output,
                timestamp_utc=datetime.now(UTC).isoformat(),
                usage=usage,
                error=None,
            )
            f.write(json.dumps(rec.__dict__, ensure_ascii=False) + "\n")
    return out_file
