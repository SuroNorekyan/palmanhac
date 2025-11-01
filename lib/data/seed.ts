import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../security/password.ts";
import { parseMockItems } from "./mockItemParser.ts";

const prisma = new PrismaClient();

export async function seedProducts() {
  const items = await parseMockItems();
  await prisma.product.deleteMany();

  for (const item of items) {
    await prisma.product.create({
      data: {
        slug: item.slug,
        category: item.category,
        name: item.name,
        priceCents: item.priceCents,
        image: item.image,
        galleryImages: [item.image],
        volumeMl: item.volumeMl,
        abv: item.abv,
        descriptionEn: item.description.en,
        descriptionPt: item.description.pt,
        details: item.details,
        stock: 100,
        isActive: true,
      },
    });
  }
}

async function seedAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@palmanhac.pt")
    .trim()
    .toLowerCase();
  const adminName = (process.env.ADMIN_NAME ?? "Palmanhac Admin").trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminPassword) {
    console.warn("⚠️  Skipping admin seed: ADMIN_PASSWORD not set.");
    return;
  }

  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash, role: Role.ADMIN },
    create: { email: adminEmail, name: adminName, passwordHash, role: Role.ADMIN },
  });

  console.info(`✅ Admin user ensured for ${adminEmail} (password hash stored).`);
}

(async () => {
  try {
    await seedProducts();
    await seedAdminUser();
    console.info("✅ Database seeded successfully with mock items and admin user.");
  } catch (err) {
    console.error("❌ Failed to seed database:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
