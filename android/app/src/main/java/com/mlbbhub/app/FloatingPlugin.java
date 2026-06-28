package com.mlbbhub.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "FloatingPlugin")
public class FloatingPlugin extends Plugin {

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
