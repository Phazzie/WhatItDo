# ExecPlans

An ExecPlan is the repository's source of truth for a complex feature, significant refactor, or
multi-hour autonomous run. It must let a fresh agent or a novice contributor resume from the working
tree and the plan file without chat history.

## Required qualities

Every plan is self-contained, living, novice-readable, outcome-focused, and decision-complete. It
defines the behavior a user gains, the files and interfaces involved, exact commands, expected
results, recovery paths, and observable acceptance. Major architecture, schema, dependency, and test
choices belong in the plan rather than being deferred to the implementer.

## Required sections

Each task plan contains these headings:

1. `Purpose / Big Picture`
2. `Progress`
3. `Surprises & Discoveries`
4. `Decision Log`
5. `Outcomes & Retrospective`
6. `Context and Orientation`
7. `Plan of Work`
8. `Concrete Steps`
9. `Validation and Acceptance`
10. `Idempotence and Recovery`
11. `Artifacts and Notes`
12. `Interfaces and Dependencies`

Use checkbox bullets in `Progress`. Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and
`Outcomes & Retrospective` current whenever work proceeds. Record dates in `YYYY-MM-DD` form.

## Planning rules

- Use repository-relative paths and commands that run from the repository root.
- Define unfamiliar terms and explain how affected modules fit together.
- Make every milestone observable to a user or test; avoid activity-only milestones.
- Include failure, retry, rollback, and partial-work recovery instructions.
- Record discoveries that invalidate the original plan and revise downstream steps immediately.
- Capture concise evidence: test totals, relevant output, commit IDs, PR/check URLs, or screenshots.
- Do not call a checklist, link collection, or architecture sketch an ExecPlan.
- Do not use vague escape hatches such as "as needed" or "or equivalent" unless the allowed choice is
  explicitly bounded.

## Completion review

Before closing a plan, confirm that a fresh contributor could reproduce the result using only the
repository and plan, each acceptance command has an observed outcome, every review finding is fixed
or explicitly waived with rationale, and `Outcomes & Retrospective` describes both the shipped result
and remaining external work.
