# ✨ Feature: GitHub Projects Kanban Integration

## Context
Mirror local `tasks/*.md` files in GitHub Projects as a kanban board.
Immediate status sync: card moves to `In Progress` the moment work starts locally,
and to `Done` automatically when a PR is merged.

## Kanban Columns
`Todo` → `In Progress` → `Done`

---

- [ ] ## Setup
    - [ ] Create `scripts/setup-github-project.sh` (one-time project creation)
    - [ ] Create `.github/project-number` (populated by setup script)
- [ ] ## Scripts
    - [ ] Create `scripts/sync-tasks-to-github.sh` (bulk import existing tasks)
    - [ ] Create `scripts/start-task.sh` (primary daily-use script)
- [ ] ## CI Automation
    - [ ] Create `.github/workflows/project-automation.yml` (auto-move to Done on merge)
- [ ] ## Verification
    - [ ] Run `setup-github-project.sh` → project appears in `gh project list`
    - [ ] Run `sync-tasks-to-github.sh` → all tasks appear in project
    - [ ] Run `start-task.sh tasks/bug-fix-same-day-alarm.md` → card moves to In Progress + branch created
    - [ ] Merge a PR with `Closes #N` → card moves to Done
