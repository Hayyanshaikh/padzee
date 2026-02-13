import FingerprintJS from "@fingerprintjs/fingerprintjs";

export async function getBrowserFingerprint(): Promise<string> {
  if (typeof window !== "undefined") {
    const override = (window as unknown as { __TEST_FINGERPRINT__?: string })
      .__TEST_FINGERPRINT__;
    if (typeof override === "string" && override.trim()) {
      return override.trim();
    }

    const shouldFail = (
      window as unknown as { __TEST_FINGERPRINT_FAIL__?: boolean }
    ).__TEST_FINGERPRINT_FAIL__;
    if (shouldFail) {
      throw new Error("Fingerprint disabled for tests");
    }
  }

  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}
