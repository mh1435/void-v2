package com.mlbbhub.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Bitmap;
import android.graphics.Path;
import android.graphics.Rect;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.util.Base64;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.view.accessibility.AccessibilityWindowInfo;

import java.io.ByteArrayOutputStream;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * VOID's on-device automation engine. Everything here is driven by explicit
 * commands from VoidAccessibilityPlugin (voice/text → JS → this) — it never
 * acts on its own. The user has to manually flip this on in
 * Settings → Accessibility → VOID Device Control (Android forbids granting
 * it silently, by design), same as every other screen-reader/automation app.
 */
public class VoidAccessibilityService extends AccessibilityService {

    private static VoidAccessibilityService INSTANCE;
    private String lastPackage = "";

    public static VoidAccessibilityService getInstance() { return INSTANCE; }
    public static boolean isRunning() { return INSTANCE != null; }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        INSTANCE = this;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Command-driven design — nothing to react to. Track the frontmost
        // package only, so "read my notifications" etc. can note context.
        if (event != null && event.getPackageName() != null) {
            lastPackage = event.getPackageName().toString();
        }
    }

    @Override
    public void onInterrupt() {}

    @Override
    public void onDestroy() {
        if (INSTANCE == this) INSTANCE = null;
        super.onDestroy();
    }

    public String getForegroundPackage() { return lastPackage; }

    /* ── Global navigation ─────────────────────────────────────────── */

    public boolean back()  { return performGlobalAction(GLOBAL_ACTION_BACK); }
    public boolean home()  { return performGlobalAction(GLOBAL_ACTION_HOME); }
    public boolean recents() { return performGlobalAction(GLOBAL_ACTION_RECENTS); }
    public boolean notificationsShade() { return performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS); }
    public boolean quickSettings() { return performGlobalAction(GLOBAL_ACTION_QUICK_SETTINGS); }

    public boolean lockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN);
        }
        return false; // not available pre-Android 9
    }

    public boolean toggleSplitScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            return performGlobalAction(GLOBAL_ACTION_TOGGLE_SPLIT_SCREEN);
        }
        return false;
    }

    /* ── Screenshot ────────────────────────────────────────────────── */

    public interface ScreenshotCallback { void onResult(String base64Png, String error); }

    public void takeScreenshotAsync(ScreenshotCallback cb) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            cb.onResult(null, "Screenshots need Android 11 or newer.");
            return;
        }
        try {
            takeScreenshot(android.view.Display.DEFAULT_DISPLAY, getMainExecutor(),
                new TakeScreenshotCallback() {
                    @Override
                    public void onSuccess(ScreenshotResult result) {
                        try {
                            Bitmap bmp = Bitmap.wrapHardwareBuffer(result.getHardwareBuffer(), result.getColorSpace());
                            result.getHardwareBuffer().close();
                            if (bmp == null) { cb.onResult(null, "Couldn't read the screenshot buffer."); return; }
                            // Hardware bitmaps can't be compressed directly — copy to a software one first.
                            Bitmap software = bmp.copy(Bitmap.Config.ARGB_8888, false);
                            bmp.recycle();
                            ByteArrayOutputStream out = new ByteArrayOutputStream();
                            software.compress(Bitmap.CompressFormat.PNG, 100, out);
                            software.recycle();
                            cb.onResult(Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP), null);
                        } catch (Exception e) {
                            cb.onResult(null, "Screenshot processing failed: " + e.getMessage());
                        }
                    }
                    @Override
                    public void onFailure(int errorCode) {
                        cb.onResult(null, "Screenshot failed (code " + errorCode + ") — some apps block capture.");
                    }
                });
        } catch (Exception e) {
            cb.onResult(null, "Screenshot failed: " + e.getMessage());
        }
    }

    /* ── Gestures: tap / long-press / swipe / scroll / pinch ─────────── */

    public interface GestureCallback { void onResult(boolean ok); }

    private void dispatch(GestureDescription gesture, GestureCallback cb) {
        boolean started = dispatchGesture(gesture, new GestureResultCallback() {
            @Override public void onCompleted(GestureDescription g) { if (cb != null) cb.onResult(true); }
            @Override public void onCancelled(GestureDescription g) { if (cb != null) cb.onResult(false); }
        }, new Handler(getMainLooper()));
        if (!started && cb != null) cb.onResult(false);
    }

    public void tap(float x, float y, GestureCallback cb) {
        Path p = new Path();
        p.moveTo(x, y);
        GestureDescription.Builder b = new GestureDescription.Builder();
        b.addStroke(new GestureDescription.StrokeDescription(p, 0, 60));
        dispatch(b.build(), cb);
    }

    public void longPress(float x, float y, GestureCallback cb) {
        Path p = new Path();
        p.moveTo(x, y);
        GestureDescription.Builder b = new GestureDescription.Builder();
        b.addStroke(new GestureDescription.StrokeDescription(p, 0, 700));
        dispatch(b.build(), cb);
    }

    public void swipe(float x1, float y1, float x2, float y2, long durationMs, GestureCallback cb) {
        Path p = new Path();
        p.moveTo(x1, y1);
        p.lineTo(x2, y2);
        GestureDescription.Builder b = new GestureDescription.Builder();
        b.addStroke(new GestureDescription.StrokeDescription(p, 0, Math.max(80, durationMs)));
        dispatch(b.build(), cb);
    }

    /** direction: up | down | left | right — swipes across ~60% of the screen. */
    public void scroll(String direction, GestureCallback cb) {
        android.util.DisplayMetrics dm = getResources().getDisplayMetrics();
        float w = dm.widthPixels, h = dm.heightPixels;
        float cx = w / 2f, cy = h / 2f;
        float x1 = cx, y1 = cy, x2 = cx, y2 = cy;
        float span = 0.3f;
        switch (direction == null ? "" : direction.toLowerCase(Locale.ROOT)) {
            case "up":    y1 = h * (0.5f + span); y2 = h * (0.5f - span); break; // content scrolls up → finger swipes up
            case "down":  y1 = h * (0.5f - span); y2 = h * (0.5f + span); break;
            case "left":  x1 = w * (0.5f + span); x2 = w * (0.5f - span); break;
            case "right": x1 = w * (0.5f - span); x2 = w * (0.5f + span); break;
            default: if (cb != null) cb.onResult(false); return;
        }
        swipe(x1, y1, x2, y2, 260, cb);
    }

    public void pinch(float centerX, float centerY, float startSpacing, float endSpacing, long durationMs, GestureCallback cb) {
        float half1 = startSpacing / 2f, half2 = endSpacing / 2f;
        Path p1 = new Path(); p1.moveTo(centerX - half1, centerY); p1.lineTo(centerX - half2, centerY);
        Path p2 = new Path(); p2.moveTo(centerX + half1, centerY); p2.lineTo(centerX + half2, centerY);
        GestureDescription.Builder b = new GestureDescription.Builder();
        long d = Math.max(120, durationMs);
        b.addStroke(new GestureDescription.StrokeDescription(p1, 0, d));
        b.addStroke(new GestureDescription.StrokeDescription(p2, 0, d));
        dispatch(b.build(), cb);
    }

    /* ── Screen content: read / find / click / fill ───────────────────── */

    /** One flattened, JSON-friendly snapshot of an on-screen element. */
    public static class ScreenNode {
        public String text, desc, className;
        public boolean clickable, editable;
        public Rect bounds = new Rect();
    }

    /** Breadth-first flatten of every window's node tree (skips invisible nodes). */
    public List<ScreenNode> readScreen() {
        List<ScreenNode> out = new ArrayList<>();
        List<AccessibilityWindowInfo> windows = getWindows();
        if (windows != null && !windows.isEmpty()) {
            for (AccessibilityWindowInfo w : windows) {
                AccessibilityNodeInfo root = w.getRoot();
                if (root != null) collect(root, out);
            }
        } else {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root != null) collect(root, out);
        }
        return out;
    }

    private void collect(AccessibilityNodeInfo node, List<ScreenNode> out) {
        ArrayDeque<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(node);
        while (!queue.isEmpty()) {
            AccessibilityNodeInfo n = queue.poll();
            if (n == null) continue;
            if (n.isVisibleToUser()) {
                CharSequence t = n.getText(), d = n.getContentDescription();
                if ((t != null && t.length() > 0) || (d != null && d.length() > 0) || n.isEditable()) {
                    ScreenNode sn = new ScreenNode();
                    sn.text = t == null ? "" : t.toString();
                    sn.desc = d == null ? "" : d.toString();
                    sn.className = n.getClassName() == null ? "" : n.getClassName().toString();
                    sn.clickable = n.isClickable();
                    sn.editable = n.isEditable();
                    n.getBoundsInScreen(sn.bounds);
                    out.add(sn);
                }
            }
            for (int i = 0; i < n.getChildCount(); i++) {
                AccessibilityNodeInfo c = n.getChild(i);
                if (c != null) queue.add(c);
            }
            // Don't recycle — node pooling was removed in newer Android and
            // recycling manually on those versions is a no-op/deprecated warning.
        }
    }

    /** Finds the node whose text/description best matches `query`, walks up to
     *  the nearest clickable ancestor (labels are often inside a clickable
     *  container), and clicks it. Falls back to a raw tap at its center if no
     *  clickable node is found in the accessibility tree. */
    public boolean clickByDescription(String query, GestureCallback fallbackTapCb) {
        if (query == null || query.trim().isEmpty()) return false;
        String q = query.trim().toLowerCase(Locale.ROOT);
        AccessibilityNodeInfo best = findBestMatch(getRootInActiveWindow(), q);
        if (best == null) return false;
        AccessibilityNodeInfo clickable = best;
        int hops = 0;
        while (clickable != null && !clickable.isClickable() && hops < 8) {
            clickable = clickable.getParent();
            hops++;
        }
        if (clickable != null && clickable.isClickable()) {
            return clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        }
        // No clickable ancestor — fall back to a real tap gesture on its bounds.
        Rect r = new Rect();
        best.getBoundsInScreen(r);
        if (!r.isEmpty()) { tap(r.centerX(), r.centerY(), fallbackTapCb); return true; }
        return false;
    }

    private AccessibilityNodeInfo findBestMatch(AccessibilityNodeInfo root, String q) {
        if (root == null) return null;
        AccessibilityNodeInfo exact = null, partial = null;
        ArrayDeque<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            AccessibilityNodeInfo n = queue.poll();
            if (n == null) continue;
            if (n.isVisibleToUser()) {
                String t = n.getText() == null ? "" : n.getText().toString().toLowerCase(Locale.ROOT);
                String d = n.getContentDescription() == null ? "" : n.getContentDescription().toString().toLowerCase(Locale.ROOT);
                if (t.equals(q) || d.equals(q)) { exact = n; break; }
                if (partial == null && (t.contains(q) || d.contains(q) || q.contains(t) && !t.isEmpty())) partial = n;
            }
            for (int i = 0; i < n.getChildCount(); i++) {
                AccessibilityNodeInfo c = n.getChild(i);
                if (c != null) queue.add(c);
            }
        }
        return exact != null ? exact : partial;
    }

    /** Finds the currently-focused editable field, or the editable field
     *  nearest a label matching `fieldHint`, and sets its text. */
    public boolean fillField(String fieldHint, String value) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return false;
        AccessibilityNodeInfo target = null;

        if (fieldHint != null && !fieldHint.trim().isEmpty()) {
            String hint = fieldHint.trim().toLowerCase(Locale.ROOT);
            target = findBestEditable(root, hint);
        }
        if (target == null) {
            AccessibilityNodeInfo focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
            if (focused != null && focused.isEditable()) target = focused;
        }
        if (target == null) return false;

        Bundle args = new Bundle();
        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value == null ? "" : value);
        return target.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
    }

    private AccessibilityNodeInfo findBestEditable(AccessibilityNodeInfo root, String hint) {
        // getHintText() needs API 26 but this app supports API 24+, so hint
        // matching relies on content-description only (still covers most
        // real-world labeled fields; falls back to the first editable field).
        AccessibilityNodeInfo byHintAttr = null, firstEditable = null;
        ArrayDeque<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            AccessibilityNodeInfo n = queue.poll();
            if (n == null) continue;
            if (n.isVisibleToUser() && n.isEditable()) {
                if (firstEditable == null) firstEditable = n;
                String d = n.getContentDescription() == null ? "" : n.getContentDescription().toString().toLowerCase(Locale.ROOT);
                if (d.contains(hint)) { byHintAttr = n; break; }
            }
            for (int i = 0; i < n.getChildCount(); i++) {
                AccessibilityNodeInfo c = n.getChild(i);
                if (c != null) queue.add(c);
            }
        }
        return byHintAttr != null ? byHintAttr : firstEditable;
    }
}
