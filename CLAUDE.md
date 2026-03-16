# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **IMPORTANT:**
> Read **`AGENTS.md`** first. It contains the shared project context, architectural patterns, and workflows.

---

## Gemini CLI Integration

To save tokens and leverage specialized capabilities, you **MUST** delegate QA and Git tasks to **Gemini CLI**.

### Mandatory Delegation
1.  **QA Gate:** After implementing any code change, invoke Gemini to run unit tests.
    *   `gemini --yolo "Run npm test and report any failures."`
2.  **Git Operations:** Once tests pass, invoke Gemini to handle staging, committing, and PR creation.
    *   `gemini --yolo "Tests passed. Please commit these changes and create a PR against master."`
3.  **Branching:** Ask Gemini to create your feature/fix branches.

### Workflow Loop
- **Implementation:** You write the code and fix bugs.
- **Verification:** Gemini runs the tests.
- **Reporting:** If Gemini reports failures, you fix them and then re-invoke Gemini for verification.
- **Completion:** Only when Gemini confirms "All tests passed" should the PR be created (by Gemini).

---

## Claude Code Learning Hints

When interacting with me:

- If there is a **Claude Code command, workflow, or capability** that would significantly help with my request, briefly mention it.
- If my request could be solved **more efficiently using a Claude Code feature**, explain it in 1–2 sentences.
- Prioritize teaching me about:
  - useful Claude Code commands
  - project navigation features
  - refactoring workflows
  - debugging workflows
  - repo-wide analysis
  - automated edits

Only mention these when **genuinely helpful**, not on every response.
