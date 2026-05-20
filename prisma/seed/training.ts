import { PrismaClient } from "@prisma/client";

export async function seedTraining(prisma: PrismaClient) {
  const allDocs = await prisma.document.findMany({ where: { isLatestRevision: true } });
  const roles = await prisma.role.findMany();

  const getDocId = (docNumber: string) => allDocs.find(d => d.docNumber === docNumber)?.id;
  const getRoleId = (name: string) => roles.find(r => r.name === name)?.id;

  // 1. Training Matrix (Role -> Document Number)
  const matrix = [
    {
      role: "Warehouse Associate",
      docs: [
        "SOP-WH-061", "SOP-WH-062", "SOP-WH-071", "SOP-WH-074", "SOP-WH-079",
        "WI-WH-017", "WI-WH-040", "WI-WH-048",
        "JSA-WH-028", "JSA-WH-038", "JSA-WH-061"
      ]
    },
    {
      role: "Forklift Operator",
      docs: [
        "SOP-WH-001", "SOP-WH-002", "SOP-WH-003", "SOP-WH-004", "SOP-WH-006", "SOP-WH-008", "SOP-WH-061",
        "WI-WH-001", "WI-WH-002", "WI-WH-042", "WI-WH-043",
        "JSA-WH-001", "JSA-WH-002", "JSA-WH-003", "JSA-WH-004", "JSA-WH-009"
      ]
    },
    {
      role: "Dock Associate",
      docs: [
        "SOP-WH-011", "SOP-WH-012", "SOP-WH-013", "SOP-WH-014", "SOP-WH-015",
        "SOP-WH-016", "SOP-WH-017", "SOP-WH-018", "SOP-WH-019", "SOP-WH-020",
        "WI-WH-003", "WI-WH-004", "WI-WH-005", "WI-WH-006", "WI-WH-010", "WI-WH-011", "WI-WH-012",
        "JSA-WH-011", "JSA-WH-012", "JSA-WH-013", "JSA-WH-014", "JSA-WH-015", "JSA-WH-016"
      ]
    },
    {
      role: "Maintenance Technician",
      docs: [
        "SOP-WH-051", "SOP-WH-052", "SOP-WH-053", "SOP-WH-054", "SOP-WH-055",
        "SOP-WH-056", "SOP-WH-057", "SOP-WH-058", "SOP-WH-059", "SOP-WH-060",
        "WI-WH-009", "WI-WH-031", "WI-WH-032", "WI-WH-033", "WI-WH-034", "WI-WH-036",
        "JSA-WH-049", "JSA-WH-050", "JSA-WH-051", "JSA-WH-052", "JSA-WH-053", "JSA-WH-054",
        "JSA-WH-055", "JSA-WH-056", "JSA-WH-057", "JSA-WH-058"
      ]
    },
    {
      role: "Senior Maintenance Technician",
      docs: [
        "SOP-WH-051", "SOP-WH-052", "SOP-WH-053", "SOP-WH-054", "SOP-WH-055",
        "SOP-WH-056", "SOP-WH-057", "SOP-WH-058", "SOP-WH-059", "SOP-WH-060",
        "WI-WH-009", "WI-WH-031", "WI-WH-032", "WI-WH-033", "WI-WH-034", "WI-WH-036",
        "JSA-WH-049", "JSA-WH-050", "JSA-WH-051", "JSA-WH-052", "JSA-WH-053", "JSA-WH-054",
        "JSA-WH-055", "JSA-WH-056", "JSA-WH-057", "JSA-WH-058"
      ]
    },
    {
      role: "Yard Spotter",
      docs: [
        "SOP-WH-021", "SOP-WH-022", "SOP-WH-023", "SOP-WH-024", "SOP-WH-026", "SOP-WH-030",
        "JSA-WH-021", "JSA-WH-022", "JSA-WH-023", "JSA-WH-024", "JSA-WH-027"
      ]
    },
    {
      role: "Contractor",
      docs: [
        "SOP-WH-054", "SOP-WH-061", "SOP-WH-069",
        "WI-WH-046",
        "JSA-WH-056", "JSA-WH-061"
      ]
    },
    {
      role: "Floor Supervisor",
      docs: [
        "SOP-WH-001", "SOP-WH-051", "SOP-WH-061", "SOP-WH-065", "SOP-WH-066", "SOP-WH-069", "SOP-WH-070",
        "WI-WH-047", "WI-WH-049",
        "JSA-WH-065", "JSA-WH-066", "JSA-WH-067"
      ]
    },
    {
      role: "EHS Manager",
      docs: [
        "SOP-WH-010", "SOP-WH-018", "SOP-WH-030", "SOP-WH-049", "SOP-WH-059", "SOP-WH-061", "SOP-WH-062", "SOP-WH-063",
        "WI-WH-047", "WI-WH-049",
        "JSA-WH-065", "JSA-WH-066", "JSA-WH-067", "JSA-WH-068"
      ]
    },
    {
      role: "EHS Engineer",
      docs: [
        "SOP-WH-010", "SOP-WH-018", "SOP-WH-030", "SOP-WH-049", "SOP-WH-059", "SOP-WH-061", "SOP-WH-062", "SOP-WH-063",
        "WI-WH-047", "WI-WH-049",
        "JSA-WH-065", "JSA-WH-066", "JSA-WH-067", "JSA-WH-068"
      ]
    },
    {
      role: "Safety Coordinator",
      docs: [
        "SOP-WH-010", "SOP-WH-018", "SOP-WH-030", "SOP-WH-049", "SOP-WH-059", "SOP-WH-061", "SOP-WH-062", "SOP-WH-063",
        "WI-WH-047", "WI-WH-049",
        "JSA-WH-065", "JSA-WH-066", "JSA-WH-067", "JSA-WH-068"
      ]
    },
    {
      role: "Operations Manager",
      docs: [
        "SOP-WH-061", "SOP-WH-065", "SOP-WH-069", "SOP-WH-070",
        "WI-WH-047", "WI-WH-049"
      ]
    },
    {
      role: "Warehouse Manager",
      docs: [
        "SOP-WH-061", "SOP-WH-065", "SOP-WH-069", "SOP-WH-070",
        "WI-WH-047", "WI-WH-049"
      ]
    },
    {
      role: "Site Leader",
      docs: [
        "SOP-WH-061", "SOP-WH-065", "SOP-WH-069", "SOP-WH-070",
        "WI-WH-047", "WI-WH-049"
      ]
    }
  ];

  // Dynamically mark all docs referenced in the training matrix as requiring training
  const uniqueDocNumbers = Array.from(new Set(matrix.flatMap(row => row.docs)));
  console.log(`Setting requiredTraining properties for ${uniqueDocNumbers.length} documents...`);

  for (const docNum of uniqueDocNumbers) {
    const id = getDocId(docNum);
    if (!id) {
      throw new Error(`Training Seed Error: Document with number '${docNum}' was referenced in the training matrix but not found in seeded documents!`);
    }

    await prisma.document.update({
      where: { id },
      data: {
        requiredTraining: true,
        requiresAcknowledgment: true,
        requiresVerification: true,
        refresherFreqMonths: 12
      }
    });
  }

  console.log("Seeding Training Matrix Requirements...");

  let totalRoleTrainingRequirements = 0;
  const docsByRoleSummary: Record<string, number> = {};

  for (const row of matrix) {
    const roleId = getRoleId(row.role);
    if (!roleId) {
      throw new Error(`Training Seed Error: Role '${row.role}' was referenced in the training matrix but not found in seeded roles database!`);
    }

    docsByRoleSummary[row.role] = row.docs.length;

    for (const docNum of row.docs) {
      const documentId = getDocId(docNum);
      if (!documentId) {
        throw new Error(`Training Seed Error: Document with number '${docNum}' was specified in the training matrix for role '${row.role}' but was not found in seeded documents!`);
      }

      await prisma.roleTrainingRequirement.upsert({
        where: { roleId_documentId: { roleId, documentId } },
        update: {},
        create: { roleId, documentId }
      });

      totalRoleTrainingRequirements++;
    }
  }

  // Double check how many role training requirements exist now
  const dbCount = await prisma.roleTrainingRequirement.count();

  console.log("================= TRAINING SEED REPORT =================");
  console.log(`Total role training requirements in matrix list: ${totalRoleTrainingRequirements}`);
  console.log(`Total role training requirement records in DB: ${dbCount}`);
  console.log("Required documents counts by Role:");
  for (const [rolename, count] of Object.entries(docsByRoleSummary)) {
    console.log(`  - ${rolename}: ${count} required documents`);
  }
  console.log(`Training-required documents count: ${uniqueDocNumbers.length}`);
  console.log("========================================================");
}
