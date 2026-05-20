import fs from 'fs';
import path from 'path';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const backupPath = path.join(process.cwd(), 'prisma', 'schema.prisma.backup');

function main() {
  console.log('--- Checking Database Schema Restoration ---');

  if (fs.existsSync(backupPath)) {
    console.log('Restoring PostgreSQL original schema from backup...');
    fs.copyFileSync(backupPath, schemaPath);
    console.log('PostgreSQL schema successfully restored.');
  } else {
    console.log('No backup found (already PostgreSQL or never converted). Skipping restoration.');
  }
}

main();
