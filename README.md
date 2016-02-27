# NativeScript Touch ID Plugin

Use the iOS fingerprint scanner in your {N} app.

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

## Changelog
1.1.1  Added TypeScript definitions.
1.1.0  Added Android platform which will always return false for `touchid.available`.
