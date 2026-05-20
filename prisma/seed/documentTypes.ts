import { PrismaClient } from "@prisma/client";

export async function seedDocumentTypes(prisma: PrismaClient) {
  const types = [
    "SOP", 
    "JSA", 
    "Work Instruction", 
    "Safety Policy", 
    "Emergency Procedure", 
    "Inspection Checklist", 
    "SIF Assessment", 
    "Corrective Action Report", 
    "Incident Investigation", 
    "Training Record", 
    "Contractor Procedure", 
    "Audit Checklist", 
    "Management of Change", 
    "Permit", 
    "Toolbox Talk"
  ];

  console.log(`Seeding ${types.length} document types...`);

  const results = [];
  for (const name of types) {
    const t = await prisma.documentType.upsert({
      where: { name },
      update: { isSystemDefault: true },
      create: { name, isSystemDefault: true }
    });
    results.push(t);
  }
  return results;
}
