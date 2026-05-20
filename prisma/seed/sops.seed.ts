import { PrismaClient } from "@prisma/client";
import { getDocumentContext, upsertDocument } from "./documentUtils";

export async function seedSOPs(prisma: PrismaClient) {
  const ctx = await getDocumentContext(prisma);
  
  const sops = [
    { 
      title: "Forklift Safe Operation SOP", docNumber: "SOP-WH-001", type: "SOP", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "high", sifPotential: true, requiredTraining: true,
      purpose: "Define safe operation requirements for all counterbalanced forklifts.",
      scope: "All certified operators and supervisors.",
      responsibilities: "Operators must conduct pre-use checks. Supervisors must enforce rules.",
      procedureSteps: [
        { order: 1, action: "Conduct 360-degree walkaround inspection.", safetyNote: "Never operate a defective truck." },
        { order: 2, action: "Mount using 3 points of contact." },
        { order: 3, action: "Fasten seatbelt and check horn/brakes." },
        { order: 4, action: "Travel with forks 2-4 inches from floor, tilted back." },
        { order: 5, action: "Sound horn at all intersections and blind spots." }
      ],
      ppe: ["Safety shoes", "High-visibility vest", "Safety glasses"],
      hazards: ["Forklift traffic", "Pedestrian interaction", "Blind corners"],
      controls: ["Training", "SOP", "Signage", "Pedestrian separation", "Blue/red forklift lights", "Backup alarms"],
      equipment: ["Forklift"]
    },
    { 
      title: "Stand-Up Reach Truck Operation SOP", docNumber: "SOP-WH-002", type: "SOP", category: "Powered Industrial Trucks", department: "Inventory Control", riskLevel: "high", sifPotential: true, requiredTraining: true,
      procedureSteps: [
        { order: 1, action: "Inspect hydraulic hoses and reach mechanism." },
        { order: 2, action: "Verify dead-man pedal functionality." },
        { order: 3, action: "Retract load before traveling." }
      ],
      equipment: ["Reach Truck"]
    },
    { 
      title: "Order Picker Operation SOP", docNumber: "SOP-WH-003", type: "SOP", category: "Powered Industrial Trucks", department: "Shipping", riskLevel: "high", sifPotential: true, requiredTraining: true,
      procedureSteps: [
        { order: 1, action: "Inspect fall protection harness and lanyard." },
        { order: 2, action: "Secure lanyard to approved anchor point before elevating." },
        { order: 3, action: "Keep both feet on the platform at all times." }
      ],
      ppe: ["Fall protection harness"],
      hazards: ["Fall from height"]
    },
    { 
      title: "Electric Pallet Jack Operation SOP", docNumber: "SOP-WH-004", type: "SOP", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "medium", sifPotential: true, requiredTraining: true,
      procedureSteps: [
        { order: 1, action: "Verify belly switch (emergency reverse) is functional." },
        { order: 2, action: "Travel with load trailing (behind the operator) when possible." }
      ],
      equipment: ["Electric pallet jack"]
    },
    { 
      title: "Manual Pallet Jack Operation SOP", docNumber: "SOP-WH-005", type: "SOP", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "low",
      procedureSteps: [
        { order: 1, action: "Check for debris on wheels." },
        { order: 2, action: "Push the jack when possible, do not pull." }
      ]
    },
    { 
      title: "Forklift Battery Charging SOP", docNumber: "SOP-WH-006", type: "SOP", category: "Powered Industrial Trucks", department: "Maintenance", riskLevel: "medium", sifPotential: true, requiredTraining: true,
      ppe: ["Safety glasses", "Gloves", "Face shield"],
      hazards: ["Battery charging hazards", "Chemical exposure"],
      equipment: ["Battery charger"]
    },
    { title: "Forklift Battery Watering SOP", docNumber: "SOP-WH-007", type: "SOP", category: "Powered Industrial Trucks", department: "Maintenance", riskLevel: "medium" },
    { title: "Forklift Pre-Use Inspection SOP", docNumber: "SOP-WH-008", type: "SOP", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "medium" },
    { title: "Damaged PIT Removal from Service SOP", docNumber: "SOP-WH-009", type: "SOP", category: "Powered Industrial Trucks", department: "Maintenance", riskLevel: "medium", sifPotential: true },
    { title: "Pedestrian and PIT Traffic Control SOP", docNumber: "SOP-WH-010", type: "SOP", category: "Powered Industrial Trucks", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    
    // Dock Operations
    { 
      title: "Dock Door Operation SOP", docNumber: "SOP-WH-011", type: "SOP", category: "Dock Operations", department: "Shipping", riskLevel: "medium", sifPotential: true,
      procedureSteps: [
        { order: 1, action: "Verify trailer is spotted and locked before opening." },
        { order: 2, action: "Use chain pull to lift door; do not jerk." },
        { order: 3, action: "Close and lock door when dock is not in use." }
      ],
      hazards: ["Dock edge fall"]
    },
    { 
      title: "Dock Leveler Operation SOP", docNumber: "SOP-WH-012", type: "SOP", category: "Dock Operations", department: "Receiving", riskLevel: "medium", sifPotential: true,
      purpose: "Establish safe procedures for operating mechanical and hydraulic dock levelers.",
      procedureSteps: [
        { order: 1, action: "Verify trailer is properly spotted and restrained." },
        { order: 2, action: "Check leveler pit for debris or personnel before operation." },
        { order: 3, action: "Engage control button or pull chain to raise leveler lid." },
        { order: 4, action: "Ensure lip extends fully and rests securely on trailer floor." },
        { order: 5, action: "Verify transition is smooth and lip is not creating a trip hazard." },
        { order: 6, action: "After use, return leveler to stored (cross-traffic) position." }
      ],
      ppe: ["Safety shoes", "High-visibility vest"],
      hazards: ["Pinch points", "Fall from dock"],
      controls: ["SOP", "Training", "Dock restraint engaged"],
      equipment: ["Dock leveler"]
    },
    { title: "Dock Restraint Verification SOP", docNumber: "SOP-WH-013", type: "SOP", category: "Dock Operations", department: "Shipping", riskLevel: "high", sifPotential: true },
    { title: "Wheel Chock Use SOP", docNumber: "SOP-WH-014", type: "SOP", category: "Dock Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Trailer Loading SOP", docNumber: "SOP-WH-015", type: "SOP", category: "Dock Operations", department: "Shipping", riskLevel: "high", sifPotential: true },
    { title: "Trailer Unloading SOP", docNumber: "SOP-WH-016", type: "SOP", category: "Dock Operations", department: "Receiving", riskLevel: "high", sifPotential: true },
    { title: "Trailer Entry Verification SOP", docNumber: "SOP-WH-017", type: "SOP", category: "Dock Operations", department: "Operations", riskLevel: "high", sifPotential: true },
    { title: "Dock Edge Protection SOP", docNumber: "SOP-WH-018", type: "SOP", category: "Dock Operations", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Dock Light Use SOP", docNumber: "SOP-WH-019", type: "SOP", category: "Dock Operations", department: "Operations", riskLevel: "low" },
    { title: "Dock Housekeeping SOP", docNumber: "SOP-WH-020", type: "SOP", category: "Dock Operations", department: "Operations", riskLevel: "low" },

    // Yard
    { title: "Trailer Yard Safety SOP", docNumber: "SOP-WH-021", type: "SOP", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "high", sifPotential: true },
    { title: "Yard Spotter Communication SOP", docNumber: "SOP-WH-022", type: "SOP", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "high", sifPotential: true },
    { title: "Yard Check SOP", docNumber: "SOP-WH-023", type: "SOP", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "medium" },
    { title: "Dropped Trailer Inspection SOP", docNumber: "SOP-WH-024", type: "SOP", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "medium" },
    { title: "Driver Check-In and Yard Access SOP", docNumber: "SOP-WH-025", type: "SOP", category: "Trailer Yard", department: "Security", riskLevel: "medium" },
    { title: "Trailer Movement Authorization SOP", docNumber: "SOP-WH-026", type: "SOP", category: "Trailer Yard", department: "Transportation / Yard", riskLevel: "high", sifPotential: true },
    { title: "Trailer Seal Verification SOP", docNumber: "SOP-WH-027", type: "SOP", category: "Shipping", department: "Shipping", riskLevel: "low" },
    { title: "Empty Trailer Inspection SOP", docNumber: "SOP-WH-028", type: "SOP", category: "Receiving", department: "Receiving", riskLevel: "low" },
    { title: "Live Load/Unload Safety SOP", docNumber: "SOP-WH-029", type: "SOP", category: "Dock Operations", department: "Operations", riskLevel: "high", sifPotential: true },
    { title: "Yard Pedestrian Safety SOP", docNumber: "SOP-WH-030", type: "SOP", category: "Trailer Yard", department: "Safety / EHS", riskLevel: "high", sifPotential: true },

    // Shipping/Receiving
    { title: "Receiving Process SOP", docNumber: "SOP-WH-031", type: "SOP", category: "Receiving", department: "Receiving", riskLevel: "medium" },
    { title: "Shipping Process SOP", docNumber: "SOP-WH-032", type: "SOP", category: "Shipping", department: "Shipping", riskLevel: "medium" },
    { title: "Pallet Staging SOP", docNumber: "SOP-WH-033", type: "SOP", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Product Putaway SOP", docNumber: "SOP-WH-034", type: "SOP", category: "Warehouse Operations", department: "Operations", riskLevel: "medium" },
    { title: "Order Picking SOP", docNumber: "SOP-WH-035", type: "SOP", category: "Warehouse Operations", department: "Operations", riskLevel: "medium" },
    { title: "Inventory Cycle Count SOP", docNumber: "SOP-WH-036", type: "SOP", category: "Inventory Control", department: "Inventory Control", riskLevel: "low" },
    { title: "Physical Inventory Safety SOP", docNumber: "SOP-WH-037", type: "SOP", category: "Inventory Control", department: "Safety / EHS", riskLevel: "medium" },
    { title: "Damaged Freight Handling SOP", docNumber: "SOP-WH-038", type: "SOP", category: "Receiving", department: "Receiving", riskLevel: "low" },
    { title: "Returns Processing SOP", docNumber: "SOP-WH-039", type: "SOP", category: "Receiving", department: "Receiving", riskLevel: "low" },
    { title: "Load Securement SOP", docNumber: "SOP-WH-040", type: "SOP", category: "Shipping", department: "Shipping", riskLevel: "medium" },

    // Conveyor
    { title: "Conveyor Startup SOP", docNumber: "SOP-WH-041", type: "SOP", category: "Conveyor Operations", department: "Maintenance", riskLevel: "medium", sifPotential: true },
    { title: "Conveyor Shutdown SOP", docNumber: "SOP-WH-042", type: "SOP", category: "Conveyor Operations", department: "Maintenance", riskLevel: "medium" },
    { title: "Conveyor Jam Response SOP", docNumber: "SOP-WH-043", type: "SOP", category: "Conveyor Operations", department: "Operations", riskLevel: "high", sifPotential: true },
    { title: "Conveyor Emergency Stop SOP", docNumber: "SOP-WH-044", type: "SOP", category: "Conveyor Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Conveyor Inspection SOP", docNumber: "SOP-WH-045", type: "SOP", category: "Conveyor Operations", department: "Maintenance", riskLevel: "medium" },
    { title: "Package Handling on Conveyor SOP", docNumber: "SOP-WH-046", type: "SOP", category: "Conveyor Operations", department: "Operations", riskLevel: "low" },
    { title: "Powered Roller Conveyor Safety SOP", docNumber: "SOP-WH-047", type: "SOP", category: "Conveyor Operations", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Conveyor Maintenance Notification SOP", docNumber: "SOP-WH-048", type: "SOP", category: "Conveyor Operations", department: "Maintenance", riskLevel: "low" },
    { title: "Conveyor Guarding SOP", docNumber: "SOP-WH-049", type: "SOP", category: "Conveyor Operations", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Conveyor Restart After E-Stop SOP", docNumber: "SOP-WH-050", type: "SOP", category: "Conveyor Operations", department: "Operations", riskLevel: "medium", sifPotential: true },

    // Maintenance
    { 
      title: "Lockout/Tagout SOP", docNumber: "SOP-WH-051", type: "SOP", category: "Lockout/Tagout", department: "Maintenance", riskLevel: "high", sifPotential: true,
      purpose: "Define the requirements for controlling hazardous energy during service and maintenance.",
      procedureSteps: [
        { order: 1, action: "Identify all energy sources (electrical, pneumatic, hydraulic, kinetic)." },
        { order: 2, action: "Notify all affected employees of the shutdown." },
        { order: 3, action: "Shut down equipment using normal stopping procedures." },
        { order: 4, action: "Isolate all energy sources using approved isolation devices." },
        { order: 5, action: "Apply personal locks and tags to each isolation point." },
        { order: 6, action: "Release or restrain any stored energy (bleeding lines, blocking parts)." },
        { order: 7, action: "Verify zero energy state by attempting to start the equipment." },
        { order: 8, action: "Perform the required service or maintenance task." }
      ],
      ppe: ["Safety glasses", "Arc-rated PPE", "Lockout/tagout kit"],
      hazards: ["Electrical shock", "Mechanical movement", "Stored energy"],
      controls: ["LOTO applied and verified", "Zero energy verification", "Supervisor verification"],
      equipment: ["Conveyor", "Baler", "Compactor"]
    },
    { title: "Preventive Maintenance SOP", docNumber: "SOP-WH-052", type: "SOP", category: "Maintenance", department: "Maintenance", riskLevel: "medium" },
    { title: "Maintenance Work Request SOP", docNumber: "SOP-WH-053", type: "SOP", category: "Maintenance", department: "Operations", riskLevel: "low" },
    { title: "Contractor Maintenance Work SOP", docNumber: "SOP-WH-054", type: "SOP", category: "Contractor Safety", department: "Maintenance", riskLevel: "medium", sifPotential: true },
    { title: "Hot Work SOP", docNumber: "SOP-WH-055", type: "SOP", category: "Maintenance", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Ladder Use SOP", docNumber: "SOP-WH-056", type: "SOP", category: "Facilities", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Scissor Lift Operation SOP", docNumber: "SOP-WH-057", type: "SOP", category: "Maintenance", department: "Facilities", riskLevel: "high", sifPotential: true },
    { title: "Electrical Panel Access SOP", docNumber: "SOP-WH-058", type: "SOP", category: "Electrical Safety", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Machine Guarding SOP", docNumber: "SOP-WH-059", type: "SOP", category: "Machine Guarding", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Compressed Air Safety SOP", docNumber: "SOP-WH-060", type: "SOP", category: "Maintenance", department: "Maintenance", riskLevel: "medium" },

    // Emergency
    { title: "Emergency Action Plan SOP", docNumber: "SOP-WH-061", type: "SOP", category: "Emergency Response", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Fire Prevention SOP", docNumber: "SOP-WH-062", type: "SOP", category: "Fire Protection", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Severe Weather/Tornado SOP", docNumber: "SOP-WH-063", type: "SOP", category: "Emergency Response", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Spill Response SOP", docNumber: "SOP-WH-064", type: "SOP", category: "Environmental", department: "Safety / EHS", riskLevel: "medium" },
    { title: "Incident Reporting SOP", docNumber: "SOP-WH-065", type: "SOP", category: "Incident Management", department: "Safety / EHS", riskLevel: "low" },
    { title: "Near Miss Reporting SOP", docNumber: "SOP-WH-066", type: "SOP", category: "Incident Management", department: "Safety / EHS", riskLevel: "low" },
    { title: "First Aid Response SOP", docNumber: "SOP-WH-067", type: "SOP", category: "Emergency Response", department: "Emergency Response Team", riskLevel: "medium" },
    { title: "Bloodborne Pathogens Response SOP", docNumber: "SOP-WH-068", type: "SOP", category: "Emergency Response", department: "Safety / EHS", riskLevel: "medium" },
    { title: "Stop Work Authority SOP", docNumber: "SOP-WH-069", type: "SOP", category: "Safety / EHS", department: "Leadership", riskLevel: "low" },
    { title: "Safety Observation SOP", docNumber: "SOP-WH-070", type: "SOP", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },

    // Housekeeping
    { title: "Housekeeping and 5S SOP", docNumber: "SOP-WH-071", type: "SOP", category: "Housekeeping / 5S", department: "Operations", riskLevel: "low" },
    { title: "Rack Damage Reporting SOP", docNumber: "SOP-WH-072", type: "SOP", category: "Inventory Control", department: "Operations", riskLevel: "high", sifPotential: true },
    { title: "Aisle and Walkway Control SOP", docNumber: "SOP-WH-073", type: "SOP", category: "Housekeeping / 5S", department: "Operations", riskLevel: "medium" },
    { title: "Emergency Exit Access SOP", docNumber: "SOP-WH-074", type: "SOP", category: "Emergency Response", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Fire Extinguisher Access SOP", docNumber: "SOP-WH-075", type: "SOP", category: "Fire Protection", department: "Safety / EHS", riskLevel: "high", sifPotential: true },
    { title: "Eyewash Station Access SOP", docNumber: "SOP-WH-076", type: "SOP", category: "Emergency Response", department: "Safety / EHS", riskLevel: "medium", sifPotential: true },
    { title: "Waste Handling SOP", docNumber: "SOP-WH-077", type: "SOP", category: "Environmental", department: "Facilities", riskLevel: "low" },
    { title: "Baler/Compactor Safety SOP", docNumber: "SOP-WH-078", type: "SOP", category: "Maintenance", department: "Facilities", riskLevel: "high", sifPotential: true },
    { title: "PPE Use and Inspection SOP", docNumber: "SOP-WH-079", type: "SOP", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },
    { title: "Visitor Safety SOP", docNumber: "SOP-WH-080", type: "SOP", category: "Security", department: "Security", riskLevel: "low" }
  ];

  console.log(`Upserting ${sops.length} SOPs...`);
  for (const doc of sops) {
    await upsertDocument(prisma, ctx, doc);
  }
}
