package com.mlbbhub.app;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.*;
import android.os.*;
import android.util.TypedValue;
import android.view.*;
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

    private WindowManager   wm;
    private View            floatRoot;
    private LinearLayout    chatLog;
    private ScrollView      chatScroll;
    private EditText        inputField;
    private View            chatPanel;
    private View            orbView;

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
        buildWidget();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (floatRoot != null && floatRoot.isAttachedToWindow()) wm.removeView(floatRoot);
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

        orbView   = buildOrb(root);
        chatPanel = buildPanel(root);

        chatPanel.setVisibility(View.GONE);

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
        params.y = dp(220);

        floatRoot = root;
        wm.addView(floatRoot, params);
    }

    private View buildOrb(FrameLayout parent) {
        FrameLayout orb = new FrameLayout(this);
        orb.setElevation(dp(8));

        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(Color.parseColor("#DD0a0a12"));
        bg.setStroke(dp(1.5f), Color.parseColor("#887c6fff"));
        orb.setBackground(bg);

        TextView v = new TextView(this);
        v.setText("V");
        v.setTextColor(Color.parseColor("#b8a4ff"));
        v.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        v.setTypeface(null, Typeface.BOLD);
        v.setGravity(Gravity.CENTER);
        orb.addView(v, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        orb.setOnTouchListener(this::onOrbTouch);

        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(52), dp(52));
        parent.addView(orb, lp);
        return orb;
    }

    private View buildPanel(FrameLayout parent) {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(13), dp(12), dp(13), dp(12));
        panel.setElevation(dp(12));

        GradientDrawable pbg = new GradientDrawable();
        pbg.setCornerRadius(dp(18));
        pbg.setColor(Color.parseColor("#EE0c0c18"));
        pbg.setStroke(dp(1), Color.parseColor("#447c6fff"));
        panel.setBackground(pbg);

        // Header
        LinearLayout hdr = new LinearLayout(this);
        hdr.setOrientation(LinearLayout.HORIZONTAL);
        hdr.setGravity(Gravity.CENTER_VERTICAL);
        hdr.setPadding(0, 0, 0, dp(10));

        TextView title = new TextView(this);
        title.setText("VOID");
        title.setTextColor(Color.parseColor("#9a87ff"));
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        title.setTypeface(null, Typeface.BOLD);
        title.setLetterSpacing(0.15f);
        hdr.addView(title, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1));

        Button closeBtn = new Button(this);
        closeBtn.setText("✕");
        closeBtn.setTextColor(Color.parseColor("#888888"));
        closeBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        closeBtn.setBackground(null);
        closeBtn.setPadding(dp(8), 0, 0, 0);
        closeBtn.setOnClickListener(v -> collapse());
        hdr.addView(closeBtn);
        panel.addView(hdr);

        // Divider
        View div = new View(this);
        div.setBackgroundColor(Color.parseColor("#22ffffff"));
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
        ibg.setColor(Color.parseColor("#220d0d1e"));
        ibg.setStroke(dp(1), Color.parseColor("#337c6fff"));
        inputRow.setBackground(ibg);

        inputField = new EditText(this);
        inputField.setHint("Ask anything...");
        inputField.setHintTextColor(Color.parseColor("#555566"));
        inputField.setTextColor(Color.parseColor("#eeeef2"));
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
        sendBtn.setTextColor(Color.parseColor("#9a87ff"));
        sendBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        sendBtn.setBackground(null);
        sendBtn.setPadding(dp(6), 0, dp(2), 0);
        sendBtn.setOnClickListener(v -> send());
        inputRow.addView(sendBtn);

        panel.addView(inputRow, inputRowLp);

        // Position panel above the orb
        FrameLayout.LayoutParams panelLp = new FrameLayout.LayoutParams(dp(285), dp(400));
        panelLp.gravity = Gravity.BOTTOM | Gravity.END;
        panelLp.setMargins(0, 0, 0, dp(60));
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
        b.setTextColor(Color.parseColor(isUser ? "#e8e8f0" : "#c4b8ff"));
        b.setPadding(dp(10), dp(7), dp(10), dp(7));
        b.setLineSpacing(dp(2), 1f);

        GradientDrawable bbg = new GradientDrawable();
        bbg.setCornerRadius(dp(11));
        bbg.setColor(Color.parseColor(isUser ? "#2d2d42" : "#1c1c2e"));
        b.setBackground(bbg);

        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.setMargins(isUser ? dp(36) : 0, dp(3), isUser ? 0 : dp(36), dp(3));
        lp.gravity = isUser ? Gravity.END : Gravity.START;
        chatLog.addView(b, lp);
    }

    private String callAPI() {
        try {
            JSONArray msgs = new JSONArray();
            msgs.put(new JSONObject().put("role", "system").put("content", SYS_PROMPT));
            // last 10 turns max
            List<String[]> slice = history.subList(Math.max(0, history.size() - 10), history.size());
            for (String[] m : slice) msgs.put(new JSONObject().put("role", m[0]).put("content", m[1]));

            JSONObject body = new JSONObject();
            body.put("model", "");
            body.put("messages", msgs);
            body.put("max_tokens", 220);

            URL url     = new URL(API_URL + "/v1/chat/completions");
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
            return new JSONObject(sb.toString())
                .getJSONArray("choices").getJSONObject(0)
                .getJSONObject("message").getString("content").trim();
        } catch (Exception e) {
            return "Error — " + e.getMessage();
        }
    }
}
