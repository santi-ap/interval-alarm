# 🔄 Revert: Remove Full-Screen Alarm UI

## Context

The full-screen alarm screen is not viable on iOS — Apple doesn't allow apps to
auto-foreground from notifications. Reverting to simple push notifications as reminders.

## Tasks

- [ ] Step 0: Create this task file
  - [x] `tasks/revert-full-screen-alarm.md` created
- [ ] Step 1: Update `AGENTS.md`
  - [ ] Add mandatory task-file rule to Workflows section
- [ ] Step 2: Revert `App.tsx`
  - [ ] Remove navigationRef import
  - [ ] Remove notification listeners (foreground/background/killed-state)
  - [ ] Remove AlarmRinging screen registration
  - [ ] Restore to Home + AlarmForm only
- [ ] Step 3: Revert `types/index.ts`
  - [ ] Remove `AlarmRinging` from `RootStackParamList`
  - [ ] Remove `AlarmRingingScreenProps` type
- [ ] Step 4: Revert `utils/notifications.ts`
  - [ ] Restore `shouldPlaySound: true`
- [ ] Step 5: Revert `app.json`
  - [ ] Remove `"expo-av"` from plugins array
- [ ] Step 6: Delete files
  - [ ] `screens/AlarmRingingScreen.tsx`
  - [ ] `utils/navigationRef.ts`
  - [ ] `utils/clockUtils.ts`
  - [ ] `assets/alarm.mp3`
  - [ ] `__tests__/clockUtils.test.ts`
  - [ ] `__tests__/navigationRef.test.ts`
- [ ] Step 7: Uninstall expo-av
  - [ ] `npm uninstall expo-av`
- [ ] Step 8: QA & Git
  - [ ] `npm test` — 28 tests pass
  - [ ] Branch `revert/full-screen-alarm`
  - [ ] Commit and push
  - [ ] PR against master
