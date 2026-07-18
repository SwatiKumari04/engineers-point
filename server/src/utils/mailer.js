import nodemailer from "nodemailer";
import { config } from "../config.js";
import { ApiError } from "./api-error.js";

const transporter = config.smtp.host
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
      // Fail fast instead of hanging for minutes when the SMTP
      // connection is blocked (Render's free tier drops these ports).
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
    })
  : null;

// Brevo delivers over HTTPS (port 443), which hosts never block.
async function sendViaBrevo(to, subject, text) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": config.brevo.apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Engineer's Point", email: config.brevo.sender },
      to: [{ email: to }],
      subject,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Brevo API ${res.status}: ${body}`);
    let detail = "";
    try {
      detail = JSON.parse(body).message ?? "";
    } catch {
      // Non-JSON body; the full text is already logged above.
    }
    // Surfaced as 502: the failure is in the upstream email service,
    // and its status plus message is what operators need to fix it.
    throw new ApiError(502, "EMAIL_SEND_FAILED",
      `Email service rejected the request (${res.status}${detail ? `: ${detail}` : ""})`);
  }
}

// Returns true if the mail was actually sent, false in dev mode (no
// email provider configured). Brevo takes priority over SMTP.
export async function sendPasswordEmail(to, password) {
  const subject = "Engineer's Point login password";
  const text = `Your one-time login password is ${password}. It is valid for 10 minutes.`;
  if (config.brevo.apiKey) {
    await sendViaBrevo(to, subject, text);
    return true;
  }
  if (transporter) {
    await transporter.sendMail({ from: config.smtp.from, to, subject, text });
    return true;
  }
  console.log(`No email provider configured. Login password for ${to}: ${password}`);
  return false;
}
