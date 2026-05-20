import { PrismaClient } from "@prisma/client";

export async function seedHazards(prisma: PrismaClient) {
  const hazards = [
    // Vehicle / PIT Hazards
    { name: "Forklift traffic", category: "Vehicle / PIT", description: "Interaction between moving PITs.", potentialOutcome: "Major collision, crush injury.", sifPotential: true },
    { name: "Pedestrian interaction", category: "Vehicle / PIT", description: "PITs and pedestrians sharing the same space.", potentialOutcome: "Struck-by, fatality.", sifPotential: true },
    { name: "Blind corners", category: "Vehicle / PIT", description: "Intersections where visibility is obstructed.", potentialOutcome: "Collision.", sifPotential: true },
    { name: "Trailer yard traffic", category: "Vehicle / PIT", description: "Movement of yard trucks and trailers.", potentialOutcome: "Struck-by, crush.", sifPotential: true },
    { name: "Yard tractor movement", category: "Vehicle / PIT", description: "Positioning trailers at docks.", potentialOutcome: "Struck-by, driver injury.", sifPotential: true },
    { name: "Dock congestion", category: "Vehicle / PIT", description: "High volume of PIT and manual movement on docks.", potentialOutcome: "Trip, strike, or fall from dock.", sifPotential: true },
    { name: "Backing equipment", category: "Vehicle / PIT", description: "Vehicle movement in reverse.", potentialOutcome: "Struck-by due to blind spot.", sifPotential: true },
    { name: "Unstable loads", category: "Vehicle / PIT", description: "Improperly stacked or secured pallets on forks.", potentialOutcome: "Falling object, product damage.", sifPotential: true },
    { name: "Elevated forks", category: "Vehicle / PIT", description: "PITs moving with forks raised too high.", potentialOutcome: "Tip-over, collision with infrastructure.", sifPotential: true },
    { name: "Battery charging hazards", category: "Vehicle / PIT", description: "Gases, sparks, or acid contact during charging.", potentialOutcome: "Explosion, burn.", sifPotential: true },

    // Dock / Trailer Hazards
    { name: "Trailer creep", category: "Dock / Trailer", description: "Trailer moving away from dock during loading.", potentialOutcome: "Forklift fall from dock edge.", sifPotential: true },
    { name: "Trailer separation", category: "Dock / Trailer", description: "Premature trailer pull-out.", potentialOutcome: "Forklift fall, major injury.", sifPotential: true },
    { name: "Dock edge fall", category: "Dock / Trailer", description: "Unguarded open dock doors.", potentialOutcome: "Fall from height (4'+).", sifPotential: true },
    { name: "Dock plate failure", category: "Dock / Trailer", description: "Structural collapse of dock bridge.", potentialOutcome: "Forklift tip or fall.", sifPotential: true },
    { name: "Dock leveler pinch points", category: "Dock / Trailer", description: "Exposed mechanical parts of leveler.", potentialOutcome: "Amputation, crush.", sifPotential: true },
    { name: "Trailer tip-over", category: "Dock / Trailer", description: "Unbalanced trailer weight or landing gear failure.", potentialOutcome: "Crush injury.", sifPotential: true },
    { name: "Dropped pallets", category: "Dock / Trailer", description: "Pallets falling from forks during loading.", potentialOutcome: "Struck-by.", sifPotential: false },
    { name: "Unsecured trailer", category: "Dock / Trailer", description: "Trailer not chocked or restrained.", potentialOutcome: "Uncontrolled movement.", sifPotential: true },
    { name: "Poor trailer lighting", category: "Dock / Trailer", description: "Dark trailer interiors.", potentialOutcome: "Trip, collision.", sifPotential: false },
    { name: "Weather exposure at dock", category: "Dock / Trailer", description: "Rain or ice entering dock area.", potentialOutcome: "Slip/Fall.", sifPotential: false },

    // Conveyor / Equipment Hazards
    { name: "Conveyor pinch points", category: "Conveyor / Equipment", description: "Gaps between rollers or belts.", potentialOutcome: "Crush, amputation.", sifPotential: true },
    { name: "Conveyor nip points", category: "Conveyor / Equipment", description: "In-running rollers/belts.", potentialOutcome: "Entrapment.", sifPotential: true },
    { name: "Entanglement", category: "Conveyor / Equipment", description: "Loose clothing or hair caught in moving parts.", potentialOutcome: "Major injury, strangulation.", sifPotential: true },
    { name: "Jam clearing", category: "Conveyor / Equipment", description: "Manual intervention in moving machinery.", potentialOutcome: "Amputation, crush.", sifPotential: true },
    { name: "Unexpected startup", category: "Conveyor / Equipment", description: "Inadequate LOTO during service.", potentialOutcome: "Fatality, amputation.", sifPotential: true },
    { name: "Machine guarding gaps", category: "Conveyor / Equipment", description: "Missing or damaged guards.", potentialOutcome: "Exposure to energized parts.", sifPotential: true },
    { name: "Belt tracking issues", category: "Conveyor / Equipment", description: "Belts wandering off rollers.", potentialOutcome: "Friction fire, belt damage.", sifPotential: false },
    { name: "Powered roller hazards", category: "Conveyor / Equipment", description: "Exposed O-rings or drive shafts.", potentialOutcome: "Finger injury.", sifPotential: false },
    { name: "Emergency stop access issues", category: "Conveyor / Equipment", description: "Blocked or missing E-stops.", potentialOutcome: "Delayed emergency response.", sifPotential: true },

    // Maintenance Hazards
    { name: "Hazardous energy", category: "Maintenance", description: "Electrical, pneumatic, or hydraulic power.", potentialOutcome: "Shock, crush, release of energy.", sifPotential: true },
    { name: "Electrical exposure", category: "Maintenance", description: "Exposed live wires during service.", potentialOutcome: "Electrocution, burn.", sifPotential: true },
    { name: "Arc flash", category: "Maintenance", description: "Sudden release of electrical energy.", potentialOutcome: "Severe burn, explosion injury.", sifPotential: true },
    { name: "Stored energy", category: "Maintenance", description: "Springs, capacitors, or gravity.", potentialOutcome: "Unexpected movement.", sifPotential: true },
    { name: "Hot work", category: "Maintenance", description: "Welding, cutting, or grinding.", potentialOutcome: "Fire, burn.", sifPotential: true },
    { name: "Elevated work", category: "Maintenance", description: "Use of ladders or aerial lifts.", potentialOutcome: "Fall from height.", sifPotential: true },
    { name: "Sharp edges", category: "Maintenance", description: "Exposed metal or cut parts.", potentialOutcome: "Laceration.", sifPotential: false },
    { name: "Rotating equipment", category: "Maintenance", description: "Exposed shafts or motors.", potentialOutcome: "Crush, entanglement.", sifPotential: true },

    // Facility Hazards
    { name: "Slips, trips, and falls", category: "Facility", description: "Common hazards due to floor state.", potentialOutcome: "Strain, sprain, or head injury.", sifPotential: true },
    { name: "Poor housekeeping", category: "Facility", description: "Pallets or trash blocking paths.", potentialOutcome: "Trip, fire hazard.", sifPotential: false },
    { name: "Wet floors", category: "Facility", description: "Leaks or cleaning residue.", potentialOutcome: "Slip/Fall.", sifPotential: true },
    { name: "Rack damage", category: "Facility", description: "Structural integrity compromised by strikes.", potentialOutcome: "Rack collapse, multiple fatalities.", sifPotential: true },
    { name: "Falling objects", category: "Facility", description: "Items falling from high-bay storage.", potentialOutcome: "Struck-by.", sifPotential: true },
    { name: "Poor lighting", category: "Facility", description: "Inadequate visibility in aisles.", potentialOutcome: "Collision, trip.", sifPotential: false },
    { name: "Fire hazards", category: "Facility", description: "Combustibles or faulty wiring.", potentialOutcome: "Fire, smoke inhalation.", sifPotential: true },
    { name: "Blocked exits", category: "Facility", description: "Egress paths obstructed.", potentialOutcome: "Entrapment during emergency.", sifPotential: true },
    { name: "Blocked fire extinguishers", category: "Facility", description: "Inaccessible emergency equipment.", potentialOutcome: "Uncontrolled fire growth.", sifPotential: true },
    { name: "Emergency eyewash access blocked", category: "Facility", description: "Inaccessible decontamination station.", potentialOutcome: "Permanent eye damage.", sifPotential: true },

    // Ergonomic Hazards
    { name: "Manual material handling", category: "Ergonomic", description: "Lifting and moving heavy items.", potentialOutcome: "Strains, MSD.", sifPotential: false },
    { name: "Repetitive motion", category: "Ergonomic", description: "Repeated tasks without breaks.", potentialOutcome: "Cumulative trauma.", sifPotential: false },
    { name: "Awkward posture", category: "Ergonomic", description: "Working in constrained spaces.", potentialOutcome: "Spinal injury.", sifPotential: false },
    { name: "Overexertion", category: "Ergonomic", description: "Pushing or pulling past limits.", potentialOutcome: "Heart stress, hernia.", sifPotential: false },
    { name: "Twisting while lifting", category: "Ergonomic", description: "Poor lifting mechanics.", potentialOutcome: "Back injury, disc herniation.", sifPotential: false },

    // Chemical / Environmental Hazards
    { name: "Chemical exposure", category: "Environmental", description: "Contact with hazardous liquids/vapors.", potentialOutcome: "Burn, illness.", sifPotential: true },
    { name: "Battery acid exposure", category: "Environmental", description: "Spills or splashes during charger maintenance.", potentialOutcome: "Chemical burn.", sifPotential: true },
    { name: "Heat stress", category: "Environmental", description: "High facility temperature.", potentialOutcome: "Heat stroke, exhaustion.", sifPotential: true },
    { name: "Cold stress", category: "Environmental", description: "Work in freezers/cold storage.", potentialOutcome: "Hypothermia, frostbite.", sifPotential: true },
    { name: "Noise exposure", category: "Environmental", description: "Excessive sound levels from equipment.", potentialOutcome: "Hearing loss.", sifPotential: false },

    // Security / Emergency Hazards
    { name: "Workplace violence", category: "Security", description: "Hostile interaction on-site.", potentialOutcome: "Assault, trauma.", sifPotential: true },
    { name: "Severe weather", category: "Security", description: "Tornado, high wind, or blizzard.", potentialOutcome: "Structural failure, exposure.", sifPotential: true },
    { name: "Medical emergency", category: "Security", description: "Sudden illness or major injury.", potentialOutcome: "Delayed care complication.", sifPotential: true },
    { name: "Unauthorized contractor work", category: "Security", description: "Work without permit or LOTO.", potentialOutcome: "Unexpected energy release.", sifPotential: true },

    // Additional hazards to ensure exact seed relationships match
    { name: "Electrical shock", category: "Maintenance", description: "Direct contact with live electrical elements.", potentialOutcome: "Electrocution, burn.", sifPotential: true },
    { name: "Fall from dock", category: "Dock / Trailer", description: "Fall from elevated warehouse dock doors.", potentialOutcome: "Fracture, concussion.", sifPotential: true },
    { name: "Fall from height", category: "Fall Protection", description: "Fall from elevated workspaces.", potentialOutcome: "Major trauma, death.", sifPotential: true },
    { name: "Falling from dock", category: "Dock / Trailer", description: "Falling off a loading dock platform.", potentialOutcome: "Limb trauma, neck injury.", sifPotential: true },
    { name: "Mechanical movement", category: "Conveyor / Equipment", description: "Hazardous movement from active motors, gears, or chains.", potentialOutcome: "Crush, pinch.", sifPotential: true },
    { name: "Pinch points", category: "Conveyor / Equipment", description: "Points of mechanical system where body parts can be caught.", potentialOutcome: "Amputation, severe crush.", sifPotential: true },
    { name: "Structural collapse", category: "Facility", description: "Collapse of structural elements under load or strike.", potentialOutcome: "Crush, entrapment.", sifPotential: true }
  ];

  console.log(`Seeding ${hazards.length} hazards...`);

  for (const h of hazards) {
    await prisma.hazard.upsert({
      where: { name: h.name },
      update: { ...h, isSystemDefault: true },
      create: { ...h, isSystemDefault: true }
    });
  }
}
