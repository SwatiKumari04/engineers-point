// All environment variables are read here and nowhere else.
export const config = {
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  adminId: process.env.ADMIN_ID ?? "admin@nitjsr",
  // In production the same server also serves the built client.
  serveClient: process.env.NODE_ENV === "production",
  // Brevo HTTP API for sending login passwords. Render's free tier blocks
  // outbound SMTP ports (25/465/587), so production mail must go over HTTPS.
  brevo: {
    apiKey: process.env.BREVO_API_KEY ?? "",
    sender: process.env.BREVO_SENDER || process.env.MAIL_FROM || "",
  },
  // SMTP fallback for local use. Empty host means dev mode:
  // the password is returned in the response instead of emailed.
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@engineers-point.local",
  },
};
