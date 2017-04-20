import * as app from "application";
import * as utils from "utils/utils";
import {
  FingerprintAuthApi,
  VerifyFingerprintOptions,
  VerifyFingerprintWithCustomFallbackOptions
} from "./fingerprint-auth.common";

declare const android: any;

const KeyStore = java.security.KeyStore;
const Cipher = javax.crypto.Cipher;
const KeyGenerator = javax.crypto.KeyGenerator;
const KeyProperties = android.security.keystore.KeyProperties;
const KeyGenParameterSpec = android.security.keystore.KeyGenParameterSpec;

const KEY_NAME = "fingerprintauth";
const SECRET_BYTE_ARRAY = Array.create("byte", 16);
const REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS = 1;

export class FingerprintAuth implements FingerprintAuthApi {

  private keyguardManager: any;

  constructor() {
    this.keyguardManager = utils.ad.getApplicationContext().getSystemService("keyguard");
  }

  available(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.keyguardManager || !this.keyguardManager.isKeyguardSecure()) {
          resolve(false);
          return;
        }

        if (android.os.Build.VERSION.SDK_INT >= 23) { // 23 == android.os.BUILD.M
          // Fingerprint API only available on from Android 6.0 (M)
          const fingerprintManager = utils.ad.getApplicationContext().getSystemService("fingerprint");
          if (!fingerprintManager.isHardwareDetected()) {
            // Device doesn't support fingerprint authentication
            reject(`Device doesn't support fingerprint authentication`);
          } else if (!fingerprintManager.hasEnrolledFingerprints()) {
            // User hasn't enrolled any fingerprints to authenticate with
            reject(`User hasn't enrolled any fingerprints to authenticate with`);
          } else {
            resolve(true);
          }
        } else {
          reject(`Your api version doesn't support fingerprint authentication`);
        }

        resolve(true);
      } catch (ex) {
        console.log(`fingerprint-auth.available: ${ex}`);
        resolve(false);
      }
    });
  }

  didFingerprintDatabaseChange(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // not implemented for Android
      resolve(false);
    });
  }

  verifyFingerprint(options: VerifyFingerprintOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        app.android.foregroundActivity.onActivityResult = function onActivityResult(requestCode, resultCode, data) {
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

        if (!this.keyguardManager) {
          reject('Sorry, your device does not support keyguardManager.');
        }
        if (this.keyguardManager && !this.keyguardManager.isKeyguardSecure()) {
          reject('Secure lock screen hasn\'t been set up.\n Go to "Settings -> Security -> Screenlock" to set up a lock screen.');
        }

        FingerprintAuth.createKey(options);

        if (this.tryEncrypt(options)) {
          resolve(true);
        }
      } catch (ex) {
        console.log(`Error in fingerprint-auth.verifyFingerprint: ${ex}`);
        reject(ex);
      }
    });
  }

  verifyFingerprintWithCustomFallback(options: VerifyFingerprintWithCustomFallbackOptions): Promise<string> {
    return this.verifyFingerprint(options);
  }

  /**
   * Creates a symmetric key in the Android Key Store which can only be used after the user has
   * authenticated with device credentials within the last X seconds.
   */
  private static createKey(options): void {
    try {
      const keyStore = KeyStore.getInstance('AndroidKeyStore');
      keyStore.load(null);
      const keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, 'AndroidKeyStore');

      keyGenerator.init(
          new KeyGenParameterSpec.Builder(KEY_NAME, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
              .setBlockModes([KeyProperties.BLOCK_MODE_CBC])
              .setUserAuthenticationRequired(true)
              .setUserAuthenticationValidityDurationSeconds(options && options.authenticationValidityDuration ? options.authenticationValidityDuration : 0)
              .setEncryptionPaddings([KeyProperties.ENCRYPTION_PADDING_PKCS7])
              .build()
      );
      keyGenerator.generateKey();
    } catch (error) {
      // checks if the AES algorithm is implemented by the AndroidKeyStore
      if ((`${error.nativeException}`).indexOf('java.security.NoSuchAlgorithmException:') > -1) {
        // You need a device with API level >= 23 in order to detect if the user has already been authenticated in the last x seconds.
      }
    }
  }

  private tryEncrypt(options): boolean {
    try {
      const keyStore = KeyStore.getInstance('AndroidKeyStore');
      keyStore.load(null);
      const secretKey = keyStore.getKey(KEY_NAME, null);

      const cipher = Cipher.getInstance(`${KeyProperties.KEY_ALGORITHM_AES}/${KeyProperties.BLOCK_MODE_CBC}/${KeyProperties.ENCRYPTION_PADDING_PKCS7}`);

      cipher.init(Cipher.ENCRYPT_MODE, secretKey);
      cipher.doFinal(SECRET_BYTE_ARRAY);

      return true;
    } catch (error) {
      if ((`${error.nativeException}`).indexOf('android.security.keystore.UserNotAuthenticatedException') > -1) {
        // the user must provide their credentials in order to proceed
        this.showAuthenticationScreen(options);
      } else if ((`${error.nativeException}`).indexOf('android.security.keystore.KeyPermanentlyInvalidatedException') > -1) {
        // Invalid fingerprint
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
  private showAuthenticationScreen(options): void {
    const intent = this.keyguardManager.createConfirmDeviceCredentialIntent(
        options && options.title ? options.title : null,
        options && options.message ? options.message : null
    );
    if (intent !== null) {
      app.android.foregroundActivity.startActivityForResult(intent, REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS);
    }
  }
}


