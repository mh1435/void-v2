package com.mlbbhub.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import androidx.core.app.NotificationCompat;

import org.json.JSONObject;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.SpeechService;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Always-on "Okay VOID" wake word using the Vosk offline speech engine — no
 * API key, works fully offline, and keeps recognizing in the background. Runs
 * as a foreground service (persistent notification, as Android requires). A
 * ~40 MB voice model is downloaded once on first enable, then reused.
 */
public class WakeWordService extends Service {

    private static final String CHANNEL_ID = "void_wake";
    private static final int NOTIF_ID = 3001;
    private static final String MODEL_NAME = "vosk-model-small-en-us-0.15";
    private static final String MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip";
    // Only listen for these phrases (keyword grammar). Deliberately NO bare
    // "void" — a single short word false-triggers on random speech.
    private static final String GRAMMAR = "[\"okay void\", \"ok void\", \"hey void\", \"hi void\", \"[unk]\"]";

    public static final String ACTION_RESUME = "com.mlbbhub.app.WAKE_RESUME";

    // Singleton handle so the floating voice pill can resume listening when done.
    private static WakeWordService INSTANCE;

    private final Handler main = new Handler(Looper.getMainLooper());
    private Model model;
    private SpeechService speechService;
    private volatile boolean running = false;
    private volatile boolean pausedForVoice = false;
    private long lastWakeMs = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        INSTANCE = this;
        createChannel();
        startForegroundNotif("Starting…");
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_RESUME.equals(intent.getAction())) {
            resumeListeningInternal();
            return START_STICKY;
        }
        if (!running) {
            running = true;
            new Thread(this::prepareAndListen).start();
        }
        return START_STICKY;
    }

    /** Called by FloatingService when the pill's mic takes over the microphone. */
    public static void pauseListening(android.content.Context ctx) {
        if (INSTANCE != null) INSTANCE.pauseForVoice();
    }

    /** Called by FloatingService after the voice pill finishes with a command. */
    public static void resumeListening(android.content.Context ctx) {
        if (INSTANCE != null) {
            INSTANCE.resumeListeningInternal();
        } else {
            Intent i = new Intent(ctx, WakeWordService.class);
            i.setAction(ACTION_RESUME);
            ctx.startService(i);
        }
    }

    // Release the mic so the voice pill's speech recognizer can use it.
    private void pauseForVoice() {
        pausedForVoice = true;
        try { if (speechService != null) speechService.stop(); } catch (Exception ignored) {}
    }

    private void resumeListeningInternal() {
        if (!pausedForVoice) return;
        pausedForVoice = false;
        // Small delay so the recognizer has fully released the microphone.
        main.postDelayed(() -> {
            try { if (speechService != null) speechService.startListening(listener); } catch (Exception ignored) {}
            setNotif("Say \"Okay VOID\"");
        }, 400);
    }

    private void prepareAndListen() {
        try {
            File modelDir = new File(getFilesDir(), MODEL_NAME);
            if (!isModelReady(modelDir)) {
                setNotif("Downloading voice model (one time)…");
                downloadAndUnzipModel(modelDir.getParentFile());
            }
            if (!isModelReady(modelDir)) { setNotif("Couldn't set up the voice model."); return; }
            setNotif("Say \"Okay VOID\"");
            model = new Model(modelDir.getAbsolutePath());
            Recognizer rec = new Recognizer(model, 16000.0f, GRAMMAR);
            rec.setWords(true); // per-word confidence, used to reject false wakes
            speechService = new SpeechService(rec, 16000.0f);
            speechService.startListening(listener);
        } catch (Exception e) {
            setNotif("Wake word error — tap to reopen VOID.");
        }
    }

    private boolean isModelReady(File modelDir) {
        // A loadable model has these sub-paths.
        return new File(modelDir, "am/final.mdl").exists()
            || new File(modelDir, "conf/model.conf").exists();
    }

    private void downloadAndUnzipModel(File destParent) {
        File zip = new File(destParent, "model.zip");
        HttpURLConnection conn = null;
        try {
            URL url = new URL(MODEL_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(true);
            conn.setConnectTimeout(20000);
            conn.setReadTimeout(30000);
            conn.connect();
            if (conn.getResponseCode() >= 300) return;
            try (InputStream in = conn.getInputStream(); OutputStream out = new FileOutputStream(zip)) {
                byte[] buf = new byte[8192];
                int n;
                while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
            }
            // Unzip (entries are prefixed with the model folder name)
            try (ZipInputStream zis = new ZipInputStream(new java.io.FileInputStream(zip))) {
                ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    File outFile = new File(destParent, entry.getName());
                    if (entry.isDirectory()) {
                        outFile.mkdirs();
                    } else {
                        File parent = outFile.getParentFile();
                        if (parent != null) parent.mkdirs();
                        try (OutputStream fo = new FileOutputStream(outFile)) {
                            byte[] buf = new byte[8192];
                            int n;
                            while ((n = zis.read(buf)) != -1) fo.write(buf, 0, n);
                        }
                    }
                    zis.closeEntry();
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
            if (zip.exists()) zip.delete();
        }
    }

    private final RecognitionListener listener = new RecognitionListener() {
        // Partials are deliberately ignored — they carry no confidence scores
        // and were the main source of random false wakes.
        @Override public void onPartialResult(String hypothesis) {}
        @Override public void onResult(String hypothesis) { check(hypothesis); }
        @Override public void onFinalResult(String hypothesis) { check(hypothesis); }
        @Override public void onError(Exception e) {}
        @Override public void onTimeout() {}
    };

    private void check(String hypothesisJson) {
        if (hypothesisJson == null) return;
        try {
            JSONObject h = new JSONObject(hypothesisJson);
            String text = h.optString("text", "").toLowerCase(Locale.ROOT).trim();
            if (text.isEmpty()) return;
            int idx = indexOfWake(text);
            if (idx < 0) return;
            if (!wakeConfident(h)) return;
            long now = System.currentTimeMillis();
            if (now - lastWakeMs < 3000) return;
            lastWakeMs = now;
            String rest = text.substring(idx)
                .replaceFirst("^(?:ok(?:ay)?|hey|hi|yo)?\\s*void\\b[\\s,.:;!?-]*", "").trim();
            fireWake(rest);
        } catch (Exception ignored) {}
    }

    // Require BOTH words of the wake phrase to be recognized with decent
    // confidence — rejects background chatter that loosely matches.
    private boolean wakeConfident(JSONObject h) {
        org.json.JSONArray words = h.optJSONArray("result");
        if (words == null) return true; // no scores available — keep old behavior
        for (int i = 0; i < words.length() - 1; i++) {
            JSONObject w1 = words.optJSONObject(i), w2 = words.optJSONObject(i + 1);
            if (w1 == null || w2 == null) continue;
            String a = w1.optString("word", ""), b = w2.optString("word", "");
            if (("okay".equals(a) || "ok".equals(a) || "hey".equals(a) || "hi".equals(a)) && "void".equals(b)) {
                double c1 = w1.optDouble("conf", 1.0), c2 = w2.optDouble("conf", 1.0);
                if (c1 >= 0.6 && c2 >= 0.6) return true;
            }
        }
        return false;
    }

    private int indexOfWake(String p) {
        String[] words = {"okay void", "ok void", "hey void", "hi void"};
        int best = -1;
        for (String w : words) {
            int i = p.indexOf(w);
            if (i >= 0 && (best < 0 || i < best)) best = i;
        }
        return best;
    }

    private void fireWake(final String rest) {
        // Wake word only acts when the VOID app is CLOSED (not on-screen). When the
        // app is open the user already has the full assistant in front of them.
        if (MainActivity.IN_FOREGROUND) return;
        main.post(() -> {
            // Hand the mic to the floating voice pill, then show it — no full app.
            pauseForVoice();
            Intent i = new Intent(this, FloatingService.class);
            i.setAction(FloatingService.ACTION_VOICE);
            if (rest != null && !rest.isEmpty()) i.putExtra("void_cmd", rest);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(i);
                else startService(i);
            } catch (Exception e) {
                // If the overlay can't start, don't strand the mic.
                resumeListeningInternal();
            }
        });
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

    private Notification buildNotif(String text) {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pi = PendingIntent.getActivity(this, 0, open, flags);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("VOID")
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pi)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void startForegroundNotif(String text) {
        Notification notif = buildNotif(text);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notif, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
        } else {
            startForeground(NOTIF_ID, notif);
        }
    }

    private void setNotif(String text) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(NOTIF_ID, buildNotif(text));
    }

    @Override
    public void onDestroy() {
        running = false;
        if (INSTANCE == this) INSTANCE = null;
        try { if (speechService != null) { speechService.stop(); speechService.shutdown(); } } catch (Exception ignored) {}
        try { if (model != null) model.close(); } catch (Exception ignored) {}
        speechService = null; model = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
