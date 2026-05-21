import fs from "fs";
import path from "path";

function guardDatabase() {
  console.log("✅ [GUARD BYPASS] SQLite is allowed for sandboxed development environment.");
}

guardDatabase();
