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
