# 🔄 Revert: Remove Full-Screen Alarm UI

## Context

The full-screen alarm screen is not viable on iOS — Apple doesn't allow apps to
auto-foreground from notifications. Reverting to simple push notifications as reminders.

## Tasks

- [x] Step 0: Create this task file
  - [x] `tasks/revert-full-screen-alarm.md` created
- [x] Step 1: Update `AGENTS.md`
  - [x] Add mandatory task-file rule to Workflows section
- [x] Step 2: Revert `App.tsx`
  - [x] Remove navigationRef import
  - [x] Remove notification listeners (foreground/background/killed-state)
  - [x] Remove AlarmRinging screen registration
  - [x] Restore to Home + AlarmForm only
- [x] Step 3: Revert `types/index.ts`
  - [x] Remove `AlarmRinging` from `RootStackParamList`
  - [x] Remove `AlarmRingingScreenProps` type
- [x] Step 4: Revert `utils/notifications.ts`
  - [x] Restore `shouldPlaySound: true`
- [x] Step 5: Revert `app.json`
  - [x] Remove `"expo-av"` from plugins array
- [x] Step 6: Delete files
  - [x] `screens/AlarmRingingScreen.tsx`
  - [x] `utils/navigationRef.ts`
  - [x] `utils/clockUtils.ts`
  - [x] `assets/alarm.mp3`
  - [x] `__tests__/clockUtils.test.ts`
  - [x] `__tests__/navigationRef.test.ts`
- [x] Step 7: Uninstall expo-av
  - [x] `npm uninstall expo-av`
- [x] Step 8: QA & Git
  - [x] `npm test` — 28 tests pass
  - [x] Branch `revert/full-screen-alarm`
  - [x] Commit and push
  - [x] PR against master
