// One record per student, keyed by email:
// { email, name, phone, passwordHash, passwordExpiresAt }
const usersByEmail = new Map();

export const userStore = {
  findByEmail: (email) => usersByEmail.get(email),
  findByPhone: (phone) => [...usersByEmail.values()].find((user) => user.phone === phone),
  save(user) {
    usersByEmail.set(user.email, user);
    return user;
  },
};
