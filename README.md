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


---

## iPhone / iOS version

A new offline-capable iPhone invoice app is available in the [web/](web/) folder. It uses the same Steel Rock invoice requirements: 18 rows, number 03959 onward, a 15% surcharge on the first charge, 5% PST only (no GST), one-page Letter invoice print/PDF, and an angled black pumpjack watermark.

**Install without an Apple Developer account:** Under this repository's **Settings → Pages**, choose **GitHub Actions** as the publishing source. Once the *Publish Steel Rock iPhone App* workflow deploys, open the Pages URL in **Safari** on the iPhone. Choose **Share → Add to Home Screen → Open as Web App → Add**.

Invoices save locally and work without a ChatGPT sign-in. Use **Print / PDF** followed by **Save to Files** to save an invoice PDF in a phone folder. Use **Export backup** regularly. Invoices and number sequences are not automatically shared across employee devices.

For a **native iOS app**, on a Mac with Xcode run:

```bash
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Sign in Xcode with your Apple development team to install or publish via TestFlight/App Store. A signed IPA is not produced by this repository's web workflow.
