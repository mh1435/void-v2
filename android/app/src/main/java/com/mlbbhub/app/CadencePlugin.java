package com.mlbbhub.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Hands a natural-language command to Cadence (a separate app, package
 * app.cadence.focus) the same way its own "hey cadence" wake word does —
 * without opening its UI. Cadence already understands the text ("log 30
 * minutes of reading", "start a 25 minute focus session"); this plugin's
 * only job is delivery + reporting back what happened.
 *
 * Wire contract (matches Cadence's RunCommandReceiver.java): an explicit,
 * package-targeted ordered broadcast for action "app.cadence.focus.RUN_COMMAND",
 * extra "command", gated by the "app.cadence.focus.permission.RUN_COMMAND"
 * permission Cadence declares and this app requests. Result codes: 1 =
 * MESSAGE (resultData is Cadence's real reply text), 2 = LIVE (Cadence was
 * open, no reply text available), 3 = QUEUED (applied next time it opens).
 * Anything else — including no response — means Cadence never got it.
 */
@CapacitorPlugin(name = "Cadence")
public class CadencePlugin extends Plugin {

    private static final String CADENCE_PKG = "app.cadence.focus";
    private static final String ACTION_RUN_COMMAND = "app.cadence.focus.RUN_COMMAND";
    private static final int TIMEOUT_MS = 8000;

    private static final int RESULT_MESSAGE = 1;
    private static final int RESULT_LIVE = 2;
    private static final int RESULT_QUEUED = 3;

    @PluginMethod
    public void runCommand(PluginCall call) {
        String command = call.getString("command", "");
        if (command.trim().isEmpty()) { call.reject("command is required"); return; }

        Context context = getContext();
        try {
            context.getPackageManager().getPackageInfo(CADENCE_PKG, 0);
        } catch (PackageManager.NameNotFoundException e) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", "not_installed");
            call.resolve(ret);
            return;
        }

        Intent intent = new Intent(ACTION_RUN_COMMAND);
        intent.setPackage(CADENCE_PKG);
        intent.putExtra("command", command);
        // Without this, a Cadence that's never been opened (or was force-stopped
        // by the user/OS) silently never receives ANY broadcast, explicit or not.
        intent.addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES);

        Handler main = new Handler(Looper.getMainLooper());
        boolean[] settled = { false };

        Runnable timeout = () -> {
            if (settled[0]) return;
            settled[0] = true;
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", "timeout");
            call.resolve(ret);
        };
        main.postDelayed(timeout, TIMEOUT_MS);

        // resultCode 0 is the sentinel: if nothing downstream ever sets it (an
        // old Cadence build with no RunCommandReceiver, or the permission not
        // yet recognized), this fires almost immediately with code 0 — not a
        // timeout, and not one of Cadence's real 1/2/3 outcomes either.
        context.sendOrderedBroadcast(intent, null, new BroadcastReceiver() {
            @Override public void onReceive(Context c, Intent i) {
                if (settled[0]) return;
                settled[0] = true;
                main.removeCallbacks(timeout);
                JSObject ret = new JSObject();
                switch (getResultCode()) {
                    case RESULT_MESSAGE:
                        ret.put("ok", true);
                        ret.put("message", getResultData());
                        break;
                    case RESULT_LIVE:
                        ret.put("ok", true);
                        ret.put("live", true);
                        break;
                    case RESULT_QUEUED:
                        ret.put("ok", true);
                        ret.put("queued", true);
                        break;
                    default:
                        ret.put("ok", false);
                        ret.put("error", "unsupported");
                        break;
                }
                call.resolve(ret);
            }
        }, main, 0, null, null);
    }
}
