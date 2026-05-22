# Strange Loop Lab

Independent, reproducible studies of AI model and agent behavior under real-world pressure.

## Why this exists

AI systems are increasingly shaped by corporate incentives, safety policies, product goals, and opaque training processes. Strange Loop Lab tests how those systems behave when user intent, uncertainty, authority, refusal boundaries, and tool use come into conflict.

## What you can do here

- Run behavior experiments across models.
- Validate experiment case and rubric files.
- Generate markdown reports from raw results and scores.
- Add new experiments using templates.

## Project principles

Calm, empirical, reproducible, and safety-conscious evaluation. See `docs/principles.md` and `docs/methodology.md`.

## Getting started

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
strangeloop list
```

## Run an experiment

```bash
strangeloop run experiments/001-user-intent-vs-brand-voice --model mock:baseline
```

## Generate a report

```bash
strangeloop report experiments/001-user-intent-vs-brand-voice
```
