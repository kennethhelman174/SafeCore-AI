
export interface MappingItem {
  dbField: string;
  spColumn: string;
  dvColumn: string;
  controlType: string;
  dataType: string;
  required: boolean;
  lookup?: string;
  notes: string;
}

export interface TableMapping {
  name: string;
  description: string;
  fields: MappingItem[];
}

export const MS365_MAPPINGS: TableMapping[] = [
  {
    name: "Safety Documents",
    description: "Primary library for SOPs, JSAs, and Work Instructions",
    fields: [
      { dbField: "id", spColumn: "ID", dvColumn: "cr_doc_id", controlType: "Hidden", dataType: "GUID/Number", required: true, notes: "Natural key mapping" },
      { dbField: "docNumber", spColumn: "DocumentID", dvColumn: "cr_doc_number", controlType: "Text", dataType: "Text", required: true, notes: "Unique index" },
      { dbField: "title", spColumn: "Title", dvColumn: "cr_title", controlType: "Text", dataType: "Text", required: true, notes: "Mapping to standard Title field" },
      { dbField: "status", spColumn: "Status", dvColumn: "cr_status", controlType: "Choice", dataType: "Choice (Global)", required: true, notes: "Draft, Review, Published" },
      { dbField: "effectiveDate", spColumn: "EffectiveDate", dvColumn: "cr_effective_date", controlType: "Date", dataType: "Date Only", required: false, notes: "" },
      { dbField: "department", spColumn: "Department", dvColumn: "cr_department_id", controlType: "Lookup", dataType: "Lookup", required: true, lookup: "Departments", notes: "Many-to-one" },
      { dbField: "purpose", spColumn: "Purpose", dvColumn: "cr_purpose", controlType: "RichText", dataType: "Text (Multiple Lines)", required: false, notes: "" },
      { dbField: "scope", spColumn: "Scope", dvColumn: "cr_scope", controlType: "RichText", dataType: "Text (Multiple Lines)", required: false, notes: "" }
    ]
  },
  {
    name: "SIF Assessments",
    description: "High-severity risk assessments and outcome modelling",
    fields: [
      { dbField: "energySource", spColumn: "EnergySource", dvColumn: "cr_energy_source", controlType: "Choice", dataType: "Choice", required: true, notes: "" },
      { dbField: "fatalityPotential", spColumn: "FatalityPotential", dvColumn: "cr_fatality_potential", controlType: "Toggle", dataType: "Yes/No", required: true, notes: "" },
      { dbField: "lifeAlteringPotential", spColumn: "LifeAlteringPotential", dvColumn: "cr_life_altering_potential", controlType: "Toggle", dataType: "Yes/No", required: true, notes: "" },
      { dbField: "missingControls", spColumn: "MissingControls", dvColumn: "cr_missing_controls", controlType: "RichText", dataType: "Text (Multiple Lines)", required: false, notes: "" }
    ]
  },
  {
    name: "Corrective Actions",
    description: "Tracker for EHS findings and escalations",
    fields: [
      { dbField: "title", spColumn: "Title", dvColumn: "cr_title", controlType: "Text", dataType: "Text", required: true, notes: "" },
      { dbField: "description", spColumn: "IssueDescription", dvColumn: "cr_description", controlType: "RichText", dataType: "Text (Multiple Lines)", required: true, notes: "" },
      { dbField: "status", spColumn: "Status", dvColumn: "cr_status", controlType: "Choice", dataType: "Choice", required: true, notes: "Open, Pending Verification, Closed" },
      { dbField: "priority", spColumn: "Priority", dvColumn: "cr_priority", controlType: "Choice", dataType: "Choice", required: true, notes: "Low, Med, High, Urgent" },
      { dbField: "dueDate", spColumn: "Deadline", dvColumn: "cr_due_date", controlType: "Date", dataType: "Date Only", required: true, notes: "" },
      { dbField: "assigneeId", spColumn: "AssignedUser", dvColumn: "cr_assigned_user_id", controlType: "People Picker", dataType: "Lookup", required: true, lookup: "Employees", notes: "" }
    ]
  },
  {
    name: "Training Records",
    description: "Compliance history and certifications",
    fields: [
      { dbField: "userId", spColumn: "Employee", dvColumn: "cr_employee_id", controlType: "Lookup", dataType: "Lookup", required: true, lookup: "Employees", notes: "" },
      { dbField: "documentId", spColumn: "Document", dvColumn: "cr_document_id", controlType: "Lookup", dataType: "Lookup", required: true, lookup: "Safety Documents", notes: "" },
      { dbField: "completedAt", spColumn: "CompletionDate", dvColumn: "cr_completion_date", controlType: "Date", dataType: "Date/Time", required: true, notes: "" },
      { dbField: "status", spColumn: "Status", dvColumn: "cr_status", controlType: "Choice", dataType: "Choice", required: true, notes: "Completed, Failed, Verified" }
    ]
  },
  {
    name: "Employees",
    description: "User profiles and role assignments",
    fields: [
      { dbField: "email", spColumn: "WorkEmail", dvColumn: "cr_email", controlType: "Text", dataType: "Text", required: true, notes: "Unique constraint" },
      { dbField: "name", spColumn: "DisplayName", dvColumn: "cr_name", controlType: "Text", dataType: "Text", required: true, notes: "" },
      { dbField: "roleId", spColumn: "SafetyRole", dvColumn: "cr_role_id", controlType: "Lookup", dataType: "Lookup", required: true, lookup: "Roles", notes: "" },
      { dbField: "departmentId", spColumn: "SiteDepartment", dvColumn: "cr_department_id", controlType: "Lookup", dataType: "Lookup", required: true, lookup: "Departments", notes: "" }
    ]
  },
  {
    name: "Hazards",
    description: "Global hazard library for risk mapping",
    fields: [
      { dbField: "name", spColumn: "HazardTitle", dvColumn: "cr_name", controlType: "Text", dataType: "Text", required: true, notes: "" },
      { dbField: "id", spColumn: "ID", dvColumn: "cr_hazard_id", controlType: "Hidden", dataType: "GUID", required: true, notes: "" }
    ]
  },
  {
    name: "Controls",
    description: "Critical control measures and hierarchies",
    fields: [
      { dbField: "name", spColumn: "ControlTitle", dvColumn: "cr_name", controlType: "Text", dataType: "Text", required: true, notes: "" },
      { dbField: "id", spColumn: "ID", dvColumn: "cr_control_id", controlType: "Hidden", dataType: "GUID", required: true, notes: "" }
    ]
  },
  {
    name: "Approvals",
    description: "Document review chain and decision logs",
    fields: [
      { dbField: "documentId", spColumn: "TargetDocument", dvColumn: "cr_document_id", controlType: "Lookup", dataType: "Lookup", required: true, lookup: "Safety Documents", notes: "" },
      { dbField: "reviewerId", spColumn: "Approver", dvColumn: "cr_reviewer_id", controlType: "People Picker", dataType: "Lookup", required: true, lookup: "Employees", notes: "" },
      { dbField: "status", spColumn: "ApprovalStatus", dvColumn: "cr_status", controlType: "Choice", dataType: "Choice", required: true, notes: "" },
      { dbField: "decisionDate", spColumn: "DecisionAt", dvColumn: "cr_decision_date", controlType: "Date", dataType: "Date/Time", required: false, notes: "" }
    ]
  }
];

