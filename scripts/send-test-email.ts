// scripts/send-test-email.ts
import "dotenv/config";
import { formatEmailBlock, sendEmail } from "../lib/email/mailer.ts";

const recipient = process.env.TEST_EMAIL_TO || "suren.norekyan123@gmail.com";

async function main() {
  await sendEmail({
    to: recipient,
    subject: "Palmanhac test email",
    text: formatEmailBlock([
      "Hello!",
      "",
      "This is an automated test to verify the Palmanhac mailer configuration.",
      `Timestamp: ${new Date().toISOString()}`,
      "",
      "If you received this message, the nodemailer setup is working.",
    ]),
  });

  console.log(`Test email dispatched to ${recipient}`);
}

main().catch((error) => {
  console.error("Failed to send test email:", error);
  process.exitCode = 1;
});
