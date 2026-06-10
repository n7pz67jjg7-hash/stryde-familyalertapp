# Build STRYDE as an Android APK

This project is a React/Vite + TanStack Start web app. To package it as an
Android APK, we use **Capacitor** to wrap the production web build inside a
native Android shell.

## One-time setup (on your local machine)

You need: Node.js 20+, Android Studio (with Android SDK + Platform Tools), JDK 17+.

```bash
# 1. Pull this repo locally (via GitHub export from Lovable)
git clone <your-repo> stryde && cd stryde

# 2. Install deps
npm install

# 3. Install Capacitor CLI + Android plus core plugins
npm install -D @capacitor/cli
npm install @capacitor/core @capacitor/android \
  @capacitor/geolocation @capacitor/motion @capacitor/device \
  @capacitor/network @capacitor/local-notifications @capacitor/haptics

# 4. Build the web app
npm run build

# 5. Add the Android platform (creates /android folder)
npx cap add android

# 6. Sync web assets + plugins into Android
npx cap sync android
```

## Required Android permissions

After `npx cap add android`, open `android/app/src/main/AndroidManifest.xml`
and ensure these permissions exist inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.CALL_PHONE" />

<uses-feature android:name="android.hardware.sensor.accelerometer" android:required="true" />
<uses-feature android:name="android.hardware.sensor.gyroscope" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="true" />
```

## Build the APK

```bash
# Open in Android Studio
npx cap open android

# Then in Android Studio:
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

The APK lands at:
`android/app/build/outputs/apk/debug/app-debug.apk`

For a release/signed APK:
1. Build → Generate Signed Bundle / APK
2. Create or pick a keystore
3. Choose `release` build variant
4. Output: `android/app/build/outputs/apk/release/app-release.apk`

## After every web change

```bash
npm run build && npx cap sync android
```

Then rebuild in Android Studio.

## What works automatically (already in the web app)

These all run inside the Capacitor WebView using the same Web APIs the web
app already uses — no extra Capacitor JS needed for the MVP:

- **Battery** — `navigator.getBattery()`
- **Geolocation** — `navigator.geolocation` (Capacitor proxies to native)
- **DeviceMotion** — accelerometer-based fall detection
- **Online/offline** — `navigator.onLine`
- **Vibration** — `navigator.vibrate()`
- **Phone calls** — `tel:` links

If you later want native-only features (background fall detection while the
app is closed, push notifications via FCM, etc.) swap the Web APIs above for
the matching `@capacitor/*` plugin imports.
