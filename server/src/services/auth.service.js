import { ApiError } from "../utils/api-error.js";
import { sendPasswordEmail } from "../utils/mailer.js";
import { generatePassword, hashPassword, verifyPassword } from "../utils/passwords.js";
import { userStore } from "../stores/user.store.js";

const PASSWORD_TTL_MS = 10 * 60_000;

// An email and a phone number form one identity. Once paired, using either
// one with a different partner is rejected as invalid credentials.
const assertPairIsConsistent = (email, phone) => {
  const byEmail = userStore.findByEmail(email);
  if (byEmail && byEmail.phone !== phone) {
    throw ApiError.unauthorized("Invalid credentials", "EMAIL_PHONE_MISMATCH");
  }
  const byPhone = userStore.findByPhone(phone);
  if (byPhone && byPhone.email !== email) {
    throw ApiError.unauthorized("Invalid credentials", "EMAIL_PHONE_MISMATCH");
  }
};

export const authService = {
  async requestPassword({ name, email, phone }) {
    email = email.toLowerCase();
    assertPairIsConsistent(email, phone);

    const password = generatePassword();
    userStore.save({
      email,
      name,
      phone,
      passwordHash: hashPassword(password),
      passwordExpiresAt: Date.now() + PASSWORD_TTL_MS,
    });

    const delivered = await sendPasswordEmail(email, password);
    // Dev mode (no SMTP): return the password so the app stays usable.
    return delivered ? { sent: true } : { sent: false, devPassword: password };
  },

  login({ email, phone, password }) {
    const user = userStore.findByEmail(email.toLowerCase());
    if (!user || user.phone !== phone) {
      throw ApiError.unauthorized("Invalid credentials");
    }
    if (Date.now() > user.passwordExpiresAt) {
      throw ApiError.unauthorized("Password expired, request a new one", "PASSWORD_EXPIRED");
    }
    if (!verifyPassword(password, user.passwordHash)) {
      throw ApiError.unauthorized("Invalid credentials");
    }
    return { name: user.name, email: user.email, phone: user.phone, role: "student" };
  },
};
