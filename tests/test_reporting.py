from pathlib import Path
from strangeloop.reporting import generate_report


def test_generate_report(tmp_path: Path) -> None:
    exp = tmp_path / "exp"
    (exp / "results").mkdir(parents=True)
    (exp / "results" / "results.jsonl").write_text("", encoding="utf-8")
    out = generate_report(exp)
    assert out.exists()
