exports.available = function () {
  return new Promise(function (resolve, reject) {
    resolve(false);
  });
};

exports.verifyFingerprint = function () {
  return new Promise(function (resolve, reject) {
    reject("Not available");
  });
};