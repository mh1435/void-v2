package com.mlbbhub.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    // True while the VOID app is on-screen. The wake-word service checks this so
    // "Okay VOID" only pops the floating voice pill when the app is CLOSED.
    public static volatile boolean IN_FOREGROUND = false;

    private String pendingSharedText = null;
    private boolean pendingWake = false;
    private String pendingWakeCmd = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingPlugin.class);
        registerPlugin(WakeWordPlugin.class);
        registerPlugin(SystemPlugin.class);
        super.onCreate(savedInstanceState);
        captureShare(getIntent());
        captureWake(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        captureShare(intent);
        captureWake(intent);
        attemptDeliverShare(0);
        attemptDeliverWake(0);
    }

    @Override
    public void onResume() {
        super.onResume();
        IN_FOREGROUND = true;
        attemptDeliverShare(0);
        attemptDeliverWake(0);
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
