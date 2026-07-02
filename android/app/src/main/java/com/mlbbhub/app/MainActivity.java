package com.mlbbhub.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private String pendingSharedText = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingPlugin.class);
        super.onCreate(savedInstanceState);
        captureShare(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        captureShare(intent);
        attemptDeliverShare(0);
    }

    @Override
    public void onResume() {
        super.onResume();
        attemptDeliverShare(0);
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
