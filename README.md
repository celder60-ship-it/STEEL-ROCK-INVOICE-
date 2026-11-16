# Steel Rock Invoice for Android

Offline Android wrapper for the 18-row invoice with PST fixed at 5%, no GST, and the existing 15% fuel surcharge. Company information and images are bundled. No login or internet permission.

## Build through GitHub
Push changes to main to trigger a build.
Open Actions > Build Android APK. After it succeeds, download Steel-Rock-Invoice-APK, extract the ZIP, and install app-debug.apk.
You can also run it manually using Run workflow.
GitHub Actions availability and account limits apply.

This is an installable debug build, not a Play Store release. Each clean build may have a different debug signing key. Export invoice backups before replacing or uninstalling the app. A stable release key is needed for ongoing upgrade distribution.

## Using the app
- Save invoice stores records inside the app on this device.
- Print / Save PDF opens Android's print dialog; choose Save as PDF.
- Export backup opens Android's file picker for a JSON backup.
- Import backup opens Android's file picker and replaces local data after confirmation.
- Existing browser invoices do not move automatically: export from the browser app, then import here.
- Devices have separate invoice lists and number sequences; there is no shared counter.
- Extra rows or long descriptions can require more than one printed page.

The build downloads the reviewed invoice HTML from a fixed URL and verifies its SHA-256 before packaging it. The installed app works offline.

## Status
Source prepared; Android compilation and device testing pending the first GitHub Actions run.
