# Engineers Point

Night canteen ordering app - students order from their hostel
rooms, pay by UPI QR, and pick up when the owner marks the order READY.

**Live:** https://engineers-point-4zxa.onrender.com 

- **Flash sale system** - concurrent buy clicks are serialized through a per-sale
  FIFO lock, so limited stock can never be oversold. Proven by a test firing
  25 simultaneous requests at 5 units: exactly 5 succeed.
- **Email OTP login** - a hashed one-time password is mailed to your college email;
  email + phone are bound as one identity.
- **Owner dashboard** - live orders, out-of-stock control, flash sale launcher.
  Try it: Admin Login with `admin@nitjsr`.