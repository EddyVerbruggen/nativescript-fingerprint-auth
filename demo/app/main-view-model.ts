import { Observable } from "tns-core-modules/data/observable";
import { alert } from "tns-core-modules/ui/dialogs";
import { FingerprintAuth } from "nativescript-fingerprint-auth";

export class HelloWorldModel extends Observable {
  private fingerprintAuth: FingerprintAuth;
  public status: string = 'STATUS';

  constructor() {
    super();
    this.fingerprintAuth = new FingerprintAuth();
  }

  public doCheckAvailable(): void {
    this.fingerprintAuth.available().then(
      (avail: boolean) => {
        // In order to test it in webpacked app
        this.set('status', "Fingerprint scanner available? - " + (avail ? "YES" : "NO"));
      }
    );
  }

  public doCheckFingerprintsChanged(): void {
    this.fingerprintAuth.didFingerprintDatabaseChange().then(
      (changed: boolean) => {
        this.set('status', "Fingerprint DB changed? - " + (changed ? "YES" : "NO"));
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