import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function vaultKey() {
  const secret = (process.env.AUTH_SECRET || process.env.CLOUDFLARE_API_TOKEN || "KEYLINK360-dev").trim();
  return createHash("sha256").update(`key-dns-vault:${secret}`).digest();
}

/** Encrypt a provider secret at rest (AES-256-GCM). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", vaultKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted secret format.");
  }
  const decipher = createDecipheriv("aes-256-gcm", vaultKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}
