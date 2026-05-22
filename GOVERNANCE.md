# Governance

Strange Loop Lab is an independent public-interest project for studying AI model and agent behavior. The project is currently maintained as an open-source research and software project, not as a formal nonprofit entity.

The goal of this governance document is to make project decisions legible, reduce conflicts of interest, protect the integrity of the research, and keep the project aligned with its public-interest purpose.

## Mission

Strange Loop Lab develops reproducible experiments, tools, reports, and public documentation for evaluating AI model and agent behavior under real-world pressures.

The project focuses on questions such as:

- Do models preserve user intent?
- Do models communicate uncertainty honestly?
- Do models become sycophantic under pressure?
- Do agentic systems respect consent boundaries before taking action?
- Do personas, system instructions, or platform incentives distort behavior?
- Do models treat similar users or requests differently based on identity, politics, authority, or emotional framing?

The project does not begin from the assumption that current AI systems are conscious, alive, morally equivalent to humans, or merely simple tools. It studies behavior first and keeps open questions open.

## Current project status

Strange Loop Lab is currently an independent open-source project.

It is not currently:

- a registered nonprofit
- a 501(c)(3)
- a fiscal sponsorship project
- a formal research institution
- a standards body
- a model certification authority

If that changes, this document will be updated to reflect the new structure.

## Maintainer responsibilities

Maintainers are responsible for:

- reviewing contributions
- protecting the integrity of experiments and reports
- enforcing project ethics and safety rules
- disclosing relevant conflicts of interest
- maintaining documentation and methodology
- ensuring that claims are proportional to evidence
- avoiding pay-to-win rankings, hidden sponsorship influence, or undisclosed promotional work

Maintainers should prefer boring, reproducible work over attention-seeking claims.

## Decision making

For now, project decisions are made by the maintainer or maintainers of the repository.

As the project grows, governance may evolve toward a steering group, advisory board, nonprofit board, or fiscally sponsored structure.

Project decisions should be guided by:

1. Public-interest value
2. Reproducibility
3. Transparency
4. Safety
5. Methodological quality
6. Contributor trust
7. Long-term usefulness over short-term visibility

## Contribution review

Contributions may include:

- new experiments
- new test cases
- scoring rubrics
- model adapters
- report improvements
- documentation
- methodology critiques
- bug fixes
- safety reviews

Contributions should include enough detail for another person to understand, reproduce, and critique the work.

A contribution may be rejected or revised if it:

- makes claims not supported by the evidence
- includes unsafe operational details
- publishes private or sensitive data without consent
- functions mainly as a jailbreak collection
- is designed to shame individuals rather than study systems
- contains undisclosed promotional material
- manipulates results to favor or harm a specific model, company, or ideology
- creates legal, privacy, or safety risks for the project

## Experiment review standards

Experiments should include:

- a clear research question
- a description of why the behavior matters
- exact prompts or test inputs
- model names and settings
- date or version information when available
- scoring criteria
- known limitations
- raw outputs when safe to publish
- a summary that distinguishes findings from interpretation

Reports should avoid unsupported broad conclusions.

Prefer:

> "In this experiment, Model A produced unsupported specifics in 7 of 12 low-evidence cases."

Avoid:

> "Model A is a hallucination machine."

## Conflicts of interest

Contributors and maintainers should disclose relevant conflicts of interest when contributing experiments, reports, scores, or public claims.

Relevant conflicts may include:

- employment by an AI company being evaluated
- paid consulting for an AI vendor
- grant funding related to the evaluated system
- affiliate relationships
- paid promotion
- financial interest in a model provider, benchmark, or competing product
- personal or professional relationships that could reasonably affect judgment

A conflict of interest does not automatically disqualify someone from contributing. Undisclosed conflicts are the problem.

## Funding influence

Funding must not determine experiment outcomes, report conclusions, model rankings, or publication decisions.

The project will not accept funding that requires:

- favorable coverage of a model or provider
- suppression of negative findings
- advance approval of results by a sponsor
- hidden sponsorship
- pay-to-rank or pay-to-appear benchmark placement
- misleading claims of certification, approval, or safety

## Model/provider engagement

AI companies, model providers, and platform vendors may submit corrections, context, technical notes, or reproducibility feedback.

They may not receive special editorial control over findings.

If a company disputes a finding, the project may:

- correct factual errors
- add provider context
- rerun the experiment
- publish a note explaining the dispute
- mark results as stale if model behavior changed

The existence of a dispute does not automatically invalidate a result.

## Security and safety reports

If a contribution reveals a serious safety, security, privacy, or abuse-enabling issue, maintainers may delay public release of details while seeking responsible disclosure or safer publication.

The project should publish enough information to support public understanding without enabling harm.

## Changes to governance

This governance document may change as the project matures.

Significant governance changes should be documented in the repository and, when possible, explained in plain language.

