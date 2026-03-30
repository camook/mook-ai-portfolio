// ─── ULID generator ──────────────────────────────────────────────────────────
// Crockford base-32 alphabet
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(): string {
  let t = Date.now();
  let ts = "";
  for (let i = 9; i >= 0; i--) {
    ts = B32[t % 32] + ts;
    t = Math.floor(t / 32);
  }
  const rand = new Uint8Array(10);
  crypto.getRandomValues(rand);
  let rs = "";
  let buf = 0,
    bits = 0,
    idx = 0;
  for (let i = 0; i < 16; i++) {
    while (bits < 5) {
      buf = (buf << 8) | rand[idx++];
      bits += 8;
    }
    bits -= 5;
    rs += B32[(buf >> bits) & 31];
  }
  return ts + rs;
}

// ─── Request body parsing ────────────────────────────────────────────────────

/** Parses the JSON body of a request. Returns null if the body is not valid JSON. */
export async function parseJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
