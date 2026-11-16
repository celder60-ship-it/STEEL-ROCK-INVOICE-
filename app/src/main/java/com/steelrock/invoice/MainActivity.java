package com.steelrock.invoice;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.print.*;
import android.webkit.*;
import android.view.*;
import android.widget.Toast;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private String pendingBackup;
    private static final String ORIGIN = "https://invoice.local/";
    private static final int IMPORT = 100, EXPORT = 101;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        web.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(true);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.addJavascriptInterface(new Bridge(), "InvoiceAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"invoice.local".equals(request.getUrl().getHost());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"https".equals(uri.getScheme()) || !"invoice.local".equals(uri.getHost())) {
                    return emptyResponse();
                }
                String path = uri.getPath();
                if (path == null || path.equals("/")) path = "/index.html";
                if (path.startsWith("/")) path = path.substring(1);
                // Strict allowlist protects the Android bundled assets from path traversal.
                if (path.isEmpty() || path.contains("..") || !path.matches("[A-Za-z0-9_./-]+")) {
                    return emptyResponse();
                }
                try {
                    String lower = path.toLowerCase(Locale.ROOT);
                    String mime = "application/octet-stream";
                    if (lower.endsWith(".html")) mime = "text/html";
                    else if (lower.endsWith(".svg")) mime = "image/svg+xml";
                    else if (lower.endsWith(".png")) mime = "image/png";
                    else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) mime = "image/jpeg";
                    else if (lower.endsWith(".js")) mime = "application/javascript";
                    else if (lower.endsWith(".css")) mime = "text/css";
                    else if (lower.endsWith(".webmanifest") || lower.endsWith(".json")) mime = "application/json";
                    return new WebResourceResponse(mime, "UTF-8", getAssets().open(path));
                } catch (IOException e) { return emptyResponse(); }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message)
                    .setPositiveButton("Continue", (d, w) -> result.confirm())
                    .setNegativeButton("Cancel", (d, w) -> result.cancel())
                    .setOnCancelListener(d -> result.cancel()).show();
                return true;
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                try { startActivityForResult(intent, IMPORT); }
                catch (ActivityNotFoundException e) { chooser.onReceiveValue(null); chooser = null; return false; }
                return true;
            }
        });
        web.loadUrl(ORIGIN + "index.html");
    }

    private static WebResourceResponse emptyResponse() {
        return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
    }
    private class Bridge {
        @JavascriptInterface public void printInvoice() { runOnUiThread(() -> printDocument()); }
        @JavascriptInterface public void saveBackup(String data) {
            if (data == null || data.length() > 10000000) return;
            runOnUiThread(() -> {
                if (pendingBackup != null) return;
                pendingBackup = data;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, "Steel-Rock-Invoices-Backup.json");
                try { startActivityForResult(intent, EXPORT); }
                catch (ActivityNotFoundException e) { pendingBackup = null; message("No file picker available."); }
            });
        }
    }

    private void printDocument() {
        PrintManager manager = (PrintManager)getSystemService(PRINT_SERVICE);
        if (manager == null) { finishPrint(); return; }
        PrintDocumentAdapter delegate = web.createPrintDocumentAdapter("Steel Rock Invoice");
        PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
            @Override public void onStart() { delegate.onStart(); }
            @Override public void onLayout(PrintAttributes oldAttrs, PrintAttributes newAttrs,
                    CancellationSignal signal, LayoutResultCallback callback, Bundle extras) {
                delegate.onLayout(oldAttrs, newAttrs, signal, callback, extras);
            }
            @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                    CancellationSignal signal, WriteResultCallback callback) {
                delegate.onWrite(pages, destination, signal, callback);
            }
            @Override public void onFinish() { delegate.onFinish(); finishPrint(); }
        };
        manager.print("Steel Rock Invoice", adapter, new PrintAttributes.Builder()
            .setMediaSize(PrintAttributes.MediaSize.NA_LETTER).build());
    }
    private void finishPrint() {
        runOnUiThread(() -> web.evaluateJavascript("window.dispatchEvent(new Event('afterprint'))", null));
    }
    private void message(String text) { Toast.makeText(this, text, Toast.LENGTH_LONG).show(); }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == IMPORT && chooser != null) {
            chooser.onReceiveValue(result == RESULT_OK && data != null && data.getData() != null
                ? new Uri[]{data.getData()} : null);
            chooser = null;
        }
        if (request == EXPORT) {
            String backup = pendingBackup;
            pendingBackup = null;
            if (result == RESULT_OK && data != null && data.getData() != null && backup != null) {
                try (OutputStream out = getContentResolver().openOutputStream(data.getData(), "wt")) {
                    if (out == null) throw new IOException("No output stream");
                    out.write(backup.getBytes(StandardCharsets.UTF_8));
                    message("Backup saved.");
                } catch (IOException e) { message("Could not save backup. Please try again."); }
            }
        }
    }
    @Override public void onBackPressed() {
        new AlertDialog.Builder(this).setMessage("Close invoice app? Your draft stays saved.")
            .setPositiveButton("Close", (d, w) -> finish()).setNegativeButton("Stay", null).show();
    }
}
