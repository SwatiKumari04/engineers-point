import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url");
const sign = (data) => createHmac("sha256", config.jwtSecret).update(data).digest("base64url");

// Minimal HS256 JSON Web Token: header.payload.signature — no external library.
export function signToken(payload, ttlMs = 7 * 24 * 60 * 60_000) {
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ ...payload, exp: Date.now() + ttlMs });
  return `${header}.${body}.${sign(`${header}.${body}`)}`;
}

export function verifyToken(token) {
  const [header, body, signature] = String(token).split(".");
  if (!header || !body || !signature) return null;
  const expected = sign(`${header}.${body}`);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  // constant-time signature check (same reason as scrypt's timingSafeEqual)
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp && Date.now() > payload.exp) return null; // expired
  return payload;
}