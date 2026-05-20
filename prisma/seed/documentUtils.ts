import { PrismaClient } from "@prisma/client";

export async function getDocumentContext(prisma: PrismaClient) {
  const admin = await prisma.user.findFirst({ where: { email: "admin@warehouse.local" } });
  if (!admin) throw new Error("Admin user not found for seeding documents.");

  const [types, categories, departments, statuses, ppe, hazards, controls, equipment] = await Promise.all([
    prisma.documentType.findMany(),
    prisma.documentCategory.findMany(),
    prisma.department.findMany(),
    prisma.documentStatus.findMany(),
    prisma.pPE.findMany(),
    prisma.hazard.findMany(),
    prisma.control.findMany(),
    prisma.equipment.findMany()
  ]);

  const getType = (name: string) => {
    const res = types.find(t => t.name === name);
    if (!res) throw new Error(`Document Type "${name}" is missing in Master Data during seeding.`);
    return res.id;
  };
  const getCat = (name: string) => {
    const res = categories.find(c => c.name === name);
    if (!res) throw new Error(`Document Category "${name}" is missing in Master Data during seeding.`);
    return res.id;
  };
  const getDept = (name: string) => {
    const res = departments.find(d => d.name === name);
    if (!res) throw new Error(`Department "${name}" is missing in Master Data during seeding.`);
    return res.id;
  };
  const getStatus = (name: string) => {
    const res = statuses.find(s => s.name === name);
    if (!res) throw new Error(`Document Status "${name}" is missing in Master Data during seeding.`);
    return res.id;
  };
  const getPPE = (name: string) => ppe.find(p => p.name === name)?.id;
  const getHazard = (name: string) => hazards.find(h => h.name === name)?.id;
  const getControl = (name: string) => controls.find(c => c.name === name)?.id;
  const getEquip = (name: string) => equipment.find(e => e.name === name)?.id;

  return {
    admin,
    getType,
    getCat,
    getDept,
    getStatus,
    getPPE,
    getHazard,
    getControl,
    getEquip,
    publishedId: getStatus("Published")
  };
}

