package com.mlbbhub.app;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Loads android/app/src/main/assets/auto_reply_restrictions.json once and
 *  checks incoming/outgoing text against it — the automated safety gate the
 *  auto-reply feature runs before ever sending anything, in place of a
 *  manual per-message review step. */
final class AutoReplyFilters {

    private static final String ASSET = "auto_reply_restrictions.json";

    private static volatile boolean loaded = false;
    private static List<String> sensitiveInput = new ArrayList<>();
    private static List<String> bannedOutput = new ArrayList<>();
    private static int cooldownSeconds = 45;
    private static int maxReplyWords = 25;

    private AutoReplyFilters() {}

    private static synchronized void ensureLoaded(Context ctx) {
        if (loaded) return;
        try (InputStream in = ctx.getAssets().open(ASSET)) {
            BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            JSONObject o = new JSONObject(sb.toString());
            sensitiveInput = toList(o.optJSONArray("sensitiveInputKeywords"));
            bannedOutput = toList(o.optJSONArray("bannedOutputWords"));
            cooldownSeconds = o.optInt("cooldownSeconds", 45);
            maxReplyWords = o.optInt("maxReplyWords", 25);
        } catch (IOException | org.json.JSONException e) {
            // Fall back to the built-in defaults above — never crash the listener over a bad/missing asset.
        }
        loaded = true;
    }

    private static List<String> toList(JSONArray arr) {
        List<String> out = new ArrayList<>();
        if (arr == null) return out;
        for (int i = 0; i < arr.length(); i++) out.add(arr.optString(i, "").toLowerCase(Locale.ROOT));
        return out;
    }

    /** True if the INCOMING message looks sensitive enough that VOID should
     *  leave it for the user rather than auto-replying with a joke. */
    static boolean looksSensitive(Context ctx, String incoming) {
        ensureLoaded(ctx);
        if (incoming == null) return false;
        String low = incoming.toLowerCase(Locale.ROOT);
        for (String kw : sensitiveInput) if (!kw.isEmpty() && low.contains(kw)) return true;
        return false;
    }

    /** True if VOID's own generated reply is clear to send. */
    static boolean isSafe(Context ctx, String reply) {
        ensureLoaded(ctx);
        if (reply == null || reply.trim().isEmpty()) return false;
        String low = reply.toLowerCase(Locale.ROOT);
        for (String w : bannedOutput) if (!w.isEmpty() && low.contains(w)) return false;
        return true;
    }

    static int cooldownSeconds(Context ctx) { ensureLoaded(ctx); return cooldownSeconds; }
    static int maxReplyWords(Context ctx) { ensureLoaded(ctx); return maxReplyWords; }
}
