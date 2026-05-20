import { PrismaClient } from "@prisma/client";
import { getDocumentContext, upsertDocument } from "./documentUtils";

export async function seedWorkInstructions(prisma: PrismaClient) {
  const ctx = await getDocumentContext(prisma);
  
  const instructions = [
    { 
      title: "Complete Forklift Pre-Use Inspection", docNumber: "WI-WH-001", type: "Work Instruction", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "low",
      procedureSteps: [
        { order: 1, action: "Identify the vehicle and log into the electronic inspection system (if applicable)." },
        { order: 2, action: "Perform a walkaround; look for leaks, debris, and structural damage." },
        { order: 3, action: "Check tires for pressure, chunks missing, or wear." },
        { order: 4, action: "Check fluid levels (if internal combustion) or battery cables (if electric)." },
        { order: 5, action: "Test horn, lights, and backup alarm." },
        { order: 6, action: "Test brakes and steering before entering a main aisle." }
      ]
    },
    { title: "Complete Electric Pallet Jack Inspection", docNumber: "WI-WH-002", type: "Work Instruction", category: "Powered Industrial Trucks", department: "Warehouse Operations", riskLevel: "low" },
    { title: "Complete Dock Safety Inspection", docNumber: "WI-WH-003", type: "Work Instruction", category: "Dock Operations", department: "Shipping", riskLevel: "medium" },
    { title: "Verify Trailer Restraint Engagement", docNumber: "WI-WH-004", type: "Work Instruction", category: "Dock Operations", department: "Shipping", riskLevel: "medium", sifPotential: true,
      procedureSteps: [
        { order: 1, action: "Confirm trailer RIG (Rear Impact Guard) is within the restraint zone." },
        { order: 2, action: "Activate the dock lock switch to 'Lock' position." },
        { order: 3, action: "Listen for mechanical engagement and observe the 'Engaged' indicator light (Green inside, Red outside)." },
        { order: 4, action: "Perform visual verification by stepping to the dock edge and confirming the hook is over the RIG." },
        { order: 5, action: "If light is flashing or amber, do not enter; notify maintenance immediately." }
      ]
    },
    { title: "Apply Wheel Chocks", docNumber: "WI-WH-005", type: "Work Instruction", category: "Dock Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Inspect Trailer Before Entry", docNumber: "WI-WH-006", type: "Work Instruction", category: "Dock Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Report Damaged Trailer", docNumber: "WI-WH-007", type: "Work Instruction", category: "Dock Operations", department: "Safety / EHS", riskLevel: "low" },
    { title: "Report Damaged Rack", docNumber: "WI-WH-008", type: "Work Instruction", category: "Inventory Control", department: "Inventory Control", riskLevel: "low" },
    { title: "Place Damaged Equipment Out of Service", docNumber: "WI-WH-009", type: "Work Instruction", category: "Maintenance", department: "Maintenance", riskLevel: "low" },
    { title: "Use a Dock Light", docNumber: "WI-WH-010", type: "Work Instruction", category: "Dock Operations", department: "Operations", riskLevel: "low" },
    { title: "Use a Dock Leveler", docNumber: "WI-WH-011", type: "Work Instruction", category: "Dock Operations", department: "Operations", riskLevel: "medium" },
    { title: "Open and Close Dock Door", docNumber: "WI-WH-012", type: "Work Instruction", category: "Dock Operations", department: "Operations", riskLevel: "low" },
    { title: "Conduct Trailer Seal Verification", docNumber: "WI-WH-013", type: "Work Instruction", category: "Shipping", department: "Shipping", riskLevel: "low" },
    { title: "Stage Pallets Safely", docNumber: "WI-WH-014", type: "Work Instruction", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Wrap a Pallet", docNumber: "WI-WH-015", type: "Work Instruction", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Cut Shrink Wrap Safely", docNumber: "WI-WH-016", type: "Work Instruction", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Use a Safety Knife", docNumber: "WI-WH-017", type: "Work Instruction", category: "Warehouse Operations", department: "Operations", riskLevel: "low" },
    { title: "Report a Near Miss", docNumber: "WI-WH-018", type: "Work Instruction", category: "Incident Management", department: "Safety / EHS", riskLevel: "low" },
    { title: "Complete Incident Report", docNumber: "WI-WH-019", type: "Work Instruction", category: "Incident Management", department: "Safety / EHS", riskLevel: "low" },
    { title: "Create Corrective Action", docNumber: "WI-WH-020", type: "Work Instruction", category: "Incident Management", department: "Safety / EHS", riskLevel: "low" },
    { title: "Escalate SIF Potential", docNumber: "WI-WH-021", type: "Work Instruction", category: "Incident Management", department: "Safety / EHS", riskLevel: "low", sifPotential: true },
    { title: "Use Spill Kit", docNumber: "WI-WH-022", type: "Work Instruction", category: "Environmental", department: "Safety / EHS", riskLevel: "medium" },
    { title: "Inspect Fire Extinguisher", docNumber: "WI-WH-023", type: "Work Instruction", category: "Fire Protection", department: "Safety / EHS", riskLevel: "low" },
    { title: "Inspect Eyewash Station", docNumber: "WI-WH-024", type: "Work Instruction", category: "Emergency Response", department: "Safety / EHS", riskLevel: "low" },
    { title: "Inspect First Aid Kit", docNumber: "WI-WH-025", type: "Work Instruction", category: "Emergency Response", department: "Safety / EHS", riskLevel: "low" },
    { title: "Conduct Evacuation Roll Call", docNumber: "WI-WH-026", type: "Work Instruction", category: "Emergency Response", department: "Safety / EHS", riskLevel: "low" },
    { title: "Conduct Pre-Shift Safety Talk", docNumber: "WI-WH-027", type: "Work Instruction", category: "Safety / EHS", department: "Operations", riskLevel: "low" },
    { title: "Use Emergency Stop", docNumber: "WI-WH-028", type: "Work Instruction", category: "Conveyor Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Reset Conveyor After E-Stop", docNumber: "WI-WH-029", type: "Work Instruction", category: "Conveyor Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Respond to Conveyor Jam", docNumber: "WI-WH-030", type: "Work Instruction", category: "Conveyor Operations", department: "Operations", riskLevel: "medium", sifPotential: true },
    { title: "Apply Lockout/Tagout", docNumber: "WI-WH-031", type: "Work Instruction", category: "Lockout/Tagout", department: "Maintenance", riskLevel: "high", sifPotential: true,
      procedureSteps: [
        { order: 1, action: "Consult the machine-specific energy control procedure (ECP) for specific points." },
        { order: 2, action: "Turn off the equipment at the local control panel." },
        { order: 3, action: "Locate the main disconnect and move handle to the 'OFF' or 'Isolated' position." },
        { order: 4, action: "Apply a multi-lock hasp if more than one person is working on the device." },
        { order: 5, action: "Apply your personal lock and a completed tag stating name/date/contact info." },
        { order: 6, action: "Secure any secondary energy sources (lock valves, block hydraulic cylinders)." }
      ]
    },
    { title: "Remove Lockout/Tagout", docNumber: "WI-WH-032", type: "Work Instruction", category: "Lockout/Tagout", department: "Maintenance", riskLevel: "medium", sifPotential: true },
    { title: "Verify Zero Energy", docNumber: "WI-WH-033", type: "Work Instruction", category: "Lockout/Tagout", department: "Maintenance", riskLevel: "high", sifPotential: true },
    { title: "Complete Hot Work Permit", docNumber: "WI-WH-034", type: "Work Instruction", category: "Maintenance", department: "Maintenance", riskLevel: "medium" },
    { title: "Inspect Ladder Before Use", docNumber: "WI-WH-035", type: "Work Instruction", category: "Facilities", department: "Operations", riskLevel: "low" },
    { title: "Inspect Scissor Lift Before Use", docNumber: "WI-WH-036", type: "Work Instruction", category: "Maintenance", department: "Facilities", riskLevel: "medium" },
    { title: "Barricade a Work Area", docNumber: "WI-WH-037", type: "Work Instruction", category: "Safety / EHS", department: "Operations", riskLevel: "low" },
    { title: "Set Up Pedestrian Detour", docNumber: "WI-WH-038", type: "Work Instruction", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },
    { title: "Check Emergency Exit Access", docNumber: "WI-WH-039", type: "Work Instruction", category: "Emergency Response", department: "Safety / EHS", riskLevel: "low" },
    { title: "Complete Housekeeping Checklist", docNumber: "WI-WH-040", type: "Work Instruction", category: "Housekeeping / 5S", department: "Operations", riskLevel: "low" },
    { title: "Inspect Battery Charging Area", docNumber: "WI-WH-041", type: "Work Instruction", category: "Maintenance", department: "Maintenance", riskLevel: "low" },
    { title: "Connect Forklift Battery Charger", docNumber: "WI-WH-042", type: "Work Instruction", category: "Maintenance", department: "Warehouse Operations", riskLevel: "low" },
    { title: "Disconnect Forklift Battery Charger", docNumber: "WI-WH-043", type: "Work Instruction", category: "Maintenance", department: "Warehouse Operations", riskLevel: "low" },
    { title: "Clean Up Battery Spill", docNumber: "WI-WH-044", type: "Work Instruction", category: "Environmental", department: "Maintenance", riskLevel: "medium" },
    { title: "Report Blocked Fire Protection Equipment", docNumber: "WI-WH-045", type: "Work Instruction", category: "Fire Protection", department: "Safety / EHS", riskLevel: "low" },
    { title: "Verify Contractor Check-In", docNumber: "WI-WH-046", type: "Work Instruction", category: "Contractor Safety", department: "Security", riskLevel: "low" },
    { title: "Perform Supervisor Safety Observation", docNumber: "WI-WH-047", type: "Work Instruction", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },
    { title: "Complete Training Acknowledgment", docNumber: "WI-WH-048", type: "Work Instruction", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },
    { title: "Complete Critical Control Verification", docNumber: "WI-WH-049", type: "Work Instruction", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" },
    { title: "Submit Document Review Feedback", docNumber: "WI-WH-050", type: "Work Instruction", category: "Safety / EHS", department: "Safety / EHS", riskLevel: "low" }
  ];

  console.log(`Upserting ${instructions.length} Work Instructions...`);
  for (const doc of instructions) {
    await upsertDocument(prisma, ctx, doc);
  }
}
