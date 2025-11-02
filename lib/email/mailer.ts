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

    if (!host || !portRaw) {
      throw new EmailConfigurationError("SMTP_HOST and SMTP_PORT must be configured.");
    }

    const port = Number.parseInt(portRaw, 10);
    if (!Number.isInteger(port)) {
      throw new EmailConfigurationError("SMTP_PORT must be a valid integer port number.");
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.verify().catch((error: unknown) => {
      console.warn("[Email] Transport verification failed", error);
    });

    return transporter;
  })();

  return transporterPromise;
};

export const sendEmail = async ({ to, subject, text, html }: EmailMessage) => {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    throw new EmailConfigurationError("EMAIL_FROM must be configured.");
  }

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
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) {
    throw new EmailConfigurationError("ADMIN_EMAIL must be configured.");
  }
  await sendEmail({ to: adminEmail, subject, text, html });
};

export const formatEmailBlock = (lines: string[]) => lines.filter(Boolean).join("\n");
