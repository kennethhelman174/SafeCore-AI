import { PrismaClient } from "@prisma/client";

export async function seedEquipment(prisma: PrismaClient) {
  const equipment = [
    // Powered Industrial Trucks
    { name: "Sit-down forklift", category: "PIT", description: "Counterbalanced sit-down truck.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true },
    { name: "Stand-up reach truck", category: "PIT", description: "Narrow aisle stand-up truck.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true },
    { name: "Order picker", category: "PIT", description: "Truck where operator rises with load.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true },
    { name: "Turret truck", category: "PIT", description: "VNA specialized truck.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true },
    { name: "Electric pallet jack", category: "PIT", description: "Powered walkie or rider pallet jack.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true },
    { name: "Forklift", category: "PIT", description: "General term for counterbalanced trucks.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true },
    { name: "Manual pallet jack", category: "MHE", description: "Non-powered manual jack.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Scissor lift", category: "PIT", description: "Mobile elevated work platform.", inspectionFreq: "Daily", isSystemDefault: true },
    { name: "Ladder", category: "Facilities", description: "A-frame or extension ladder.", inspectionFreq: "Per-use", isSystemDefault: true },
    { name: "Yard tractor", category: "PIT", description: "Hostler for moving trailers in yard.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true },

    // Dock Equipment
    { name: "Dock door", category: "Dock", description: "Overhead door for trailer access.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Dock leveler", category: "Dock", description: "Adjustable bridge between dock and trailer.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Dock restraint", category: "Dock", description: "Vehicle restraint system (DOK-LOK).", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Trailer stand", category: "Dock", description: "Support for spotted trailer nose.", inspectionFreq: "Per-use", isSystemDefault: true },
    { name: "Dock seal", category: "Dock", description: "Foam pads sealing trailer to building.", inspectionFreq: "Monthly", isSystemDefault: true },

    // Warehouse Equipment
    { name: "Conveyor", category: "Automation", description: "Main facility conveyor track.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Stretch wrapper", category: "MHE", description: "Automated pallet wrapping machine.", inspectionFreq: "Daily", isSystemDefault: true },
    { name: "Pallet wrapper", category: "MHE", description: "Manual or semi-auto wrapper.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Baler", category: "Maintenance", description: "Cardboard or plastic compression unit.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Compactor", category: "Maintenance", description: "Waste compression unit.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Racking", category: "Facility", description: "Multi-level pallet storage racks.", inspectionFreq: "Weekly/Monthly", isSystemDefault: true },
    { name: "Battery charger", category: "Facility", description: "Station for PIT battery charging.", inspectionFreq: "Weekly", isSystemDefault: true },

    // Safety / Emergency Equipment
    { name: "Fire extinguisher", category: "Emergency", description: "Portable fire suppression unit.", inspectionFreq: "Monthly", isSystemDefault: true },
    { name: "First aid kit", category: "Emergency", description: "Trauma and basic care supplies.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "AED", category: "Emergency", description: "Automated external defibrillator.", inspectionFreq: "Weekly", isSystemDefault: true },
    { name: "Eyewash station", category: "Emergency", description: "Emergency eye decontamination unit.", inspectionFreq: "Weekly (Flush)", isSystemDefault: true },
    { name: "Spill kit", category: "Emergency", description: "Absorbents for hazard response.", inspectionFreq: "Monthly", isSystemDefault: true },

    // Facility Systems
    { name: "Electrical panel", category: "Infrastructure", description: "Breaker panel for site power.", inspectionFreq: "Monthly (Access Check)", isSystemDefault: true },
    { name: "HVAC unit", category: "Infrastructure", description: "Roof-top air handlers.", inspectionFreq: "Quarterly", isSystemDefault: true },
    { name: "Sprinkler system", category: "Infrastructure", description: "Fire suppression piping.", inspectionFreq: "Monthly (Valve Check)", isSystemDefault: true },
    { name: "Generator", category: "Infrastructure", description: "Backup power supply.", inspectionFreq: "Weekly (Test Run)", isSystemDefault: true },
    { name: "Reach Truck", category: "PIT", description: "Narrow aisle stand-up truck alias.", inspectionFreq: "Daily/Shiftly", isSystemDefault: true }
  ];

  console.log(`Seeding ${equipment.length} equipment items...`);

  for (const e of equipment) {
    await prisma.equipment.upsert({
      where: { name: e.name },
      update: { ...e, isSystemDefault: true },
      create: { ...e, isSystemDefault: true }
    });
  }
}
