package com.mlbbhub.app;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Device utilities (Gemini-style): launch ANY installed app by name and open
 * any Android Settings screen — not just apps that happen to have web links.
 */
@CapacitorPlugin(name = "VoidSystem")
public class SystemPlugin extends Plugin {

    /** All launchable apps on the device: [{ label, pkg }] */
    @PluginMethod
    public void listApps(PluginCall call) {
        JSArray out = new JSArray();
        PackageManager pm = getContext().getPackageManager();
        for (ApplicationInfo ai : pm.getInstalledApplications(0)) {
            if (pm.getLaunchIntentForPackage(ai.packageName) == null) continue;
            JSObject o = new JSObject();
            o.put("label", String.valueOf(pm.getApplicationLabel(ai)));
            o.put("pkg", ai.packageName);
            out.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("apps", out);
        call.resolve(ret);
    }

    /** Fuzzy-launch an app by spoken/typed name, e.g. "proton vpn". */
    @PluginMethod
    public void openApp(PluginCall call) {
        String query = call.getString("query", "");
        String label = tryLaunchApp(getContext(), query);
        if (label == null) { fail(call, query); return; }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("label", label);
        call.resolve(ret);
    }

    /** Find the best-matching launchable app and start it. Returns its label, or null. */
    public static String tryLaunchApp(android.content.Context ctx, String rawQuery) {
        String query = norm(rawQuery == null ? "" : rawQuery);
        if (query.isEmpty()) return null;
        PackageManager pm = ctx.getPackageManager();
        String bestPkg = null, bestLabel = null;
        int bestScore = 0;
        for (ApplicationInfo ai : pm.getInstalledApplications(0)) {
            if (pm.getLaunchIntentForPackage(ai.packageName) == null) continue;
            String label = String.valueOf(pm.getApplicationLabel(ai));
            int score = matchScore(query, norm(label), ai.packageName.toLowerCase(Locale.ROOT));
            if (score > bestScore) { bestScore = score; bestPkg = ai.packageName; bestLabel = label; }
        }
        if (bestPkg == null || bestScore < 40) return null;
        try {
            Intent launch = pm.getLaunchIntentForPackage(bestPkg);
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(launch);
            return bestLabel;
        } catch (Exception e) { return null; }
    }

    private static void fail(PluginCall call, String q) {
        JSObject ret = new JSObject();
        ret.put("ok", false);
        ret.put("query", q);
        call.resolve(ret);
    }

    private static String norm(String s) {
        return s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
    }

    // Ranked matching: exact label > label starts-with > label contains > all
    // query words present > package-name contains. Score 0..100.
    private static int matchScore(String q, String label, String pkg) {
        if (label.equals(q)) return 100;
        String qNoSpace = q.replace(" ", ""), lNoSpace = label.replace(" ", "");
        if (lNoSpace.equals(qNoSpace)) return 95;
        if (label.startsWith(q) || lNoSpace.startsWith(qNoSpace)) return 85;
        if (label.contains(q) || lNoSpace.contains(qNoSpace)) return 75;
        String[] words = q.split(" ");
        int hit = 0;
        for (String w : words) if (!w.isEmpty() && label.contains(w)) hit++;
        if (words.length > 0 && hit == words.length) return 65;
        if (pkg.contains(qNoSpace)) return 50;
        if (hit > 0 && hit >= (words.length + 1) / 2) return 45;
        return 0;
    }

    /** Open any URL via the system resolver — deep-links into installed apps
     *  (an Instagram link opens the Instagram app, not a browser tab). */
    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url", "");
        JSObject ret = new JSObject();
        ret.put("ok", viewUrl(getContext(), url));
        call.resolve(ret);
    }

