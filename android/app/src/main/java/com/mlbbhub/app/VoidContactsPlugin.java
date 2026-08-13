package com.mlbbhub.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.provider.ContactsContract;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.HashSet;
import java.util.Set;

/**
 * Read-only contact lookup by name — lets VOID resolve "Mom" or "Kassie" to
 * a phone number so it can hand off to WhatsApp/SMS with the chat already
 * open and the message pre-filled. Never writes to or modifies contacts.
 */
@CapacitorPlugin(
    name = "VoidContacts",
    permissions = {
        @Permission(strings = { Manifest.permission.READ_CONTACTS }, alias = "contacts")
    }
)
public class VoidContactsPlugin extends Plugin {

    private boolean hasPermission() {
        return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_CONTACTS)
            == PackageManager.PERMISSION_GRANTED;
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("value", hasPermission());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (hasPermission()) { call.resolve(); return; }
        requestAllPermissions(call, "contactsPermCallback");
    }

    @PermissionCallback
    private void contactsPermCallback(PluginCall call) {
        if (hasPermission()) call.resolve();
        else call.reject("CONTACTS_PERMISSION_DENIED");
    }

    /** query: a name (or partial name) to search for. Returns up to 5
     *  name+phone matches, best (alphabetically first) match first. */
    @PluginMethod
    public void find(PluginCall call) {
        if (!hasPermission()) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", "NOT_ENABLED");
            call.resolve(ret);
            return;
        }
        String query = call.getString("query", "").trim();
        if (query.isEmpty()) { call.reject("query is required"); return; }

        JSArray results = new JSArray();
        String[] projection = {
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        };
        String selection = ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " LIKE ?";
        String[] selectionArgs = { "%" + query + "%" };

        try (Cursor cursor = getContext().getContentResolver().query(
                ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                projection, selection, selectionArgs,
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC")) {
            if (cursor != null) {
                // The same phone number can appear more than once (synced from
                // multiple accounts) — dedupe so one contact isn't listed 3x.
                Set<String> seen = new HashSet<>();
                int nameIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                int numberIdx = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                while (cursor.moveToNext() && results.length() < 5) {
                    String name = cursor.getString(nameIdx);
                    String number = cursor.getString(numberIdx);
                    if (name == null || number == null) continue;
                    String dedupeKey = name + "|" + number.replaceAll("[^0-9+]", "");
                    if (!seen.add(dedupeKey)) continue;
                    JSObject o = new JSObject();
                    o.put("name", name);
                    o.put("phone", number);
                    results.put(o);
                }
            }
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("ok", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
            return;
        }

        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("results", results);
        call.resolve(ret);
    }
}
