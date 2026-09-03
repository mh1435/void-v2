package com.mlbbhub.app;

import android.content.Context;
import android.content.SharedPreferences;

/** Whether the auto-reply feature is turned on. Persisted natively since
 *  onNotificationPosted() fires with no JS/WebView involvement and needs to
 *  check this synchronously on every notification. */
final class AutoReplyPrefs {

    private static final String PREFS = "void_autoreply_prefs";
    private static final String KEY_ENABLED = "enabled";

    private AutoReplyPrefs() {}

    static boolean isEnabled(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY_ENABLED, false);
    }

    static void setEnabled(Context ctx, boolean enabled) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }
}
