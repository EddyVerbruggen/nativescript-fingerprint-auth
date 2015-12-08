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

Here are the supported functions:

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
    message: 'Scan yer finger', // optional
    fallbackTitle: 'Enter PIN' // optional
  }).then(
      function() {
        console.log("Fingerprint was OK");
      },
      function(error) {
        console.log("Fingerprint NOT OK, here's why: " + JSON.stringify(error));
      }
  )
```