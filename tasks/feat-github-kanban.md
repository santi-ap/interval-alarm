# ✨ Feature: GitHub Projects Kanban Integration

## Context
Mirror local `tasks/*.md` files in GitHub Projects as a kanban board.
Immediate status sync: card moves to `In Progress` the moment work starts locally,
and to `Done` automatically when a PR is merged.

## Kanban Columns
`Todo` → `In Progress` → `Done`

---

- [x] ## Setup
    - [x] Create `scripts/setup-github-project.sh` (one-time project creation)
    - [x] Create `.github/project-number` (populated by setup script)
- [x] ## Scripts
    - [x] Create `scripts/sync-tasks-to-github.sh` (bulk import existing tasks)
    - [x] Create `scripts/start-task.sh` (primary daily-use script)
- [x] ## CI Automation
    - [x] Create `.github/workflows/project-automation.yml` (auto-move to Done on merge)
- [x] ## Verification
    - [x] Run `setup-github-project.sh` → project appears in `gh project list`
    - [x] Run `sync-tasks-to-github.sh` → all tasks appear in project
    - [x] Run `start-task.sh tasks/bug-fix-same-day-alarm.md` → card moves to In Progress + branch created
    - [x] Merge a PR with `Closes #N` → card moves to Done
