import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { authenticator } from "otplib";
import QRCode from "qrcode";

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const ISSUER = "Palmanhac";

const resolveEncryptionKey = () => {
  const secret = process.env.TOTP_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOTP_ENCRYPTION_KEY is not configured.");
  }
  return createHash("sha256").update(secret).digest();
};

export const encryptSecret = (secret: string): string => {
  const key = resolveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

export const decryptSecret = (payload: string): string => {
  const key = resolveEncryptionKey();
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const data = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

  return decrypted.toString("utf8");
};

export const generateTwoFASecret = (email: string) => {
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(email, ISSUER, secret);
  return { secret, otpauth };
};

export const generateQRCodeDataUrl = async (otpauth: string) => {
  return QRCode.toDataURL(otpauth, {
    errorCorrectionLevel: "M",
    width: 240,
  });
};

const formatRecoveryCode = (buffer: Buffer) => {
  const base32 = buffer.toString("hex").toUpperCase();
  return `${base32.slice(0, 4)}-${base32.slice(4, 8)}-${base32.slice(8, 12)}`;
};

export const generateRecoveryCodes = async (count = 8) => {
  const codes: string[] = [];
  const hashes: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const raw = randomBytes(6);
    const code = formatRecoveryCode(raw);
    codes.push(code);
    hashes.push(await bcrypt.hash(code, 12));
  }

  return { codes, hashes };
};

export const verifyTotpToken = (token: string, secret: string) => {
  return authenticator.check(token, secret);
};

export const matchRecoveryCodeIndex = async (code: string, hashes: string[]) => {
  for (const [index, hash] of hashes.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const match = await bcrypt.compare(code, hash);
    if (match) {
      return index;
    }
  }
  return -1;
};
