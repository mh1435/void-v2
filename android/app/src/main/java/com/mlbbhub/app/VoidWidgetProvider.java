package com.mlbbhub.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/**
 * Launcher widget: VOID wordmark + a live one-line stat, tap opens the app.
 * updatePeriodMillis is 0 (no automatic polling — RemoteViews can't run JS to
 * fetch anything itself), so the stat text is pushed from the WebView side
 * via VoidWidgetPlugin whenever Dashboard-relevant state changes, stored in
 * SharedPreferences here, and rendered on the next refresh.
 */
public class VoidWidgetProvider extends AppWidgetProvider {

    static final String PREFS = "void_widget_prefs";
    static final String KEY_STAT = "stat_text";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        for (int id : widgetIds) updateOne(context, manager, id);
    }

    private static void updateOne(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.void_widget);
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String stat = prefs.getString(KEY_STAT, "Ask anything →");
        views.setTextViewText(R.id.widget_stat, stat);

        Intent launch = new Intent(context, MainActivity.class);
        launch.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            context, 0, launch,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.widget_root, pi);
        manager.updateAppWidget(widgetId, views);
    }

    /** Called by VoidWidgetPlugin right after it saves fresh stat text, so
     *  every placed widget instance refreshes immediately instead of
     *  waiting for a periodic update that (deliberately) never comes. */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, VoidWidgetProvider.class));
        for (int id : ids) updateOne(context, manager, id);
    }
}
