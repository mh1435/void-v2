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
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "mic")
    }
)
public class WakeWordPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissionForAlias("mic", call, "micPermCallback");
            return;
        }
        launch();
        call.resolve();
    }

    @PermissionCallback
    private void micPermCallback(PluginCall call) {
        if (getPermissionState("mic") == com.getcapacitor.PermissionState.GRANTED) {
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
