import { PrismaClient } from "@prisma/client";

export async function seedPPE(prisma: PrismaClient) {
  const ppeList = [
    { name: "Safety shoes", description: "Steel or composite toe footwear.", whenRequired: "Mandatory in all warehouse areas.", limitations: "Not for chemical immersion.", inspectionNotes: "Check for tread wear and structural integrity weekly." },
    { name: "High-visibility vest", description: "Neon yellow or orange reflective vest.", whenRequired: "Required in all traffic and dock areas.", limitations: "Must be zipped/secured to avoid snagging.", inspectionNotes: "Ensure reflective strips are visible and non-faded." },
    { name: "Safety glasses", description: "Z87+ rated eye protection.", whenRequired: "Mandatory on production floor.", limitations: "No side protection if not wrap-around.", inspectionNotes: "Check for scratches or pit marks." },
    { name: "Gloves", description: "General hand protection.", whenRequired: "As per task JSA.", limitations: "Check specific glove type for chemical/cut rating.", inspectionNotes: "Check for holes." },
    { name: "Cut-resistant gloves", description: "Level A3 or higher rated gloves.", whenRequired: "When using safety knives or handling sharp edges.", limitations: "Not for use with rotating machinery.", inspectionNotes: "Check for holes or thinning material." },
    { name: "General work gloves", description: "Leather or synthetic grip gloves.", whenRequired: "Manual pallet handling.", limitations: "Limited cut/chemical protection.", inspectionNotes: "Check for grip degradation." },
    { name: "Chemical-resistant gloves", description: "Nitrile or PVC long-cuff gloves.", whenRequired: "Battery watering or chemical handling.", limitations: "Specific to chemical type - check SDS.", inspectionNotes: "Check for leaks or degradation." },
    { name: "Hearing protection", description: "Earplugs or earmuffs.", whenRequired: "In noise-designated areas (>85dB).", limitations: "Must be properly seated to be effective.", inspectionNotes: "Ensure cleanliness and elasticity." },
    { name: "Hard hat", description: "Class G or E protective headwear.", whenRequired: "When working near overhead conveyor or construction.", limitations: "Does not protect from side impacts.", inspectionNotes: "Check suspension and shell for cracks." },
    { name: "Bump cap", description: "Lightweight head protection.", whenRequired: "In low-clearance areas like under-conveyor.", limitations: "Not for falling object protection.", inspectionNotes: "Ensure internal shell is secure." },
    { name: "Face shield", description: "Clear polycarbonate full face cover.", whenRequired: "During battery watering or high-splash risk tasks.", limitations: "Must be worn with safety glasses.", inspectionNotes: "Check for clarity and attachment security." },
    { name: "Arc-rated face shield", description: "Specialized flash protection.", whenRequired: "Electrical work within flash boundary.", limitations: "UV/IR protection only.", inspectionNotes: "Check for carbon tracking or scratches." },
    { name: "Arc-rated PPE", description: "Full set of arc flash protection.", whenRequired: "High-voltage electrical work.", limitations: "Must be rated for incident energy level.", inspectionNotes: "Inspect for holes or contamination." },
    { name: "Arc-rated clothing", description: "Flame-resistant coveralls/uniform.", whenRequired: "Working on energized equipment.", limitations: "Must not be contaminated with grease/oil.", inspectionNotes: "Check for holes or fraying." },
    { name: "Lockout/tagout kit", description: "Personal lock, tag, and hasp.", whenRequired: "Before performing service/maintenance.", limitations: "One lock per person rule applies.", inspectionNotes: "Ensure keys are unique and tags legible." },
    { name: "Fall protection harness", description: "Full-body safety harness.", whenRequired: "Working at heights (>4ft in general industry, >6ft construction).", limitations: "Must be sized correctly to prevent injury.", inspectionNotes: "Annual professional inspection required; daily user check." },
    { name: "Fall protection lanyard", description: "Shock-absorbing or SRI lanyard.", whenRequired: "Coupled with harness for fall arrest.", limitations: "Check fall clearance distance.", inspectionNotes: "Inspect for frays, burns, or deployed indicators." },
    { name: "Respirator", description: "N95 or half-mask with cartridges.", whenRequired: "Specific tasks with airborne contaminants.", limitations: "Requires fit testing and medical clearance.", inspectionNotes: "Check valves and seal integrity." },
    { name: "Dust mask", description: "General nuisance dust protection.", whenRequired: "Sweeping or cleaning dusty areas.", limitations: "Not for hazardous vapors or fine silica.", inspectionNotes: "Discard after single use or if soiled." },
    { name: "Nitrile gloves", description: "Disposable thin nitrile gloves.", whenRequired: "First aid or light cleaning.", limitations: "Very low puncture/cut resistance.", inspectionNotes: "Check for tears before use." },
    { name: "Apron", description: "PVC or heavy-duty protective apron.", whenRequired: "Splashing risk (e.g., battery wash).", limitations: "Frontal protection only.", inspectionNotes: "Check for punctures or tears." },
    { name: "Welding shield", description: "Auto-darkening welding helmet.", whenRequired: "During any welding/cutting task.", limitations: "Check lens shade rating.", inspectionNotes: "Ensure sensors and battery are functional." },
    { name: "Heat-resistant gloves", description: "Insulated heavy-duty gloves.", whenRequired: "Handling hot parts or hot work.", limitations: "Bulky, reduces dexterity.", inspectionNotes: "Check for scorched spots or holes." },
    { name: "Cold-weather PPE", description: "Insulated bibs, coats, and gloves.", whenRequired: "Working in freezer or refrigerated sections.", limitations: "Restricts movement.", inspectionNotes: "Ensure no moisture trapped in insulation." },
    { name: "Rain gear", description: "Waterproof jacket and pants.", whenRequired: "Outdoor yard work in wet weather.", limitations: "Can cause overheating.", inspectionNotes: "Check for tears in seams." },
    { name: "Knee pads", description: "Protective knee caps.", whenRequired: "Tasks requiring extended kneeling.", limitations: "May shift during movement.", inspectionNotes: "Check strap elasticity." },
    { name: "Back support belt", description: "Optional lifting support.", whenRequired: "As per company policy (reminder of technique only).", limitations: "Does not increase lifting capacity.", inspectionNotes: "Ensure velcro is functional." }
  ];

  console.log(`Seeding ${ppeList.length} PPE items...`);

  for (const ppe of ppeList) {
    await prisma.pPE.upsert({
      where: { name: ppe.name },
      update: { ...ppe, isSystemDefault: true },
      create: { ...ppe, isSystemDefault: true }
    });
  }
}
