var FingerprintAuth = require("nativescript-fingerprint-auth").FingerprintAuth;
var fingerprintAuth = new FingerprintAuth();

describe("available", function () {
  it("exists", function () {
    expect(fingerprintAuth.available).toBeDefined();
  });

  it("returns a promise", function () {
    expect(fingerprintAuth.available()).toEqual(jasmine.any(Promise));
  });
});

describe("verifyFingerprint", function () {
  it("exists", function () {
    expect(fingerprintAuth.verifyFingerprint).toBeDefined();
  });

  it("returns a promise", function () {
    expect(fingerprintAuth.verifyFingerprint()).toEqual(jasmine.any(Promise));
  });
});

describe("verifyFingerprintWithCustomFallback", function () {
  it("exists", function () {
    expect(fingerprintAuth.verifyFingerprintWithCustomFallback).toBeDefined();
  });

  it("returns a promise", function () {
    expect(fingerprintAuth.verifyFingerprintWithCustomFallback()).toEqual(jasmine.any(Promise));
  });
});

describe("didFingerprintDatabaseChange", function () {
  it("exists", function () {
    expect(fingerprintAuth.didFingerprintDatabaseChange).toBeDefined();
  });

  it("returns a promise", function () {
    expect(fingerprintAuth.didFingerprintDatabaseChange()).toEqual(jasmine.any(Promise));
  });
});
