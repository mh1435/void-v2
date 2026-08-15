package com.mlbbhub.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

public class MainActivity extends BridgeActivity {

    // True while the VOID app is on-screen. The wake-word service checks this so
    // "Okay VOID" only pops the floating voice pill when the app is CLOSED.
    public static volatile boolean IN_FOREGROUND = false;

    private String pendingSharedText = null;
    private boolean pendingWake = false;
    private String pendingWakeCmd = null;
    private String pendingAttach = null;
    private boolean pendingSong = false;
    private boolean pendingImageShare = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingPlugin.class);
        registerPlugin(WakeWordPlugin.class);
        registerPlugin(SystemPlugin.class);
        registerPlugin(VoidAccessibilityPlugin.class);
        registerPlugin(VoidContactsPlugin.class);
        registerPlugin(VoidWidgetPlugin.class);
        registerPlugin(CadencePlugin.class);
        super.onCreate(savedInstanceState);
        captureShare(getIntent());
        captureImageShare(getIntent());
        captureWake(getIntent());
        captureAttach(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        captureShare(intent);
        captureImageShare(intent);
        captureWake(intent);
        captureAttach(intent);
        attemptDeliverShare(0);
        attemptDeliverImageShare(0);
        attemptDeliverWake(0);
        attemptDeliverAttach(0);
        attemptDeliverSong(0);
    }

    @Override
    public void onResume() {
        super.onResume();
        IN_FOREGROUND = true;
        attemptDeliverShare(0);
        attemptDeliverImageShare(0);
        attemptDeliverWake(0);
        attemptDeliverAttach(0);
        attemptDeliverSong(0);
    }

    // A photo shared to VOID from Gallery/Camera/any app ("Share" → VOID).
    // Read off the main thread since decoding+base64-encoding a full-size
    // photo can take a noticeable moment.
    private void captureImageShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (type == null || !type.startsWith("image/")) return;
        Uri uri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
        if (uri == null) return;
        final String mime = type;
        new Thread(() -> {
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                if (in == null) return;
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                byte[] chunk = new byte[8192];
                int n;
                while ((n = in.read(chunk)) != -1) buf.write(chunk, 0, n);
                String b64 = Base64.encodeToString(buf.toByteArray(), Base64.NO_WRAP);
                PendingSharedImage.set(b64, mime);
                pendingImageShare = true;
                runOnUiThread(() -> attemptDeliverImageShare(0));
            } catch (Exception ignored) {
                // Unreadable/revoked URI — silently drop rather than leave a stuck flag.
            }
        }).start();
    }

    // Tell the web layer a shared image is ready. Retries like the other
    // share hooks, since app.js may not have finished loading yet.
    private void attemptDeliverImageShare(final int attempt) {
        if (!pendingImageShare || bridge == null) return;
        if (!PendingSharedImage.has()) { pendingImageShare = false; return; }
        final String b64Payload = JSONObject.quote(PendingSharedImage.base64);
        final String mimePayload = JSONObject.quote(PendingSharedImage.mimeType == null ? "image/jpeg" : PendingSharedImage.mimeType);
        bridge.getWebView().evaluateJavascript(
            "window.__voidReceiveImageShare?(window.__voidReceiveImageShare(" + b64Payload + "," + mimePayload + "),'ok'):'no'",
            value -> {
                if ("\"ok\"".equals(value)) {
                    pendingImageShare = false;
                    // Keep PendingSharedImage set (not cleared) — the wake-word
                    // voice pill can still answer questions about the same
                    // photo later even after it's landed in the chat.
                } else if (attempt < 20) {
                    bridge.getWebView().postDelayed(() -> attemptDeliverImageShare(attempt + 1), 800);
                }
            });
    }

    private void captureAttach(Intent intent) {
        if (intent == null) return;
        String kind = intent.getStringExtra("void_attach");
        if (kind != null && !kind.isEmpty()) pendingAttach = kind;
        if (intent.getBooleanExtra("void_song", false)) pendingSong = true;
    }

    // Voice pill song request → run VOID's in-app listener.
    private void attemptDeliverSong(final int attempt) {
        if (!pendingSong || bridge == null) return;
        bridge.getWebView().evaluateJavascript(
            "window.__voidSongId?(window.__voidSongId(),'ok'):'no'",
            value -> {
                if ("\"ok\"".equals(value)) {
                    pendingSong = false;
                } else if (attempt < 20) {
                    bridge.getWebView().postDelayed(() -> attemptDeliverSong(attempt + 1), 800);
                }
            });
    }

    // Voice pill "+" → open the app straight into the right attach picker.
    private void attemptDeliverAttach(final int attempt) {
        if (pendingAttach == null || bridge == null) return;
        final String payload = JSONObject.quote(pendingAttach);
        bridge.getWebView().evaluateJavascript(
            "window.__voidAttach?(window.__voidAttach(" + payload + "),'ok'):'no'",
            value -> {
                if ("\"ok\"".equals(value)) {
                    pendingAttach = null;
                } else if (attempt < 20) {
                    bridge.getWebView().postDelayed(() -> attemptDeliverAttach(attempt + 1), 800);
                }
            });
    }

    @Override
    public void onPause() {
        super.onPause();
        IN_FOREGROUND = false;
    }

    private void captureWake(Intent intent) {
        if (intent == null || !intent.getBooleanExtra("void_wake", false)) return;
        pendingWake = true;
        pendingWakeCmd = intent.getStringExtra("void_cmd");
    }

    // Tell the web layer the wake word fired (and pass anything said after it).
    private void attemptDeliverWake(final int attempt) {
        if (!pendingWake || bridge == null) return;
        final String payload = JSONObject.quote(pendingWakeCmd == null ? "" : pendingWakeCmd);
        bridge.getWebView().evaluateJavascript(
            "window.__voidWake?(window.__voidWake(" + payload + "),'ok'):'no'",
            value -> {
                if ("\"ok\"".equals(value)) {
                    pendingWake = false;
                    pendingWakeCmd = null;
                } else if (attempt < 20) {
                    bridge.getWebView().postDelayed(() -> attemptDeliverWake(attempt + 1), 800);
                }
            });
    }

    private void captureShare(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        if (!"text/plain".equals(intent.getType())) return;
        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text != null && !text.trim().isEmpty()) pendingSharedText = text.trim();
    }

    // The WebView loads the remote app, so on cold starts the JS handler may not
    // exist yet — retry until app.js confirms receipt (up to ~16s).
    private void attemptDeliverShare(final int attempt) {
        if (pendingSharedText == null || bridge == null) return;
        final String payload = JSONObject.quote(pendingSharedText);
        bridge.getWebView().evaluateJavascript(
            "window.__voidReceiveShare?(window.__voidReceiveShare(" + payload + "),'ok'):'no'",
            value -> {
                if ("\"ok\"".equals(value)) {
                    pendingSharedText = null;
                } else if (attempt < 20) {
                    bridge.getWebView().postDelayed(() -> attemptDeliverShare(attempt + 1), 800);
                }
            });
    }
}
