import { PrismaClient } from "@prisma/client";
import { getDocumentContext, upsertDocument } from "./documentUtils";
import { seedSOPs } from "./sops.seed";
import { seedWorkInstructions } from "./workInstructions.seed";
import { seedJSAs } from "./jsas.seed";

export async function seedDocuments(prisma: PrismaClient) {
  // 1. Run modular seeds (SOPs, Work Instructions, JSAs)
  await seedSOPs(prisma);
  await seedWorkInstructions(prisma);
  await seedJSAs(prisma);

  const ctx = await getDocumentContext(prisma);

  // 2. Add other document types (Checklists, Policies, etc.)
  const realisticChecklists = [
    "Forklift Daily Pre-Operational Inspection Checklist",
    "Electric Pallet Jack Pre-Use Inspection Checklist",
    "Loading Dock Safety & Lever Board Checklist",
    "Battery Charging Station Safety Inspection Checklist",
    "Emergency Eyewash & Shower Monthly Checklist",
    "Fire Extinguisher Monthly Inspection Checklist",
    "Conveyor Line Visual & Guard Inspection Checklist",
    "First Aid Kit Audit and replenishment Inventory",
    "High-bay Racking & Structural Integrity Checklist",
    "Trailer Yard Yard-Dog Vehicle Inspection Checklist",
    "PPE Compliance Weekly Audit checklist",
    "Hazardous Chemical Spill Kit Readiness Inspection",
    "Dock Restraint and Light Indicator Test Sheet",
    "Housekeeping & 5S Warehouse Area Checklist",
    "LOTO Station Padlock and Tag Audit checklist",
    "Emergency Exit Path & Signage Visibility Checklist",
    "Baler and Compactor Machine Guarding Checklist",
    "Ladder Safety and Maintenance Inspection Audit",
    "Overhead Door Sensor & Braking Safety Sheet",
    "Pedestrian Walkway Visual Separation Check List",
    "Dock Leveler Pit Cleaner & Debris Log Checklist",
    "Aisle Clearances & Stacking Height Inspection Checklist",
    "Hazmat Storage Cabinet Ventilation Check",
    "Thermal Sensor & Heat Detection System Checklist",
    "Cold Storage Evaporator Valve Safety Checklist"
  ];

  const genericChecklists = realisticChecklists.map((title, i) => ({
    title,
    docNumber: `CHK-WHS-${100 + i}`,
    type: "Inspection Checklist",
    category: "Inspection",
    riskLevel: "low",
    purpose: `To standardize the regular inspection of ${title.toLowerCase()} to ensure proactive detection of safety issues.`,
    scope: "Covers all shifts, personnel, and operating segments within the warehouse facility.",
    responsibilities: "Inspecting technician must sign off; supervisor must audit and log corrections."
  }));

  const realisticSifAssessments = [
    "High-Bay Rack Collapse SIF Assessment",
    "Forklift-Pedestrian Collision SIF Assessment",
    "Trailer Creep & Early Departure SIF Prevention Study",
    "Main Electrical Panel LOTO Integrity Assessment",
    "High-Speed Conveyor In-running Nip Point Hazard Study",
    "Baler Hydraulic Failure & Crush SIF Assessment",
    "Work at Heights Racking Repair Fall Risk Assessment",
    "Dock Edge Unprotected Drop Fall Mitigation Review",
    "Electric Forklift Battery Acid Exposure Risks",
    "Ammonia Refrigeration Line Leak Risk Assessment",
    "Yard Dog Back-over Fatality Prevention Study",
    "Overhead Mezzanine Edge Drop SIF Assessment",
    "Dock Lock Restraint Mechanical Bypass Risk Assessment",
    "Propane Tank Refueling Explosion SIF Assessment",
    "Battery Station Hydrogen Gas Accumulation Review",
    "High-Voltage Transformer Access Safety Audit",
    "Trailer Roof Structural Collapse Evaluation",
    "Compactor Maintenance Jam Clearing Risk Assessment",
    "Overhead Hoist Mechanical Cable Integrity Audit",
    "Active Dock Cross-Traffic Pedestrian Hazard Study"
  ];

  const sifAssessments = realisticSifAssessments.map((title, i) => ({
    title,
    docNumber: `SIF-WHS-${100 + i}`,
    type: "SIF Assessment",
    category: "SIF / Critical Risk",
    riskLevel: "high",
    sifPotential: true,
    purpose: `Identify critical controls to completely eliminate precursor risks for ${title.toLowerCase()}.`,
    scope: "High-risk areas evaluated for structural, electrical, and kinetic risk profiles.",
    responsibilities: "EHS Manager and Area Operations Lead must sign and review at at-risk-meetings."
  }));

  const realisticPolicies = [
    "Zero Harm Workplace Safety Commitment Policy",
    "Forklift Licensing & Operations Accountability Policy",
    "Zero Energy Lockout/Tagout Enforcement Policy",
    "Universal Slip, Trip, and Fall Prevention Directive",
    "Mandatory Personal Protective Equipment Standard",
    "Pedestrian Right-of-Way and Warning Zone Standard",
    "Contractor On-Site Behavior & Prequalification Policy",
    "Hot Work Permitting & Fire Watch Policy",
    "Incident Reporting & Root Cause Analysis Mandate",
    "Reasonable Suspicion Drug & Alcohol Free Workplace Policy",
    "Severe Weather Warehouse Closure Safety Protocol",
    "Ergonomic Safe Lifting and Load Team Lifting Directive",
    "Clean-As-You-Go Spill Response and 5S Housekeeping Policy",
    "Heat Illness Prevention & Mandatory Hydration Break Policy",
    "Conveyor System Emergency Handrails Access Policy",
    "Hazard Communication & Global Harmonized System Compliance",
    "Working Alone at Remote Warehouse Yards Policy",
    "Visitor Safety Escort and High-Visibility Vest Requirement",
    "Warehouse High-Bay Racking Capacity and Safety Stacking Policy",
    "Preventative Equipment Maintenance Safety Clearance Standards"
  ];

  const policies = realisticPolicies.map((title, i) => ({
    title,
    docNumber: `POL-WHS-${100 + i}`,
    type: "Safety Policy",
    category: "Warehouse",
    riskLevel: "low",
    purpose: `Establish official corporate alignment and compliance expectations regarding ${title.toLowerCase()}.`,
    scope: "All corporate, administrative, warehouse operations, and guest activities.",
    responsibilities: "Compliance with this policy is mandatory. Failure to follow is subject to formal corrective action."
  }));

  const realisticEmergencies = [
    "Ammonia Refrigeration Line Leak Emergency Evacuation",
    "Active Shooter and Safe Room Shelter-in-Place Protocol",
    "Forklift Battery Charging Station Acid Spill Emergency",
    "Main Distribution Center Fire Alarm Evacuation Standard",
    "Tornado & Severe Weather Safe Shelter-in-Place Plan",
    "High-Voltage Electrical Contact Shock Response",
    "Hazardous Gas Main Line Leak Isolation Plan",
    "High-Bay Racking Dynamic Collapse Search & Rescue Procedure",
    "Active Trailer Creep / Trailer Tip Emergency Evacuation",
    "Racking Fire Suppression System Mechanical Bypass",
    "Confined Space Entry Entrapment Rescue Standard",
    "Active Yard Fire Standpipe Isolation Control Plan",
    "Severe Injury Extreme Hemorrhaging Traumatic Response Procedure",
    "Toxic Chemical Inhalation Immediate Action Protocol",
    "Warehouse Dock Water Contamination Emergency Shutoff"
  ];

  const emergencies = realisticEmergencies.map((title, i) => ({
    title,
    docNumber: `EMER-WHS-${100 + i}`,
    type: "Emergency Procedure",
    category: "Emergency Response",
    riskLevel: "high",
    sifPotential: true,
    purpose: `Mitigate risk of panic, coordinate immediate containment, and ensure rapid evacuation and response for ${title.toLowerCase()}.`,
    scope: "Applies during active alarms, emergency distress alerts, or local incident control calls.",
    responsibilities: "Emergency coordinators dictate response; all onsite personnel must immediately yield and comply."
  }));

  const realisticContractorMaint = [
    "External Electric Service Isolation Authorization Protocol",
    "Rooftop HVAC Preventative Maintenance Safework Guide",
    "Dock Hydraulic Pump High-Pressure Fluid Servicing Standard",
    "High-Bay Structural Fire Sprinkler Line Repair Work",
    "Forklift Carriage Mast Cylinder Seal Replacement SOP",
    "Subcontractor LOTO Lock Integration Coordination Procedures",
    "Racking Upright Column Guard Weld Repair Safety Manual",
    "Overhead Mezzanine Steel Rail Deck Retrofit Guide",
    "Conveyor Roller Core Bearing Greasing Maintenance Standard",
    "Warehouse Floor Joint Concrete Crack Patching Procedures",
    "High-Voltage Substation Circuit Breaker Yearly Preventative Maintenance",
    "Baler Shear Blade Safe Resharpening Procedure",
    "Dock Door Torsion Spring Structural Tensioning Guide",
    "Yard Gravel Compaction and Pipelining Subcontractor SOP",
    "Industrial Battery Equalizing Charge Maintenance Work"
  ];

  const contractorMaint = realisticContractorMaint.map((title, i) => ({
    title,
    docNumber: `CMP-WHS-${100 + i}`,
    type: "Contractor Procedure",
    category: "Contractor Safety",
    riskLevel: "medium",
    purpose: `Coordinate third-party technician and contractor workspace alignment for ${title.toLowerCase()} safely.`,
    scope: "All contractor operations, engineering adjustments, and on-premises vendor work.",
    responsibilities: "Contractor must review pre-work safety checklist with warehouse authority before operations begin."
  }));

  const realisticIncidentAudit = [
    "Warehouse Near-Miss Reporting Framework Document",
    "Major Property Damage Loss Investigation Form",
    "OSHA-300 Workplace Injury Logging Template",
    "Behavioral Safety Observation (BBS) Performance Appraisal",
    "Pedestrian Struck-by-Forklift Active Root Cause Audit Template",
    "LOTO Personal Padlock Violation Disciplinary Procedure",
    "Hazard Spray Containment Area Integrity Verification Form",
    "Monthly Joint Health & Safety Committee Audit Protocol",
    "Weekly Site General Housekeeping Standard Verification Sheet",
    "High-Bay Rack Level Deflection and Damage Audit Template",
    "SIF Potential Squeeze-in-Ramps Audit Framework",
    "Corrective Action Plan Effectiveness Verification Procedure",
    "Emergency Drill Audit Performance Evaluation Checklist",
    "Annual Safety Platform Regulatory Compliance Audit Template",
    "Workplace Ergonomics Load Transfer Assessment Protocol"
  ];

  const incidentAudit = realisticIncidentAudit.map((title, i) => ({
    title,
    docNumber: `IAT-WHS-${100 + i}`,
    type: "Corrective Action Report",
    category: "Incident Management",
    riskLevel: "medium",
    purpose: `Ensure systematic root-cause investigation, corrective tracking, and documentation format for ${title.toLowerCase()}.`,
    scope: "Covers all post-audits, regulatory reviews, and corrective action workflows.",
    responsibilities: "Audit leaders define corrective actions; department managers verify compliance."
  }));

  const others = [
    ...genericChecklists,
    ...sifAssessments,
    ...policies,
    ...emergencies,
    ...contractorMaint,
    ...incidentAudit
  ];

  console.log(`Upserting ${others.length} realistic document records...`);
  for (const doc of others) {
    await upsertDocument(prisma, ctx, doc);
  }
}
