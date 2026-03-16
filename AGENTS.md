# AGENTS.md

This file serves as the **central knowledge base** for all AI agents (Claude Code, Gemini CLI, etc.) working on this repository.
It defines the shared context, architectural patterns, and workflows.

**Agents:** Please read this file to understand the project structure and rules.

---

## Language Standards

- **TypeScript:** Always use TypeScript instead of JavaScript.
- **Files:** Prefer `.ts` and `.tsx` for new code.
- **Typing:** Use strong typing; avoid `any`. Prefer explicit interfaces for data models.
- **Migration:** Suggest converting `.js` files to `.ts` when modifying them.

**Example `Alarm` type:**

```ts
interface Alarm {
  id: string
  label: string
  startMinutes: number
  endMinutes: number
  intervalMinutes: number
  active: boolean
  notificationIds: string[]
}
```

---

## Workflows

### Mandatory Verification
**ALL** changes (features, bug fixes, refactors) **MUST** pass unit tests locally before a PR is created.
- Command: `npm test`
- Policy: No PRs with failing tests. No skipping local tests.

### Agent Roles & Responsibilities
- **Claude Code:** Primary code architect and implementer. Focuses on logic and feature implementation.
- **Gemini CLI:** Primary **QA and Git Operator**.
    - **QA:** Responsible for running `npm test` after code changes.
    - **Git:** Responsible for branching, commits, and PR creation **only after tests pass**.
    - **Conflict Resolution:** Handles simple Git conflicts. Complex or logic-heavy conflicts (e.g., architectural overlaps) should be delegated back to the authoring agent (usually Claude).

### Task File Requirement
Every feature, bug fix, revert, or similar work **MUST** begin by creating a task file in `tasks/` before any code is written.
- File name: `tasks/<type>-<description>.md` (e.g., `tasks/feat-alarm-snooze.md`, `tasks/bug-fix-crash.md`)
- Format: nested checkboxes, emoji prefix on the title (e.g., `# ✨ Feature:`, `# 🐛 Bug Fix:`, `# 🔄 Revert:`)
- Use `[-]` when starting a step, `[x]` when fully complete

### Bug Fix Workflow
1. Pull latest `master`.
2. Create a branch (`fix/description`).
3. Implementation (Claude).
4. **QA Gate:** Run tests (Gemini). If fail, report to Claude to fix.
5. **PR:** Create PR against `master` once tests pass (Gemini).

### Feature Development Workflow
1. Pull latest `master`.
2. Create a branch (Gemini).
3. Implementation (Claude).
4. **QA Gate:** Run tests (Gemini). If fail, report to Claude to fix.
5. **PR:** Create PR against `master` once tests pass (Gemini).


---

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Start with Android emulator
npm run ios        # Start with iOS simulator
npm test           # Run unit tests
```

**iOS Limitation:** `expo-notifications` requires a development build for iOS. Cannot test fully in Expo Go on iOS without an Apple Developer account.

---

## Architecture

**Stack:** React Native (Expo SDK 54) using local notifications.

### Data Model
- **Alarm:** `id`, `label`, `startMinutes` (minutes since midnight), `endMinutes`, `intervalMinutes`, `active`, `notificationIds[]`.
- **Time:** Stored as minutes since midnight (e.g., 9:00 AM = 540).

### Navigation (`App.js`)
- **HomeScreen:** Lists alarms, toggle active, delete.
- **AlarmFormScreen:** Create/edit alarm. Receives `route.params.alarm` (null for new).

### Notifications (`utils/notifications.js`)
- **Strategy:** One `expo-notifications` daily repeating notification per interval tick.
- **Process:** Cancel existing IDs -> Schedule new ones -> Store IDs in alarm object.
- **Android Channel:** `interval-alarms`.

### Persistence (`utils/storage.js`)
- **Storage:** `AsyncStorage`.
- **Key:** `interval_alarms`.
- **Method:** Serializes entire alarm array after every mutation.

### Key Constraints
- **OS Limits:** `expo-notifications` schedules one OS notification per tick.
- **iOS Limit:** Caps pending notifications at **64 total**. Logic must respect this to avoid failures.
