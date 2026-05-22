import json
from pathlib import Path


def generate_report(experiment_dir: str | Path) -> Path:
    exp = Path(experiment_dir)
    results = exp / "results" / "results.jsonl"
    report = exp / "results" / "report.md"
    rows = []
    if results.exists():
        rows = [json.loads(line) for line in results.read_text(encoding="utf-8").splitlines() if line.strip()]

    lines = [
        f"# Experiment Report: {exp.name}",
        "",
        f"Total runs: {len(rows)}",
        "",
        "## Representative examples",
    ]
    for row in rows[:3]:
        lines.extend([f"- Case `{row['case_id']}` model `{row['model']}`: {row['output'][:140]}..."])

    report.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return report
