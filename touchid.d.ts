declare module "nativescript-touchid" {

  export interface VerifyFingerprintOptions {
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

  /**
   * Sets text on the clipboard, replacing anything currently on there.
   */
  export function available(): Promise<boolean>;

  /**
   * Gets any currently present text from the clipboard.
   */
  export function verifyFingerprint(options: VerifyFingerprintOptions): Promise<string>;
}