package com.mlbbhub.app;

import android.animation.ObjectAnimator;
import android.animation.AnimatorSet;
import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.*;
import android.os.*;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.util.TypedValue;
import android.text.InputType;
import android.view.*;
import android.view.animation.DecelerateInterpolator;
import android.view.inputmethod.*;
import android.widget.*;
import androidx.core.app.NotificationCompat;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public class FloatingService extends Service {

    private static final String CHANNEL_ID  = "void_float";
    private static final int    NOTIF_ID    = 2001;
    private static final String API_URL     = "https://void-proxy.mohamadhacothman1.workers.dev";
    private static final String SYS_PROMPT  =
        "You are VOID, an AI assistant running as a small floating overlay on the user's phone. " +
        "Keep all replies very short — 1 to 3 sentences max. " +
        "Be direct and useful. Do not mention MLBB or gaming unless the user asks.";

    // VOID theme colours
    private static final int COL_BG       = 0xFF0d0d10;  // --bg
    private static final int COL_SURFACE  = 0xFF16161f;  // --surface
    private static final int COL_BORDER   = 0x12ffffff;  // subtle white border
    private static final int COL_PURPLE   = 0xFF7c6fff;  // --accent
    private static final int COL_PURPLE_L = 0xFF9a87ff;  // lighter purple (text/title)
    private static final int COL_TEXT     = 0xFFe8e8f0;
    private static final int COL_MUTED    = 0xFF6b6b80;
    private static final int COL_USER_BG  = 0xFF2d2d42;
    private static final int COL_AI_BG    = 0xFF1c1c2e;

    // Wake word ("Okay VOID") fires this to pop the compact voice pill.
    public static final String ACTION_VOICE = "com.mlbbhub.app.FLOAT_VOICE";

    private WindowManager   wm;
    private View            floatRoot;
    private LinearLayout    chatLog;
    private ScrollView      chatScroll;
    private EditText        inputField;
    private View            chatPanel;
    private FrameLayout     orbView;
    private View            pulseRing;
    private Handler         pulseHandler;
    private boolean         orbShown = false;

    // Floating voice pill (Google-Assistant-style listening bar)
    private View            voicePill;
    private WindowManager.LayoutParams voiceParams;
    private TextView        voiceStatus;
    private LinearLayout     voiceDots;
    private EditText         voiceField;
    private LinearLayout     attachRow;
    private SpeechRecognizer voiceRecognizer;
    private TextToSpeech     tts;
    private boolean          ttsReady = false;
    private boolean          voiceFinishing = false;
    private final Handler    mainHandler = new Handler(Looper.getMainLooper());
    private Runnable         dotAnim;

    private boolean dragging    = false;
    private boolean expanded    = false;
    private float   touchInitX, touchInitY;
    private int     initParamsX, initParamsY;

    private WindowManager.LayoutParams params;
    private final List<String[]>       history  = new ArrayList<>();
    private final ExecutorService      executor = Executors.newSingleThreadExecutor();

    /* ─── Lifecycle ─────────────────────────────────────────── */

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
        startForeground(NOTIF_ID, buildNotification());
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        pulseHandler = new Handler(Looper.getMainLooper());
        tts = new TextToSpeech(this, status -> ttsReady = (status == TextToSpeech.SUCCESS));
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_VOICE.equals(action)) {
            String hint = intent.getStringExtra("void_cmd");
            showVoicePill(hint);
        } else if (!orbShown) {
            // Default: the persistent draggable orb assistant.
            buildWidget();
            orbShown = true;
        }
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        pulseHandler.removeCallbacksAndMessages(null);
        mainHandler.removeCallbacksAndMessages(null);
        if (floatRoot != null && floatRoot.isAttachedToWindow()) wm.removeView(floatRoot);
        removeVoicePill();
        try { if (voiceRecognizer != null) voiceRecognizer.destroy(); } catch (Exception ignored) {}
        try { if (tts != null) { tts.stop(); tts.shutdown(); } } catch (Exception ignored) {}
        executor.shutdown();
    }

    /* ─── Notification ──────────────────────────────────────── */

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "VOID Floating", NotificationManager.IMPORTANCE_MIN);
            ch.setSound(null, null);
            ch.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
    }

    private Notification buildNotification() {
        Intent tap    = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(this, 0, tap,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("VOID")
            .setContentText("Floating assistant active")
            .setSmallIcon(android.R.drawable.star_on)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setOngoing(true)
            .build();
    }

    /* ─── Widget build ──────────────────────────────────────── */

    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v,
            getResources().getDisplayMetrics());
    }

    private void buildWidget() {
        FrameLayout root = new FrameLayout(this);

        chatPanel = buildPanel(root);
        chatPanel.setVisibility(View.GONE);

        orbView = buildOrb(root);

        params = new WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = getResources().getDisplayMetrics().widthPixels - dp(68);
        params.y = dp(200);

        floatRoot = root;
        wm.addView(floatRoot, params);
        startPulse();
    }

    private FrameLayout buildOrb(FrameLayout parent) {
        FrameLayout orb = new FrameLayout(this);

        // Pulse ring — same purple as VoidFloat's .void-float-pulse
        pulseRing = new View(this);
        GradientDrawable ringBg = new GradientDrawable();
        ringBg.setShape(GradientDrawable.OVAL);
        ringBg.setStroke(dp(1.5f), 0x59_7c6fff); // rgba(124,111,255,0.35)
        ringBg.setColor(Color.TRANSPARENT);
        pulseRing.setBackground(ringBg);
        FrameLayout.LayoutParams ringLp = new FrameLayout.LayoutParams(dp(60), dp(60));
        ringLp.gravity = Gravity.CENTER;
        orb.addView(pulseRing, ringLp);

        // Orb background — dark with subtle purple border
        FrameLayout orbInner = new FrameLayout(this);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(COL_BG);
        bg.setStroke(dp(1.5f), 0x59_7c6fff);
        orbInner.setBackground(bg);
        orbInner.setElevation(dp(8));
        FrameLayout.LayoutParams innerLp = new FrameLayout.LayoutParams(dp(50), dp(50));
        innerLp.gravity = Gravity.CENTER;
        orb.addView(orbInner, innerLp);

        // V label
        TextView v = new TextView(this);
        v.setText("V");
        v.setTextColor(COL_PURPLE_L);
        v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        v.setTypeface(null, Typeface.BOLD);
        v.setGravity(Gravity.CENTER);
        FrameLayout.LayoutParams vLp = new FrameLayout.LayoutParams(dp(50), dp(50));
        vLp.gravity = Gravity.CENTER;
        orb.addView(v, vLp);

        orb.setOnTouchListener(this::onOrbTouch);

        FrameLayout.LayoutParams orbLp = new FrameLayout.LayoutParams(dp(60), dp(60));
        parent.addView(orb, orbLp);
        orbView = orb;
        return orb;
    }

    private void startPulse() {
        Runnable pulse = new Runnable() {
            @Override
            public void run() {
                if (pulseRing == null) return;
                pulseRing.setAlpha(0.7f);
                pulseRing.setScaleX(1f);
                pulseRing.setScaleY(1f);
                pulseRing.animate()
                    .scaleX(1.65f)
                    .scaleY(1.65f)
                    .alpha(0f)
                    .setDuration(2800)
                    .setInterpolator(new DecelerateInterpolator())
                    .withEndAction(() -> pulseHandler.postDelayed(this, 200))
                    .start();
            }
        };
        pulseHandler.post(pulse);
    }

    private View buildPanel(FrameLayout parent) {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(13), dp(12), dp(13), dp(12));
        panel.setElevation(dp(12));

        GradientDrawable pbg = new GradientDrawable();
        pbg.setCornerRadius(dp(18));
        pbg.setColor(0xEA_0d0d10); // --bg with 92% opacity
        pbg.setStroke(dp(1), 0x2E_7c6fff); // purple border
        panel.setBackground(pbg);

        // Header
        LinearLayout hdr = new LinearLayout(this);
        hdr.setOrientation(LinearLayout.HORIZONTAL);
        hdr.setGravity(Gravity.CENTER_VERTICAL);
        hdr.setPadding(0, 0, 0, dp(10));

        TextView title = new TextView(this);
        title.setText("VOID");
        title.setTextColor(COL_PURPLE_L);
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        title.setTypeface(null, Typeface.BOLD);
        title.setLetterSpacing(0.2f);
        hdr.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        Button closeBtn = new Button(this);
        closeBtn.setText("✕");
        closeBtn.setTextColor(COL_MUTED);
        closeBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        closeBtn.setBackground(null);
        closeBtn.setPadding(dp(8), 0, 0, 0);
        closeBtn.setOnClickListener(v -> collapse());
        hdr.addView(closeBtn);
        panel.addView(hdr);

        // Divider
        View div = new View(this);
        div.setBackgroundColor(0x12_ffffff);
        LinearLayout.LayoutParams divLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, dp(1));
        divLp.setMargins(0, 0, 0, dp(10));
        panel.addView(div, divLp);

        // Chat log
        chatScroll = new ScrollView(this);
        chatScroll.setScrollbarFadingEnabled(true);
        chatLog = new LinearLayout(this);
        chatLog.setOrientation(LinearLayout.VERTICAL);
        chatLog.setPadding(0, dp(2), 0, dp(2));
        chatScroll.addView(chatLog);
        panel.addView(chatScroll, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));

        // Input row
        LinearLayout inputRow = new LinearLayout(this);
        inputRow.setOrientation(LinearLayout.HORIZONTAL);
        inputRow.setGravity(Gravity.CENTER_VERTICAL);
        inputRow.setPadding(dp(10), dp(7), dp(6), dp(7));
        LinearLayout.LayoutParams inputRowLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        inputRowLp.setMargins(0, dp(10), 0, 0);

        GradientDrawable ibg = new GradientDrawable();
        ibg.setCornerRadius(dp(12));
        ibg.setColor(COL_SURFACE);
        ibg.setStroke(dp(1), 0x22_7c6fff);
        inputRow.setBackground(ibg);

        inputField = new EditText(this);
        inputField.setHint("Ask anything…");
        inputField.setHintTextColor(COL_MUTED);
        inputField.setTextColor(COL_TEXT);
        inputField.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        inputField.setBackground(null);
        inputField.setImeOptions(EditorInfo.IME_ACTION_SEND);
        inputField.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        inputField.setMaxLines(2);
        inputField.setOnEditorActionListener((v, action, ev) -> {
            if (action == EditorInfo.IME_ACTION_SEND) { send(); return true; }
            return false;
        });
        inputRow.addView(inputField, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        Button sendBtn = new Button(this);
        sendBtn.setText("→");
        sendBtn.setTextColor(COL_PURPLE_L);
        sendBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        sendBtn.setBackground(null);
        sendBtn.setPadding(dp(6), 0, dp(2), 0);
        sendBtn.setOnClickListener(v -> send());
        inputRow.addView(sendBtn);

        panel.addView(inputRow, inputRowLp);

        FrameLayout.LayoutParams panelLp = new FrameLayout.LayoutParams(dp(285), dp(400));
        panelLp.gravity = Gravity.BOTTOM | Gravity.END;
        panelLp.setMargins(0, 0, 0, dp(64));
        parent.addView(panel, panelLp);
        return panel;
    }

    /* ─── Drag + tap ────────────────────────────────────────── */

    private boolean onOrbTouch(View v, MotionEvent e) {
        switch (e.getAction()) {
            case MotionEvent.ACTION_DOWN:
                touchInitX  = e.getRawX();
                touchInitY  = e.getRawY();
                initParamsX = params.x;
                initParamsY = params.y;
                dragging    = false;
                return true;
            case MotionEvent.ACTION_MOVE:
                float dx = e.getRawX() - touchInitX;
                float dy = e.getRawY() - touchInitY;
                if (!dragging && (Math.abs(dx) > dp(5) || Math.abs(dy) > dp(5))) dragging = true;
                if (dragging) {
                    params.x = initParamsX + (int) dx;
                    params.y = initParamsY + (int) dy;
                    wm.updateViewLayout(floatRoot, params);
                }
                return true;
            case MotionEvent.ACTION_UP:
                if (!dragging) { if (expanded) collapse(); else expand(); }
                return true;
        }
        return false;
    }

    private void expand() {
        expanded = true;
        chatPanel.setVisibility(View.VISIBLE);
        params.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        wm.updateViewLayout(floatRoot, params);
        inputField.requestFocus();
    }

    private void collapse() {
        expanded = false;
        chatPanel.setVisibility(View.GONE);
        params.flags |= WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        wm.updateViewLayout(floatRoot, params);
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm != null) imm.hideSoftInputFromWindow(inputField.getWindowToken(), 0);
    }

    /* ─── Chat ──────────────────────────────────────────────── */

    private void send() {
        String text = inputField.getText().toString().trim();
        if (text.isEmpty()) return;
        inputField.setText("");
        history.add(new String[]{"user", text});
        addBubble(text, true);

        executor.execute(() -> {
            String reply = callAPI();
            history.add(new String[]{"assistant", reply});
            new Handler(Looper.getMainLooper()).post(() -> {
                addBubble(reply, false);
                chatScroll.post(() -> chatScroll.fullScroll(View.FOCUS_DOWN));
            });
        });
    }

    private void addBubble(String text, boolean isUser) {
        TextView b = new TextView(this);
        b.setText(text);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        b.setTextColor(isUser ? COL_TEXT : COL_PURPLE_L);
        b.setPadding(dp(10), dp(7), dp(10), dp(7));
        b.setLineSpacing(dp(2), 1f);

        GradientDrawable bbg = new GradientDrawable();
        bbg.setCornerRadius(dp(11));
        bbg.setColor(isUser ? COL_USER_BG : COL_AI_BG);
        b.setBackground(bbg);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.setMargins(isUser ? dp(36) : 0, dp(3), isUser ? 0 : dp(36), dp(3));
        lp.gravity = isUser ? Gravity.END : Gravity.START;
        chatLog.addView(b, lp);
    }

    /* ─── Floating voice pill ("Okay VOID") ─────────────────── */

    private void showVoicePill(String hint) {
        if (voicePill != null) {
            // Pill already on screen (e.g. showing the last reply) and the wake
            // word fired again — just start a fresh listen in place.
            restartListening();
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            setNotifText("Enable \"Draw over other apps\" for VOID voice.");
            finishVoice();
            return;
        }
        voiceFinishing = false;
        buildVoicePill();
        setVoiceState("Listening…", true);
        startVoiceCapture(hint);
    }

    private void buildVoicePill() {
        int screenW = getResources().getDisplayMetrics().widthPixels;

        LinearLayout pill = new LinearLayout(this);
        pill.setOrientation(LinearLayout.VERTICAL);
        pill.setPadding(dp(10), dp(10), dp(10), dp(10));
        pill.setElevation(dp(14));
        GradientDrawable pbg = new GradientDrawable();
        pbg.setCornerRadius(dp(26));
        pbg.setColor(0xF2_16161f);
        pbg.setStroke(dp(1), 0x40_7c6fff);
        pill.setBackground(pbg);

        /* Row 1: [+] [status + dots] [mic] */
        LinearLayout row1 = new LinearLayout(this);
        row1.setOrientation(LinearLayout.HORIZONTAL);
        row1.setGravity(Gravity.CENTER_VERTICAL);

        TextView plusBtn = new TextView(this);
        plusBtn.setText("+");
        plusBtn.setTextColor(COL_TEXT);
        plusBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        plusBtn.setGravity(Gravity.CENTER);
        GradientDrawable plusBg = new GradientDrawable();
        plusBg.setShape(GradientDrawable.OVAL);
        plusBg.setColor(0x14_ffffff);
        plusBtn.setBackground(plusBg);
        plusBtn.setOnClickListener(x -> {
            if (attachRow != null) attachRow.setVisibility(
                attachRow.getVisibility() == View.VISIBLE ? View.GONE : View.VISIBLE);
        });
        LinearLayout.LayoutParams plusLp = new LinearLayout.LayoutParams(dp(38), dp(38));
        plusLp.setMargins(0, 0, dp(10), 0);
        row1.addView(plusBtn, plusLp);

        LinearLayout center = new LinearLayout(this);
        center.setOrientation(LinearLayout.VERTICAL);
        center.setGravity(Gravity.CENTER_VERTICAL);

        voiceStatus = new TextView(this);
        voiceStatus.setTextColor(COL_TEXT);
        voiceStatus.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        voiceStatus.setMaxLines(4);
        voiceStatus.setText("Listening…");
        center.addView(voiceStatus, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        voiceDots = new LinearLayout(this);
        voiceDots.setOrientation(LinearLayout.HORIZONTAL);
        voiceDots.setPadding(0, dp(6), 0, dp(2));
        for (int i = 0; i < 5; i++) {
            View dot = new View(this);
            GradientDrawable dbg = new GradientDrawable();
            dbg.setShape(GradientDrawable.OVAL);
            dbg.setColor(COL_PURPLE);
            dot.setBackground(dbg);
            LinearLayout.LayoutParams dLp = new LinearLayout.LayoutParams(dp(6), dp(6));
            dLp.setMargins(0, 0, dp(6), 0);
            voiceDots.addView(dot, dLp);
        }
        center.addView(voiceDots, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        row1.addView(center, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        // Mic button: restart listening (closing happens by tapping outside)
        FrameLayout mic = new FrameLayout(this);
        GradientDrawable mbg = new GradientDrawable();
        mbg.setShape(GradientDrawable.OVAL);
        mbg.setColor(0x59_7c6fff);
        mic.setBackground(mbg);
        TextView micIco = new TextView(this);
        micIco.setText("🎤"); micIco.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16); micIco.setGravity(Gravity.CENTER);
        mic.addView(micIco, new FrameLayout.LayoutParams(dp(42), dp(42)));
        mic.setOnClickListener(x -> restartListening());
        LinearLayout.LayoutParams micLp = new LinearLayout.LayoutParams(dp(42), dp(42));
        micLp.setMargins(dp(8), 0, 0, 0);
        row1.addView(mic, micLp);

        pill.addView(row1, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        /* Attach row (hidden until + is tapped): Photos / Camera / Files */
        attachRow = new LinearLayout(this);
        attachRow.setOrientation(LinearLayout.HORIZONTAL);
        attachRow.setVisibility(View.GONE);
        attachRow.setPadding(0, dp(10), 0, 0);
        String[][] kinds = { {"Photos", "photos"}, {"Camera", "camera"}, {"Files", "files"} };
        for (String[] k : kinds) {
            TextView chip = new TextView(this);
            chip.setText(k[0]);
            chip.setTextColor(COL_TEXT);
            chip.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
            chip.setGravity(Gravity.CENTER);
            chip.setPadding(0, dp(11), 0, dp(11));
            GradientDrawable cbg = new GradientDrawable();
            cbg.setCornerRadius(dp(14));
            cbg.setColor(0x14_ffffff);
            cbg.setStroke(dp(1), 0x26_ffffff);
            chip.setBackground(cbg);
            final String kind = k[1];
            chip.setOnClickListener(x -> openAppForAttach(kind));
            LinearLayout.LayoutParams cLp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
            cLp.setMargins(dp(3), 0, dp(3), 0);
            attachRow.addView(chip, cLp);
        }
        pill.addView(attachRow, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        /* Row 2: type-instead field + send */
        LinearLayout row2 = new LinearLayout(this);
        row2.setOrientation(LinearLayout.HORIZONTAL);
        row2.setGravity(Gravity.CENTER_VERTICAL);
        row2.setPadding(dp(12), dp(4), dp(6), dp(2));
        LinearLayout.LayoutParams row2Lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        row2Lp.setMargins(0, dp(8), 0, 0);
        GradientDrawable r2bg = new GradientDrawable();
        r2bg.setCornerRadius(dp(18));
        r2bg.setColor(0x0F_ffffff);
        r2bg.setStroke(dp(1), 0x1F_ffffff);
        row2.setBackground(r2bg);

        voiceField = new EditText(this);
        voiceField.setHint("Or type…");
        voiceField.setHintTextColor(COL_MUTED);
        voiceField.setTextColor(COL_TEXT);
        voiceField.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        voiceField.setBackground(null);
        voiceField.setMaxLines(2);
        voiceField.setImeOptions(EditorInfo.IME_ACTION_SEND);
        voiceField.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        // The overlay window starts NOT_FOCUSABLE so it never steals the
        // keyboard; first tap on the field makes it focusable and opens IME.
        voiceField.setOnTouchListener((v2, ev) -> {
            makePillFocusable();
            return false;
        });
        voiceField.setOnEditorActionListener((v2, action, ev) -> {
            if (action == EditorInfo.IME_ACTION_SEND) { sendTyped(); return true; }
            return false;
        });
        row2.addView(voiceField, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        TextView sendBtn = new TextView(this);
        sendBtn.setText("➤");
        sendBtn.setTextColor(COL_PURPLE_L);
        sendBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        sendBtn.setPadding(dp(10), dp(6), dp(10), dp(6));
        sendBtn.setOnClickListener(x -> sendTyped());
        row2.addView(sendBtn);

        pill.addView(row2, row2Lp);

        // Tiny build tag so it's obvious which APK is actually installed.
        TextView buildTag = new TextView(this);
        String ver = "?";
        try { ver = getPackageManager().getPackageInfo(getPackageName(), 0).versionName; } catch (Exception ignored) {}
        buildTag.setText("v" + ver);
        buildTag.setTextColor(COL_MUTED);
        buildTag.setTextSize(TypedValue.COMPLEX_UNIT_SP, 9);
        buildTag.setAlpha(0.6f);
        buildTag.setGravity(Gravity.END);
        buildTag.setPadding(0, dp(4), dp(6), 0);
        pill.addView(buildTag, new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        voiceParams = new WindowManager.LayoutParams(
            Math.min(screenW - dp(24), dp(380)),
            WindowManager.LayoutParams.WRAP_CONTENT,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        );
        voiceParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        voiceParams.y = dp(80);
        voiceParams.softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;

        // Tap anywhere OUTSIDE the pill → close (no ✕ button needed)
        pill.setOnTouchListener((v2, ev) -> {
            if (ev.getAction() == MotionEvent.ACTION_OUTSIDE) { finishVoice(); return true; }
            return false;
        });

        voicePill = pill;
        pill.setAlpha(0f);
        wm.addView(voicePill, voiceParams);
        pill.animate().alpha(1f).setDuration(180).start();
    }

    private void makePillFocusable() {
        if (voicePill == null || voiceParams == null) return;
        if ((voiceParams.flags & WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE) == 0) return;
        voiceParams.flags &= ~WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        try { wm.updateViewLayout(voicePill, voiceParams); } catch (Exception ignored) {}
    }

    private void sendTyped() {
        if (voiceField == null) return;
        String t = voiceField.getText().toString().trim();
        if (t.isEmpty()) return;
        voiceField.setText("");
        try { if (voiceRecognizer != null) { voiceRecognizer.cancel(); voiceRecognizer.destroy(); voiceRecognizer = null; } } catch (Exception ignored) {}
        try { if (tts != null) tts.stop(); } catch (Exception ignored) {}
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        if (imm != null) imm.hideSoftInputFromWindow(voiceField.getWindowToken(), 0);
        onCommandRecognized(t);
    }

    private void restartListening() {
        try { if (tts != null) tts.stop(); } catch (Exception ignored) {}
        try { if (voiceRecognizer != null) { voiceRecognizer.cancel(); voiceRecognizer.destroy(); voiceRecognizer = null; } } catch (Exception ignored) {}
        // Take the mic back from the wake-word service while we capture.
        WakeWordService.pauseListening(this);
        setVoiceState("Listening…", true);
        startVoiceCapture(null);
    }

    private void openAppForAttach(String kind) {
        Intent i = new Intent(this, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra("void_attach", kind);
        try { startActivity(i); } catch (Exception ignored) {}
        finishVoice();
    }

    private void setVoiceState(String text, boolean showDots) {
        if (voiceStatus != null) voiceStatus.setText(text);
        if (voiceDots != null) voiceDots.setVisibility(showDots ? View.VISIBLE : View.GONE);
        if (showDots) startDots(); else stopDots();
    }

    private void startDots() {
        stopDots();
        dotAnim = new Runnable() {
            int step = 0;
            @Override public void run() {
                if (voiceDots == null) return;
                for (int i = 0; i < voiceDots.getChildCount(); i++) {
                    View d = voiceDots.getChildAt(i);
                    float phase = (float) Math.sin((step / 3.0) + i * 0.7);
                    float s = 0.7f + 0.6f * (phase + 1f) / 2f;
                    d.setScaleX(s); d.setScaleY(s);
                    d.setAlpha(0.45f + 0.55f * (phase + 1f) / 2f);
                }
                step++;
                mainHandler.postDelayed(this, 90);
            }
        };
        mainHandler.post(dotAnim);
    }

    private void stopDots() {
        if (dotAnim != null) { mainHandler.removeCallbacks(dotAnim); dotAnim = null; }
    }

    private void startVoiceCapture(String hint) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            if (hint != null && hint.trim().length() >= 2) { onCommandRecognized(hint.trim()); return; }
            setVoiceState("Voice input unavailable — type below instead.", false);
            WakeWordService.resumeListening(this);
            return;
        }
        try {
            voiceRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            Intent ri = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            ri.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            ri.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            ri.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            // Listen in the language chosen in VOID's settings (synced from the app)
            String lang = SystemPlugin.getLang(this);
            ri.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            ri.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
            voiceRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle p) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rms) {}
                @Override public void onBufferReceived(byte[] b) {}
                @Override public void onEndOfSpeech() { setVoiceState("Thinking…", true); }
                @Override public void onError(int err) {
                    if (hint != null && hint.trim().length() >= 2) { onCommandRecognized(hint.trim()); return; }
                    setVoiceState("Didn't catch that — tap the mic or type.", false);
                    WakeWordService.resumeListening(FloatingService.this);
                }
                @Override public void onResults(Bundle results) {
                    java.util.ArrayList<String> m = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (m != null && !m.isEmpty() && m.get(0).trim().length() > 0) onCommandRecognized(m.get(0).trim());
                    else if (hint != null && hint.trim().length() >= 2) onCommandRecognized(hint.trim());
                    else {
                        setVoiceState("Didn't catch that — tap the mic or type.", false);
                        WakeWordService.resumeListening(FloatingService.this);
                    }
                }
                @Override public void onPartialResults(Bundle partial) {
                    java.util.ArrayList<String> m = partial.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (m != null && !m.isEmpty() && voiceStatus != null) voiceStatus.setText(m.get(0));
                }
                @Override public void onEvent(int e, Bundle b) {}
            });
            voiceRecognizer.startListening(ri);
        } catch (Exception e) {
            if (hint != null && hint.trim().length() >= 2) onCommandRecognized(hint.trim());
            else {
                // Mic busy or recognizer failed — keep the pill up so the user
                // can retry via the mic button or type instead.
                setVoiceState("Mic is busy — tap the mic to retry, or type.", false);
                WakeWordService.resumeListening(this);
            }
        }
    }

    private void onCommandRecognized(String text) {
        setVoiceState(text, true);
        // "Hey VOID, guess the song" → listen to the music right here in the pill.
        if (SystemPlugin.isSongQuery(text)) { runPillSongId(); return; }
        // Device commands ("open spotify", "open wifi settings") are handled
        // natively — actually launching the thing — never sent to the LLM,
        // which would just pretend it did.
        String device = SystemPlugin.tryHandleCommand(this, text);
        if (device != null) {
            history.add(new String[]{"user", text});
            history.add(new String[]{"assistant", device});
            speakAndFinish(device);
            return;
        }
        history.add(new String[]{"user", text});
        executor.execute(() -> {
            String reply = callAPI();
            history.add(new String[]{"assistant", reply});
            mainHandler.post(() -> speakAndFinish(reply));
        });
    }

    /* ── In-pill song recognition: record ~10 s and identify via VOID CORE ── */

    private void runPillSongId() {
        setVoiceState("Listening to the music…", true);
        executor.execute(() -> {
            String reply = recognizeSongBlocking();
            mainHandler.post(() -> speakAndFinish(reply));
        });
    }

    private String recognizeSongBlocking() {
        final int RATE = 16000, SECONDS = 10;
        byte[] pcm;
        android.media.AudioRecord rec = null;
        try {
            int minBuf = android.media.AudioRecord.getMinBufferSize(RATE,
                android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT);
            rec = new android.media.AudioRecord(android.media.MediaRecorder.AudioSource.MIC, RATE,
                android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT,
                Math.max(minBuf, RATE * 2));
            pcm = new byte[RATE * 2 * SECONDS];
            rec.startRecording();
            int off = 0;
            while (off < pcm.length) {
                int n = rec.read(pcm, off, pcm.length - off);
                if (n <= 0) break;
                off += n;
            }
        } catch (Exception e) {
            return "I couldn't reach the microphone to listen.";
        } finally {
            try { if (rec != null) { rec.stop(); rec.release(); } } catch (Exception ignored) {}
        }
        try {
            byte[] wav = pcmToWav(pcm, RATE);
            String b64 = android.util.Base64.encodeToString(wav, android.util.Base64.NO_WRAP);
            URL url = new URL(API_URL + "/song-id");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(30000);
            JSONObject body = new JSONObject();
            body.put("audio", b64);
            body.put("mimeType", "audio/wav");
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
            int code = conn.getResponseCode();
            InputStream is = code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream();
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String ln;
                while ((ln = br.readLine()) != null) sb.append(ln);
            }
            JSONObject data = new JSONObject(sb.toString());
            if (data.optBoolean("found")) {
                String title = data.optString("title", ""), artist = data.optString("artist", "");
                // "open the song in google for me" — jump straight to the result
                SystemPlugin.viewUrl(this, "https://www.google.com/search?q=" +
                    java.net.URLEncoder.encode(title + " " + artist, "UTF-8"));
                return "That's " + title + " by " + artist + ". Opening it for you.";
            }
            if (data.has("found")) return "I heard it, but couldn't recognize that song — get closer to the speaker and try again.";
        } catch (Exception ignored) {}
        // Recognition service unavailable → hand off to Google's listener / Shazam
        String via = SystemPlugin.startMusicSearch(this);
        if (via != null) return "Listening via " + via + "…";
        return "Song detection isn't set up yet — add the free AudD token to VOID CORE.";
    }

    private static byte[] pcmToWav(byte[] pcm, int rate) {
        int dataLen = pcm.length, byteRate = rate * 2;
        java.nio.ByteBuffer b = java.nio.ByteBuffer.allocate(44 + dataLen).order(java.nio.ByteOrder.LITTLE_ENDIAN);
        b.put("RIFF".getBytes()).putInt(36 + dataLen).put("WAVE".getBytes()).put("fmt ".getBytes());
        b.putInt(16).putShort((short) 1).putShort((short) 1).putInt(rate).putInt(byteRate)
         .putShort((short) 2).putShort((short) 16).put("data".getBytes()).putInt(dataLen).put(pcm);
        return b.array();
    }

    // Show + speak the reply. The pill does NOT auto-close — it stays until
    // the user taps outside it. Wake listening resumes only AFTER the spoken
    // reply finishes, so VOID can't mis-hear its own voice as the wake word
    // and wipe the reply with a fresh "Listening…".
    private void speakAndFinish(String reply) {
        setVoiceState(reply, false);
        boolean speaking = false;
        if (ttsReady && tts != null) {
            try {
                // Speak in the app's configured language when the device supports it
                try {
                    java.util.Locale loc = java.util.Locale.forLanguageTag(SystemPlugin.getLang(this).replace('_', '-'));
                    if (tts.isLanguageAvailable(loc) >= TextToSpeech.LANG_AVAILABLE) tts.setLanguage(loc);
                } catch (Exception ignored) {}
                tts.setOnUtteranceProgressListener(new android.speech.tts.UtteranceProgressListener() {
                    @Override public void onStart(String id) {}
                    @Override public void onDone(String id) { WakeWordService.resumeListening(FloatingService.this); }
                    @Override public void onError(String id) { WakeWordService.resumeListening(FloatingService.this); }
                });
                tts.speak(reply, TextToSpeech.QUEUE_FLUSH, null, "void_reply");
                speaking = true;
            } catch (Exception ignored) {}
        }
        if (!speaking) WakeWordService.resumeListening(this);
    }

    private void removeVoicePill() {
        stopDots();
        if (voicePill != null && voicePill.isAttachedToWindow()) {
            try {
                InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
                if (imm != null && voiceField != null) imm.hideSoftInputFromWindow(voiceField.getWindowToken(), 0);
            } catch (Exception ignored) {}
            try { wm.removeView(voicePill); } catch (Exception ignored) {}
        }
        voicePill = null; voiceStatus = null; voiceDots = null; voiceField = null; attachRow = null;
    }

    private void finishVoice() {
        if (voiceFinishing) return;
        voiceFinishing = true;
        try { if (voiceRecognizer != null) { voiceRecognizer.cancel(); voiceRecognizer.destroy(); } } catch (Exception ignored) {}
        voiceRecognizer = null;
        try { if (tts != null) tts.stop(); } catch (Exception ignored) {}
        removeVoicePill();
        // Give the mic back to the wake-word service.
        WakeWordService.resumeListening(this);
        // If we were only up for the voice pill (no orb), shut down.
        if (!orbShown) stopSelf();
    }

    private void setNotifText(String text) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null) return;
        Notification n = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("VOID").setContentText(text)
            .setSmallIcon(android.R.drawable.star_on)
            .setPriority(NotificationCompat.PRIORITY_LOW).setOngoing(true).build();
        nm.notify(NOTIF_ID, n);
    }

    private String callAPI() {
        // A photo shared to VOID (or attached in-app) rides along on the most
        // recent user turn, same multimodal shape the web chat sends —
        // "Hey VOID, what's in this photo" works whether the app is open or
        // the wake word fired it while closed.
        boolean attachImage = PendingSharedImage.has();
        try {
            JSONArray msgs = new JSONArray();
            msgs.put(new JSONObject().put("role", "system").put("content", SYS_PROMPT));
            List<String[]> slice = history.subList(Math.max(0, history.size() - 10), history.size());
            for (int i = 0; i < slice.size(); i++) {
                String[] m = slice.get(i);
                boolean isLastUserTurn = attachImage && i == slice.size() - 1 && "user".equals(m[0]);
                if (isLastUserTurn) {
                    JSONArray content = new JSONArray();
                    content.put(new JSONObject().put("type", "text").put("text", m[1]));
                    JSONObject imageUrl = new JSONObject().put("url", "data:"
                        + (PendingSharedImage.mimeType == null ? "image/jpeg" : PendingSharedImage.mimeType)
                        + ";base64," + PendingSharedImage.base64);
                    content.put(new JSONObject().put("type", "image_url").put("image_url", imageUrl));
                    msgs.put(new JSONObject().put("role", "user").put("content", content));
                } else {
                    msgs.put(new JSONObject().put("role", m[0]).put("content", m[1]));
                }
            }

            JSONObject body = new JSONObject();
            body.put("model", "");
            body.put("messages", msgs);
            body.put("max_tokens", 220);

            URL url = new URL(API_URL + "/v1/chat/completions");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(22000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }

            int code = conn.getResponseCode();
            InputStream is = code >= 200 && code < 300 ? conn.getInputStream() : conn.getErrorStream();
            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
                String ln;
                while ((ln = br.readLine()) != null) sb.append(ln);
            }
            if (attachImage) PendingSharedImage.clear(); // one-shot, like the web chat's attach preview
            return new JSONObject(sb.toString())
                .getJSONArray("choices").getJSONObject(0)
                .getJSONObject("message").getString("content").trim();
        } catch (Exception e) {
            return "Error — " + e.getMessage();
        }
    }
}
