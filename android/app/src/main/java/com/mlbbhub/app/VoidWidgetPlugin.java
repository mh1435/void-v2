package com.mlbbhub.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.PluginCall;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** JS-facing bridge for the home screen widget — the WebView pushes a short
 *  live stat line (e.g. "3 chats · 1 due today") whenever Dashboard-relevant
 *  state changes; this stores it and forces every placed widget to redraw
 *  with it immediately. */
@CapacitorPlugin(name = "VoidWidget")
public class VoidWidgetPlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String text = call.getString("text", "Ask anything →");
        // RemoteViews TextViews don't wrap/scroll — keep it short so it
        // doesn't just get truncated with an ellipsis on typical widget sizes.
        if (text.length() > 40) text = text.substring(0, 39) + "…";
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(VoidWidgetProvider.PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(VoidWidgetProvider.KEY_STAT, text).apply();
        VoidWidgetProvider.refreshAll(context);
        call.resolve();
    }
}
