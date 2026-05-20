import { PrismaClient } from "@prisma/client";

export async function seedRoles(prisma: PrismaClient) {
  const roles = [
    { name: "Administrator", description: "Full system access and data management." },
    { name: "Site Leader", description: "Executive responsible for total facility safety and performance." },
    { name: "Operations Manager", description: "Leads day-to-day warehouse operations." },
    { name: "Warehouse Manager", description: "Manages specific storage and handling departments." },
    { name: "EHS Manager", description: "Leads environmental, health, and safety strategy." },
    { name: "EHS Engineer", description: "Develops safety programs, JSAs, and SOPs." },
    { name: "Safety Coordinator", description: "Conducts inspections and training verifications." },
    { name: "Floor Supervisor", description: "Oversees front-line associates and task execution." },
    { name: "Shipping Supervisor", description: "Focuses on outbound dock safety and efficiency." },
    { name: "Receiving Supervisor", description: "Focuses on inbound dock safety and unloading." },
    { name: "Logistics Supervisor", description: "Manages yard and transportation coordination." },
    { name: "Inventory Control Lead", description: "Audits racking and inventory processes." },
    { name: "Training Coordinator", description: "Maintains training matrix and records." },
    { name: "Maintenance Manager", description: "Leads technical team and LOTO program." },
    { name: "Senior Maintenance Technician", description: "Experienced technician, LOTO authorized." },
    { name: "Maintenance Technician", description: "Technical repairs and PM execution." },
    { name: "Forklift Operator", description: "Certified for powered industrial truck operations." },
    { name: "Dock Associate", description: "Manual material handling at dock doors." },
    { name: "Warehouse Associate", description: "General material handling and order picking." },
    { name: "Yard Spotter", description: "Operates yard tractor for trailer positioning." },
    { name: "Security Officer", description: "Site security and visitor management." },
    { name: "Contractor", description: "External provider performing authorized work." },
    { name: "Visitor", description: "Temporary site guest with limited access." },
    { name: "Read-Only Auditor", description: "Access for compliance reviews only." }
  ];

  console.log(`Seeding ${roles.length} roles...`);

  const results = [];
  for (const role of roles) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, isSystemDefault: true },
      create: { ...role, isSystemDefault: true }
    });
    results.push(r);
  }
  return results;
}
