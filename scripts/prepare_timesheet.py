"""Prepare separate timesheet APK without modifying the committed invoice app."""
from pathlib import Path
import shutil

assets=Path('app/src/main/assets')
if assets.exists(): shutil.rmtree(assets)
shutil.copytree('web/timesheet',assets)
gradle=Path('app/build.gradle')
s=gradle.read_text()
assert "applicationId 'com.steelrock.invoice'" in s
gradle.write_text(s.replace("applicationId 'com.steelrock.invoice'","applicationId 'com.steelrock.timesheet'"))
manifest=Path('app/src/main/AndroidManifest.xml')
manifest.write_text(manifest.read_text().replace('Steel Rock Invoice','Steel Rock Timesheet'))
java=Path('app/src/main/java/com/steelrock/invoice/MainActivity.java')
s=java.read_text()
assert 'Invoice-[A-Za-z0-9_-]{1,80}' in s
s=s.replace('Invoice-[A-Za-z0-9_-]{1,80}','Timesheet-[A-Za-z0-9_-]{1,80}').replace('(pdf|png)','(pdf|png|csv)')
assert '"image/png".equals(mime) && name.endsWith(".png")' in s
s=s.replace('"image/png".equals(mime) && name.endsWith(".png")','"image/png".equals(mime) && name.endsWith(".png") ||\n                "text/csv".equals(mime) && name.endsWith(".csv")')
s=s.replace('Steel-Rock-Invoices-Backup.json','Steel-Rock-Timesheet-Backup.json').replace('Steel Rock Invoice','Steel Rock Timesheet').replace('Close invoice app?','Close timesheet app?')
java.write_text(s)
print('Prepared separate offline timesheet app (com.steelrock.timesheet)')
