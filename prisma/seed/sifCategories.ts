import { PrismaClient } from "@prisma/client";

export async function seedSIFCategories(prisma: PrismaClient) {
  const categories = [
    { name: "Vehicle / PIT Interaction", description: "Collsions involving powered equipment." },
    { name: "Fall from Height", description: "Falls over 4 feet or involving specialized equipment." },
    { name: "Hazardous Energy / LOTO", description: "Unexpected release of stored energy." },
    { name: "Machine Guarding / Caught-in", description: "Interaction with moving machinery parts." },
    { name: "Electrical / Arc Flash", description: "Exposure to live electrical current." },
    { name: "Crush / Gravity", description: "Falling objects or structural collapses." },
    { name: "Chemical / Toxic", description: "Acute exposure to hazardous substances." },
    { name: "Fire / Explosion", description: "Thermal or pressure wave injuries." },
    { name: "Line of Fire", description: "Positioning oneself in a path of release or impact." }
  ];

  console.log(`Seeding ${categories.length} SIF categories...`);

  for (const cat of categories) {
    await prisma.sIFCategory.upsert({
      where: { name: cat.name },
      update: { ...cat, isSystemDefault: true },
      create: { ...cat, isSystemDefault: true }
    });
  }
}
