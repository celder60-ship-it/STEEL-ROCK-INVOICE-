"""Package the same Steel Rock invoice layout for iPhone and Android.

Both versions use web/index.html, the restored directly editable, original
Android APK form. No online fetch or ChatGPT login is required.
"""
from pathlib import Path
import shutil

source=Path("web")
target=Path("app/src/main/assets")
if not (source/"index.html").is_file():
    raise SystemExit("Missing shared web/index.html")
target.mkdir(parents=True,exist_ok=True)
for item in source.rglob("*"):
    if item.is_file():
        output=target/item.relative_to(source)
        output.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(item,output)
html=(target/"index.html").read_text(encoding="utf-8")
required=["class=\"paper-head\"","id=\"rows\"","length:18","fuel15","0.15","subtotal","pst","InvoiceAndroid.printInvoice","InvoiceAndroid.saveBackup","migrateModernSavedInvoices"]
missing=[value for value in required if value not in html]
if missing:
    raise SystemExit(f"Invoice verification failed; missing: {missing}")
print("Bundled restored original APK-style invoice form with 18 rows, 15% fuel surcharge and 5% PST.")
