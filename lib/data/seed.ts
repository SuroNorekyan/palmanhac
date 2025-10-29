import { PrismaClient } from "@prisma/client";
import { parseMockItems } from "./mockItemParser.ts";

const prisma = new PrismaClient();

export async function seedProducts() {
  // Parse the 10 items from /mock-items
  const items = await parseMockItems();

  // Clean slate, then insert ONLY the 10 curated items
  await prisma.product.deleteMany();

  for (const item of items) {
    await prisma.product.create({
      data: {
        slug: item.slug,
        category: item.category,
        name: item.name,
        priceCents: item.priceCents,
        image: item.image,
        volumeMl: item.volumeMl,
        abv: item.abv,
        descriptionEn: item.description.en,
        descriptionPt: item.description.pt,
      },
    });
  }
}

// Always run when executed directly (Prisma's `db seed` runs the file)
(async () => {
  try {
    await seedProducts();
    console.info("✅ Database seeded with mock items from /mock-items.");
  } catch (err) {
    console.error("❌ Failed to seed database:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
