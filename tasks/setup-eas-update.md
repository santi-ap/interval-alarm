# Task: Set Up EAS Update for Expo Go (no PC needed)

## Goal
Publish the JS bundle to Expo's CDN so Expo Go can load the app remotely without a running dev server.

## Steps

- [x] 0. Create task file *(this file)*
- [x] 1. Create an Expo account at https://expo.dev/signup
- [x] 2. Install EAS CLI: `npm install -g eas-cli` *(eas-cli/18.3.0)*
- [x] 3. Log in: `eas login`
- [x] 4. Add `owner` field to `app.json` *(santi_ap)*
- [x] 5. Run `eas build:configure` to generate `eas.json`
- [x] 6. Publish first update: `eas update --branch production --message "initial publish"`
- [x] 7. Open in Expo Go on phone (scan QR or enter URL)

## Notes
- Username from step 1 is needed for step 4
- `eas build:configure` auto-generates `eas.json`
- Future updates: `eas update --branch production --message "describe change"`
