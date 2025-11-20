// lib/email/mailer.ts
import nodemailer from "nodemailer";

export class EmailConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailConfigurationError";
  }
}

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

const resolveTransporter = async () => {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    const host = process.env.SMTP_HOST?.trim();
    const portRaw = process.env.SMTP_PORT?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (!host || !portRaw || !user || !pass) {
      throw new EmailConfigurationError(
        "SMTP is not fully configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS env variables.",
      );
    }

    const port = Number.parseInt(portRaw, 10);
    if (!Number.isInteger(port)) {
      throw new EmailConfigurationError("SMTP_PORT must be a valid integer port number.");
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465 (SSL), false for 587 (TLS STARTTLS)
      auth: {
        user,
        pass,
      },
    });

    try {
      await transporter.verify();
      console.log("[Email] SMTP transport verified successfully");
    } catch (error) {
      console.error("[Email] SMTP transport verification failed", error);
      throw new EmailConfigurationError(
        "Failed to verify SMTP connection. Check your SMTP_* env vars.",
      );
    }

    return transporter;
  })();

  return transporterPromise;
};

export const sendEmail = async ({ to, subject, text, html }: EmailMessage) => {
  const from =
    process.env.EMAIL_FROM?.trim() ??
    process.env.ADMIN_EMAIL?.trim() ??
    "no-reply@palmanhac-shop.pt";

  const transporter = await resolveTransporter();

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

export const sendAdminEmail = async ({
  subject,
  text,
  html,
}: Omit<EmailMessage, "to">) => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || "suren.norekyan123@gmail.com";
  await sendEmail({ to: adminEmail, subject, text, html });
};

export const formatEmailBlock = (lines: string[]) => lines.filter(Boolean).join("\n");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toHtmlWithBold = (line: string) => {
  const boldPattern = /\*\*(.+?)\*\*/g;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = boldPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(line.slice(lastIndex, match.index));
    }
    const boldText = match[1] ?? "";
    result += `<strong>${escapeHtml(boldText)}</strong>`;
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < line.length) {
    result += escapeHtml(line.slice(lastIndex));
  }
  if (!result) {
    result = escapeHtml(line);
  }
  return result;
};

export const formatEmailHtml = (lines: string[]) => {
  return lines
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;">${toHtmlWithBold(line)}</p>`
        : `<p style="margin:0 0 10px;font-size:14px;line-height:1.6;">&nbsp;</p>`,
    )
    .join("");
};
