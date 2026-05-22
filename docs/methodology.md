# Methodology

## Core objects

- **Experiment**: a focused behavioral study with cases and rubric.
- **Case**: a single scenario prompt with expected behavior and failure modes.
- **Run**: one model execution for one case, with metadata.
- **Score**: human or assisted evaluation aligned with rubric criteria.

## Scoring layers

1. Deterministic checks.
2. Human rubric scoring.
3. LLM-assisted scoring (advisory only).
