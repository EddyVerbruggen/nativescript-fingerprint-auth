declare module "nativescript-touchid" {

  export interface VerifyFingerprintOptions {
    /**
     * The optional message in the fingerprint dialog on ios and page description on android.
     * Default: 'Scan your finger'.
     */
    message?: string;

    /**
     * The optional title in the fingerprint page for android.
     * Default: 'We are doing this for your own security'.
     */

    title?: string;
  }

  export interface verifyFingerprintWithCustomFallbackOptions {
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
  }

  export function available(): Promise<boolean>;
  export function didFingerprintDatabaseChange(): Promise<boolean>;
  export function verifyFingerprint(options: VerifyFingerprintOptions): Promise<string>;
  export function verifyFingerprintWithCustomFallback(options: verifyFingerprintWithCustomFallbackOptions): Promise<string>;
}