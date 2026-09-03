package com.mlbbhub.app;

import android.content.Intent;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

/**
 * JS-facing bridge to VoidAccessibilityService — device navigation,
 * gestures, screenshots, screen reading, click-by-description, and
 * auto-fill. Every method no-ops with ok:false when the service isn't
 * running yet (the user has to manually enable it once, in Settings).
 */
@CapacitorPlugin(name = "VoidAccessibility")
public class VoidAccessibilityPlugin extends Plugin {

    private VoidAccessibilityService svc() { return VoidAccessibilityService.getInstance(); }

    private void notEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ok", false);
        ret.put("error", "NOT_ENABLED");
        call.resolve(ret);
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", VoidAccessibilityService.isRunning());
        call.resolve(ret);
    }

    /** Deep-links to Android's Accessibility settings list; the user taps
     *  "VOID Device Control" and flips it on themselves — Android does not
     *  allow any app to grant this permission to itself. */
    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private void okOrFail(PluginCall call, boolean ok) {
        JSObject ret = new JSObject();
        ret.put("ok", ok);
        call.resolve(ret);
    }

    // call.getDouble() returns a boxed Double — javac won't combine unboxing
    // with a narrowing cast in one step ("(float) Double" doesn't compile),
    // so unbox to a primitive double first, then narrow that.
    private float getFloat(PluginCall call, String key, double def) {
        double d = call.getDouble(key, def);
        return (float) d;
    }

    @PluginMethod public void back(PluginCall call) {
        if (svc() == null) { notEnabled(call); return; }
        okOrFail(call, svc().back());
    }
    @PluginMethod public void home(PluginCall call) {
        if (svc() == null) { notEnabled(call); return; }
        okOrFail(call, svc().home());
    }
    @PluginMethod public void recents(PluginCall call) {
        if (svc() == null) { notEnabled(call); return; }
        okOrFail(call, svc().recents());
    }
    @PluginMethod public void notifications(PluginCall call) {
        if (svc() == null) { notEnabled(call); return; }
        okOrFail(call, svc().notificationsShade());
    }
    @PluginMethod public void quickSettings(PluginCall call) {
        if (svc() == null) { notEnabled(call); return; }
        okOrFail(call, svc().quickSettings());
    }
    @PluginMethod public void lockScreen(PluginCall call) {
        if (svc() == null) { notEnabled(call); return; }
        okOrFail(call, svc().lockScreen());
    }
    @PluginMethod public void toggleSplitScreen(PluginCall call) {
        if (svc() == null) { notEnabled(call); return; }
        okOrFail(call, svc().toggleSplitScreen());
    }

    @PluginMethod
    public void screenshot(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        s.takeScreenshotAsync((base64Png, error) -> {
            JSObject ret = new JSObject();
            if (base64Png != null) {
                ret.put("ok", true);
                ret.put("dataUrl", "data:image/png;base64," + base64Png);
            } else {
                ret.put("ok", false);
                ret.put("error", error);
            }
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void tap(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        float x = getFloat(call, "x", -1.0);
        float y = getFloat(call, "y", -1.0);
        if (x < 0 || y < 0) { call.reject("x and y are required"); return; }
        s.tap(x, y, ok -> okOrFail(call, ok));
    }

    @PluginMethod
    public void longPress(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        float x = getFloat(call, "x", -1.0);
        float y = getFloat(call, "y", -1.0);
        if (x < 0 || y < 0) { call.reject("x and y are required"); return; }
        s.longPress(x, y, ok -> okOrFail(call, ok));
    }

    @PluginMethod
    public void swipe(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        float x1 = getFloat(call, "x1", -1.0);
        float y1 = getFloat(call, "y1", -1.0);
        float x2 = getFloat(call, "x2", -1.0);
        float y2 = getFloat(call, "y2", -1.0);
        long duration = call.getInt("durationMs", 260);
        if (x1 < 0 || y1 < 0 || x2 < 0 || y2 < 0) { call.reject("x1,y1,x2,y2 are required"); return; }
        s.swipe(x1, y1, x2, y2, duration, ok -> okOrFail(call, ok));
    }

    /** direction: up | down | left | right */
    @PluginMethod
    public void scroll(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        String direction = call.getString("direction", "down");
        s.scroll(direction, ok -> okOrFail(call, ok));
    }

    @PluginMethod
    public void pinch(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        android.util.DisplayMetrics dm = getContext().getResources().getDisplayMetrics();
        float cx = getFloat(call, "centerX", dm.widthPixels / 2.0);
        float cy = getFloat(call, "centerY", dm.heightPixels / 2.0);
        float startSpacing = getFloat(call, "startSpacing", dm.widthPixels * 0.15);
        float endSpacing = getFloat(call, "endSpacing", dm.widthPixels * 0.6);
        long duration = call.getInt("durationMs", 300);
        s.pinch(cx, cy, startSpacing, endSpacing, duration, ok -> okOrFail(call, ok));
    }

    /** Flattened dump of every visible on-screen element with text/desc. */
    @PluginMethod
    public void readScreen(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        List<VoidAccessibilityService.ScreenNode> nodes = s.readScreen();
        JSArray arr = new JSArray();
        for (VoidAccessibilityService.ScreenNode n : nodes) {
            JSObject o = new JSObject();
            o.put("text", n.text);
            o.put("desc", n.desc);
            o.put("class", n.className);
            o.put("clickable", n.clickable);
            o.put("editable", n.editable);
            JSObject bounds = new JSObject();
            bounds.put("left", n.bounds.left);
            bounds.put("top", n.bounds.top);
            bounds.put("right", n.bounds.right);
            bounds.put("bottom", n.bounds.bottom);
            o.put("bounds", bounds);
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("foregroundApp", s.getForegroundPackage());
        ret.put("nodes", arr);
        call.resolve(ret);
    }

    /** "click the submit button" — query is the visible label/description to find and tap. */
    @PluginMethod
    public void clickByDescription(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        String query = call.getString("query", "");
        boolean ok = s.clickByDescription(query, null);
        okOrFail(call, ok);
    }

    /** Sets the text of the field matching `label` (or the currently
     *  focused field if no label is given/found) to `value`. */
    @PluginMethod
    public void fillField(PluginCall call) {
        VoidAccessibilityService s = svc();
        if (s == null) { notEnabled(call); return; }
        String label = call.getString("label", "");
        String value = call.getString("value", "");
        okOrFail(call, s.fillField(label, value));
    }

    /* ── Notifications: a separate Android permission from Accessibility ── */

    @PluginMethod
    public void isNotificationAccessEnabled(PluginCall call) {
        boolean enabled = NotificationManagerCompat.getEnabledListenerPackages(getContext())
            .contains(getContext().getPackageName());
        JSObject ret = new JSObject();
        ret.put("value", enabled && VoidNotificationListenerService.isRunning());
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Intent intent = new Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    /** appFilter (optional): only notifications whose package name contains this. */
    @PluginMethod
    public void readNotifications(PluginCall call) {
        VoidNotificationListenerService n = VoidNotificationListenerService.getInstance();
        if (n == null) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", "NOT_ENABLED");
            call.resolve(ret);
            return;
        }
        String appFilter = call.getString("appFilter", "");
        List<VoidNotificationListenerService.NotifSnapshot> list = n.currentNotifications(appFilter);
        JSArray arr = new JSArray();
        for (VoidNotificationListenerService.NotifSnapshot s : list) {
            JSObject o = new JSObject();
            o.put("app", s.appPackage);
            o.put("title", s.title);
            o.put("text", s.text);
            o.put("postTime", s.postTime);
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("notifications", arr);
        call.resolve(ret);
    }

    /** Turns auto-reply on/off. Requires Notification access to already be
     *  granted — VoidNotificationListenerService.onNotificationPosted() reads
     *  this flag natively on every notification, so it's persisted via
     *  AutoReplyPrefs rather than kept only in JS-land App.settings. */
    @PluginMethod
    public void setAutoReply(PluginCall call) {
        boolean enabled = call.getBoolean("enabled", false);
        boolean notifAccess = NotificationManagerCompat.getEnabledListenerPackages(getContext())
            .contains(getContext().getPackageName());
        if (enabled && !notifAccess) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", "NOTIFICATION_ACCESS_REQUIRED");
            call.resolve(ret);
            return;
        }
        AutoReplyPrefs.setEnabled(getContext(), enabled);
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("enabled", enabled);
        call.resolve(ret);
    }

    /** Drains auto-reply events (sent, or skipped and why) queued natively
     *  while the WebView wasn't around to log them — the caller pushes each
     *  one through logActivity() so the Activity Log stays complete. */
    @PluginMethod
    public void drainAutoReplyLog(PluginCall call) {
        org.json.JSONArray entries = AutoReplyLog.drain(getContext());
        JSArray arr = new JSArray();
        for (int i = 0; i < entries.length(); i++) {
            org.json.JSONObject e = entries.optJSONObject(i);
            if (e == null) continue;
            JSObject o = new JSObject();
            o.put("time", e.optLong("time"));
            o.put("text", e.optString("text"));
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("entries", arr);
        call.resolve(ret);
    }
}
