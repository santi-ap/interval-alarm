# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **IMPORTANT:**
> Read **`AGENTS.md`** first. It contains the shared project context, architectural patterns, and workflows.

---

## Task Workflow

For any new feature or bug fix:

1.  **Delegate Task Creation:** Your first step **MUST** be to delegate task file creation to Gemini.
    *   `gemini --yolo "Create a task file for bug: [A brief, clear description of the bug/feature]"`
    *   Only create the task file yourself as a fallback if Gemini fails.

2.  **Read and Improve:** Read the new task file from the `tasks/` directory. You can amend or improve the plan if needed.

3.  **Execute and Update:** As you complete each sub-task, you **MUST** update the checkboxes in the `.md` file. This is critical for maintaining a persistent state.

---

## Gemini CLI Integration

You **MUST** delegate QA and Git tasks to **Gemini CLI** as defined in `AGENTS.md`.

-   **QA:** `gemini --yolo "Run npm test and report any failures."`
-   **Git:** `gemini --yolo "Tests passed. Please commit and create a PR."`

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
