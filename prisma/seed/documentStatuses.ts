import { PrismaClient } from "@prisma/client";

export async function seedDocumentStatuses(prisma: PrismaClient) {
  const statuses = [
    "Draft",
    "Submitted for Review",
    "In Review",
    "Revision Requested",
    "Approved",
    "Published",
    "Archived"
  ];

  console.log(`Seeding ${statuses.length} document statuses...`);

  const results = [];
  for (const name of statuses) {
    const s = await prisma.documentStatus.upsert({
      where: { name },
      update: { isSystemDefault: true },
      create: { name, isSystemDefault: true }
    });
    results.push(s);
  }
  return results;
}
