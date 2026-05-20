import { PrismaClient } from "@prisma/client";

export async function seedDepartments(prisma: PrismaClient) {
  const departments = [
    { name: "Safety / EHS", description: "Oversight of all safety programs and compliance." },
    { name: "Operations", description: "General facility operations and workflow management." },
    { name: "Warehouse Operations", description: "Core storage and material handling operations." },
    { name: "Shipping", description: "Outbound logistics and trailer loading." },
    { name: "Receiving", description: "Inbound logistics and trailer unloading." },
    { name: "Inventory Control", description: "Accuracy, audits, and racking integrity." },
    { name: "Maintenance", description: "Equipment repair and facility upkeep." },
    { name: "Facilities", description: "Building systems, grounds, and infrastructure." },
    { name: "Security", description: "Access control and loss prevention." },
    { name: "Training", description: "Onboarding and competency tracking." },
    { name: "Human Resources", description: "Personnel management and labor relations." },
    { name: "Quality", description: "Product integrity and compliance audits." },
    { name: "Transportation / Yard", description: "Trailer yard management and spotting." },
    { name: "Contractor Management", description: "Oversight of 3rd party service providers." },
    { name: "Emergency Response Team", description: "Trained first responders for site incidents." },
    { name: "Leadership", description: "Executive oversight and strategic planning." },
    { name: "IT / Systems", description: "Network infrastructure and software systems." },
    { name: "Continuous Improvement", description: "Lean, 5S, and process optimization." },
    { name: "Sanitation / Housekeeping", description: "Facility cleanliness and waste management." },
    { name: "Returns / Reverse Logistics", description: "Processing of returned or damaged goods." }
  ];

  console.log(`Seeding ${departments.length} departments...`);
  
  const results = [];
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: { description: dept.description, isSystemDefault: true },
      create: { ...dept, isSystemDefault: true }
    });
    results.push(d);
  }
  return results;
}
