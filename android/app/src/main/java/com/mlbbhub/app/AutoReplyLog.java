package com.mlbbhub.app;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Auto-reply events (sent, or skipped and why) captured while the WebView
 *  wasn't around to log them via the JS-side Activity Log — drained and
 *  replayed into logActivity() next time the app is open, the same "queue
 *  now, apply on next open" shape as Cadence's own PendingStore.java. */
final class AutoReplyLog {

    private static final String PREFS = "void_autoreply_log";
    private static final String KEY = "entries";
    private static final int MAX = 50;
    private static final Object LOCK = new Object();

    private AutoReplyLog() {}

    static void add(Context ctx, String text) {
        synchronized (LOCK) {
            JSONArray arr = read(ctx);
            JSONObject entry = new JSONObject();
            try {
                entry.put("time", System.currentTimeMillis());
                entry.put("text", text);
                arr.put(entry);
            } catch (JSONException ignored) {
                return;
            }
            while (arr.length() > MAX) arr.remove(0);
            write(ctx, arr);
        }
    }

    /** Returns everything queued and empties the queue. */
    static JSONArray drain(Context ctx) {
        synchronized (LOCK) {
            JSONArray arr = read(ctx);
            write(ctx, new JSONArray());
            return arr;
        }
    }

    private static JSONArray read(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = p.getString(KEY, "[]");
        try { return new JSONArray(raw); } catch (JSONException e) { return new JSONArray(); }
    }

    private static void write(Context ctx, JSONArray arr) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, arr.toString()).apply();
    }
}
