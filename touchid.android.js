exports.available = function () {
  return new Promise(function (resolve, reject) {
    resolve(false);
  });
};

// shouldn't be called anyway because 'available' returned false
exports.verifyFingerprint = function () {
  return new Promise(function (resolve, reject) {
    reject("Not available");
  });
};