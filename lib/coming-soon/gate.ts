export const comingSoonCookieName = "mb_gate";

function bytesToBase64(bytes: Uint8Array): string {
  // Prefer Buffer when available (Node), otherwise use btoa (Edge/Web).
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replaceAll("-", "+").replaceAll("_", "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const withPadding = padded + "=".repeat(padLen);
  return base64ToBytes(withPadding);
}

async function hmacSha256Base64Url(
  secret: string,
  message: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );

  return base64UrlEncode(new Uint8Array(sig));
}

export async function createComingSoonCookieValue(params: {
  secret: string;
  token: string;
}): Promise<string> {
  const signature = await hmacSha256Base64Url(params.secret, params.token);
  return `${params.token}.${signature}`;
}

export async function verifyComingSoonCookieValue(params: {
  secret: string;
  value: string | undefined;
}): Promise<boolean> {
  if (!params.value) return false;

  const dot = params.value.indexOf(".");
  if (dot <= 0) return false;

  const token = params.value.slice(0, dot);
  const providedSig = params.value.slice(dot + 1);
  if (!token || !providedSig) return false;

  // Validate base64url-ish (avoid weird cookie values / parser edge cases)
  try {
    base64UrlDecode(token);
    base64UrlDecode(providedSig);
  } catch {
    return false;
  }

  const expectedSig = await hmacSha256Base64Url(params.secret, token);
  return expectedSig === providedSig;
}

