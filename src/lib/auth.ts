const SESSION_COOKIE = "apo_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 1週間

async function hmac(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("hex");
}

export async function createSessionToken(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${expiresAt}`;
  const signature = await hmac(secret, payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return false;

    const expiresAt = Number(payload);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    const expected = await hmac(secret, payload);
    return expected === signature;
  } catch {
    return false;
  }
}

export { SESSION_COOKIE };
