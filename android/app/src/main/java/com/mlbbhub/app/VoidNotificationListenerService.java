package com.mlbbhub.app;

import android.app.Notification;
import android.app.PendingIntent;
import android.app.RemoteInput;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.ArrayList;
import java.util.List;

/**
 * "Read my notifications" needs a completely separate Android permission
 * from the Accessibility service (Notification access, granted the same
 * manual way in Settings) — this just keeps the currently-active
 * notifications available for VoidAccessibilityPlugin.notifications() to
 * read; it doesn't act on them.
 *
 * onNotificationPosted() below is the one place this DOES act: the
 * auto-reply feature. It only fires when AutoReplyPrefs says the user
 * turned it on, and only for notifications that carry their own quick-reply
 * RemoteInput action — most messaging apps (WhatsApp, SMS, Telegram,
 * Signal, Instagram) already expose one on their own notifications, so this
 * is also the natural "is this actually a message" filter: no hardcoded
 * per-app allowlist needed, and nothing with a plain "OK"/dismiss action
 * (a shipping update, a calendar alert) ever qualifies.
 */
public class VoidNotificationListenerService extends NotificationListenerService {

    private static VoidNotificationListenerService INSTANCE;

    public static VoidNotificationListenerService getInstance() { return INSTANCE; }
    public static boolean isRunning() { return INSTANCE != null; }

    @Override
    public void onListenerConnected() { INSTANCE = this; }

    @Override
    public void onListenerDisconnected() { if (INSTANCE == this) INSTANCE = null; }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !AutoReplyPrefs.isEnabled(this)) return;
        if (getPackageName().equals(sbn.getPackageName())) return; // never reply to our own notifications

        Notification n = sbn.getNotification();
        if (n == null || n.actions == null) return;
        Notification.Action replyAction = null;
        RemoteInput replyInput = null;
        for (Notification.Action action : n.actions) {
            RemoteInput[] inputs = action.getRemoteInputs();
            if (inputs == null) continue;
            for (RemoteInput ri : inputs) { replyAction = action; replyInput = ri; break; }
            if (replyAction != null) break;
        }
        if (replyAction == null || replyInput == null) return; // no quick-reply action = not a repliable message

        Bundle extras = n.extras;
        CharSequence textCs = extras != null ? extras.getCharSequence(Notification.EXTRA_TEXT) : null;
        if (textCs == null || textCs.toString().trim().isEmpty()) return;
        final String message = textCs.toString();

        final String conversationKey = sbn.getPackageName() + ":" + sbn.getKey();
        if (!AutoReplyCooldown.shouldReply(this, conversationKey)) return;
        if (AutoReplyFilters.looksSensitive(this, message)) {
            AutoReplyLog.add(this, "Skipped a sensitive-looking message from " + sbn.getPackageName() + " — left for you to answer.");
            return;
        }

        final Notification.Action finalAction = replyAction;
        final RemoteInput finalInput = replyInput;
        final android.content.Context ctx = getApplicationContext();
        new Thread(() -> {
            String reply = AutoReplyAI.generateReply(ctx, message);
            if (reply == null) return; // network/AI failure — silently skip, nothing to send
            if (!AutoReplyFilters.isSafe(ctx, reply)) {
                AutoReplyLog.add(ctx, "Blocked a generated reply that didn't pass the safety check.");
                return;
            }
            try {
                Bundle b = new Bundle();
                b.putCharSequence(finalInput.getResultKey(), reply);
                Intent local = new Intent();
                RemoteInput.addResultsToIntent(new RemoteInput[]{finalInput}, local, b);
                finalAction.actionIntent.send(ctx, 0, local);
                AutoReplyCooldown.markReplied(ctx, conversationKey);
                AutoReplyLog.add(ctx, "Auto-replied to " + sbn.getPackageName() + ": \"" + reply + "\"");
            } catch (PendingIntent.CanceledException e) {
                AutoReplyLog.add(ctx, "Couldn't send an auto-reply to " + sbn.getPackageName() + " — the reply action was no longer valid.");
            }
        }).start();
    }

    public static class NotifSnapshot {
        public String appPackage, title, text;
        public long postTime;
    }

    /** Current notifications, newest first. `appFilter` (a package name
     *  fragment or app label the caller typed) narrows it down when given. */
    public List<NotifSnapshot> currentNotifications(String appFilter) {
        List<NotifSnapshot> out = new ArrayList<>();
        StatusBarNotification[] active;
        try { active = getActiveNotifications(); } catch (Exception e) { return out; }
        if (active == null) return out;
        String filter = appFilter == null ? "" : appFilter.trim().toLowerCase(java.util.Locale.ROOT);
        for (StatusBarNotification sbn : active) {
            if (sbn == null) continue;
            // Skip VOID's own persistent service notifications (wake word / floating pill).
            if (getPackageName().equals(sbn.getPackageName())) continue;
            if (!filter.isEmpty() && !sbn.getPackageName().toLowerCase(java.util.Locale.ROOT).contains(filter)) continue;
            Notification n = sbn.getNotification();
            if (n == null) continue;
            Bundle extras = n.extras;
            CharSequence title = extras != null ? extras.getCharSequence(Notification.EXTRA_TITLE) : null;
            CharSequence text = extras != null ? extras.getCharSequence(Notification.EXTRA_TEXT) : null;
            if (title == null && text == null) continue; // group summaries / silent entries
            NotifSnapshot s = new NotifSnapshot();
            s.appPackage = sbn.getPackageName();
            s.title = title == null ? "" : title.toString();
            s.text = text == null ? "" : text.toString();
            s.postTime = sbn.getPostTime();
            out.add(s);
        }
        out.sort((a, b) -> Long.compare(b.postTime, a.postTime));
        return out;
    }
}
