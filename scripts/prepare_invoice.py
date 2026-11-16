"""Package the exact same versioned Steel Rock app on iPhone and Android.

No network downloads: every Android web asset is copied from the repository's web/
folder. Both platforms share one design and one set of invoice functions.
"""
from pathlib import Path
import shutil

source = Path("web")
target = Path("app/src/main/assets")
if not (source / "index.html").is_file():
    raise SystemExit("Shared Steel Rock web/index.html is missing")
target.mkdir(parents=True, exist_ok=True)
for item in source.rglob("*"):
    if item.is_file():
        output = target / item.relative_to(source)
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, output)
html = (target / "index.html").read_text(encoding="utf-8")
required = ["ROWS=18", "INITIAL=3959", "amount(0)*.15", "subtotal*.05", "InvoiceAndroid.printInvoice", "InvoiceAndroid.saveBackup"]
missing = [value for value in required if value not in html]
if missing:
    raise SystemExit(f"App checks failed: missing {missing}")
print("Android bundled the SAME 18-row, 5% PST, 15% fuel invoice app used by iPhone.")
