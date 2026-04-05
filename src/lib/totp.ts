import { createHmac } from "crypto";

function normalizeBase32(input: string) {
  return input.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
}

function decodeBase32(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = normalizeBase32(input);
  let bits = "";

  for (const char of normalized) {
    const value = alphabet.indexOf(char);
    if (value === -1) {
      throw new Error("Invalid TOTP secret");
    }
    bits += value.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

function generateTotpAt(secret: string, timestamp: number, stepSeconds = 30) {
  const key = decodeBase32(secret);
  const counter = Math.floor(timestamp / 1000 / stepSeconds);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return String(code % 1_000_000).padStart(6, "0");
}

export function isAdminMfaEnabled() {
  return Boolean(process.env.ADMIN_TOTP_SECRET);
}

export function buildAdminTotpUri() {
  const secret = process.env.ADMIN_TOTP_SECRET;
  if (!secret) {
    return null;
  }

  const issuer = process.env.NEXT_PUBLIC_SITE_NAME || "CyberNoir";
  const accountName =
    process.env.ADMIN_EMAIL ||
    process.env.ADMIN_USERNAME ||
    "admin@cybernoir.local";

  return `otpauth://totp/${encodeURIComponent(`${issuer}:${accountName}`)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(secret: string, otp: string, skewWindows = 1) {
  try {
    const normalizedOtp = otp.trim();
    if (!/^\d{6}$/.test(normalizedOtp)) {
      return false;
    }

    const currentTime = Date.now();
    for (let offset = -skewWindows; offset <= skewWindows; offset += 1) {
      const candidate = generateTotpAt(secret, currentTime + offset * 30_000);
      if (candidate === normalizedOtp) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
