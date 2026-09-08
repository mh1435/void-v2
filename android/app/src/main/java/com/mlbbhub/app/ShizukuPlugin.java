package com.mlbbhub.app;

import android.content.pm.PackageManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import rikka.shizuku.Shizuku;

import java.io.BufferedReader;
import java.io.InputStreamReader;

/**
 * Bridges to Shizuku (https://shizuku.rikka.app) for shell-level (adb)
 * privileges the user explicitly grants. Unlike every other permission in
 * this app, this requires a separate, third-party app (Shizuku) to be
 * installed AND actively running (started via wireless debugging pairing
 * each reboot, or root) before any of this works — VOID cannot start or
 * install Shizuku itself. Every method fails with a specific error code
 * ("NOT_INSTALLED"/"NOT_RUNNING"/"NOT_GRANTED") instead of silently no-op'ing,
 * so the JS side can tell the user exactly what's missing.
 */
@CapacitorPlugin(name = "VoidShizuku")
public class ShizukuPlugin extends Plugin {

    private static final int REQUEST_CODE = 9001;

    private boolean shizukuInstalled() {
        try {
            getContext().getPackageManager().getPackageInfo("moe.shizuku.privileged.api", 0);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        boolean installed = shizukuInstalled();
        boolean running = installed && Shizuku.pingBinder();
        ret.put("installed", installed);
        ret.put("running", running);
        call.resolve(ret);
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (!Shizuku.pingBinder()) {
            ret.put("granted", false);
            ret.put("error", "NOT_RUNNING");
            call.resolve(ret);
            return;
        }
        try {
            ret.put("granted", Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED);
        } catch (Exception e) {
            ret.put("granted", false);
            ret.put("error", "CHECK_FAILED");
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (!Shizuku.pingBinder()) {
            JSObject ret = new JSObject();
            ret.put("granted", false);
            ret.put("error", "NOT_RUNNING");
            call.resolve(ret);
            return;
        }
        if (Shizuku.checkSelfPermission() == PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
            return;
        }
        final Shizuku.OnRequestPermissionResultListener[] holder = new Shizuku.OnRequestPermissionResultListener[1];
        holder[0] = (requestCode, grantResult) -> {
            if (requestCode != REQUEST_CODE) return;
            Shizuku.removeRequestPermissionResultListener(holder[0]);
            JSObject ret = new JSObject();
            ret.put("granted", grantResult == PackageManager.PERMISSION_GRANTED);
            call.resolve(ret);
        };
        Shizuku.addRequestPermissionResultListener(holder[0]);
        try {
            Shizuku.requestPermission(REQUEST_CODE);
        } catch (Exception e) {
            Shizuku.removeRequestPermissionResultListener(holder[0]);
            JSObject ret = new JSObject();
            ret.put("granted", false);
            ret.put("error", "REQUEST_FAILED");
            call.resolve(ret);
        }
    }

    /** Runs a shell command with Shizuku's shell-level (adb) privileges.
     *  `command`: the full command line, e.g. "dumpsys notification". */
    @PluginMethod
    public void runCommand(PluginCall call) {
        String command = call.getString("command", "");
        if (command.isEmpty()) { call.reject("command required"); return; }
        if (!Shizuku.pingBinder()) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", "NOT_RUNNING");
            call.resolve(ret);
            return;
        }
        if (Shizuku.checkSelfPermission() != PackageManager.PERMISSION_GRANTED) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", "NOT_GRANTED");
            call.resolve(ret);
            return;
        }
        new Thread(() -> {
            JSObject ret = new JSObject();
            try {
                Process p = Shizuku.newProcess(new String[]{"sh", "-c", command}, null, null);
                StringBuilder out = new StringBuilder();
                try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                    String line;
                    while ((line = r.readLine()) != null) out.append(line).append('\n');
                }
                p.waitFor();
                ret.put("ok", true);
                ret.put("output", out.toString());
            } catch (Exception e) {
                ret.put("ok", false);
                ret.put("error", "EXEC_FAILED: " + e.getMessage());
            }
            call.resolve(ret);
        }).start();
    }
}