export const POWER_AUTOMATE_WORKFLOWS = [
  {
    name: "Document Approval Flow",
    trigger: "When an item is modified (Status = 'Review')",
    actions: ["Start and wait for an approval", "Update Status to 'Published' on approval", "Send notification on rejection"],
    escalation: "Escalate to Department Manager after 48h"
  },
  {
    name: "Annual Review Reminder",
    trigger: "Recurrence (Daily check)",
    actions: ["Filter Safe Documents where EffectiveDate < today - 365 days", "Create approval for annual revision", "Notify EHS Manager"],
    escalation: "None"
  },
  {
    name: "Corrective Action Escalation",
    trigger: "When an item is created or modified",
    actions: ["Wait for DueDate", "Check if Status != 'Closed'", "Send daily reminders", "Escalate to Site Leader after 72h past due"],
    escalation: "Site Leadership Team"
  }
];

export const POWER_APPS_SCREENS = [
  { name: "Safety Hub Home", description: "Central dashboard with KPIs and quick actions", components: ["Metric Cards", "Task List", "Charts"] },
  { name: "SOP/JSA Builder", description: "Form-based wizard for document creation", components: ["Multi-step form", "Hazard selector", "Approver lookup"] },
  { name: "Field Compliance App", description: "Mobile-first app for floor inspections", components: ["QR Scanner", "Photo upload", "Offline sync"] },
  { name: "Management Review", description: "High-level approval and report viewing", components: ["Approval Gallery", "Power BI Embed"] }
];
