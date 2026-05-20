import { PrismaClient } from "@prisma/client";

export async function seedCorrectiveActions(prisma: PrismaClient) {
  const templates = [
    { title: "Retrain employee", description: "Assign and verify training for the relevant procedure.", priority: "medium" },
    { title: "Repair damaged equipment", description: "Lockout equipment and coordinate with maintenance.", priority: "high" },
    { title: "Clear blocked exit", description: "Immediate removal of obstructions from emergency egress paths.", priority: "urgent" },
    { title: "Replace damaged rack component", description: "Structural repair as per engineering spec.", priority: "high" },
    { title: "Update SOP", description: "Revise procedure based on new hazard identification.", priority: "medium" },
    { title: "Install guard/bollard", description: "Add physical engineering control to prevent impact/contact.", priority: "medium" },
    { title: "Conduct RCA", description: "Perform full Root Cause Analysis for a SIF or Near Miss.", priority: "high" },
    { title: "Improve Lighting", description: "Install additional lighting fixtures in dark aisles or trailers.", priority: "low" },
    { title: "Replace Safety Signage", description: "Update faded or missing cautionary signs and floor markings.", priority: "low" },
    { title: "Conduct Toolbox Talk", description: "Perform a targeted safety brief for a specific team regarding an incident.", priority: "medium" },
    { title: "Audit JSA effectiveness", description: "Field verify that JSA controls are working as intended.", priority: "medium" },
    { title: "Upgrade PPE", description: "Move to a higher level of protection (e.g., Level A4 gloves).", priority: "medium" },
    { title: "Seal Floor Cracks", description: "Repair trip hazards in high-traffic pedestrian zones.", priority: "low" },
    { title: "Test E-Stops", description: "Perform a site-wide functional test of all emergency stops.", priority: "high" },
    { title: "Review Chemical SDS", description: "Verify all chemicals have current Safety Data Sheets available.", priority: "medium" }
  ];

  console.log(`Seeding ${templates.length} corrective action templates...`);

  for (const t of templates) {
    await prisma.correctiveAction.upsert({
      where: { title: t.title },
      update: {
        description: t.description,
        priority: t.priority,
        isSystemDefault: true
      },
      create: {
        ...t,
        status: "open",
        isSystemDefault: true
      }
    });
  }
}
