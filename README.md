# NativeScript Fingerprint Authentication

> Also works with Face ID on iPhone X 🚀
> Requires Xcode 9+, iOS 11 SDK

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-fingerprint-auth.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-fingerprint-auth
[npm-image]:http://img.shields.io/npm/v/nativescript-fingerprint-auth.svg
[npm-url]:https://npmjs.org/package/nativescript-fingerprint-auth
[downloads-image]:http://img.shields.io/npm/dm/nativescript-fingerprint-auth.svg
[twitter-image]:https://img.shields.io/twitter/follow/eddyverbruggen.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/eddyverbruggen

<img src="https://github.com/EddyVerbruggen/nativescript-fingerprint-auth/raw/master/media/fingerprint.png" />

## Installation
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-fingerprint-auth
```

## Demo
If you want a quickstart, [check out the demo app](https://github.com/EddyVerbruggen/nativescript-fingerprint-auth/tree/master/demo).

<img src="https://raw.githubusercontent.com/EddyVerbruggen/nativescript-fingerprint-auth/master/media/ios-demo-01.png" width="200px" /> <img src="https://raw.githubusercontent.com/EddyVerbruggen/nativescript-fingerprint-auth/master/media/ios-demo-02.png" width="200px" /> <img src="https://raw.githubusercontent.com/EddyVerbruggen/nativescript-fingerprint-auth/master/media/ios-demo-03.png" width="200px" /> <img src="https://raw.githubusercontent.com/EddyVerbruggen/nativescript-fingerprint-auth/master/media/ios-demo-04.png" width="200px" /> <img src="https://raw.githubusercontent.com/EddyVerbruggen/nativescript-fingerprint-auth/master/media/ios-demo-05.png" width="200px" />

## API
Want a nicer guide than these raw code samples? Read [Nic Raboy's blog post about this plugin](https://www.thepolyglotdeveloper.com/2016/03/add-touch-id-authentication-support-to-your-nativescript-app/).

### `available`

#### JavaScript
```js
var fingerprintAuthPlugin = require("nativescript-fingerprint-auth");
var fingerprintAuth = new fingerprintAuthPlugin.FingerprintAuth();

fingerprintAuth.available().then(
    function(avail) {
      console.log("Available? " + avail);
    }
)
```

#### TypeScript
```typescript
import { FingerprintAuth, BiometricIDAvailableResult } from "nativescript-fingerprint-auth";

class MyClass {
  private fingerprintAuth: FingerprintAuth;

  constructor() {
    this.fingerprintAuth = new FingerprintAuth();
  }

  this.fingerprintAuth.available().then((result: BiometricIDAvailableResult) => {
    console.log(`Biometric ID available? ${result.any}`);
    console.log(`Touch? ${result.touch}`);
    console.log(`Face? ${result.face}`);
  });
}
```

### `verifyFingerprint`
Note that on the iOS simulator this will just `resolve()`.

```js
fingerprintAuth.verifyFingerprint(
	{
	  title: 'Android title', // optional title (used only on Android)
	  message: 'Scan yer finger', // optional (used on both platforms) - for FaceID on iOS see the notes about NSFaceIDUsageDescription
	  authenticationValidityDuration: 10, // optional (used on Android, default 5)
	  useCustomAndroidUI: false // set to true to use a different authentication screen (see below)
	})
	.then(() => console.log("Biometric ID OK"))
	.catch(err => console.log(`Biometric ID NOT OK: ${JSON.stringify(err)}`));
```

#### A nicer UX/UI on Android (`useCustomAndroidUI: true`)
The default authentication screen on Android is a standalone screen that (depending on the exact Android version) looks kinda 'uninteresting'. So with version 6.0.0 this plugin added the ability to override the default screen and offer an iOS popover style which you can activate by passing in `useCustomAndroidUI: true` in the function above.

##### Mandatory change
To be able to use this screen, a change to `App_Resources/Android/AndroidManifest.xml` is required as our NativeScript activity needs to extend AppCompatActivity (note that in the future this may become the default for NativeScript apps).

To do so, open the file and replace `<activity android:name="com.tns.NativeScriptActivity"` by `<activity android:name="org.nativescript.fingerprintplugin.AppCompatActivity"`.

Note that if you forget this and set `useCustomAndroidUI: true` the plugin will `reject` the Promise with a relevant error message.

##### Optional change
If you want to override the default texts of this popover screen, then drop a file `App_Resources/Android/values/strings.xml` in your project and override the properties you like. See the demo app for an example.

### `verifyFingerprintWithCustomFallback` (iOS only, falls back to `verifyFingerprint` on Android)
Instead of falling back to the default Passcode UI of iOS you can roll your own.
Just show that when the error callback is invoked.

```js
fingerprintAuth.verifyFingerprintWithCustomFallback({
  message: 'Scan yer finger', // optional, shown in the fingerprint dialog (default: 'Scan your finger').
  fallbackMessage: 'Enter PIN', // optional, the button label when scanning fails (default: 'Enter password').
  authenticationValidityDuration: 10 // optional (used on Android, default 5)
}).then(
    function() {
      console.log("Fingerprint was OK");
    },
    function(error) {
      // when error.code === -3, the user pressed the button labeled with your fallbackMessage
      console.log("Fingerprint NOT OK. Error code: " + error.code + ". Error message: " + error.message);
    }
)
```

## Face ID (iOS)
iOS 11 added support for Face ID and was first supported by the iPhone X.
The developer needs to provide a value for `NSFaceIDUsageDescription`, otherwise your app may crash.

You can provide this value (the reason for using Face ID) by adding something like this to `app/App_Resources/ios/Info.plist`:

```xml
  <key>NSFaceIDUsageDescription</key>
  <string>For easy authentication with our app.</string>
``` 
 
## Security++ (iOS)
Since iOS9 it's possible to check whether or not the list of enrolled fingerprints changed since
the last time you checked it. It's recommended you add this check so you can counter hacker attacks
to your app. See [this article](https://godpraksis.no/2016/03/fingerprint-trojan/) for more details.

So instead of checking the fingerprint after `available` add another check.
In case `didFingerprintDatabaseChange` returns `true` you probably want to re-authenticate your user
before accepting valid fingerprints again.

```js
fingerprintAuth.available().then(
    function(avail) {
      if (!avail) {
        return;
      }

      fingerprintAuth.didFingerprintDatabaseChange().then(
          function(changed) {
            if (changed) {
              // re-auth the user by asking for his credentials before allowing a fingerprint scan again
            } else {
              // call the fingerprint scanner
            }
          }
      );
    }
)
```

## Changelog
- 5.0.0  Better `Face ID` support. Breaking change, see the API for `available`.
- 4.0.1  Aligned with [the official NativeScript plugin seed](https://github.com/NativeScript/nativescript-plugin-seed). Requires NativeScript 3.0.0+. Thanks, @angeltsvetkov!
- 4.0.0  Converted to TypeScript. Changed the error response type of `verifyFingerprintWithCustomFallback`.
- 3.0.0  Android support added. Renamed `nativescript-touchid` to `nativescript-fingerprint-auth` (sorry for any inconvenience!).
- 2.1.1  Xcode 8 compatibility - requires NativeScript 2.3.0+.
- 2.1.0  Added `didFingerprintDatabaseChange` for enhanced security.
- 2.0.0  Added `verifyFingerprintWithCustomFallback`, `verifyFingerprint` now falls back to the passcode.
- 1.2.0  You can now use the built-in passcode interface as fallback.
- 1.1.1  Added TypeScript definitions.
- 1.1.0  Added Android platform which will always return false for `touchid.available`.
