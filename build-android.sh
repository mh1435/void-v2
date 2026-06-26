#!/bin/bash
# Sync web assets to Android project and prepare for APK build
set -e

echo "Copying web assets to www/..."
mkdir -p www
cp index.html style.css app.js gamehub-data.js manifest.json sw.js icon-192.png icon-512.png www/
cp -r images www/

echo "Syncing to Android..."
npx cap sync android

echo ""
echo "Done! To build the APK:"
echo "  Open the android/ folder in Android Studio"
echo "  Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo ""
echo "Or via command line (needs Android SDK):"
echo "  cd android && ./gradlew assembleDebug"
echo "  APK will be at: android/app/build/outputs/apk/debug/app-debug.apk"
