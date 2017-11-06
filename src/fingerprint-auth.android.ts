import * as app from "tns-core-modules/application";
import * as utils from "tns-core-modules/utils/utils";
import {
  BiometricIDAvailableResult,
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

  // TODO can we detect face on the Samsung S8?
  available(): Promise<BiometricIDAvailableResult> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.keyguardManager || !this.keyguardManager.isKeyguardSecure()) {
          resolve({
            any: false
          });
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
            resolve({
              any: true,
              touch: true
            });
          }
        } else {
          reject(`Your api version doesn't support fingerprint authentication`);
        }
      } catch (ex) {
        console.log(`fingerprint-auth.available: ${ex}`);
        reject(ex);
      }
    });
  }

  didFingerprintDatabaseChange(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // not implemented for Android
      resolve(false);
    });
  }

  verifyFingerprint(options: VerifyFingerprintOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        app.android.foregroundActivity.onActivityResult = function onActivityResult(requestCode, resultCode, data) {
          console.log(">>> onActivityResult 1: " + requestCode);
          if (requestCode === REQUEST_CODE_CONFIRM_DEVICE_CREDENTIALS) {
            console.log(">>> onActivityResult 2: " + resultCode);
            console.log(">>> android.app.Activity.RESULT_OK: " + android.app.Activity.RESULT_OK);
            if (resultCode === android.app.Activity.RESULT_OK) {
              // the user has just authenticated via the ConfirmDeviceCredential activity
              resolve({
                any: true,
                touch: true
              });
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

        const tryEncryptResult: boolean = this.tryEncrypt(options);
        if (tryEncryptResult === undefined) {
          // this one is async
        } else if (tryEncryptResult === true) {
          resolve();
        } else {
          reject();
        }
      } catch (ex) {
        console.log(`Error in fingerprint-auth.verifyFingerprint: ${ex}`);
        reject(ex);
      }
    });
  }

  verifyFingerprintWithCustomFallback(options: VerifyFingerprintWithCustomFallbackOptions): Promise<any> {
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
        return undefined;
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


