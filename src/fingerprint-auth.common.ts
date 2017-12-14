export interface VerifyFingerprintOptions {
  /**
   * The optional title in the fingerprint page for android.
   * Default: whatever the device default is ('Confirm your password' is likely)
   */
  title?: string;

  /**
   * The optional message in the fingerprint dialog on ios and page description on android.
   * Default: 'Scan your finger' on iOS and the device default on Android (which is likely 'Enter your device password to continue').
   */
  message?: string;

  /**
   * Default 5 (seconds). Can be 0  to always trigger auth.
   * Android only.
   */
  authenticationValidityDuration?: number;
}

export interface VerifyFingerprintWithCustomFallbackOptions {
  /**
   * The optional message in the fingerprint dialog.
   * Default: 'Scan your finger'.
   */
  message?: string;

  /**
   * The optional button label when scanning the fingerprint fails.
   * Default: 'Enter password'.
   */
  fallbackMessage?: string;

  /**
   * Default 5 (seconds). Can be 0  to always trigger auth.
   * Android only.
   */
  authenticationValidityDuration?: number;
}

export interface BiometricIDAvailableResult {
  any: boolean;
  touch?: boolean;
  face?: boolean;
}

//noinspection JSUnusedGlobalSymbols
export interface FingerprintAuthApi {
  available(): Promise<BiometricIDAvailableResult>;

  didFingerprintDatabaseChange(): Promise<boolean>;
  /**
   * This (recommended) method uses keychain instead of localauth so the passcode fallback can be used.
   */
  verifyFingerprint(options: VerifyFingerprintOptions): Promise<any>;

  /**
   * This implementation uses LocalAuthentication and has no built-in passcode fallback on iOS.
   * On Android this is exactly the same as 'verifyFingerprint'
   */
  verifyFingerprintWithCustomFallback(options: VerifyFingerprintWithCustomFallbackOptions): Promise<any>;
}