export async function upsertDocument(prisma: PrismaClient, ctx: any, doc: any) {
  const key = {
    docNumber_currentRevision: { 
      docNumber: doc.docNumber, 
      currentRevision: doc.revision || "1.0" 
    }
  };

  const existing = await prisma.document.findUnique({
    where: key,
    select: { id: true, isSystemDefault: true }
  });

  const typeId = ctx.getType(doc.type);
  const categoryId = ctx.getCat(doc.category || "Warehouse");
  const departmentId = ctx.getDept(doc.department || "Operations");
  const statusId = ctx.publishedId;

  const data: any = {
    docNumber: doc.docNumber,
    title: doc.title,
    typeId,
    categoryId,
    departmentId,
    statusId,
    riskLevel: doc.riskLevel || "medium",
    sifPotential: doc.sifPotential || false,
    requiredTraining: doc.requiredTraining || false,
    authorId: ctx.admin.id,
    currentRevision: doc.revision || "1.0",
    isLatestRevision: true,
    purpose: doc.purpose || `Establish safety guidelines and standard work procedures for ${doc.title}.`,
    scope: doc.scope || "This protocol applies to all warehouse personnel, full-time staff, and authorized contractors operating on site.",
    responsibilities: doc.responsibilities || "Operations managers are responsible for ensuring compliance; all operators must follow these standard guidelines.",
    isSystemDefault: true,
  };

  // Check relationship requirements
  for (const p of doc.ppe || []) {
    if (!ctx.getPPE(p)) {
      throw new Error(`Seeding relationship error: PPE item "${p}" referenced by document '${doc.docNumber}' is not seeded in the database.`);
    }
  }
  for (const h of doc.hazards || []) {
    if (!ctx.getHazard(h)) {
      throw new Error(`Seeding relationship error: Hazard "${h}" referenced by document '${doc.docNumber}' is not seeded in the database.`);
    }
  }
  for (const c of doc.controls || []) {
    if (!ctx.getControl(c)) {
      throw new Error(`Seeding relationship error: Control "${c}" referenced by document '${doc.docNumber}' is not seeded in the database.`);
    }
  }
  for (const e of doc.equipment || []) {
    if (!ctx.getEquip(e)) {
      throw new Error(`Seeding relationship error: Equipment "${e}" referenced by document '${doc.docNumber}' is not seeded in the database.`);
    }
  }

  // --- Dynamic Procedural Generation for High-Quality Task-Specific Content ---
  function generateTaskProcedureSteps(title: string): { order: number; title?: string; action: string; safetyNote?: string }[] {
    const t = title.toLowerCase();
    
    if (t.includes("forklift") || t.includes("truck") || t.includes("picker") || t.includes("pit")) {
      return [
        { order: 1, title: "Pre-task planning", action: `Conduct safe ${title} pre-start walkaround, checking tires, fluids, and hydraulics.`, safetyNote: "Report any defects immediately; tag out of service if unsafe." },
        { order: 2, title: "Mounting PIT", action: `Mount ${title} operator compartment utilizing three points of contact at all times.`, safetyNote: "Wear high-visibility vest and fasten seatbelt immediately." },
        { order: 3, title: "Controls test", action: "Test operational controls: steering, horn, service and parking brakes, and hoist mechanism.", safetyNote: "Sound horn twice before moving or reversing." },
        { order: 4, title: "Safe travel", action: `Travel under safe speed limits with load tilted back and forks lowered to 2-4 inches height.`, safetyNote: "Keep hands and feet inside compartment and maintain 360-degree awareness." },
        { order: 5, title: "Post-task securement", action: "Upon task completion, park in designated charging bay, lower forks flat to floor, and apply handbrake.", safetyNote: "Turn off ignition key and remove key to prevent unauthorized use." }
      ];
    }
    
    if (t.includes("battery") || t.includes("charge") || t.includes("watering")) {
      return [
        { order: 1, title: "Positioning PIT", action: "Position equipment in designated battery charging bay and engage emergency brake.", safetyNote: "Ensure area is well-ventilated; no spark or heat sources nearby." },
        { order: 2, title: "PPE deployment", action: "Put on heavy-duty chemical gloves, splash apron, and full face shield before handling batteries.", safetyNote: "Acid splash risk is high; verify eye wash station is operational." },
        { order: 3, title: "Charger inspection", action: "Inspect connector plugs, cables, and charger unit for physical damage or burn marks.", safetyNote: "Do not plug in if cable insulation is cracked or exposed." },
        { order: 4, title: "Connection safe", action: "Connect charger lead safely to battery receptacle, verifying alignment clicks completely.", safetyNote: "Never disconnect charger while still actively transferring high-amp current." },
        { order: 5, title: "Watering process", action: "For watering ops, add deionized water up to indicator shelf only AFTER battery charging finishes.", safetyNote: "Do not overfill; toxic electrolyte overflow hazard." }
      ];
    }

    if (t.includes("dock") || t.includes("trailer") || t.includes("restraint") || t.includes("chock")) {
      return [
        { order: 1, title: "Pre-entry checks", action: "Verify incoming trailer has wheels chocked and vehicle restraint system is locked green.", safetyNote: "Never step onto a trailer without absolute mechanical lock confirmation." },
        { order: 2, title: "Floor structural audit", action: "Conduct visual inspection of trailer floor inside for rot, cracks, holes, or weakness.", safetyNote: "Keep clear of the fall threshold at the dock opening." },
        { order: 3, title: "Leveler engagement", action: "Engage the dock leveler control to extend lip completely and rest safely on the trailer floor.", safetyNote: "Verify leveler transition plate is secure and flush; no trip edges." },
        { order: 4, title: "PIT Cargo transfer", action: "Execute cargo transfer using appropriate lift equipment, maintaining safe center traffic.", safetyNote: "Keep a minimum 3-foot clearance from dock edge borders." },
        { order: 5, title: "Post-operation securing", action: "Retract and store leveler safely, close dock doors, and flip interlock lights back to red.", safetyNote: "Ensure dock door is fully locked post-operation." }
      ];
    }

    if (t.includes("loto") || t.includes("lock") || t.includes("lockout") || t.includes("energy")) {
      return [
        { order: 1, title: "Isolate identification", action: "Identify all energy sources (electrical, pneumatic, kinetic, hydraulic) connected to equipment.", safetyNote: "Refer to machine-specific energy control procedure map first." },
        { order: 2, title: "Impact warning", action: "Notify all affected employees in vicinity that LOTO sequence is about to be performed.", safetyNote: "Ensure everyone is clear of moving parts." },
        { order: 3, title: "Power cutoff", action: "Shut down the machine utilizing normal operator stops and isolate all main disconnects.", safetyNote: "Bleed residual kinetic or pressure energy to zero energy state." },
        { order: 4, title: "Lock & Tag placement", action: "Apply individual personalized locks and tags to every energy isolation point securely.", safetyNote: "Strict One-Lock-One-Person rule is mandatory." },
        { order: 5, title: "Energy zero check", action: "Verify zero energy state by attempting to start machine using control panel buttons.", safetyNote: "Return startup switches to 'off' post-verification before restoration." }
      ];
    }

    if (t.includes("chemical") || t.includes("spill") || t.includes("hazmat") || t.includes("waste")) {
      return [
        { order: 1, title: "SDS evaluation", action: "Identify SDS instructions and hazard labels for the exact chemical of interest before handling.", safetyNote: "Wear chemical-resistant gloves, apron, and indirect-vent safety goggles." },
        { order: 2, title: "Safe containment", action: "Ensure chemical containers are kept tightly sealed and stored upright in designated yellow cabinets.", safetyNote: "Use secondary containment trays for bulk assets." },
        { order: 3, title: "Spill isolate", action: "For spills, isolate the spill zone, erect barrier signs, and deploy appropriate absorbent pads.", safetyNote: "Never attempt cleanup of highly toxic chemicals without certified HAZWOPER rescue team." },
        { order: 4, title: "Disposal protocols", action: "Sweep up saturated absorbents using non-sparking plastic tools and seal inside hazardous drum packs.", safetyNote: "Affix complete toxic disposal warning labels immediately." },
        { order: 5, title: "Post-work sanitization", action: "Wash face and hands thoroughly with soap after handling chemicals and clean tools.", safetyNote: "Report spill events to environmental engineer within 15 minutes." }
      ];
    }

    if (t.includes("ladder") || t.includes("height") || t.includes("overhead") || t.includes("harness")) {
      return [
        { order: 1, title: "Equipment select", action: "Select correct ladder or lift equipment corresponding to height requirements and load capacity.", safetyNote: "Inspect rails, steps, and non-slip feet for safety." },
        { order: 2, title: "Setup stabilization", action: "Set up ladder on solid, level ground and engage locking spreaders or stabilizers.", safetyNote: "Keep a 4:1 slope for straight/extension ladders." },
        { order: 3, title: "Elevate backup lock", action: "For elevations over 4/6 feet, put on a certified full-body fall arrest harness and lanyard.", safetyNote: "Anchor lanyard only to structurally engineered structural points." },
        { order: 4, title: "Climb contact rules", action: "Maintain 3 points of contact (two hands one foot, or two feet one hand) when climbing.", safetyNote: "Never carry heavy items in hand; use tool belts or hoist lines." },
        { order: 5, title: "Safe ladder descent", action: "Dismount carefully, fold equipment, and return tools to storage racks at floor level.", safetyNote: "Never overreach from ladders; descend and reposition instead." }
      ];
    }

    if (t.includes("emergency") || t.includes("fire") || t.includes("evacuation") || t.includes("drill")) {
      return [
        { order: 1, title: "Egress maps training", action: "Learn exact escape paths, rally maps, and emergency exit signs in your workplace zone.", safetyNote: "Ensure emergency egress layout lines are never blocked." },
        { order: 2, title: "Active warning shutdown", action: "Upon hearing sirens or alarms, immediately stop work and cut off active power grids.", safetyNote: "Do not delay to retrieve personal luggage or clothing items." },
        { order: 3, title: "Exit tower exit", action: "Egress the facility heading using closest visual exit signs in a safe, orderly line.", safetyNote: "Strictly avoid elevators; utilize designated fire tower stairs." },
        { order: 4, title: "Rally field setup", action: "Assemble immediately at designate exterior rally area matching your shift group.", safetyNote: "Report headcount to marshal immediately upon arrival." },
        { order: 5, title: "Wait for instruction", action: "Do not re-enter facility under any circumstance until official clear signal sounds.", safetyNote: "EHS Manager must declare all-clear sign before return." }
      ];
    }

    if (t.includes("ppe") || t.includes("shoe") || t.includes("eyewear") || t.includes("vest") || t.includes("glove")) {
      return [
        { order: 1, title: "Check location map", action: "Refer to area PPE assessment maps to verify specific protection gear required.", safetyNote: "Steel toe shoes are mandatory inside active warehouse docks." },
        { order: 2, title: "Inspect eye guards", action: "Perform visual fit testing on safety goggles, checking for major scratches or cracks.", safetyNote: "Only use ANSI Z87.1 certified protective glasses." },
        { order: 3, title: "Select gloves", action: "Confirm protective gloves match chemical or abrasive hazards present in work loop.", safetyNote: "Use puncture-resistant latex gloves with mechanical grips." },
        { order: 4, title: "Fit high-vis vests", action: "Wear high-visibility Class 2 safety vests at all times inside forklift gridways.", safetyNote: "Adjust straps for tight snug fit; avoid hanging loose straps." },
        { order: 5, title: "Audit wear limits", action: "Keep personal gear sanitized, stored in clean cabinets, and replace elements showing wear.", safetyNote: "Report PPE shortages to shift supervisor immediately." }
      ];
    }

    if (t.includes("housekeeping") || t.includes("5s") || t.includes("clean") || t.includes("spill")) {
      return [
        { order: 1, title: "Mark workspace lines", action: "Establish clear workflow zones using visual marking tapes and keep aisles unobstructed.", safetyNote: "Fire corridors and electric panel clearances must have 3-foot clearance." },
        { order: 2, title: "Daily sweeping", action: "Execute daily cleaning routine: sweep fine dust, wipe machine screens, clear discard materials.", safetyNote: "Affix wet-floor hazard markers before wet mopping." },
        { order: 3, title: "Return tools to board", action: "Return tools, equipment, and raw inventory exactly to designated silhouette boards and shelves.", safetyNote: "Check for correct tool tags as per 5S standards." },
        { order: 4, title: "Verify structural flaws", action: "Immediately report floor surface cracks, loose rack bolts, or fluid leaks to EHS Team.", safetyNote: "Clear spill zones immediately using designated spill towels." },
        { order: 5, title: "Sign housekeeping board", action: "Execute weekly audit walk and sign off housekeeping checklist at your designated shift board.", safetyNote: "Supervisor validation is required for 5S grade." }
      ];
    }

    // fallback dynamic detailed steps based on title
    return [
      { order: 1, title: "Walkway and environment sweep", action: `Perform pre-task inspection of physical environment and review layout requirements for standard work on ${title}.`, safetyNote: "Ensure all required personal protective equipment is fully buckled." },
      { order: 2, title: "Boundary markers & controls configuration", action: `Verify clear zone boundary lines and coordinate safe setup parameters for executing ${title}.`, safetyNote: "Identify nearby emergency shutdown valves or primary disconnect switches." },
      { order: 3, title: "Primary execution safety locks", action: `Initiate primary execution phase of ${title} conforming strictly to safe operating limits and speeds.`, safetyNote: "Maintain steady footing and keep hands clear of active interface points." },
      { order: 4, title: "Steady-state operation monitoring", action: `Run steady monitoring checks on operational quality, checking for safe temperature and sound signatures.`, safetyNote: "Report immediately if any anomalous vibration, smoke, or odor is detected." },
      { order: 5, title: "De-energization and cleanup", action: `Inactivate equipment power, follow safe storage protocols, and clean up area as per 5S standards.`, safetyNote: "Ensure power lines are stored dry and verify safe closure with supervisors." }
    ];
  }

  function generateTaskJSASteps(title: string): { order: number; taskDescription: string; potentialHazards: string; controlMeasures: string }[] {
    const t = title.toLowerCase();

    if (t.includes("forklift") || t.includes("truck") || t.includes("picker") || t.includes("pit")) {
      return [
        { order: 1, taskDescription: "PIT Pre-use Inspection", potentialHazards: "Fluid leak slip hazard, pinch points checking engine hood", controlMeasures: "Wear leather work gloves, inspect leak trace on solid ground." },
        { order: 2, taskDescription: "Mounting and Ignition", potentialHazards: "Slipped boot sole during climb, operator strike from overhead", controlMeasures: "Maintain 3-point contact, wearing helmet before mounting." },
        { order: 3, taskDescription: "Driving in Aisles", potentialHazards: "Collisions with pedestrian staff, blind corner strikes, tipping", controlMeasures: "Obey 5mph limit, sound horn at intersections, use blue backup spot lights." },
        { order: 4, taskDescription: "Elevating / Stacking Load", potentialHazards: "Overturning due to excessive center weight, dropping palette stack", controlMeasures: "Verify weight stays beneath max limit plate, do not stack on damaged rails." },
        { order: 5, taskDescription: "Parking and Exit", potentialHazards: "Rollaway accidents on sloped deck, operator ankle strain descending", controlMeasures: "Apply mechanical hand brake, lower lift mast flat, step backward down cleanly." }
      ];
    }

    if (t.includes("dock") || t.includes("trailer") || t.includes("restraint") || t.includes("chock")) {
      return [
        { order: 1, taskDescription: "Trailer Spotting Verification", potentialHazards: "Trailer creep away from platform, early departure crush injury", controlMeasures: "Verify automatic hook is locked, place heavy-duty rubber wheel chocks." },
        { order: 2, taskDescription: "Opening Dock Door", potentialHazards: "Heavy spring failure muscle snap, pinch fingers on roller tracks", controlMeasures: "Stand straight, lift cleanly using legs, avoid reaching onto roller path." },
        { order: 3, taskDescription: "Deploying Dock Leveler", potentialHazards: "Pinch feet in descending plate, metal plate trip point hazard", controlMeasures: "Confirm dock pit is clear of helpers, verify lip sits flush on trailer flat." },
        { order: 4, taskDescription: "Entering trailer with Lift", potentialHazards: "Trailer floor wood breakthrough, PIT tipping over dock ledge", controlMeasures: "Inspect floor boarding condition, maintain slow entry speed." },
        { order: 5, taskDescription: "Task Finished Lockup", potentialHazards: "Unauthorized intruder breach, drop temperature cooling loss", controlMeasures: "Retract leveler plate, securely drop close overhead dock door." }
      ];
    }

    if (t.includes("loto") || t.includes("lock") || t.includes("lockout") || t.includes("energy")) {
      return [
        { order: 1, taskDescription: "Isolating Main Source", potentialHazards: "High-voltage arc flash, sudden unexpected mechanical rotation", controlMeasures: "Wear safety glasses and protective electric gloves, stand at side angle." },
        { order: 2, taskDescription: "Locking Disconnect Switch", potentialHazards: "Unauthorized turn-on, tag falling off switch trigger", controlMeasures: "Affix heavy padlocks to breaker lockouts, tag out with name/cell phone." },
        { order: 3, taskDescription: "Bleeding Residual Pressures", potentialHazards: "Pneumatic hose whipping, high temperature fluid spray", controlMeasures: "Wear full splash face shield, open exhaust dump valves slowly." },
        { order: 4, taskDescription: "Zero-Energy Verification", potentialHazards: "False reading lock-out, machine starting up unexpectedly", controlMeasures: "Press start test switch, verify voltmeter reads zero, double-test isolators." },
        { order: 5, taskDescription: "Restoring Service safely", potentialHazards: "Tool left inside gear grids, injury to nearby coworkers", controlMeasures: "Clear area of crew, perform visual cavity check, remove locks together." }
      ];
    }

    if (t.includes("chemical") || t.includes("spill") || t.includes("hazmat") || t.includes("waste")) {
      return [
        { order: 1, taskDescription: "Retrieving Chemical Assets", potentialHazards: "Container drop container rupture, toxic vapor inhalation", controlMeasures: "Verify dual tight seal, carry using certified carry crates only." },
        { order: 2, taskDescription: "Pumping / Mixing Fluids", potentialHazards: "Corrosive chemical skin burn, splash contact onto eyes", controlMeasures: "Wear chemical splash apron, butyl safety gloves, indirect goggles." },
        { order: 3, taskDescription: "Zone Cleanup containment", potentialHazards: "Spill expansion, chemical sliding slips, fume buildup", controlMeasures: "Deploy yellow absorbent boom socks, open positive ventilation dampers." },
        { order: 4, taskDescription: "Absorbent Disposal", potentialHazards: "Skin contamination handling waste, chemical skin absorption", controlMeasures: "Use plastic non-reactive shovel, place into labeled sealed hazard drums." },
        { order: 5, taskDescription: "Decontamination check", potentialHazards: "Transferring chemicals to skin, face splash contamination", controlMeasures: "Utilize safety wash basin, shower for 15 minutes if direct contact occurred." }
      ];
    }

    return [
      { order: 1, taskDescription: `Area Preparation for ${title}`, potentialHazards: "Slipping/tripping on scrap debris, insufficient lighting errors", controlMeasures: "Conduct quick walkway sweep, verify light level fits target guidelines." },
      { order: 2, taskDescription: `Tool Isolation and setup for ${title}`, potentialHazards: "Electrical shock, strain injuries carrying tools, tool drops", controlMeasures: "Inspect insulation cords, perform leg lift when lifting accessories." },
      { order: 3, taskDescription: `Primary execution of ${title}`, potentialHazards: "Pinch points on gears, dust inhalation risk, eye damage", controlMeasures: "Affix mechanical barrier guards, use dust masks and wrap goggles." },
      { order: 4, taskDescription: "Quality & Stability Monitoring", potentialHazards: "Sudden release of heat, material break loose, tipping risk", controlMeasures: "Check temperature sensors, stand clear of primary discharge slots." },
      { order: 5, taskDescription: "Facility Clean Out & Audit", potentialHazards: "Trash pileup hazardous fire risk, lost tracking tags", controlMeasures: "Return equipment to 5S grids, throw waste in correct categorized scrap bins." }
    ];
  }

  // Assign and pad steps to guarantee at least 5 task-specific steps
  const isSOP = doc.type === "SOP" || doc.type === "Work Instruction";
  let _procedureSteps = doc.procedureSteps;
  if (isSOP) {
    if (!_procedureSteps || _procedureSteps.length < 5) {
      const generated = generateTaskProcedureSteps(doc.title);
      if (_procedureSteps && _procedureSteps.length > 0) {
        const existingLength = _procedureSteps.length;
        const padded = [..._procedureSteps];
        for (let i = existingLength + 1; i <= 5; i++) {
          const genStep = generated[i - 1] || generated[generated.length - 1];
          padded.push({
            order: i,
            title: genStep.title || `Step ${i}`,
            action: genStep.action,
            safetyNote: genStep.safetyNote
          });
        }
        _procedureSteps = padded;
      } else {
        _procedureSteps = generated;
      }
    }
  }

  const isJSA = doc.type === "JSA";
  let _jsaSteps = doc.jsaSteps;
  if (isJSA) {
    if (!_jsaSteps || _jsaSteps.length < 5) {
      const generated = generateTaskJSASteps(doc.title);
      if (_jsaSteps && _jsaSteps.length > 0) {
        const existingLength = _jsaSteps.length;
        const padded = [..._jsaSteps];
        for (let i = existingLength + 1; i <= 5; i++) {
          const genStep = generated[i - 1] || generated[generated.length - 1];
          padded.push({
            order: i,
            taskDescription: genStep.taskDescription,
            potentialHazards: genStep.potentialHazards,
            controlMeasures: genStep.controlMeasures
          });
        }
        _jsaSteps = padded;
      } else {
        _jsaSteps = generated;
      }
    }
  }

  const isChecklist = doc.type === "Inspection Checklist";
  let _checklistItems = doc.checklistItems;
  if (isChecklist && !_checklistItems) {
    _checklistItems = [
      { order: 1, requirement: "Guards and shields are in place", frequency: "Daily" },
      { order: 2, requirement: "No obvious leaks of fluids", frequency: "Daily" },
      { order: 3, requirement: "Emergency stops are unobstructed", frequency: "Daily" },
      { order: 4, requirement: "PPE stations are stocked", frequency: "Weekly" },
      { order: 5, requirement: "Signage is visible and cleanly legible", frequency: "Monthly" }
    ];
  }

  const isSIF = doc.type === "SIF Assessment";
  let _sifDetails = doc.sifDetails;
  let _criticalControls = doc.criticalControls;
  if (isSIF) {
    if (!_sifDetails) {
      _sifDetails = {
        energySource: "Kinetic / Gravitational / Electrical",
        criticalRiskCategory: "Struck By / Crushed By / Fall / Electrocution",
        potentialOutcome: "Fatality or serious permanent disability",
        missingControls: "None identified presently",
        controlVerification: "Weekly supervisor walkaround"
      };
    }
    if (!_criticalControls || _criticalControls.length === 0) {
      _criticalControls = [
        { name: "Physical Separation Guards", verificationMethod: "Visual inspection of integrity", frequency: "Daily" },
        { name: "Electronic LOTO Interlocks", verificationMethod: "Cycle testing and relay verify", frequency: "Monthly" }
      ];
    }
  }

  const isRiskAssessment = doc.riskAssessments !== undefined;
  
  if (!existing) {
    return await prisma.document.create({
      data: {
        ...data,
        procedureSteps: _procedureSteps ? {
          create: _procedureSteps.map((s: any) => ({
            order: s.order,
            title: s.title || null,
            action: s.action,
            safetyNote: s.safetyNote || null
          }))
        } : undefined,
        jsaSteps: _jsaSteps ? {
          create: _jsaSteps.map((s: any) => ({
            order: s.order,
            taskDescription: s.taskDescription,
            potentialHazards: s.potentialHazards,
            controlMeasures: s.controlMeasures
          }))
        } : undefined,
        checklistItems: _checklistItems ? {
          create: _checklistItems.map((s: any) => ({
            order: s.order,
            requirement: s.requirement,
            frequency: s.frequency || null
          }))
        } : undefined,
        sifDetails: _sifDetails ? {
          create: _sifDetails
        } : undefined,
        criticalControls: _criticalControls ? {
          create: _criticalControls.map((c: any) => ({
            name: c.name,
            verificationMethod: c.verificationMethod,
            frequency: c.frequency
          }))
        } : undefined,
        riskAssessments: doc.riskAssessments ? {
          create: doc.riskAssessments
        } : undefined,
        ppe: {
          connect: (doc.ppe || []).map((name: string) => ({ name }))
        },
        hazards: {
          connect: (doc.hazards || []).map((name: string) => ({ name }))
        },
        controls: {
          connect: (doc.controls || []).map((name: string) => ({ name }))
        },
        equipment: {
          connect: (doc.equipment || []).map((name: string) => ({ name }))
        }
      }
    });
  } else {
    if (!existing.isSystemDefault) {
      // Return existing and do not overwrite user-customized documents
      return existing;
    }

    return await prisma.document.update({
      where: { id: existing.id },
      data: {
        ...data,
        procedureSteps: {
          deleteMany: {},
          create: _procedureSteps ? _procedureSteps.map((s: any) => ({
            order: s.order,
            title: s.title || null,
            action: s.action,
            safetyNote: s.safetyNote || null
          })) : []
        },
        jsaSteps: {
          deleteMany: {},
          create: _jsaSteps ? _jsaSteps.map((s: any) => ({
            order: s.order,
            taskDescription: s.taskDescription,
            potentialHazards: s.potentialHazards,
            controlMeasures: s.controlMeasures
          })) : []
        },
        checklistItems: {
          deleteMany: {},
          create: _checklistItems ? _checklistItems.map((s: any) => ({
            order: s.order,
            requirement: s.requirement,
            frequency: s.frequency || null
          })) : []
        },
        sifDetails: _sifDetails ? {
          upsert: {
            create: _sifDetails,
            update: _sifDetails
          }
        } : undefined,
        criticalControls: {
          deleteMany: {},
          create: _criticalControls ? _criticalControls.map((c: any) => ({
            name: c.name,
            verificationMethod: c.verificationMethod,
            frequency: c.frequency
          })) : []
        },
        riskAssessments: doc.riskAssessments ? {
          deleteMany: {},
          create: doc.riskAssessments
        } : undefined,
        ppe: {
          set: (doc.ppe || []).map((name: string) => ({ name }))
        },
        hazards: {
          set: (doc.hazards || []).map((name: string) => ({ name }))
        },
        controls: {
          set: (doc.controls || []).map((name: string) => ({ name }))
        },
        equipment: {
          set: (doc.equipment || []).map((name: string) => ({ name }))
        }
      }
    });
  }
}
