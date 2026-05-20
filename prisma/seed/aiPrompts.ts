import { PrismaClient } from "@prisma/client";

export async function seedAIPrompts(prisma: PrismaClient) {
  const templates = [
    {
      name: "Draft SOP",
      category: "sop",
      description: "Generate a full SOP from a Title and Department.",
      template: "Act as a Safety Engineer. Write a comprehensive Standard Operating Procedure (SOP) for the task: {{title}}. Include sections for Purpose, Scope, Responsibilities, Hazards, Controls, PPE required, and detailed step-by-step procedures. Use professional, clear, and actionable language."
    },
    {
      name: "Improve SOP wording",
      category: "sop",
      description: "Refine existing procedure steps for clarity.",
      template: "Act as a technical writer. Review the following SOP steps and rewrite them to be more concise and clear while maintaining all safety requirements: {{content}}"
    },
    {
      name: "Generate JSA steps",
      category: "jsa",
      description: "Break down a job into steps, hazards, and controls.",
      template: "Create a Job Safety Analysis (JSA) for: {{task}}. Break the job down into 5-10 logical steps. For each step, identify at least one potential hazard and corresponding control measures."
    },
    {
      name: "Identify hazards",
      category: "jsa",
      description: "Identify potential hazards for a specific task.",
      template: "For the following task: {{title}}, list all potential hazards including physical, chemical, ergonomic, and environmental risks."
    },
    {
      name: "Recommend controls",
      category: "general",
      description: "Recommend hierarchy of controls for identified hazards.",
      template: "For these hazards: {{content}}, recommend a hierarchy of controls starting with Elimination/Substitution, then Engineering, Administrative, and finally PPE."
    },
    {
      name: "Identify SIF potential",
      category: "sif",
      description: "Analyze a task for serious injury or fatality potential.",
      template: "Analyze the following task for Serious Injury or Fatality (SIF) potential: {{content}}. Identify high-energy sources, missing critical controls, and provide a risk rating."
    },
    {
      name: "Generate critical controls",
      category: "sif",
      description: "Create list of must-have controls for SIF risks.",
      template: "For the SIF hazard {{hazard}}, generate a list of exactly 3-5 critical controls that MUST be in place to prevent a fatality."
    },
    {
      name: "Generate corrective actions",
      category: "general",
      description: "Create SMART corrective actions for a finding.",
      template: "For the safety finding {{finding}}, generate 3 SMART (Specific, Measurable, Achievable, Relevant, Time-bound) corrective actions."
    },
    {
      name: "Create training quiz",
      category: "general",
      description: "Generate 5 multiple-choice questions from document content.",
      template: "Based on the following safety procedure: {{content}}, create a 5-question multiple choice quiz to verify understanding. Include an answer key."
    },
    {
      name: "Create toolbox talk",
      category: "general",
      description: "Summarize an SOP into a 5-minute safety talk.",
      template: "Summarize the following SOP into a 5-minute safety 'Toolbox Talk' for a shift startup meeting: {{content}}. Focus on the top 3 risks and top 3 behaviors required."
    },
    {
      name: "Summarize incident",
      category: "general",
      description: "Condense long incident logs into a concise summary.",
      template: "Summarize the following incident details into a concise executive summary: {{content}}. Highlight root cause and immediate actions taken."
    },
    {
      name: "Review document for missing sections",
      category: "general",
      description: "Check if document meets formal safety standards.",
      template: "Review the following safety document: {{content}}. Identify any missing sections typically required by ISO 45001 or OSHA standards (e.g., Scope, Responsibilities, Record Keeping)."
    },
    {
      name: "Simplify procedure for operators",
      category: "sop",
      description: "Convert complex jargon into simple operator instructions.",
      template: "Rewrite the following technical procedure so it is easy for a front-line operator to understand (5th-grade reading level): {{content}}"
    },
    {
      name: "Create audit checklist from SOP",
      category: "general",
      description: "Generate an inspection checklist based on SOP requirements.",
      template: "Based on the requirements in this SOP: {{content}}, generate a 10-point 'Yes/No' audit checklist for a supervisor to use in the field."
    },
    {
      name: "Create emergency response procedure",
      category: "general",
      description: "Draft emergency steps for a specific scenario.",
      template: "Draft a specific, high-level emergency response procedure for the scenario: {{scenario}}. Focus on immediate life-safety actions."
    }
  ];

  console.log(`Seeding ${templates.length} AI prompt templates...`);

  for (const t of templates) {
    await prisma.aIPromptTemplate.upsert({
      where: { name: t.name },
      update: { ...t, isSystemDefault: true },
      create: { ...t, isSystemDefault: true }
    });
  }
}
