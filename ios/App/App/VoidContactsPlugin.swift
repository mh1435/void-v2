import Foundation
import Capacitor
import Contacts

/**
 * Read-only contact lookup by name — the iOS counterpart to
 * android/.../VoidContactsPlugin.java. Same plugin name ("VoidContacts") and
 * same method shapes (isEnabled/requestAccess/find -> {ok, results:[{name,phone}]})
 * so app.js's contactsPlugin() helper works identically on both platforms
 * with zero JS changes. Never writes to or modifies contacts.
 */
@objc(VoidContactsPlugin)
public class VoidContactsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "VoidContactsPlugin"
    public let jsName = "VoidContacts"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isEnabled", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAccess", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "find", returnType: CAPPluginReturnPromise)
    ]

    @objc func isEnabled(_ call: CAPPluginCall) {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        call.resolve(["value": status == .authorized])
    }

    @objc func requestAccess(_ call: CAPPluginCall) {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        if status == .authorized {
            call.resolve()
            return
        }
        CNContactStore().requestAccess(for: .contacts) { granted, _ in
            if granted {
                call.resolve()
            } else {
                call.reject("CONTACTS_PERMISSION_DENIED")
            }
        }
    }

    /// query: a name (or partial name) to search for. Returns up to 5
    /// name+phone matches, contact order as returned by the Contacts store.
    @objc func find(_ call: CAPPluginCall) {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        guard status == .authorized else {
            call.resolve(["ok": false, "error": "NOT_ENABLED"])
            return
        }
        let query = (call.getString("query") ?? "").trimmingCharacters(in: .whitespaces)
        guard !query.isEmpty else {
            call.reject("query is required")
            return
        }

        let store = CNContactStore()
        let keys = [CNContactGivenNameKey, CNContactFamilyNameKey, CNContactPhoneNumbersKey] as [CNKeyDescriptor]
        let request = CNContactFetchRequest(keysToFetch: keys)
        let lowerQuery = query.lowercased()
        var results: [[String: String]] = []
        // The same phone number can appear more than once per contact — dedupe
        // so one person isn't listed multiple times.
        var seen = Set<String>()

        do {
            try store.enumerateContacts(with: request) { contact, stop in
                if results.count >= 5 { stop.pointee = true; return }
                let fullName = "\(contact.givenName) \(contact.familyName)"
                    .trimmingCharacters(in: .whitespaces)
                guard fullName.lowercased().contains(lowerQuery) else { return }
                for phone in contact.phoneNumbers {
                    let number = phone.value.stringValue
                    let dedupeKey = "\(fullName)|\(number.filter { "0123456789+".contains($0) })"
                    guard seen.insert(dedupeKey).inserted else { continue }
                    results.append(["name": fullName, "phone": number])
                    if results.count >= 5 { break }
                }
            }
        } catch {
            call.resolve(["ok": false, "error": error.localizedDescription])
            return
        }

        call.resolve(["ok": true, "results": results])
    }
}
