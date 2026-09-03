package com.mlbbhub.app;

import android.content.Context;
import android.content.SharedPreferences;

/** Per-conversation cooldown — loop-prevention, not a review gate. If the
 *  other side also runs an auto-reply bot, this stops the two from
 *  rapid-firing each other rather than adding any human confirmation step. */
final class AutoReplyCooldown {

    private static final String PREFS = "void_autoreply_cooldown";

    private AutoReplyCooldown() {}

    static boolean shouldReply(Context ctx, String conversationKey) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long last = p.getLong(conversationKey, 0L);
        long cooldownMs = AutoReplyFilters.cooldownSeconds(ctx) * 1000L;
        return System.currentTimeMillis() - last >= cooldownMs;
    }

    static void markReplied(Context ctx, String conversationKey) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putLong(conversationKey, System.currentTimeMillis()).apply();
    }
}
