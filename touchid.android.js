
var app = require('application');
var utils = require('utils/utils');

var KeyguardManager = android.app.KeyguardManager;
var ActivityCompat = android.support.v4.app.ActivityCompat;
var Manifest = android.Manifest;
var PackageManager = android.content.pm.PackageManager;
var KeyStore = java.security.KeyStore;
var Cipher = javax.crypto.Cipher;
var KeyGenerator = javax.crypto.KeyGenerator;
var KeyProperties = android.security.keystore.KeyProperties;
var SecretKey = javax.crypto.SecretKey;
var KeyGenParameterSpec = android.security.keystore.KeyGenParameterSpec;


//var FingerprintManager;

//var KEYGUARD_SYSTEM_SERVICE = "keyguard";
var KEY_NAME = 'fingerprintscanner';
var SECRET_BYTE_ARRAY = Array.create('byte', 16);
var REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS = 1;
var AUTHENTICATION_DURATION = 15; // in seconds

var activity = null;

var keyguardManager = null;

var available = function () {
  return new Promise(function (resolve, reject) {

    keyguardManager = utils.ad.getApplicationContext().getSystemService("keyguard");

    if (!keyguardManager.isKeyguardSecure()) { 
        resolve(false);
        return;
    }

    if (ActivityCompat.checkSelfPermission(utils.ad.getApplicationContext(), Manifest.permission.USE_FINGERPRINT) != PackageManager.PERMISSION_GRANTED) {
        console.log('Permission not granted');
        resolve(false);
        return;
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

      if (keyguardManager == null) {
        reject('Sorry, your device does not support keyguardManager.');
      }
      if (keyguardManager && !keyguardManager.isKeyguardSecure()) {
        reject('Secure lock screen hasn\'t been set up.\n Go to "Settings -> Security -> Screenlock" to set up a lock screen.');
      }

      createKey();
      tryEncrypt(); 
      
    } catch (ex) {
      console.log("Error in verifyFingerprint: " + ex);
      reject(ex);
    }
  });
};


var verifyFingerprintWithCustomFallback = function (arg) {
  return new Promise(function (resolve, reject) {
    try {
      resolve('Not implemented');
    } catch (ex) {
      console.log("Error in verifyFingerprint: " + ex);
      reject(ex);
    }
  });
};

/**
 * Creates a symmetric key in the Android Key Store which can only be used after the user has
 * authenticated with device credentials within the last X seconds.
 */
function createKey() {
  try {
    var keyStore = KeyStore.getInstance('AndroidKeyStore');
    keyStore.load(null);
    var keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, 'AndroidKeyStore');

    keyGenerator.init(
      new KeyGenParameterSpec.Builder(KEY_NAME, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
        .setBlockModes([KeyProperties.BLOCK_MODE_CBC])
        .setUserAuthenticationRequired(true)
        .setUserAuthenticationValidityDurationSeconds(AUTHENTICATION_DURATION)
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


function tryEncrypt() {
  try {
    var keyStore = KeyStore.getInstance('AndroidKeyStore');
    keyStore.load(null);
    var secretKey = keyStore.getKey(KEY_NAME, null);
    console.log('passei aqui!');
    console.log(secretKey);

    var cipher = Cipher.getInstance(KeyProperties.KEY_ALGORITHM_AES + "/" +
                                    KeyProperties.BLOCK_MODE_CBC + "/" +
                                    KeyProperties.ENCRYPTION_PADDING_PKCS7);

    cipher.init(Cipher.ENCRYPT_MODE, secretKey);
    cipher.doFinal(SECRET_BYTE_ARRAY);
    
    return true;
  } catch (error) {
    console.log('asdasd');
    if ((error.nativeException + '').indexOf('android.security.keystore.UserNotAuthenticatedException') > -1) {
      // the user must provide their credentials in order to proceed
      showAuthenticationScreen();
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
function showAuthenticationScreen() {
  // title and description are optional, if you want the defaults,
  // you must pass nulls to the factory function
  var title = 'Please confirm your credentials.';
  var description = 'We are doing this for your own security.';
  var intent = keyguardManager.createConfirmDeviceCredentialIntent(title, description);

  if (intent != null) {
    activity.startActivityForResult(intent, REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS);
  }
}



exports.available = available;
exports.didFingerprintDatabaseChange = didFingerprintDatabaseChange;
exports.verifyFingerprint = verifyFingerprint;
exports.verifyFingerprintWithCustomFallback = verifyFingerprintWithCustomFallback;