import { Observable } from "data/observable";
import { alert } from "ui/dialogs";
import { FingerprintAuth } from "nativescript-fingerprint-auth";

export class HelloWorldModel extends Observable {
  private fingerprintAuth: FingerprintAuth;

  constructor() {
    super();
    this.fingerprintAuth = new FingerprintAuth();
  }

  public doCheckAvailable(): void {
    this.fingerprintAuth.available().then(
        (avail: boolean) => {
          alert({
            title: "Fingerprint scanner available?",
            message: avail ? "YES" : "NO",
            okButtonText: "OK"
          });
        }
    );
  }

  public doCheckFingerprintsChanged(): void {
    this.fingerprintAuth.didFingerprintDatabaseChange().then(
        (changed: boolean) => {
          alert({
            title: "Fingerprint DB changed?",
            message: changed ? "YES" : "NO",
            okButtonText: "OK"
          });
        }
    );
  }

  public doVerifyFingerprint(): void {
    this.fingerprintAuth.verifyFingerprint({
      message: 'Scan yer finger' // optional
    }).then(
        () => {
          alert({
            title: "Fingerprint / passcode OK",
            okButtonText: "Sweet"
          });
        },
        () => {
          alert({
            title: "Fingerprint NOT OK / canceled",
            okButtonText: "Mmkay"
          });
        }
    );
  }

  public doVerifyFingerprintWithCustomFallback(): void {
    this.fingerprintAuth.verifyFingerprintWithCustomFallback({
      message: 'Scan yer finger', // optional
      fallbackMessage: 'Enter PIN' // optional
    }).then(
        () => {
          alert({
            title: "Fingerprint OK",
            okButtonText: "Sweet"
          });
        },
        (error) => {
          alert({
            title: "Fingerprint NOT OK",
            message: (error.code === -3 ? "Show custom fallback" : error.message),
            okButtonText: "Mmkay"
          });
        }
    );
  }
}