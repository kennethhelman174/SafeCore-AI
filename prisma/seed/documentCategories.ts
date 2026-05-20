import { PrismaClient } from "@prisma/client";

export async function seedDocumentCategories(prisma: PrismaClient) {
  const categories = [
    "Powered Industrial Trucks",
    "Dock Operations",
    "Trailer Yard",
    "Shipping",
    "Receiving",
    "Inventory Control",
    "Conveyor Operations",
    "Maintenance",
    "Lockout/Tagout",
    "Electrical Safety",
    "Emergency Response",
    "Fire Protection",
    "Hazard Communication",
    "Contractor Safety",
    "Machine Guarding",
    "Fall Protection",
    "Ergonomics",
    "Housekeeping / 5S",
    "Training",
    "Security",
    "Environmental",
    "SIF / Critical Risk",
    "Inspection",
    "Incident Management",
    "Corrective Actions",
    "Warehouse",
    "Facilities",
    "Safety / EHS",
    "Warehouse Operations",
    "Workplace Safety",
    "General Operations",
    "Operations",
    "Quality"
  ];

  console.log(`Seeding ${categories.length} document categories...`);

  const results = [];
  for (const name of categories) {
    const c = await prisma.documentCategory.upsert({
      where: { name },
      update: { isSystemDefault: true },
      create: { name, isSystemDefault: true }
    });
    results.push(c);
  }
  return results;
}
