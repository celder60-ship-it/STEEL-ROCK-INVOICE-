/* Steel Rock native iPhone bridge.
 * The web app and Android APK continue to use their existing print/backup.
 * No credentials or remote server are needed.
 */
(function () {
  'use strict';
  const cap = window.Capacitor;
  if (!cap || cap.getPlatform?.() !== 'ios' || typeof cap.nativePromise !== 'function') return;

  const native = (plugin, method, args = {}) => cap.nativePromise(plugin, method, args);

  window.print = function printSteelRockInvoice() {
    native('Printer', 'printWebView', { name: 'Steel Rock Invoice' })
      .catch(error => {
        console.error('Native iOS print error', error);
        alert('Could not open iPhone printing. Please try again.');
      })
      .finally(() => window.dispatchEvent(new Event('afterprint')));
  };

  const backup = document.querySelector('#backup');
  if (!backup) return;
  backup.onclick = async function exportSteelRockBackup() {
    try {
      db.draft = current;
      const date = new Date().toISOString().slice(0, 10);
      const filename = 'Steel-Rock-Invoice-Backup-' + date + '.json';
      const file = await native('Filesystem', 'writeFile', {
        path: filename,
        data: JSON.stringify(db, null, 2),
        directory: 'CACHE',
        encoding: 'utf8'
      });
      await native('Share', 'share', {
        title: 'Steel Rock Invoice backup',
        text: 'Save this invoice backup in Files for safekeeping.',
        files: [file.uri],
        dialogTitle: 'Save Steel Rock backup'
      });
    } catch (error) {
      console.error('iPhone backup export error', error);
      alert('Unable to export the backup. Your invoices are still saved in the app.');
    }
  };
})();