    public static boolean viewUrl(android.content.Context ctx, String url) {
        if (url == null || url.trim().isEmpty()) return false;
        String u = url.trim();
        if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://" + u;
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(u));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            return true;
        } catch (Exception e) { return false; }
    }

    /** Shazam-style song detection: Google's "Search a song" listener, or
     *  Shazam/SoundHound if installed. Returns which one handled it. */
    @PluginMethod
    public void detectMusic(PluginCall call) {
        String via = startMusicSearch(getContext());
        JSObject ret = new JSObject();
        ret.put("ok", via != null);
        if (via != null) ret.put("via", via);
        call.resolve(ret);
    }

    public static String startMusicSearch(android.content.Context ctx) {
        try {
            Intent i = new Intent("com.google.android.googlequicksearchbox.MUSIC_SEARCH");
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            return "Google";
        } catch (Exception ignored) {}
        String[][] apps = {
            {"com.shazam.android", "Shazam"}, {"com.shazam.encore.android", "Shazam"},
            {"com.melodis.midomiMusicIdentifier.freemium", "SoundHound"},
            {"com.melodis.midomiMusicIdentifier", "SoundHound"},
        };
        PackageManager pm = ctx.getPackageManager();
        for (String[] a : apps) {
            try {
                Intent li = pm.getLaunchIntentForPackage(a[0]);
                if (li != null) {
                    li.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(li);
                    return a[1];
                }
            } catch (Exception ignored) {}
        }
        return null;
    }

    /* ── Voice-pill hook: handle "open X" / "open X settings" natively ─────
       Used by FloatingService so "Okay VOID, open spotify" from the home
       screen actually launches the app instead of asking the LLM. Returns a
       short spoken reply, or null if the text isn't a device command. */
    public static String tryHandleCommand(android.content.Context ctx, String text) {
        if (text == null) return null;
        String t = text.toLowerCase(Locale.ROOT).trim().replaceAll("[.?!]+$", "").trim();
        java.util.regex.Matcher m;

        // Links — a pasted URL or "open youtube.com"
        m = java.util.regex.Pattern.compile("^(?:(?:please )?(?:open|go to|visit|take me to)\\s+)?((?:https?://|www\\.)\\S+|[a-z0-9-]+(?:\\.[a-z0-9-]+)+(?:/\\S*)?)$").matcher(t);
        if (m.matches()) {
            if (viewUrl(ctx, m.group(1))) return "Opening that link.";
            return "I couldn't open that link.";
        }

        // Song detection — "what song is this", "shazam this"
        if (t.matches("^(?:what(?:'s| is) (?:this|that|the) song(?: playing)?|what song is (?:this|that|playing)|identify (?:this |the )?song|detect (?:this |the )?song|name (?:this|that) song|shazam(?: (?:this|it))?)$")) {
            String via = startMusicSearch(ctx);
            return via != null ? "Listening via " + via + "…"
                : "You'll need the Google app or Shazam installed to identify songs.";
        }

        m = java.util.regex.Pattern.compile("^(?:please )?(?:open|show|launch|go to|take me to)\\s+(?:the |my )?(.+?)\\s+settings?$").matcher(t);
        if (m.matches()) {
            String screen = mapSettingKeyword(m.group(1));
            if (launchSetting(ctx, screen)) return "Opening " + m.group(1) + " settings.";
            return "I couldn't open those settings.";
        }
        if (t.matches("^(?:please )?(?:open|show|go to|take me to)\\s+(?:the |my |phone |device |system )*settings?$")) {
            if (launchSetting(ctx, "home")) return "Opening settings.";
            return "I couldn't open settings.";
        }
        m = java.util.regex.Pattern.compile("^(?:please )?(?:turn (?:on|off)|enable|disable|toggle)\\s+(?:the |my )?(wi-?fi|bluetooth|hotspot|airplane(?: mode)?|flight mode|mobile data|vpn|nfc|location|gps)$").matcher(t);
        if (m.matches()) {
            if (launchSetting(ctx, mapSettingKeyword(m.group(1)))) return "Opening " + m.group(1) + " settings — flip it there.";
            return "I couldn't open those settings.";
        }
        m = java.util.regex.Pattern.compile("^(?:please )?(?:open|launch|start)\\s+(?:the )?([a-z0-9 .&+-]{2,40}?)(?: app)?$").matcher(t);
        if (m.matches()) {
            String q = m.group(1).trim();
            if (q.matches("(a |an |the )?(new )?(chat|conversation|settings?|menu|image|picture|photo|doc|document|file|research|it|this|that)s?")) return null;
            String label = tryLaunchApp(ctx, q);
            return label != null ? "Opening " + label + "." : "I couldn't find an app called " + q + " on this phone.";
        }
        return null;
    }

    private static String mapSettingKeyword(String what) {
        if (what == null) return "home";
        String w = what.toLowerCase(Locale.ROOT);
        if (w.matches(".*(wi-?fi|wireless).*")) return "wifi";
        if (w.contains("bluetooth")) return "bluetooth";
        if (w.matches(".*(hotspot|tether).*")) return "hotspot";
        if (w.matches(".*(airplane|flight).*")) return "airplane";
        if (w.matches(".*(mobile data|data).*")) return "data";
        if (w.contains("vpn")) return "vpn";
        if (w.matches(".*(battery|power).*")) return "battery";
        if (w.matches(".*(display|brightness|screen).*")) return "display";
        if (w.matches(".*(sound|volume|ringtone|vibrat).*")) return "sound";
        if (w.contains("notification")) return "notifications";
        if (w.contains("storage")) return "storage";
        if (w.matches(".*(security|lock|fingerprint).*")) return "security";
        if (w.matches(".*(location|gps).*")) return "location";
        if (w.matches(".*(language|locale).*")) return "language";
        if (w.matches(".*(date|time|clock).*")) return "datetime";
        if (w.contains("developer")) return "developer";
        if (w.contains("accessibility")) return "accessibility";
        if (w.contains("nfc")) return "nfc";
        if (w.contains("wallpaper")) return "wallpaper";
        if (w.matches(".*(keyboard|input).*")) return "keyboard";
        if (w.matches(".*(account|sync).*")) return "accounts";
        if (w.matches(".*app.*")) return "apps";
        return "home";
    }

    /** Open a specific Android Settings screen (wifi, bluetooth, battery, …). */
    @PluginMethod
    public void openSetting(PluginCall call) {
        String screen = call.getString("screen", "home").toLowerCase(Locale.ROOT);
        JSObject ret = new JSObject();
        ret.put("ok", launchSetting(getContext(), screen));
        call.resolve(ret);
    }

    /** Start a Settings intent; falls back to the main Settings page. */
    public static boolean launchSetting(android.content.Context ctx, String screenKey) {
        String screen = screenKey == null ? "home" : screenKey.toLowerCase(Locale.ROOT);
        Intent intent;
        switch (screen) {
            case "wifi":          intent = new Intent(Settings.ACTION_WIFI_SETTINGS); break;
            case "bluetooth":     intent = new Intent(Settings.ACTION_BLUETOOTH_SETTINGS); break;
            case "data":          intent = new Intent(Settings.ACTION_DATA_USAGE_SETTINGS); break;
            case "airplane":      intent = new Intent(Settings.ACTION_AIRPLANE_MODE_SETTINGS); break;
            case "hotspot":       intent = new Intent(Settings.ACTION_WIRELESS_SETTINGS); break;
            case "vpn":           intent = new Intent("android.settings.VPN_SETTINGS"); break;
            case "battery":       intent = new Intent(Intent.ACTION_POWER_USAGE_SUMMARY); break;
            case "display":       intent = new Intent(Settings.ACTION_DISPLAY_SETTINGS); break;
            case "sound":         intent = new Intent(Settings.ACTION_SOUND_SETTINGS); break;
            case "notifications": intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                                      .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.getPackageName()); break;
            case "storage":       intent = new Intent(Settings.ACTION_INTERNAL_STORAGE_SETTINGS); break;
            case "apps":          intent = new Intent(Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS); break;
            case "security":      intent = new Intent(Settings.ACTION_SECURITY_SETTINGS); break;
            case "location":      intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS); break;
            case "language":      intent = new Intent(Settings.ACTION_LOCALE_SETTINGS); break;
            case "datetime":      intent = new Intent(Settings.ACTION_DATE_SETTINGS); break;
            case "developer":     intent = new Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS); break;
            case "accessibility": intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS); break;
            case "nfc":           intent = new Intent(Settings.ACTION_NFC_SETTINGS); break;
            case "wallpaper":     intent = new Intent(Intent.ACTION_SET_WALLPAPER); break;
            case "keyboard":      intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS); break;
            case "accounts":      intent = new Intent(Settings.ACTION_SYNC_SETTINGS); break;
            case "app_details":   intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                                      Uri.parse("package:" + ctx.getPackageName())); break;
            default:              intent = new Intent(Settings.ACTION_SETTINGS); break;
        }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            ctx.startActivity(intent);
            return true;
        } catch (Exception e) {
            // Screen not available on this device/OEM — fall back to main Settings.
            try {
                Intent main = new Intent(Settings.ACTION_SETTINGS);
                main.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(main);
                return true;
            } catch (Exception e2) { return false; }
        }
    }
}
