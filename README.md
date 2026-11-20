# Steel Rock Invoice — iPhone and Android

The iPhone app uses the **original Android APK invoice-page layout**, with an editable invoice form rather than a separate editor and preview. The form includes the black Steel Rock logo header, side branding, diagonal pumpjack watermark, and 18 compact invoice rows.

Both versions support automatic invoice numbering beginning at **03959**, a 15% fuel surcharge based on line one, **5% PST only** (no GST), editable company and customer details, saved invoices, backups, and PDF printing.

## iPhone installation

1. On your iPhone, open https://celder60-ship-it.github.io/STEEL-ROCK-INVOICE-/ using **Safari**.
2. If you installed a previous version, close it and reopen the site. If an old layout persists, refresh Safari (the new service worker cache is versioned).
3. Tap Safari **Share → Add to Home Screen**. This installs the web app without a ChatGPT sign-in; this is not a signed App Store IPA.

In the new layout you **edit directly in the invoice**, as in the original Android APK. On iPhone, the wide paper form can be scrolled sideways to enter all fields; print layout is Letter size.

**Existing iPhone invoices:** the app automatically copies invoices from the previous `steel-rock-invoices-v1` local store into the restored layout's `field-invoice-v1` store when there is no existing restored-layout data. It leaves the previous store untouched. Export a backup before uninstalling or clearing browser data.

## Android APK

Every push to `main` triggers **Actions → Build Android APK**. Open the successful run, download the **Steel-Rock-Invoice-APK** artifact, extract the ZIP and install `app-debug.apk`. The APK packages the same offline `web/index.html` layout; Android supplies native print/PDF and file backup controls.

**Back up the old Android app before upgrading.** Debug-signing changes may prevent an in-place upgrade and removing an app can erase its local data. Never uninstall before exporting invoices.

## Shared application behavior

- 18 editable invoice lines, including an automatic fuel surcharge on line 2.
- 5% PST only, no GST.
- Company name, address, telephone, email and tax number.
- Saved invoice list, new invoices, duplicates and deletion.
- Invoice PDF printing and JSON backup import/export.

Saved invoices and invoice-number sequences are **per device**, not shared live between employees. An exported backup can be imported to move data, but this does not provide multi-user synchronization.

The GitHub Pages workflow deploys `web/` for iPhone; `scripts/prepare_invoice.py` packages that same source into the Android APK. Capacitor/Xcode signing is required if you want a native App Store iOS application.


## Deleting invoice lines and one-page totals

In both iPhone and Android versions:
- Tap the **red × to the left** of any line to remove it, or select **− Delete last line**.
- Line count updates immediately, the invoice re-calculates, and deleted lines are not automatically added back when you save/reopen it.
- If you delete the automatic fuel line, **＋ Add 15% fuel line** restores it.
- **Subtotal, PST 5%, and Total Due (CAD)** stay in a box at the bottom of the Letter-size invoice, even when you remove rows. GST is not charged.
- Printing uses a single Letter-size page. If you add more than 24 lines or unusually long descriptions, the app warns before printing because that much content may be clipped. Review the print preview before delivering the invoice.


## Native iPhone iOS app (.ipa)

**Build source:** `package.json` + `capacitor.config.json` + `web/` are wrapped into the native **Steel Rock Invoice** app using Capacitor 7. Its bundle ID is `ca.steelrock.invoices`.

**Automatic iOS build:** Open **Actions → Build Steel Rock iPhone IPA (unsigned)**. Each build runs on a GitHub macOS runner and produces:
- `Steel-Rock-iPhone-UNSIGNED-IPA`: contains an **unsigned** `.ipa` for signing/sideloading; **cannot be installed directly** by tapping the file.
- `Steel-Rock-iOS-Xcode-Source`: native Xcode project and app source for local Apple signing.

**Install to a personal iPhone with a Mac:** Download the Xcode source ZIP, extract, run `npm install` from its root if needed, open `ios/App/App.xcworkspace` in Xcode, choose the App target → Signing & Capabilities → your Apple Team, connect the iPhone, select it, and run. Xcode can use a free personal Apple Account for limited device testing; App Store/TestFlight distribution requires suitable Apple Developer membership and signing. **Do not put Apple credentials or certificate passwords in GitHub source code.**

The native iOS app keeps the existing 18-line original invoice format, per-line delete buttons, bottom-aligned subtotal/PST/total, 15% fuel surcharge, 5% PST and no GST. Its native iPhone bridge calls the iOS print dialog and exports JSON backups to Files via the iPhone share sheet. Native print/export should be tested on an actual device.

**Data warning:** The native iOS app and Safari/Home Screen web app use **different local storage containers**. Before switching to a native version, **Export backup** from your existing web app; use **Import backup** in the native app to move invoices. Do not delete existing app data until verified.

**Simplest no-signing option:** Continue to use the iPhone Home Screen app at https://celder60-ship-it.github.io/STEEL-ROCK-INVOICE-/ → Safari Share → Add to Home Screen. This still provides offline invoice work but is not a separately signed IPA.


## Save PDF / Save Image (PNG)

All versions now share two offline invoice export buttons. **Save PDF** creates a single US Letter (8.5 × 11 inch) image-based PDF. **Save Image (PNG)** creates a sharp 2550 × 3300 pixel image. Both exports use the current invoice's company logo, watermark, editable fields, line amounts and calculated tax totals; no app menus, edit buttons or browser bars are included. The PDF uses a high-resolution embedded JPEG sheet (text is not selectable). Excessively long content is rejected rather than silently clipped.

On Android, choose a folder and filename in the system file picker. In the native iPhone app, choose Save to Files or another available share-sheet action. Safari/Home Screen uses a browser file download. Save invoice remains the editable local record; PDF/PNG export does not replace JSON backup. Native iOS install requires Apple signing, and app installation/printing/export needs on-device verification.

The "Test invoice PDF and PNG exports" GitHub Actions workflow checks mobile browser downloads, calculation accuracy, one-page PDF size, and PNG pixel dimensions.


## Steel Rock Timesheet & Logbook (separate app)

Open https://celder60-ship-it.github.io/STEEL-ROCK-INVOICE-/timesheet/ and install using Safari Share → Add to Home Screen (or Android browser Install app, where supported). No login is required. Daily records are stored locally, with weekly Monday–Sunday totals, overnight shifts, breaks, extra travel hours, kilometres, job/site/unit and work description. Travel is additional time outside the recorded work shift. Entries can be edited/deleted; PDF supports multiple pages, PNG is available for single-page reports, CSV for spreadsheets, and JSON backup for transferring records. Typed confirmation is not a verified signature. This is a timesheet, not certified driver ELD or payroll/overtime software. Keep backups; employees do not automatically sync.

GitHub Actions → **Build Steel Rock Timesheet apps** produces a separate Android APK (com.steelrock.timesheet) and an unsigned iOS IPA (ca.steelrock.timesheet). Those builds do not replace Steel Rock Invoice. The IPA requires Apple signing. Web and native devices have independent local data.
