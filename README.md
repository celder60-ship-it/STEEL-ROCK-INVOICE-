# Steel Rock Invoice — iPhone and Android

**One shared app design and one set of invoice functions on both platforms.** Edit the shared `web/index.html` to update both versions at the next build.

The invoice uses black-and-white pumpjack branding and the same invoice editor, one-page Letter-size preview, 18 line items, automatic 15% fuel surcharge on the first item, PST 5% (no GST), auto-incrementing invoice numbers from 03959, editable company and customer details, saved invoices, invoice deletion, JSON backup import/export, and PDF printing.

## Install the iPhone version
The GitHub Pages published version of `web/` works as an installable home-screen web app, including offline use after the first visit. In Safari, open https://celder60-ship-it.github.io/STEEL-ROCK-INVOICE-/ then use Share → Add to Home Screen. No ChatGPT login. This is **not** a signed IPA or App Store build.

## Build the Android APK
Every push to main triggers **Actions → Build Android APK**. Open the successful run, choose the `Steel-Rock-Invoice-APK` artifact, unzip it, then install `app-debug.apk`. The APK bundles all `web/` files offline and has native Print / Save as PDF and native Android file-picker JSON export/import. No sign-in or internet permission.

**Important upgrade note:** Before replacing an older Steel Rock Android APK, open the old app and export a backup. Existing data may use an older schema or be tied to a different debug-signing key; do not uninstall the old APK until invoices have been backed up. The importer accepts compatible older exports with `draft` instead of `current`, but unsupported older formats may require conversion.

Invoices are saved locally **per device**. Different employees do **not** share invoice sequences automatically. To move invoices, export a JSON backup and import it on the other device; there is no live multi-user sync.

## How both apps stay identical
`web/index.html` is the single shared interface and invoice business logic. `scripts/prepare_invoice.py` copies `web/` into the Android assets directory before compiling. The Android `MainActivity.java` loads those bundled assets, and routes print/export to Android's native print/file pickers. The GitHub Pages workflow publishes the exact same `web/` on iPhone.

## Development
- `Actions → Publish Steel Rock iPhone App` deploys the PWA.
- `Actions → Build Android APK` builds the Android debug app.
- The optional Capacitor configuration can be used to create a native Xcode iOS project on a Mac; Apple code signing is required for IPA/TestFlight/App Store distribution.

A one-page layout is designed for the supplied 18 rows and short descriptions. Excessively long descriptions may overflow printed cells and should be reviewed before sending.
