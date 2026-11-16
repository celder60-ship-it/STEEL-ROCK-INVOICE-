"""Fetch the exact reviewed invoice, verify it, and add Android print/backup hooks."""
from pathlib import Path
import hashlib
import subprocess

url = "https://d2ol7oe51mr4n9.cloudfront.net/user_3LCr1wkQuRvYbQtlwCA7McZeotK/dd96c34a-797c-47e0-b1a9-c90e75d85b08.html"
target = Path("app/src/main/assets/index.html")
target.parent.mkdir(parents=True, exist_ok=True)
subprocess.run(["curl", "--fail", "--location", "--silent", "--show-error", "--retry", "3", url, "--output", str(target)], check=True)
data = target.read_bytes()
expected = "36fb72a580f6878eeba3bbad85551aab900d9d96507cec59336949d69f5188c5"
if hashlib.sha256(data).hexdigest() != expected:
    raise SystemExit("Invoice checksum mismatch; refusing to build unreviewed content")
html = data.decode("utf-8")
old = "window.print();if(beforeBlank){current=beforeBlank;beforeBlank=null;render()}"
new = "window.addEventListener('afterprint',()=>{if(beforeBlank){current=beforeBlank;beforeBlank=null;render()}},{once:true});window.print()"
assert old in html
html = html.replace(old, new)
bridge = """<script>
window.print=()=>InvoiceAndroid.printInvoice();
document.querySelector('#backup').onclick=()=>{db.draft=current;InvoiceAndroid.saveBackup(JSON.stringify(db,null,2));};
</script>"""
html = html.replace("</body>", bridge + "</body>")
assert "PST 5%" in html and "GST / HST" not in html and "length:18" in html
target.write_text(html, encoding="utf-8")
print("Verified and prepared 18-row invoice with 5% PST.")
