package com.mlbbhub.app;

import android.content.ComponentName;
import android.content.ServiceConnection;
import android.content.pm.PackageManager;
import android.os.IBinder;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import rikka.shizuku.Shizuku;

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

    // Shared across calls so we only pay the bind cost once per app session —
    // bindUserService() spins up a whole separate privileged process.
    private static volatile IUserService userService;
    private static final Object serviceLock = new Object();

    private final ServiceConnection userServiceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            synchronized (serviceLock) {
                userService = IUserService.Stub.asInterface(binder);
                serviceLock.notifyAll();
            }
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            synchronized (serviceLock) {
                userService = null;
            }
        }
    };

    private Shizuku.UserServiceArgs userServiceArgs() {
        return new Shizuku.UserServiceArgs(
                new ComponentName(getContext().getPackageName(), UserService.class.getName()))
            .daemon(false)
            .processNameSuffix("shizuku_svc")
            .debuggable(false)
            .version(1);
    }

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
                IUserService svc = obtainUserService();
                if (svc == null) {
                    ret.put("ok", false);
                    ret.put("error", "BIND_TIMEOUT");
                } else {
                    String output = svc.exec(command);
                    ret.put("ok", true);
                    ret.put("output", output == null ? "" : output);
                }
            } catch (Exception e) {
                ret.put("ok", false);
                ret.put("error", "EXEC_FAILED: " + e.getMessage());
            }
            call.resolve(ret);
        }).start();
    }

    // Binds the privileged UserService process if not already connected, and
    // waits (up to 5s) for the connection — bindUserService() is async, its
    // result only arrives via ServiceConnection.onServiceConnected().
    private IUserService obtainUserService() throws InterruptedException {
        synchronized (serviceLock) {
            if (userService != null) return userService;
            Shizuku.bindUserService(userServiceArgs(), userServiceConnection);
            serviceLock.wait(5000);
            return userService;
        }
    }
}
