import fs from "fs";
import path from "path";

function guardDatabase() {
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  console.log(`[GUARD] Checking database provider in schema at: ${schemaPath}`);

  if (!fs.existsSync(schemaPath)) {
    console.error(`[GUARD ERROR] Prisma schema file not found at ${schemaPath}`);
    process.exit(1);
  }

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");

  const forbiddenProvider = 'provider = "sqlite"';
  const forbiddenProviderSingle = "provider = 'sqlite'";
  const forbiddenDbFile = "file:./dev.db";

  if (
    schemaContent.includes(forbiddenProvider) ||
    schemaContent.includes(forbiddenProviderSingle) ||
    schemaContent.includes(forbiddenDbFile)
  ) {
    console.error("=========================================================================");
    console.error("❌ [SECURITY & ARCHITECTURE VIOLATION]");
    console.error("This application is STRICTLY PostgreSQL-only.");
    console.error("Using SQLite ('provider = \"sqlite\"' or 'file:./dev.db') is FORBIDDEN.");
    console.error("Please ensure prisma/schema.prisma uses the postgresql provider and env(DATABASE_URL).");
    console.error("=========================================================================");
    process.exit(1);
  }

  console.log("✅ [GUARD] Prisma schema validation passed (PostgreSQL-only status verified).");
}

guardDatabase();
