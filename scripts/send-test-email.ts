// scripts/send-test-email.ts
import "dotenv/config";
import { formatEmailBlock, formatEmailHtml, sendEmail } from "../lib/email/mailer.ts";

const recipient = "suren.norekyan123@gmail.com";

async function main() {
  const timestamp = new Date().toISOString();
  const previewId = `T-${timestamp.replace(/\D/g, "").slice(-6)}`;
  const lines = [
    "**Palmanhac formatted email test**",
    "",
    `**Order number:** #${previewId}`,
    `**Total amount:** €42.50`,
    "",
    "This automated test verifies that bold formatting now renders correctly in Palmanhac order notifications.",
    "",
    "Obrigado / Thank you,",
    "**Palmanhac Team**",
    "",
    `Sent at ${timestamp}`,
  ];

  await sendEmail({
    to: recipient,
    subject: "Palmanhac formatted email test",
    text: formatEmailBlock(lines),
    html: formatEmailHtml(lines),
  });

  console.log(`Formatted test email dispatched to ${recipient}`);
}

main().catch((error) => {
  console.error("Failed to send test email:", error);
  process.exitCode = 1;
});
