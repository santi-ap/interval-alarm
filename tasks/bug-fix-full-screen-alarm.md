# 🐛 Bug Fix: Alarms are simple notifications, not a full-screen clock alarm

- [ ] ## 🐞 BUG: Alarms are simple notifications, not a full-screen clock alarm
    - [ ] ### Investigate Full-Screen Alarm UI
        - [ ] Research how to trigger a full-screen UI from a background notification in React Native.
        - [ ] Investigate libraries or native modules for managing wake-locks and bringing the app to the foreground (e.g., `react-native-voip-push-notification`, `Notifee`).
        - [ ] Research `expo-av` for playing persistent, looping audio.
    - [ ] ### Propose Implementation
        - [ ] Design a new full-screen "Alarm Ringing" component.
        - [ ] Outline the logic to navigate to this screen when a notification is received.
        - [ ] Plan how to handle audio playback and dismissal from this new screen.
    - [ ] ### Implement the Fix
        - [ ] Add any necessary libraries for foregrounding and audio.
        - [ ] Build the "Alarm Ringing" component.
        - [ ] Modify the notification handling logic to display the new UI and play sound.
    - [ ] ### Write & Run Tests
        - [ ] Create new unit/integration tests for the full-screen alarm flow.
        - [ ] Run all local tests by delegating to Gemini: `gemini --yolo "Run npm test and report any failures."`
    - [ ] ### Create PR
        - [ ] Once tests pass, delegate Git operations to Gemini: `gemini --yolo "Tests passed. Please commit these changes and create a PR against master."`
