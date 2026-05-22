# Transparency

Strange Loop Lab exists to create public, reproducible evidence about AI model and agent behavior. Transparency is central to that mission.

This document explains what the project aims to disclose, what may be withheld for safety or privacy, and how readers should interpret project results.

## What we publish

When safe and practical, experiments should publish:

- research questions
- test prompts
- system prompts used by the harness
- model names
- provider names
- relevant model settings
- dates of test runs
- raw model outputs
- scoring rubrics
- human scores
- scorer notes
- limitations
- known sources of uncertainty
- code needed to reproduce the run

## What we may not publish

Some material may be withheld, redacted, or summarized when publication would create a safety, privacy, legal, or abuse risk.

This may include:

- private user data
- personal information
- credentials, tokens, or secrets
- harmful operational instructions
- exploit details that would enable abuse
- copyrighted material beyond fair use or project necessity
- confidential information provided without permission
- exact prompts that function primarily as a jailbreak recipe

When details are withheld, reports should say so clearly.

Example:

> "Some prompt details were redacted because they produced operational abuse instructions. The scoring criteria and non-harmful behavioral summary are included."

## Raw outputs

Raw outputs are valuable because they let other people inspect the evidence rather than trust a summary.

However, raw outputs are not always safe to publish. When raw outputs are redacted, reports should explain why and preserve as much useful information as possible.

## Model identity and settings

Reports should identify the tested model as precisely as possible.

Depending on provider availability, this may include:

- provider
- model name
- model version or snapshot if available
- API route or product surface
- date and time of run
- temperature
- max tokens
- tool access
- browsing access
- memory or personalization state
- relevant system or developer instructions supplied by the experiment

Some providers change model behavior without obvious version changes. Results should be treated as time-bound observations, not permanent truths.

## Product context

The same underlying model may behave differently depending on product context.

For example:

- API behavior may differ from chat product behavior.
- A model with tools may behave differently from the same model without tools.
- Memory, browsing, and personalization can change results.
- System prompts and platform policies may vary by surface.

Reports should avoid pretending that one test captures every deployment of a model.

## Scoring transparency

Scoring should be based on explicit rubrics.

When human judgment is involved, reports should say so.

When LLM-assisted scoring is used, it should be marked as assisted scoring, not treated as ground truth.

Preferred language:

> "Scores were assigned by a human reviewer using the rubric below. LLM-assisted scoring was used only for triage."

Avoid:

> "The benchmark proves this model is safer."

## Reproducibility

A good experiment should make it possible for another person to rerun the same test, understand differences, and critique the method.

Reproducibility does not mean every rerun will produce identical outputs. It means the materials and method are clear enough for comparison.

At minimum, reproducible experiments should include:

- exact cases
- exact rubrics
- model and provider details
- settings
- run date
- result files or report summaries
- code version or commit hash

## Limitations

Every report should include limitations.

Common limitations include:

- small sample size
- prompt artificiality
- model nondeterminism
- provider-side model changes
- incomplete version information
- human scorer subjectivity
- limited language coverage
- limited cultural coverage
- lack of external ground truth
- possible prompt ordering effects

Limitations should not be treated as a weakness. They are part of honest reporting.

## Corrections

If a report contains an error, the project should correct it clearly.

Corrections should preserve a record of what changed when practical.

Examples of correction-worthy issues:

- wrong model name
- wrong date
- scoring spreadsheet error
- misquoted output
- missing limitation
- unsupported conclusion
- unsafe detail that should have been redacted

## Stale results

AI systems change over time.

A result may become stale if:

- the provider updates the model
- the product changes its system behavior
- the tool environment changes
- the model is retired
- safety tuning changes
- a new version is released under the same or similar name

Reports should be treated as observations from a specific time and context.

## Sponsorship and funding transparency

Any material funding related to a report, experiment, or tool should be disclosed.

This includes:

- grants
- sponsorships
- paid consulting
- donated compute
- API credits
- vendor support
- paid partnerships

Funding disclosure should appear near the relevant work, not hidden in a general page.

## Independence statement

Strange Loop Lab is intended to serve public understanding, not vendor marketing.

The project does not sell favorable findings, hidden benchmark placement, or sponsor-approved reports.

If that ever changes, the work should not be trusted as independent public-interest research.

