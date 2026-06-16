const SESSION_COOKIE = "apo_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24時間

async function importHmacKey(secret: string) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i]! ^ bb[i]!;
  return diff === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${expiresAt}`;
  const signature = await hmacHex(secret, payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) return false;
    const payload = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);
    if (!payload || !signature) return false;

    const expiresAt = Number(payload);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const expected = await hmacHex(secret, payload);
    return timingSafeEqualStrings(expected, signature);
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
