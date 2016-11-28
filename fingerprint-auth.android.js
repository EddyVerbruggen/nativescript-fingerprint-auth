var app = require('application');
var utils = require('utils/utils');

var KeyStore = java.security.KeyStore;
var Cipher = javax.crypto.Cipher;
var KeyGenerator = javax.crypto.KeyGenerator;
var KeyProperties = android.security.keystore.KeyProperties;
var KeyGenParameterSpec = android.security.keystore.KeyGenParameterSpec;

var KEY_NAME = 'fingerprintauth';
var SECRET_BYTE_ARRAY = Array.create('byte', 16);
var REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS = 1;

var activity = null;
var keyguardManager = null;

var available = function () {
  return new Promise(function (resolve, reject) {

    keyguardManager = utils.ad.getApplicationContext().getSystemService("keyguard");

    if (!keyguardManager.isKeyguardSecure()) {
      resolve(false);
      return;
    }

    if (android.os.Build.VERSION.SDK_INT >= 23) { //23 == android.os.BUILD.M
      //Fingerprint API only available on from Android 6.0 (M)
      var fingerprintManager = utils.ad.getApplicationContext().getSystemService("fingerprint");
      if (!fingerprintManager.isHardwareDetected()) {
        // Device doesn't support fingerprint authentication
        reject('Device doesn\'t support fingerprint authentication');
      } else if (!fingerprintManager.hasEnrolledFingerprints()) {
        // User hasn't enrolled any fingerprints to authenticate with
        reject('User hasn\'t enrolled any fingerprints to authenticate with');
      } else {
        resolve(true);
      }
    }else{
      reject('Your api version don\'t support fingerprint auth');
    }

    resolve(true);
  });
};

var didFingerprintDatabaseChange = function () {
  return new Promise(function (resolve, reject) {
    resolve('Not yet implemented!');
  });
};


var verifyFingerprint = function (arg) {
  return new Promise(function (resolve, reject) {
    activity = app.android.foregroundActivity;
    try {
      activity.onActivityResult = function onActivityResult(requestCode, resultCode, data) {
        if (requestCode === REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS) {
          if (resultCode === android.app.Activity.RESULT_OK) {
            // the user has just authenticated via the ConfirmDeviceCredential activity
            resolve('Congrats! You have just been authenticated successfully!');
          } else {
            // the user has quit the activity without providing credentials
            reject('The last authentication attempt was cancelled.');
          }
        }
      };

      if (keyguardManager === null) {
        reject('Sorry, your device does not support keyguardManager.');
      }
      if (keyguardManager && !keyguardManager.isKeyguardSecure()) {
        reject('Secure lock screen hasn\'t been set up.\n Go to "Settings -> Security -> Screenlock" to set up a lock screen.');
      }

      createKey(arg);

      if (tryEncrypt(arg)) {
        resolve(true);
      }

    } catch (ex) {
      console.log("Error in verifyFingerprint: " + ex);
      reject(ex);
    }
  });
};


var verifyFingerprintWithCustomFallback = function (arg) {
  return verifyFingerprint(arg);
};

/**
 * Creates a symmetric key in the Android Key Store which can only be used after the user has
 * authenticated with device credentials within the last X seconds.
 */
function createKey(arg) {
  try {
    var keyStore = KeyStore.getInstance('AndroidKeyStore');
    keyStore.load(null);
    var keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, 'AndroidKeyStore');

    keyGenerator.init(
        new KeyGenParameterSpec.Builder(KEY_NAME, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes([KeyProperties.BLOCK_MODE_CBC])
            .setUserAuthenticationRequired(true)
            .setUserAuthenticationValidityDurationSeconds(arg && arg.authenticationValidityDuration ? arg.authenticationValidityDuration : 0)
            .setEncryptionPaddings([KeyProperties.ENCRYPTION_PADDING_PKCS7])
            .build()
    );
    keyGenerator.generateKey();
  } catch (error) {
    // checks if the AES algorithm is implemented by the AndroidKeyStore
    if ((error.nativeException + '').indexOf('java.security.NoSuchAlgorithmException:') > -1) {
      //You need a device with API level >= 23 in order to detect if the user has already been authenticated in the last x seconds.
    }
  }
}

function tryEncrypt(arg) {
  try {
    var keyStore = KeyStore.getInstance('AndroidKeyStore');
    keyStore.load(null);
    var secretKey = keyStore.getKey(KEY_NAME, null);

    var cipher = Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/" +
        KeyProperties.BLOCK_MODE_CBC + "/" +
        KeyProperties.ENCRYPTION_PADDING_PKCS7);

    cipher.init(Cipher.ENCRYPT_MODE, secretKey);
    cipher.doFinal(SECRET_BYTE_ARRAY);

    return true;
  } catch (error) {
    if ((error.nativeException + '').indexOf('android.security.keystore.UserNotAuthenticatedException') > -1) {
      // the user must provide their credentials in order to proceed
      showAuthenticationScreen(arg);
    } else if((error.nativeException + '').indexOf('android.security.keystore.KeyPermanentlyInvalidatedException') > -1){
      //Invalid fingerprint
      console.log(error);
    } else {
      console.log(error);
    }
    return false;
  }
}

/**
 * Starts the built-in Android ConfirmDeviceCredential activity.
 */
function showAuthenticationScreen(arg) {
  var intent = keyguardManager.createConfirmDeviceCredentialIntent(
      arg && arg.title ? arg.title : null,
      arg && arg.message ? arg.message : null
  );
  if (intent !== null) {
    activity.startActivityForResult(intent, REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS);
  }
}


exports.available = available;
exports.didFingerprintDatabaseChange = didFingerprintDatabaseChange;
exports.verifyFingerprint = verifyFingerprint;
exports.verifyFingerprintWithCustomFallback = verifyFingerprintWithCustomFallback;