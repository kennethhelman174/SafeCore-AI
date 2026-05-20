import { PrismaClient } from "@prisma/client";

export async function seedControls(prisma: PrismaClient) {
  const controls = [
    // Elimination
    { name: "Remove unnecessary pedestrian access", type: "Elimination", description: "Designated work areas where no foot traffic is allowed.", effectivenessLevel: "Highest", verificationMethod: "Audits / Badge Access", isSystemDefault: true },
    { name: "Remove damaged equipment from service", type: "Elimination", description: "Immediate lockout and removal to repair shop.", effectivenessLevel: "Highest", verificationMethod: "Inspection / Tagout", isSystemDefault: true },
    
    // Substitution
    { name: "Use lower-risk chemical", type: "Substitution", description: "Replacing toxic cleaners with green alternatives.", effectivenessLevel: "High", verificationMethod: "SDS Review", isSystemDefault: true },
    { name: "Use ergonomic material handling device", type: "Substitution", description: "Replacing manual lift with vacuum lift or lift table.", effectivenessLevel: "High", verificationMethod: "Task Observation", isSystemDefault: true },
    
    // Engineering Controls
    { name: "Physical Guarding", type: "Engineering", description: "Fixed barrier to prevent contact with moving parts.", effectivenessLevel: "Medium-High", verificationMethod: "Physical Inspection", isSystemDefault: true },
    { name: "Interlocked guards", type: "Engineering", description: "Safety switch that kills power when guard is opened.", effectivenessLevel: "Medium-High", verificationMethod: "Functional Test", isSystemDefault: true },
    { name: "Pedestrian barriers", type: "Engineering", description: "Bollards or railings separating traffic.", effectivenessLevel: "Medium-High", verificationMethod: "Visual Inspection", isSystemDefault: true },
    { name: "Dock restraints", type: "Engineering", description: "Automated hook to secure trailer rear-impact guard.", effectivenessLevel: "Medium-High", verificationMethod: "Functional Test", isSystemDefault: true },
    { name: "Wheel chocks", type: "Engineering", description: "Manual block placed behind trailer wheels.", effectivenessLevel: "Medium-High", verificationMethod: "Verification Step", isSystemDefault: true },
    { name: "Trailer stands", type: "Engineering", description: "Support stands used in spotted trailers to prevent tip-over.", effectivenessLevel: "Medium-High", verificationMethod: "Visual Verification", isSystemDefault: true },
    { name: "Fall protection anchor points", type: "Engineering", description: "Engineered tie-off points.", effectivenessLevel: "High", verificationMethod: "Annual Certification", isSystemDefault: true },
    { name: "Conveyor emergency stops", type: "Engineering", description: "Pull-cords or buttons to halt conveyors.", effectivenessLevel: "High", verificationMethod: "Weekly Testing", isSystemDefault: true },
    { name: "Light curtains", type: "Engineering", description: "Optical barrier to detect intrusion into hazard zone.", effectivenessLevel: "High", verificationMethod: "Safety PLC Test", isSystemDefault: true },
    { name: "Safety gates", type: "Engineering", description: "Spring-loaded gates at ladder or dock openings.", effectivenessLevel: "Medium", verificationMethod: "Visual Inspection", isSystemDefault: true },
    { name: "Pedestrian separation", type: "Engineering", description: "Physical barriers or painted exclusion zones.", effectivenessLevel: "High", verificationMethod: "Site Audit", isSystemDefault: true },
    { name: "Dock restraint engaged", type: "Engineering", description: "Verification that the dock hook is locked on the trailer RIG.", effectivenessLevel: "High", verificationMethod: "Status Light Check", isSystemDefault: true },
    { name: "Wheel chocks applied", type: "Administrative", description: "Visual confirmation that chocks are snug against rear tires.", effectivenessLevel: "Medium", verificationMethod: "Verification Step", isSystemDefault: true },
    { name: "Trailer condition verified", type: "Administrative", description: "Inspection of trailer floor, walls, and roof before entry.", effectivenessLevel: "Medium", verificationMethod: "Checklist", isSystemDefault: true },
    { name: "LOTO applied and verified", type: "Administrative", description: "Locks/tags in place and verified by authorized personnel.", effectivenessLevel: "High", verificationMethod: "Audit", isSystemDefault: true },
    { name: "Zero energy verification", type: "Administrative", description: "Attempting to start equipment to confirm no residual energy.", effectivenessLevel: "Highest", verificationMethod: "Field Verification", isSystemDefault: true },
    { name: "Machine guards in place", type: "Engineering", description: "Verification that all required guards are secured.", effectivenessLevel: "High", verificationMethod: "Visual Check", isSystemDefault: true },
    { name: "E-stop accessible", type: "Engineering", description: "Verification that emergency stops are not blocked.", effectivenessLevel: "Medium", verificationMethod: "Sweep", isSystemDefault: true },
    { name: "Fall protection inspected", type: "PPE", description: "Pre-use check of harness and lanyard for wear or damage.", effectivenessLevel: "Medium", verificationMethod: "Pre-use check", isSystemDefault: true },
    { name: "Work area barricaded", type: "Administrative", description: "Physical barriers used to exclude unauthorized personnel.", effectivenessLevel: "Medium", verificationMethod: "Visual Check", isSystemDefault: true },
    { name: "Spotter assigned", type: "Administrative", description: "Designated person to guide equipment or warn pedestrians.", effectivenessLevel: "Medium", verificationMethod: "Verification Step", isSystemDefault: true },
    { name: "Supervisor verification", type: "Administrative", description: "Secondary check by a leader before high-risk task start.", effectivenessLevel: "High", verificationMethod: "Sign-off", isSystemDefault: true },
    { name: "Secondary battery cover", type: "Engineering", description: "Protective shield for battery cells.", effectivenessLevel: "Medium", verificationMethod: "Visual Inspection", isSystemDefault: true },
    { name: "Rack protection", type: "Engineering", description: "Bollards or guards at column bases.", effectivenessLevel: "Medium", verificationMethod: "Visual Inspection", isSystemDefault: true },
    { name: "Blue/red forklift lights", type: "Engineering", description: "Visual indicators on floor for approaching PITs.", effectivenessLevel: "Medium", verificationMethod: "Functional Check", isSystemDefault: true },
    { name: "Backup alarms", type: "Engineering", description: "Audible warning for reversing equipment.", effectivenessLevel: "Low-Medium", verificationMethod: "Functional Check", isSystemDefault: true },
    { name: "Speed limiters", type: "Engineering", description: "Electronic restriction on top PIT speed.", effectivenessLevel: "High", verificationMethod: "Configuration Audit", isSystemDefault: true },

    // Administrative Controls
    { name: "Standard operating procedure", type: "Administrative", description: "Documented steps for safe task performance.", effectivenessLevel: "Low", verificationMethod: "Training Record", isSystemDefault: true },
    { name: "Job Safety Analysis", type: "Administrative", description: "Risk mapping for specific tasks.", effectivenessLevel: "Low-Medium", verificationMethod: "JSA Review", isSystemDefault: true },
    { name: "Training", type: "Administrative", description: "Skill acquisition for safe work.", effectivenessLevel: "Low", verificationMethod: "Competency Test", isSystemDefault: true },
    { name: "Pre-use inspection", type: "Administrative", description: "User check before equipment operation.", effectivenessLevel: "Low", verificationMethod: "Checklist Audit", isSystemDefault: true },
    { name: "Permit to work", type: "Administrative", description: "High-risk task authorization (hot work, height).", effectivenessLevel: "Medium", verificationMethod: "Permit Closure Audit", isSystemDefault: true },
    { name: "Lockout/tagout verification", type: "Administrative", description: "Confirming zero energy state before work.", effectivenessLevel: "Medium-High", verificationMethod: "Verification Step Check", isSystemDefault: true },
    { name: "Traffic management plan", type: "Administrative", description: "Designated routes for PITs vs pedestrians.", effectivenessLevel: "Medium", verificationMethod: "Site Audit", isSystemDefault: true },
    { name: "Stop work authority", type: "Administrative", description: "Employee power to halt unsafe conditions.", effectivenessLevel: "High (Potential)", verificationMethod: "Culture Survey / Incident Review", isSystemDefault: true },
    { name: "Safety observation", type: "Administrative", description: "Behavioral safety feedback program.", effectivenessLevel: "Medium", verificationMethod: "Participation Tracking", isSystemDefault: true },
    { name: "Shift startup meeting", type: "Administrative", description: "Daily safety brief to team.", effectivenessLevel: "Low", verificationMethod: "Attendance Log", isSystemDefault: true },

    // PPE Controls (usually listed in PPE library too, but here as a category)
    { name: "PPE Program", type: "PPE", description: "Requirements for mandatory personal protection.", effectivenessLevel: "Lowest", verificationMethod: "Observation Audit", isSystemDefault: true },

    // Additional commonly used safety controls
    { name: "SOP", type: "Administrative", description: "Standard Operating Procedure outlining safe work steps.", effectivenessLevel: "Low", verificationMethod: "Training Record", isSystemDefault: true },
    { name: "Signage", type: "Administrative", description: "Visual signage, warning labels, or safety placards.", effectivenessLevel: "Low", verificationMethod: "Visual Inspection", isSystemDefault: true }
  ];

  console.log(`Seeding ${controls.length} controls...`);

  for (const c of controls) {
    await prisma.control.upsert({
      where: { name: c.name },
      update: { ...c, isSystemDefault: true },
      create: { ...c, isSystemDefault: true }
    });
  }
}
