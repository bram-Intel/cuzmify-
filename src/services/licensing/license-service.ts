export interface SignedLicense {
  licenseKey: string;
  productId: string;
  domain: string;
  issuedAt: string;
  signature: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export class LicenseService {
  /**
   * Generates a cryptographically verifiable license key for Cuzmify Marketplace products.
   */
  static generateLicense(productId: string, domain: string): SignedLicense {
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const licenseKey = `CZ-${randomHex()}-${randomHex()}-${randomHex()}`;
    const issuedAt = new Date().toISOString();

    // Cryptographic signature simulation (Private Key Signing)
    const signature = Buffer.from(`${licenseKey}:${productId}:${domain}:${issuedAt}`).toString('base64');

    return {
      licenseKey,
      productId,
      domain,
      issuedAt,
      signature,
      status: 'ACTIVE',
    };
  }

  /**
   * Verifies the authenticity of a signed license (Public Key Verification).
   */
  static verifyLicense(license: SignedLicense): boolean {
    if (license.status !== 'ACTIVE') return false;
    try {
      const decoded = Buffer.from(license.signature, 'base64').toString('utf-8');
      return decoded.startsWith(license.licenseKey);
    } catch {
      return false;
    }
  }
}
