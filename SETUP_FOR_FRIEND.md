# FieldKonnect Duke setup

## Requirements

- Node.js 20 or newer
- JDK 17
- Android Studio and the Android SDK
- macOS and Xcode for iOS development
- Ruby 3.4.2 and CocoaPods for iOS development

## Install JavaScript dependencies

From the project root:

```sh
npm install
```

The `postinstall` script applies the Android dependency configuration required by this project.

## Run Android

Start Metro in one terminal:

```sh
npm start
```

Run the Android app from another terminal:

```sh
npm run android
```

Alternatively, open the `android` directory in Android Studio, sync Gradle, and run the app.

Android application ID: `com.fieldkonnect.duke`

The included debug keystore is only for local debug builds. Production release signing requires the private upload keystore and an `android/keystore.properties` file based on `android/keystore.properties.example`. These private files are intentionally not included.

## Run iOS

On macOS, install CocoaPods dependencies after `npm install`:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios
```

You can also open `ios/FieldConnect.xcworkspace` in Xcode and run the `FieldConnect` scheme after installing the pods.

## Notes

- The app connects to the configured FieldKonnect Duke production API.
- Valid organization-provided login credentials are required to use the app.
- Do not commit or share release keystores, signing passwords, or machine-specific `local.properties` files.
