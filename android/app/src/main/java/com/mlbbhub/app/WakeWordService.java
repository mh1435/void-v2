package com.mlbbhub.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.core.app.NotificationCompat;

import java.util.ArrayList;
import java.util.Locale;

/**
 * Always-on "Okay VOID" wake word. Runs as a foreground service (persistent
 * notification, as Android requires) so it keeps listening even when the app
 * is backgrounded or the screen is off. Uses the on-device SpeechRecognizer in
 * a restart loop — no API key, no model download. When it hears the wake
 * phrase it launches VOID and tells it to start listening.
 */
public class WakeWordService extends Service {

    private static final String CHANNEL_ID = "void_wake";
    private static final int NOTIF_ID = 3001;

    private SpeechRecognizer recognizer;
    private Intent recognizerIntent;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private boolean shouldListen = false;
    private long lastWakeMs = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        startForegroundNotif();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        shouldListen = true;
        handler.post(this::startListening);
        return START_STICKY;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "VOID wake word", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Listening for \"Okay VOID\"");
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private void startForegroundNotif() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, flags);

        Notification notif = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("VOID is listening")
            .setContentText("Say \"Okay VOID\" anytime")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notif, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIF_ID, notif);
        }
    }

    private void startListening() {
        if (!shouldListen) return;
        try {
            if (recognizer == null) {
                if (!SpeechRecognizer.isRecognitionAvailable(this)) return;
                recognizer = SpeechRecognizer.createSpeechRecognizer(this);
                recognizer.setRecognitionListener(listener);
                recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, getPackageName());
            }
            recognizer.startListening(recognizerIntent);
        } catch (Exception e) {
            scheduleRestart(800);
        }
    }

    private void scheduleRestart(long delayMs) {
        if (!shouldListen) return;
        handler.postDelayed(() -> {
            try { if (recognizer != null) recognizer.cancel(); } catch (Exception ignored) {}
            startListening();
        }, delayMs);
    }

    private void checkForWake(Bundle results) {
        if (results == null) return;
        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches == null) return;
        for (String phrase : matches) {
            if (phrase == null) continue;
            String p = phrase.toLowerCase(Locale.ROOT);
            int idx = indexOfWake(p);
            if (idx >= 0) {
                long now = System.currentTimeMillis();
                if (now - lastWakeMs < 3000) return; // debounce repeat detections
                lastWakeMs = now;
                String rest = p.substring(idx).replaceFirst("^(?:ok(?:ay)?|hey|hi|yo)\\s+void\\b[\\s,.:;!?-]*", "").trim();
                fireWake(rest);
                return;
            }
        }
    }

    // Returns the start index of the wake phrase, or -1.
    private int indexOfWake(String p) {
        String[] prefixes = {"okay void", "ok void", "hey void", "hi void", "yo void"};
        int best = -1;
        for (String w : prefixes) {
            int i = p.indexOf(w);
            if (i >= 0 && (best < 0 || i < best)) best = i;
        }
        return best;
    }

    private void fireWake(String rest) {
        Intent i = new Intent(this, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra("void_wake", true);
        if (rest != null && !rest.isEmpty()) i.putExtra("void_cmd", rest);
        try { startActivity(i); } catch (Exception ignored) {}
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}

        @Override public void onPartialResults(Bundle partialResults) {
            checkForWake(partialResults);
        }

        @Override public void onResults(Bundle results) {
            checkForWake(results);
            scheduleRestart(300);
        }

        @Override public void onError(int error) {
            // Busy / no-match / timeout are all normal in a continuous loop — just restart.
            long delay = (error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) ? 1000 : 500;
            scheduleRestart(delay);
        }

        @Override public void onEvent(int eventType, Bundle params) {}
    };

    @Override
    public void onDestroy() {
        shouldListen = false;
        handler.removeCallbacksAndMessages(null);
        if (recognizer != null) {
            try { recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
