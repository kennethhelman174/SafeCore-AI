import { PrismaClient } from "@prisma/client";
import { getDocumentContext, upsertDocument } from "./documentUtils";

export async function seedJSAs(prisma: PrismaClient) {
  const ctx = await getDocumentContext(prisma);
  
  const jsas = [
    { 
      title: "Operating Sit-Down Forklift", docNumber: "JSA-WH-001", type: "JSA", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "high", sifPotential: true,
      jsaSteps: [
        { order: 1, taskDescription: "Inspect vehicle", potentialHazards: "Fluid leaks, tire damage", controlMeasures: "Use daily checklist, out-of-service if failed" },
        { order: 2, taskDescription: "Mount/Dismount", potentialHazards: "Slips, trips, and falls", controlMeasures: "Use 3 points of contact, check ground for debris" },
        { order: 3, taskDescription: "Travel in aisles", potentialHazards: "Pedestrian collision, blind corners", controlMeasures: "Sound horn at intersections, stay in green lanes, use spotters" },
        { order: 4, taskDescription: "Pick up load", potentialHazards: "Unstable loads, tip-over", controlMeasures: "Verify weight, ensure forks level, center load" },
        { order: 5, taskDescription: "Place load in high rack", potentialHazards: "Falling objects, rack damage", controlMeasures: "Look up before lifting, check overhead clearance, approach slowly" },
        { order: 6, taskDescription: "Shutdown and park", potentialHazards: "Runaway vehicle", controlMeasures: "Lower forks to floor, set brake, turn off power" }
      ],
      ppe: ["Safety shoes", "High-visibility vest", "Safety glasses"],
      hazards: ["Forklift traffic", "Pedestrian interaction", "Blind corners"],
      controls: ["Training", "SOP", "Pedestrian separation", "Spotter assigned"],
      equipment: ["Forklift", "Racking"]
    },
    { title: "Operating Stand-Up Reach Truck", docNumber: "JSA-WH-002", type: "JSA", category: "Powered Industrial Trucks", department: "Inventory Control", riskLevel: "high", sifPotential: true },
    { title: "Operating Order Picker", docNumber: "JSA-WH-003", type: "JSA", category: "Powered Industrial Trucks", department: "Shipping", riskLevel: "high", sifPotential: true },
    { title: "Operating Electric Pallet Jack", docNumber: "JSA-WH-004", type: "JSA", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "medium", sifPotential: true },
    { title: "Operating Manual Pallet Jack", docNumber: "JSA-WH-005", type: "JSA", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "low" },
    { title: "Traveling Through Pedestrian Areas", docNumber: "JSA-WH-006", type: "JSA", category: "Safety / EHS", department: "Operations", riskLevel: "high", sifPotential: true },
    { title: "Loading Pallets into Trailer", docNumber: "JSA-WH-007", type: "JSA", category: "Shipping", department: "Shipping", riskLevel: "high", sifPotential: true,
      jsaSteps: [
        { order: 1, taskDescription: "Open dock door", potentialHazards: "Shoulder strain, pinched fingers", controlMeasures: "Use proper lifting technique, keep fingers on handles" },
        { order: 2, taskDescription: "Verify trailer restraint", potentialHazards: "Trailer creep, forklift fall", controlMeasures: "Visual check of outer light/hook, verification step" },
        { order: 3, taskDescription: "Deploy dock leveler", potentialHazards: "Trip hazard, pinch point", controlMeasures: "Stay clear of leveler lip during deployment" },
        { order: 4, taskDescription: "Enter trailer with load", potentialHazards: "Trailer tip-over, floor failure", controlMeasures: "Verify floor integrity, use trailer stands if required" }
      ],
      controls: ["Dock restraint engaged", "Wheel chocks applied", "Trailer condition verified"],
      equipment: ["Forklift", "Dock leveler", "Dock restraint"]
    },
    { title: "Unloading Pallets from Trailer", docNumber: "JSA-WH-008", type: "JSA", category: "Receiving", department: "Receiving", riskLevel: "high", sifPotential: true },
    { title: "Battery Charging", docNumber: "JSA-WH-009", type: "JSA", category: "Powered Industrial Trucks", department: "Maintenance", riskLevel: "medium", sifPotential: true },
    { title: "Battery Watering", docNumber: "JSA-WH-010", type: "JSA", category: "Powered Industrial Trucks", department: "Maintenance", riskLevel: "medium" },
    
    // Dock
    { title: "Opening Dock Door", docNumber: "JSA-WH-011", type: "JSA", category: "Dock Operations", department: "Operations", riskLevel: "medium" },
    { title: "Operating Dock Leveler", docNumber: "JSA-WH-012", type: "JSA", category: "Dock Operations", department: "Operations", riskLevel: "medium" },
    { title: "Entering Trailer", docNumber: "JSA-WH-013", type: "JSA", category: "Dock Operations", department: "Operations", riskLevel: "high", sifPotential: true,
      jsaSteps: [
        { order: 1, taskDescription: "Engage trailer restraint", potentialHazards: "Trailer creep, premature departure", controlMeasures: "Verify green light on panel, visual check of hook" },
        { order: 2, taskDescription: "Set wheel chocks", potentialHazards: "Manual restraint failure", controlMeasures: "Use correct chocking technique, verify contact with tires" },
        { order: 3, taskDescription: "Inspect trailer floor", potentialHazards: "Forklift breakthrough, collapse", controlMeasures: "Walk center and edges, check for holes/soft spots" },
        { order: 4, taskDescription: "Check trailer roof/nose", potentialHazards: "Falling objects, water damage", controlMeasures: "Visual scan for leaks or structural cracks" },
        { order: 5, taskDescription: "Deploy dock leveler", potentialHazards: "Trip/pinch point", controlMeasures: "Keep feet clear of transition plate, ensure full support" },
        { order: 6, taskDescription: "First entry with forklift", potentialHazards: "Weight shift, trailer tip", controlMeasures: "Approach slowly, enter centered, use jack stands if required" }
      ],
      ppe: ["Safety shoes", "High-visibility vest", "Safety glasses"],
      hazards: ["Trailer creep", "Falling from dock", "Structural collapse"],
      controls: ["Dock restraint engaged", "Wheel chocks applied", "Trailer condition verified"],
      equipment: ["Dock leveler", "Forklift", "Dock restraint"]
    },
    { title: "Loading Trailer", docNumber: "JSA-WH-014", type: "JSA", category: "Shipping", department: "Shipping", riskLevel: "high", sifPotential: true },
    { title: "Unloading Trailer", docNumber: "JSA-WH-015", type: "JSA", category: "Receiving", department: "Receiving", riskLevel: "high", sifPotential: true },
    { title: "Working Near Dock Edge", docNumber: "JSA-WH-016", type: "JSA", category: "Dock Operations", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Applying Wheel Chocks", docNumber: "JSA-WH-017", type: "JSA", category: "Dock Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Verifying Dock Restraint", docNumber: "JSA-WH-018", type: "JSA", category: "Dock Operations", department: "Shipping", riskLevel: "medium", sifPotential: true },
    { title: "Using Dock Plate", docNumber: "JSA-WH-019", type: "JSA", category: "Dock Operations", department: "Operations", riskLevel: "medium" },
    { title: "Working Around Live Load/Unload", docNumber: "JSA-WH-020", type: "JSA", category: "Dock Operations", department: "Operations", riskLevel: "high", sifPotential: true },

    // Yard
    { title: "Walking in Trailer Yard", docNumber: "JSA-WH-021", type: "JSA", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "high", sifPotential: true },
    { title: "Yard Spotting", docNumber: "JSA-WH-022", type: "JSA", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "high", sifPotential: true },
    { title: "Conducting Yard Check", docNumber: "JSA-WH-023", type: "JSA", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "medium" },
    { title: "Inspecting Dropped Trailer", docNumber: "JSA-WH-024", type: "JSA", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "medium" },
    { title: "Driver Check-In Process", docNumber: "JSA-WH-025", type: "JSA", category: "Trailer Yard", department: "Security", riskLevel: "low" },
    { title: "Trailer Seal Verification", docNumber: "JSA-WH-026", type: "JSA", category: "Shipping", department: "Shipping", riskLevel: "low" },
    { title: "Trailer Movement Communication", docNumber: "JSA-WH-027", type: "JSA", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "high", sifPotential: true },

    // Warehouse Ops
    { title: "Manual Material Handling", docNumber: "JSA-WH-028", type: "JSA", category: "Ergonomics", department: "Operations", riskLevel: "low" },
    { title: "Pallet Wrapping", docNumber: "JSA-WH-029", type: "JSA", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Cutting Shrink Wrap", docNumber: "JSA-WH-030", type: "JSA", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Picking Product from Rack", docNumber: "JSA-WH-031", type: "JSA", category: "Warehouse Operations", department: "Operations", riskLevel: "medium" },
    { title: "Product Putaway", docNumber: "JSA-WH-032", type: "JSA", category: "Warehouse Operations", department: "Operations", riskLevel: "medium" },
    { title: "Pallet Staging", docNumber: "JSA-WH-033", type: "JSA", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Damaged Pallet Handling", docNumber: "JSA-WH-034", type: "JSA", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Damaged Freight Handling", docNumber: "JSA-WH-035", type: "JSA", category: "Receiving", department: "Receiving", riskLevel: "low" },
    { title: "Cycle Counting", docNumber: "JSA-WH-036", type: "JSA", category: "Inventory Control", department: "Inventory Control", riskLevel: "low" },
    { title: "Physical Inventory Count", docNumber: "JSA-WH-037", type: "JSA", category: "Inventory Control", department: "Inventory Control", riskLevel: "medium" },
    { title: "Housekeeping and 5S", docNumber: "JSA-WH-038", type: "JSA", category: "Housekeeping / 5S", department: "Operations", riskLevel: "low" },
    { title: "Waste Handling", docNumber: "JSA-WH-039", type: "JSA", category: "Environmental", department: "Facilities", riskLevel: "low" },
    { title: "Baler/Compactor Use", docNumber: "JSA-WH-040", type: "JSA", category: "Maintenance", department: "Facilities", riskLevel: "high", sifPotential: true },

    // Conveyor
    { title: "Conveyor Startup", docNumber: "JSA-WH-041", type: "JSA", category: "Conveyor Operations", department: "Maintenance", riskLevel: "medium", sifPotential: true },
    { title: "Conveyor Shutdown", docNumber: "JSA-WH-042", type: "JSA", category: "Conveyor Operations", department: "Maintenance", riskLevel: "low" },
    { title: "Conveyor Jam Clearing", docNumber: "JSA-WH-043", type: "JSA", category: "Conveyor Operations", department: "Operations", riskLevel: "high", sifPotential: true,
      jsaSteps: [
        { order: 1, taskDescription: "Identify jam location", potentialHazards: "Slips while walking on catwalks", controlMeasures: "Maintain 3 points of contact on stairs/catwalks" },
        { order: 2, taskDescription: "Emergency Stop", potentialHazards: "Unexpected startup", controlMeasures: "Depress nearest E-stop button or pull cord" },
        { order: 3, taskDescription: "Apply Lockout/Tagout", potentialHazards: "Restart by others", controlMeasures: "Apply personal lock/tag to isolator switch" },
        { order: 4, taskDescription: "Access jam area", potentialHazards: "Reaching into moving parts", controlMeasures: "Ensure all motion has stopped before reaching in" },
        { order: 5, taskDescription: "Clear debris/package", potentialHazards: "Stored kinetic energy (package under tension)", controlMeasures: "Use tool to reposition if possible, wear cut-resistant gloves" },
        { order: 6, taskDescription: "Remove LOTO and reset", potentialHazards: "Personnel in danger zone", controlMeasures: "Verify area is clear, notify others before restart" },
        { order: 7, taskDescription: "Resume operation", potentialHazards: "Recurring jam", controlMeasures: "Monitor area from safe distance" }
      ],
      ppe: ["Safety shoes", "Bump cap", "Cut-resistant gloves"],
      hazards: ["Pinch points", "Entanglement", "Unexpected startup"],
      controls: ["LOTO applied and verified", "Conveyor emergency stops", "Machine guards in place"],
      equipment: ["Conveyor"]
    },
    { title: "Conveyor Inspection", docNumber: "JSA-WH-044", type: "JSA", category: "Conveyor Operations", department: "Maintenance", riskLevel: "medium" },
    { title: "Working Near Powered Rollers", docNumber: "JSA-WH-045", type: "JSA", category: "Conveyor Operations", department: "Operations", riskLevel: "high", sifPotential: true },
    { title: "Using Conveyor E-Stop", docNumber: "JSA-WH-046", type: "JSA", category: "Conveyor Operations", department: "Operations", riskLevel: "low", sifPotential: true },
    { title: "Resetting Conveyor After E-Stop", docNumber: "JSA-WH-047", type: "JSA", category: "Conveyor Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Replacing Conveyor Roller", docNumber: "JSA-WH-048", type: "JSA", category: "Conveyor Operations", department: "Maintenance", riskLevel: "medium" },

    // Maintenance
    { title: "Lockout/Tagout Maintenance", docNumber: "JSA-WH-049", type: "JSA", category: "Lockout/Tagout", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Electrical Troubleshooting", docNumber: "JSA-WH-050", type: "JSA", category: "Electrical Safety", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Machine Guarding Inspection", docNumber: "JSA-WH-051", type: "JSA", category: "Machine Guarding", department: "Safety / EHS", riskLevel: "medium", sifPotential: true },
    { title: "Hot Work", docNumber: "JSA-WH-052", type: "JSA", category: "Maintenance", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Ladder Use", docNumber: "JSA-WH-053", type: "JSA", category: "Facilities", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Scissor Lift Use", docNumber: "JSA-WH-054", type: "JSA", category: "Maintenance", department: "Facilities", riskLevel: "high", sifPotential: true },
    { title: "Working at Height", docNumber: "JSA-WH-055", type: "JSA", category: "Fall Protection", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Contractor Maintenance Work", docNumber: "JSA-WH-056", type: "JSA", category: "Contractor Safety", department: "Maintenance", riskLevel: "medium", sifPotential: true },
    { title: "Preventive Maintenance", docNumber: "JSA-WH-057", type: "JSA", category: "Maintenance", department: "Maintenance", riskLevel: "medium" },
    { title: "Compressed Air Use", docNumber: "JSA-WH-058", type: "JSA", category: "Maintenance", department: "Maintenance", riskLevel: "low" },

    // Emergency
    { title: "Spill Cleanup", docNumber: "JSA-WH-059", type: "JSA", category: "Environmental", department: "Safety / EHS", riskLevel: "medium" },
    { title: "Fire Extinguisher Use", docNumber: "JSA-WH-060", type: "JSA", category: "Fire Protection", department: "Safety / EHS", riskLevel: "medium" },
    { title: "Emergency Evacuation", docNumber: "JSA-WH-061", type: "JSA", category: "Emergency Response", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Severe Weather Shelter", docNumber: "JSA-WH-062", type: "JSA", category: "Emergency Response", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "First Aid Response", docNumber: "JSA-WH-063", type: "JSA", category: "Emergency Response", department: "Emergency Response Team", riskLevel: "medium" },
    { title: "Bloodborne Pathogen Cleanup", docNumber: "JSA-WH-064", type: "JSA", category: "Emergency Response", department: "Safety / EHS", riskLevel: "medium" },
    { title: "Incident Investigation", docNumber: "JSA-WH-065", type: "JSA", category: "Incident Management", department: "Safety / EHS", riskLevel: "low" },
    { title: "Safety Observation", docNumber: "JSA-WH-066", type: "JSA", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },
    { title: "Critical Control Verification", docNumber: "JSA-WH-067", type: "JSA", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },
    { title: "Corrective Action Verification", docNumber: "JSA-WH-068", type: "JSA", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" }
  ];

  console.log(`Upserting ${jsas.length} JSAs...`);
  for (const doc of jsas) {
    await upsertDocument(prisma, ctx, doc);
  }
}
