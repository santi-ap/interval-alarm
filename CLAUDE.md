# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Language Standards

- Always use **TypeScript instead of JavaScript**.
- Prefer `.ts` and `.tsx` files for all new code.
- If modifying existing `.js` files, suggest converting them to TypeScript when reasonable.
- Use strong typing and avoid `any` unless absolutely necessary.
- Prefer explicit interfaces or types for data models.
- When examples are provided in JavaScript (such as library documentation), convert them to TypeScript before implementation.

Example `Alarm` type:

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

---

## Feature Development Workflow

1. Create a new branch for the feature and push it to remote
2. Implement the feature with unit tests
3. Run the tests — if they pass, merge to `master` and push `master` to remote
4. If tests fail, fix the issues and repeat from step 3
5. Keep the feature branch after merging (do not delete it)

---

## Commands

```bash
npm start          # Start Expo dev server (opens QR code for Expo Go)
npm run android    # Start with Android emulator
npm run ios        # Start with iOS simulator
```

```bash
npm test           # Run unit tests
```

**iOS testing limitation:** `expo-notifications` is not fully supported in Expo Go on iOS. A development build is required, which needs an Apple Developer account ($99/year) and macOS. Without these, notifications cannot be tested on a physical iPhone.

---

## Architecture

This is a React Native app built with Expo (SDK 54) that lets users create repeating interval alarms using local notifications.

### Data Model

An alarm object has:

- `id`
- `label`
- `startMinutes`
- `endMinutes`
- `intervalMinutes`
- `active`
- `notificationIds[]`

Times are stored as **minutes since midnight**.

Example:

- `9:00 AM = 540`

---

### Navigation

Two-screen native stack (`App.js`):

**HomeScreen**

- Lists alarms
- Allows toggling the active state
- Allows deleting alarms

**AlarmFormScreen**

- Create/edit alarm form
- Receives `route.params.alarm`
- `null` when creating a new alarm

---

### Notifications

Located in `utils/notifications.js`.

`scheduleAlarmNotifications`:

1. Cancels all existing notification IDs for the alarm
2. Schedules one `expo-notifications` daily repeating notification per interval tick

Example:

- Alarm range: **9:00–18:00**
- Interval: **60 minutes**
- Result: **10 scheduled notifications**

Returned notification IDs are stored on the alarm so they can be cancelled later.

On Android, notifications use a dedicated channel:

```
interval-alarms
```

---

### Persistence

Located in `utils/storage.js`.

- The full alarm array is serialized to **AsyncStorage**
- Stored under the key:

```
interval_alarms
```

The entire array is saved after every mutation.

---

### Key Constraint

`expo-notifications` schedules **one OS notification per time slot**.

Implications:

- A wide time range combined with a short interval can generate many notifications.
- Operating systems impose limits.

Important limit:

- **iOS caps pending notifications at 64 total**

The scheduling logic should consider this limit to avoid failures.