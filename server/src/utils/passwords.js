import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

// 6-digit one-time password, generated with a cryptographic RNG.
export const generatePassword = () => String(randomInt(100000, 1000000));

// scrypt is built into Node, so no bcrypt dependency is needed.
// Stored format is "salt:hash".
export const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
};

// timingSafeEqual avoids leaking information through comparison time.
export const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(scryptSync(password, salt, 32), Buffer.from(hash, "hex"));
};
