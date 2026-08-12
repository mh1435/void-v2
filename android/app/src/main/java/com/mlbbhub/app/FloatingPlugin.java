package com.mlbbhub.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "FloatingPlugin",
    permissions = {
        // Same Android 13+ gap as the wake-word service: without this the
        // pill's own foreground-service notification is silently dropped.
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notif")
    }
)
public class FloatingPlugin extends Plugin {

    private boolean hasNotif() {
        if (Build.VERSION.SDK_INT < 33) return true;
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void startFloating(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(getContext())) {
            // Send user to "Draw over other apps" settings; JS should retry after they return
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.reject("OVERLAY_PERMISSION_REQUIRED");
            return;
        }
        if (!hasNotif()) {
            requestAllPermissions(call, "notifPermCallback");
            return;
        }
        launchService();
        call.resolve();
    }

    @PermissionCallback
    private void notifPermCallback(PluginCall call) {
        // Notification permission is best-effort — launch either way (the
        // service still runs without a visible notification if declined).
        launchService();
        call.resolve();
    }

    @PluginMethod
    public void stopFloating(PluginCall call) {
        getContext().stopService(new Intent(getContext(), FloatingService.class));
        call.resolve();
    }

    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        JSObject ret = new JSObject();
        boolean can = Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(getContext());
        ret.put("value", can);
        call.resolve(ret);
    }

    private void launchService() {
        Intent intent = new Intent(getContext(), FloatingService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }
}
