import { getDb } from "../db.js";

const users = () => getDb().collection("users");

export const userStore = {
  findByEmail: (email) => users().findOne({ email }, { projection: { _id: 0 } }),

  findByPhone: (phone) => users().findOne({ phone }, { projection: { _id: 0 } }),

  // Upsert by email: creates the user if new, updates them if they already
  // exist (e.g. requesting a fresh OTP). Keyed by email, so no duplicates.
  async save(user) {
    await users().updateOne({ email: user.email }, { $set: user }, { upsert: true });
    return user;
  },
};