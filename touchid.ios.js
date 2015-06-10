var keychainItemIdentifier = "TouchIDKey";
var keychainItemServiceName = null;

var available = function () {
  return new Promise(function (resolve, reject) {
    try {
      resolve(
          LAContext.alloc().init().canEvaluatePolicyError(
              LAPolicyDeviceOwnerAuthenticationWithBiometrics, null));
    } catch (ex) {
      console.log("Error in touchid.available: " + ex);
      resolve(false);
    }
  });
};

var verifyFingerprint = function (arg) {
  return new Promise(function (resolve, reject) {
    try {

      //if (!available()) {
      //  reject("No TouchID available");
      //} else {

      if (keychainItemServiceName == null) {
        var bundleID = NSBundle.mainBundle().infoDictionary.objectForKey("CFBundleIdentifier");
        keychainItemServiceName = bundleID + ".TouchID";
      }
      console.log("keychainItemServiceName: " + keychainItemServiceName);

      if (!createKeyChainEntry()) {
        console.log("Keychain trouble. Falling back to verifyFingerprintWithCustomPasswordFallback.");
        verifyFingerprintWithCustomPasswordFallback(arg);
      } else {

        var message = arg != null && arg.message || "Scan your finger";
        console.log("message: " + message);

        var query = NSMutableDictionary.alloc().init();
        query.setObjectForKey(kSecClassGenericPassword, kSecClass);
        query.setObjectForKey(keychainItemIdentifier, kSecAttrAccount);
        query.setObjectForKey(keychainItemServiceName, kSecAttrService);
        query.setObjectForKey(message, kSecUseOperationPrompt);

        console.log("query: " + query);

        // Start the query and the fingerprint scan and/or device passcode validation
        var res = SecItemCopyMatching(query, null);
        resolve(res == noErr);
      }
      //}

    } catch (ex) {
      console.log("Error in touchid.verifyFingerprint: " + ex);
      reject(ex);
    }
  });
};

var verifyFingerprintWithCustomPasswordFallback = function (arg) {
  return new Promise(function (resolve, reject) {
    try {
      if (available()) {
        var message = arg != null && arg.message || "Scan your finger";
        var callback = function(authOK, error) {
          console.log("Fingerprint scanned ok? " + authOK); // TODO this is called, but..
          resolve(authOK); // .. this is never called!
        };
        LAContext.alloc().init().evaluatePolicyLocalizedReasonReply(
            LAPolicyDeviceOwnerAuthenticationWithBiometrics, message, callback);
      } else {
        reject("No TouchID available");
      }
    } catch (ex) {
      console.log("Error in touchid.verifyFingerprintWithCustomPasswordFallback: " + ex);
      reject(ex);
    }
  });
};

var createKeyChainEntry = function () {
  var attributes = NSMutableDictionary.alloc().init();
  attributes.setObjectForKey(kSecClassGenericPassword, kSecClass);
  attributes.setObjectForKey(keychainItemIdentifier, kSecAttrAccount);
  attributes.setObjectForKey(keychainItemServiceName, kSecAttrService);

  console.log("keychain attributes: " + attributes);

  var accessControlRef = SecAccessControlCreateWithFlags(
      kCFAllocatorDefault,
      kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
      kSecAccessControlUserPresence,
      null
  );
  if (accessControlRef == null) {
    console.log("Can't store identifier '" + keychainItemIdentifier + "' in the KeyChain: " + accessControlError + ".");
    return false;
  } else {
    attributes.setObjectForKey(accessControlRef, kSecAttrAccessControl);
    attributes.setObjectForKey(true, kSecUseNoAuthenticationUI);
    // The content of the password is not important
    attributes.setObjectForKey("dummy content", kSecValueData);
    SecItemAdd(attributes, null);
    return true;
  }
};

exports.available = available;
exports.verifyFingerprint = verifyFingerprint;
exports.verifyFingerprintWithCustomPasswordFallback = verifyFingerprintWithCustomPasswordFallback;