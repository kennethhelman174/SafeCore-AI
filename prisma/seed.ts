import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { seedDepartments } from "./seed/departments";
import { seedRoles } from "./seed/roles";
import { seedPPE } from "./seed/ppe";
import { seedHazards } from "./seed/hazards";
import { seedControls } from "./seed/controls";
import { seedEquipment } from "./seed/equipment";
import { seedDocumentTypes } from "./seed/documentTypes";
import { seedDocumentCategories } from "./seed/documentCategories";
import { seedDocumentStatuses } from "./seed/documentStatuses";
import { seedSIFCategories } from "./seed/sifCategories";
import { seedAIPrompts } from "./seed/aiPrompts";
import { seedUsers } from "./seed/users";
import { seedDocuments } from "./seed/documents";
import { seedTraining } from "./seed/training";
import { seedCorrectiveActions } from "./seed/correctiveActions";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Master Library Seeding...");

  try {
    // Phase 1: Pure Master Data
    await seedDocumentTypes(prisma);
    await seedDocumentCategories(prisma);
    await seedDocumentStatuses(prisma);
    await seedSIFCategories(prisma);
    await seedDepartments(prisma);
    await seedRoles(prisma);
    await seedPPE(prisma);
    await seedHazards(prisma);
    await seedControls(prisma);
    await seedEquipment(prisma);
    await seedAIPrompts(prisma);

    // Phase 2: Users (depends on Roles/Depts)
    await seedUsers(prisma);

    // Phase 3: Documents (depends on Types/Cats/Hazards/Controls/PPE/Equip/Users)
    await seedDocuments(prisma);

    // Phase 4: Composed Data (depends on Documents/Roles/Users)
    await seedTraining(prisma);
    await seedCorrectiveActions(prisma);

    console.log("\n--- Seeding Summary ---");
    const counts = {
      users: await prisma.user.count(),
      departments: await prisma.department.count(),
      roles: await prisma.role.count(),
      ppe: await prisma.pPE.count(),
      hazards: await prisma.hazard.count(),
      controls: await prisma.control.count(),
      equipment: await prisma.equipment.count(),
      documentTypes: await prisma.documentType.count(),
      categories: await prisma.documentCategory.count(),
      totalDocuments: await prisma.document.count(),
      sops: await prisma.document.count({ where: { type: { name: "SOP" } } }),
      jsas: await prisma.document.count({ where: { type: { name: "JSA" } } }),
      workInstructions: await prisma.document.count({ where: { type: { name: "Work Instruction" } } }),
      checklists: await prisma.document.count({ where: { type: { name: "Inspection Checklist" } } }),
      sifAssessments: await prisma.document.count({ where: { type: { name: "SIF Assessment" } } }),
      safetyPolicies: await prisma.document.count({ where: { type: { name: "Safety Policy" } } }),
      emergencyProcedures: await prisma.document.count({ where: { type: { name: "Emergency Procedure" } } }),
      contractorProcedures: await prisma.document.count({ where: { type: { name: "Contractor Procedure" } } }),
      incidentAuditTemplates: await prisma.document.count({ where: { type: { name: "Corrective Action Report" } } }),
      trainingRequiredDocs: await prisma.document.count({ where: { requiredTraining: true } }),
      trainingAssignments: await prisma.trainingAssignment.count(),
      correctiveActionTemplates: await prisma.correctiveAction.count(),
      aiPromptTemplates: await prisma.aIPromptTemplate.count()
    };
    console.table(counts);

    // Validate that admin@warehouse.local exists of type Administrator
    const seededAdmin = await prisma.user.findFirst({
      where: {
        email: "admin@warehouse.local"
      },
      include: { role: true }
    });

    if (!seededAdmin) {
      throw new Error("[SEED VALIDATION FAILED] Seeded admin user admin@warehouse.local was not found!");
    } else if (seededAdmin.role.name !== "Administrator") {
      throw new Error(`[SEED VALIDATION FAILED] Seeded admin user exists but has role ${seededAdmin.role.name}, expected Administrator`);
    } else {
      console.log(`\n================================================================================`);
      console.log(`✅ [SEED VALIDATION SUCCESS] Default Admin User verified in database:`);
      console.log(`   - Email: ${seededAdmin.email}`);
      console.log(`   - Name: ${seededAdmin.name}`);
      console.log(`   - Role: ${seededAdmin.role.name}`);
      console.log(`   - Dev Demo Password: SafeCore2026! (Documented for development only)`);
      console.log(`================================================================================\n`);
    }

    // Precise Seeding Quality Indicators requested by deployment/export requirements
    const totalDocuments = await prisma.document.count();
    const sopCount = await prisma.document.count({ where: { type: { name: "SOP" } } });
    const sopsWith5PlusSteps = await prisma.document.count({ where: { type: { name: "SOP" }, procedureSteps: { some: { order: { gte: 5 } } } } });
    const wiCount = await prisma.document.count({ where: { type: { name: "Work Instruction" } } });
    const wisWith5PlusSteps = await prisma.document.count({ where: { type: { name: "Work Instruction" }, procedureSteps: { some: { order: { gte: 5 } } } } });
    const jsaCount = await prisma.document.count({ where: { type: { name: "JSA" } } });
    const jsasWith5PlusSteps = await prisma.document.count({ where: { type: { name: "JSA" }, jsaSteps: { some: { order: { gte: 5 } } } } });
    const checklistCount = await prisma.document.count({ where: { type: { name: "Inspection Checklist" } } });
    const checklistsWithItems = await prisma.document.count({ where: { type: { name: "Inspection Checklist" }, checklistItems: { some: {} } } });
    const sifCount = await prisma.document.count({ where: { type: { name: "SIF Assessment" } } });
    const sifsWithDetails = await prisma.document.count({ where: { type: { name: "SIF Assessment" }, sifDetails: { isNot: null } } });
    const sifsWithCriticalControls = await prisma.document.count({ where: { type: { name: "SIF Assessment" }, criticalControls: { some: {} } } });

    console.log("\n--- QUALITY & SEED DETAIL REPORT ---");
    console.log(`Total Documents: ${totalDocuments}`);
    console.log(`SOP Count: ${sopCount}`);
    console.log(`SOPs with 5+ procedure steps: ${sopsWith5PlusSteps}`);
    console.log(`Work Instruction Count: ${wiCount}`);
    console.log(`Work Instructions with 5+ procedure steps: ${wisWith5PlusSteps}`);
    console.log(`JSA Count: ${jsaCount}`);
    console.log(`JSAs with 5+ JSA steps: ${jsasWith5PlusSteps}`);
    console.log(`Inspection Checklist Count: ${checklistCount}`);
    console.log(`Checklists with checklist items: ${checklistsWithItems}`);
    console.log(`SIF Assessment Count: ${sifCount}`);
    console.log(`SIF Assessments with SIF details: ${sifsWithDetails}`);
    console.log(`SIF Assessments with critical controls: ${sifsWithCriticalControls}`);
    console.log("-------------------------------------\n");

    // Dynamic Group Counts by Type & Category
    const dbTypes = await prisma.documentType.findMany();
    const docCountsByType = await prisma.document.groupBy({
      by: ["typeId"],
      _count: { id: true }
    });
    console.log("--- DOCUMENT COUNTS BY TYPE ---");
    for (const item of docCountsByType) {
      const typeName = dbTypes.find(t => t.id === item.typeId)?.name || "Unknown";
      console.log(` - ${typeName}: ${item._count.id}`);
    }

    const dbCategories = await prisma.documentCategory.findMany();
    const docCountsByCategory = await prisma.document.groupBy({
      by: ["categoryId"],
      _count: { id: true }
    });
    console.log("\n--- DOCUMENT COUNTS BY CATEGORY ---");
    for (const item of docCountsByCategory) {
      const catName = dbCategories.find(c => c.id === item.categoryId)?.name || "Unknown";
      console.log(` - ${catName}: ${item._count.id}`);
    }
    console.log("-------------------------------------\n");

    if (totalDocuments < 308) throw new Error(`[SEED VALIDATION] Expected at least 308 documents but got ${totalDocuments}`);
    if (sopCount < 80) throw new Error(`[SEED VALIDATION] Expected at least 80 SOPs but got ${sopCount}`);
    if (wiCount < 50) throw new Error(`[SEED VALIDATION] Expected at least 50 Work Instructions but got ${wiCount}`);
    if (jsaCount < 68) throw new Error(`[SEED VALIDATION] Expected at least 68 JSAs but got ${jsaCount}`);

    console.log("Master Library Seeding Complete!");
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
