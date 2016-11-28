var utils = require("utils/utils");

var keychainItemIdentifier = "TouchIDKey";
var keychainItemServiceName = null;

var available = function () {
  return new Promise(function (resolve, reject) {
    try {
      resolve(
          LAContext.new().canEvaluatePolicyError(
              LAPolicyDeviceOwnerAuthenticationWithBiometrics, null));
    } catch (ex) {
      console.log("Error in fingerprint-auth.available: " + ex);
      resolve(false);
    }
  });
};

var didFingerprintDatabaseChange = function () {
  return new Promise(function (resolve, reject) {
    try {
      var laContext = LAContext.new();

      // we expect the dev to have checked 'isAvailable' already so this should not return an error,
      // we do however need to run canEvaluatePolicy here in order to get a non-nil evaluatedPolicyDomainState
      if (!laContext.canEvaluatePolicyError(LAPolicyDeviceOwnerAuthenticationWithBiometrics, null)) {
        reject("Not available");
        return;
      }

      // only supported on iOS9+, so check this.. if not supported just report back as false
      if (utils.ios.MajorVersion < 9) {
        resolve(false);
        return;
      }

      var FingerprintDatabaseStateKey = "FingerprintDatabaseStateKey";
      var state = laContext.evaluatedPolicyDomainState;
      if (state !== null) {
        var stateStr = state.base64EncodedStringWithOptions(0);
        var standardUserDefaults = utils.ios.getter(NSUserDefaults, NSUserDefaults.standardUserDefaults);
        var storedState = standardUserDefaults.stringForKey(FingerprintDatabaseStateKey);

        // Store enrollment
        standardUserDefaults.setObjectForKey(stateStr, FingerprintDatabaseStateKey);
        standardUserDefaults.synchronize();

        // whenever a finger is added/changed/removed the value of the storedState changes,
        // so compare agains a value we previously stored in the context of this app
        var changed = storedState !== null && stateStr !== storedState;
        resolve(changed);
      }
    } catch (ex) {
      console.log("Error in fingerprint-auth.didFingerprintDatabaseChange: " + ex);
      resolve(false);
    }
  });
};

/**
 * this 'default' method uses keychain instead of localauth so the passcode fallback can be used
 */
var verifyFingerprint = function (arg) {
  return new Promise(function (resolve, reject) {
    try {

      if (keychainItemServiceName === null) {
        var bundleID = utils.ios.getter(NSBundle, NSBundle.mainBundle).infoDictionary.objectForKey("CFBundleIdentifier");
        keychainItemServiceName = bundleID + ".TouchID";
      }

      if (!createKeyChainEntry()) {
        verifyFingerprintWithCustomFallback(arg).then(resolve, reject);
        return;
      }

      var message = arg !== null && arg.message || "Scan your finger";
      var query = NSMutableDictionary.new();
      query.setObjectForKey(kSecClassGenericPassword, kSecClass);
      query.setObjectForKey(keychainItemIdentifier, kSecAttrAccount);
      query.setObjectForKey(keychainItemServiceName, kSecAttrService);
      query.setObjectForKey(message, kSecUseOperationPrompt);

      // Start the query and the fingerprint scan and/or device passcode validation
      var res = SecItemCopyMatching(query, null);
      if (res === 0) { // 0 = ok (match, not canceled)
        resolve();
      } else {
        reject(res);
      }

    } catch (ex) {
      console.log("Error in fingerprint-auth.verifyFingerprint: " + ex);
      reject(ex);
    }
  });
};

/**
 * This implementation uses LocalAuthentication and has no built-in passcode fallback
 */
var verifyFingerprintWithCustomFallback = function (arg) {
  return new Promise(function (resolve, reject) {
    try {
      var laContext = LAContext.new();
      if (!laContext.canEvaluatePolicyError(LAPolicyDeviceOwnerAuthenticationWithBiometrics, null)) {
        reject("Not available");
        return;
      }

      var message = arg !== null && arg.message || "Scan your finger";
      if (arg !== null && arg.fallbackMessage) {
        laContext.localizedFallbackTitle = arg.fallbackMessage;
      }
      laContext.evaluatePolicyLocalizedReasonReply(
          LAPolicyDeviceOwnerAuthenticationWithBiometrics,
          message,
          function (ok, error) {
            if (ok) {
              resolve(ok);
            } else {
              reject(error);
            }
          }
      );
    } catch (ex) {
      console.log("Error in fingerprint-auth.verifyFingerprint: " + ex);
      reject(ex);
    }
  });
};

var createKeyChainEntry = function () {
  var attributes = NSMutableDictionary.new();
  attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
  attributes.setObjectForKey(keychainItemIdentifier, kSecAttrAccount);
  attributes.setObjectForKey(keychainItemServiceName, kSecAttrService);

  var accessControlRef = SecAccessControlCreateWithFlags(
      kCFAllocatorDefault,
      kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
      //kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
      kSecAccessControlUserPresence,
      null
  );
  if (accessControlRef === null) {
    console.log("Can't store identifier '" + keychainItemIdentifier + "' in the KeyChain: " + accessControlError + ".");
    return false;
  } else {
    attributes.setObjectForKey(accessControlRef, kSecAttrAccessControl);
    attributes.setObjectForKey(1, kSecUseNoAuthenticationUI);
    // The content of the password is not important
    var htmlString = NSString.stringWithString("dummy content");
    var nsData = htmlString.dataUsingEncoding(NSUTF8StringEncoding);
    attributes.setObjectForKey(nsData, kSecValueData);

    console.log("keychain attributes: " + attributes);

    SecItemAdd(attributes, null);
    return true;
  }
};

exports.available = available;
exports.didFingerprintDatabaseChange = didFingerprintDatabaseChange;
exports.verifyFingerprint = verifyFingerprint;
exports.verifyFingerprintWithCustomFallback = verifyFingerprintWithCustomFallback;