import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "@/lib/security/password";

if (typeof process.loadEnvFile === "function") {
  process.loadEnvFile();
}

const prisma = new PrismaClient();

type ArgumentMap = {
  email?: string;
  password?: string;
  name?: string;
};

const parseArgs = (): ArgumentMap => {
  const result: ArgumentMap = {};
  for (const raw of process.argv.slice(2)) {
    if (!raw.startsWith("--")) continue;
    const [key, value = ""] = raw.slice(2).split("=");
    if (!key) continue;
    if (key === "email" || key === "password" || key === "name") {
      result[key] = value;
    }
  }
  return result;
};

async function ensureAdmin() {
  const args = parseArgs();
  const rawEmail = args.email ?? process.env.ADMIN_EMAIL ?? "";
  const rawPassword = args.password ?? process.env.ADMIN_PASSWORD ?? "";
  const rawName = args.name ?? process.env.ADMIN_NAME ?? "Palmanhac Admin";

  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword.trim();
  const name = rawName.trim();

  if (!email || !password) {
    console.error(
      "❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD. Provide them in the environment or via --email= and --password= flags.",
    );
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email,
      name,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.info(`✅ Admin user ensured for ${email}.`);
}

ensureAdmin()
  .catch((error) => {
    console.error("❌ Failed to create admin user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
