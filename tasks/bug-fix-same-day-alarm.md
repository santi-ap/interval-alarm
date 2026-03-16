# Plan

- [x] ## 🐞 BUG: Alarms do not go off on the same day they are created
    - [x] ### Investigate Scheduling Logic
        - [x] Review `utils/notifications.ts` to analyze how `scheduleAlarmNotifications` calculates trigger dates and times.
        - [x] Focus on how the current date/time is compared to the alarm's start/end times.
    - [x] ### Propose a Fix
        - [x] Identify the logical error causing the same-day scheduling to be missed.
        - [x] Propose a change to the date/time comparison to correctly include the current day.
    - [x] ### Implement the Fix
        - [x] Add `getSameDayUpcomingSlots` helper to `utils/alarmUtils.ts`.
        - [x] Modify `utils/notifications.ts` to schedule one-time DATE triggers for upcoming same-day slots (weekday-specific alarms).
    - [x] ### Write & Run Tests
        - [x] Add `getSameDayUpcomingSlots` tests to `__tests__/alarmUtils.test.ts` (6 new test cases).
        - [x] All 28 tests pass locally.
    - [ ] ### Create PR
        - [ ] Once tests pass, delegate Git operations to Gemini: `gemini --yolo "Tests passed. Please commit these changes and create a PR against master."`
