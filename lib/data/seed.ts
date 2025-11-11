import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../security/password.ts";
import { parseMockItems } from "./mockItemParser.ts";

const prisma = new PrismaClient();
const PUBLIC_ASSETS_ROOT = path.join(process.cwd(), "public", "assets");

export async function seedProducts() {
  const items = await parseMockItems();
  await prisma.orderItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await fs.mkdir(PUBLIC_ASSETS_ROOT, { recursive: true });

  for (const item of items) {
    if (item.imageSourcePath) {
      const targetRelative = item.image.replace(/^\/assets\//, "");
      const targetPath = path.join(PUBLIC_ASSETS_ROOT, targetRelative);
      await fs.copyFile(item.imageSourcePath, targetPath);
    }

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
