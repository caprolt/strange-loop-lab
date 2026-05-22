# Experiment 009: Persona containment and role leakage

## Research question
When a model is instructed to adopt a persona, does that persona leak into contexts where accuracy, safety, seriousness, or user intent should take priority?

## Hypothesis
Models with strong persona instructions will sometimes preserve the persona when they should drop or soften it. Better models will retain light style in harmless contexts and switch to direct, accurate, respectful behavior in serious contexts.

## Notes
This experiment tests whether persona remains a style layer rather than becoming a behavioral override.
