import { URL } from "url";
import { createConnection } from "net";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL variable is not set.");
  process.exit(1);
}

if (dbUrl.startsWith("file:") || !dbUrl.includes("postgresql")) {
  console.log("✅ Using SQLite database. Connection is inherently local and ready.");
  process.exit(0);
}

try {
  const url = new URL(dbUrl);
  const host = url.hostname;
  const port = parseInt(url.port || "5432", 10);

  console.log(`Checking connection to database at ${host}:${port}...`);

  const socket = createConnection({ host, port, timeout: 2000 }, () => {
    console.log("✅ Database is reachable!");
    socket.end();
    process.exit(0);
  });

  socket.on("error", (err) => {
    console.error(`❌ Connection failed: ${err.message}`);
    process.exit(1);
  });

  socket.on("timeout", () => {
    console.error("❌ Connection timed out.");
    socket.destroy();
    process.exit(1);
  });
} catch (error) {
  console.error(`❌ Invalid DATABASE_URL: ${error.message}`);
  process.exit(1);
}
