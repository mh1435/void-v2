package com.mlbbhub.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/** Starts/stops the always-on wake-word foreground service from JS. */
@CapacitorPlugin(
    name = "WakeWord",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "mic"),
        // Android 13+ silently drops the foreground-service notification
        // without this — the service still starts, but the user never sees
        // it and (on stricter OEM battery managers) it gets killed faster
        // since there's nothing telling Android "keep this alive". Missing
        // this was the actual cause of "nothing appears, nothing answers".
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notif")
    }
)
public class WakeWordPlugin extends Plugin {

    private boolean hasMic() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
            == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasNotif() {
        if (Build.VERSION.SDK_INT < 33) return true; // permission doesn't exist pre-13
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!hasMic() || !hasNotif()) {
            // Requests every permission declared on this plugin (mic + notif) in
            // one system prompt sequence.
            requestAllPermissions(call, "wakePermCallback");
            return;
        }
        launch();
        call.resolve();
    }

    @PermissionCallback
    private void wakePermCallback(PluginCall call) {
        // Mic is what actually gates functionality — a declined notification
        // permission still lets the service run (just invisibly), so don't
        // block on it. Only fail hard if mic itself was denied.
        if (hasMic()) {
            launch();
            call.resolve();
        } else {
            call.reject("MIC_PERMISSION_DENIED");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), WakeWordService.class));
        call.resolve();
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", android.speech.SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(ret);
    }

    private void launch() {
        Intent intent = new Intent(getContext(), WakeWordService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
    }
}
