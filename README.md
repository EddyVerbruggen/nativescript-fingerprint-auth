# NativeScript Touch ID Plugin


> Deprecated! Use `nativescript-fingerprint-auth` from now on (which has Android support!)


<img src="images/fingerprint.png" />

### Use when
* You want to know if the device runing your app has enrolled for [Touch ID](https://support.apple.com/en-us/HT201371),
* You want to leverage the TouchID sensor in your {N} app.

## Installation
From the command prompt go to your app's root folder and execute:
```
tns plugin add nativescript-touchid
```

## Usage

If you want a quickstart, [clone our demo app](https://github.com/EddyVerbruggen/nativescript-touchid-demo).

Want a nicer guide than these raw code samples? Read [Nic Raboy's blog post about this plugin](https://www.thepolyglotdeveloper.com/2016/03/add-touch-id-authentication-support-to-your-nativescript-app/).

### function: available
```js
  var touchid = require("nativescript-touchid");

  touchid.available().then(
      function(avail) {
        console.log("Available? " + avail);
      }
  )
```

### function: verifyFingerprint

```js
  touchid.verifyFingerprint({
    message: 'Scan yer finger' // optional, shown in the fingerprint dialog (default: 'Scan your finger').
  }).then(
      function() {
        console.log("Fingerprint was OK");
      },
      function(error) {
        console.log("Fingerprint NOT OK" + (error.code ? ". Code: " + error.code : ""));
      }
  )
```

### function: verifyFingerprintWithCustomFallback

```js
  touchid.verifyFingerprintWithCustomFallback({
    message: 'Scan yer finger', // optional, shown in the fingerprint dialog (default: 'Scan your finger').
    fallbackMessage: 'Enter PIN' // optional, the button label when scanning fails (default: 'Enter password').
  }).then(
      function() {
        console.log("Fingerprint was OK");
      },
      function(error) {
        console.log("Fingerprint NOT OK" + (error.code ? ". Code: " + error.code : ""));
      }
  )
```

## Security++
Since iOS9 it's possible to check whether or not the list of enrolled fingerprints changed since
the last time you checked it. It's recommended you add this check so you can counter hacker attacks
to your app. See [this article](https://godpraksis.no/2016/03/fingerprint-trojan/) for more details.

So instead of checking the fingerprint after `available` add another check.
In case `didFingerprintDatabaseChange` returns `true` you probably want to re-authenticate your user
before accepting valid fingerprints again.

```js
touchid.available().then(
    function(avail) {
      if (avail) {
        touchid.didFingerprintDatabaseChange().then(
            function(changed) {
              if (changed) {
                // re-auth the user by asking for his credentials before allowing a fingerprint scan again
              } else {
                // call the fingerprint scanner
              }
            }
        );
      }
    }
)
```

## Changelog
- 2.1.1  Xcode 8 compatibility - requires NativeScript 2.3.0+.
- 2.1.0  Added `didFingerprintDatabaseChange` for enhanced security.
- 2.0.0  Added `verifyFingerprintWithCustomFallback`, `verifyFingerprint` now falls back to the passcode.
- 1.2.0  You can now use the built-in passcode interface as fallback.
- 1.1.1  Added TypeScript definitions.
- 1.1.0  Added Android platform which will always return false for `touchid.available`.
