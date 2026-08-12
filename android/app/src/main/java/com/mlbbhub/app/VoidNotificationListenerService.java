package com.mlbbhub.app;

import android.app.Notification;
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
 */
public class VoidNotificationListenerService extends NotificationListenerService {

    private static VoidNotificationListenerService INSTANCE;

    public static VoidNotificationListenerService getInstance() { return INSTANCE; }
    public static boolean isRunning() { return INSTANCE != null; }

    @Override
    public void onListenerConnected() { INSTANCE = this; }

    @Override
    public void onListenerDisconnected() { if (INSTANCE == this) INSTANCE = null; }

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
