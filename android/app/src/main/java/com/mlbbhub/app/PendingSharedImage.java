package com.mlbbhub.app;

/**
 * Holds the most recently shared-to-VOID image (base64 + mime type) so both
 * MainActivity (delivers it into the WebView chat) and FloatingService (lets
 * the wake-word voice pill answer questions about it while the app is
 * closed) can read the same data. Same-process static state — fine here
 * since neither component runs in a separate `:process`.
 */
final class PendingSharedImage {
    static volatile String base64;
    static volatile String mimeType;

    static void set(String data, String mime) {
        base64 = data;
        mimeType = mime;
    }

    static boolean has() {
        return base64 != null && !base64.isEmpty();
    }

    static void clear() {
        base64 = null;
        mimeType = null;
    }

    private PendingSharedImage() {}
}
