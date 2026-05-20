import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const backupPath = path.join(process.cwd(), 'prisma', 'schema.prisma.backup');

async function main() {
  console.log('--- Setting up Local SQLite Database ---');

  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  // If already backed up or already SQLite, handle gracefully
  if (schemaContent.includes('provider = "sqlite"') || schemaContent.includes('file:./dev.db')) {
    console.log('Database is already configured to use SQLite.');
  } else {
    console.log('Backing up original schema to prisma/schema.prisma.backup');
    fs.writeFileSync(backupPath, schemaContent);

    console.log('Modifying prisma/schema.prisma for development SQLite...');
    let modifiedContent = schemaContent.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    modifiedContent = modifiedContent.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');

    // Also look for other DB-specific fields if any, but since we didn't find @db tags, it should be fine.
    fs.writeFileSync(schemaPath, modifiedContent);
    console.log('Schema converted successfully.');
  }

  try {
    console.log('Running prisma db push onto SQLite...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' });

    console.log('Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('Checking if seeding is required...');
    // Seed using the seed script
    console.log('Running database seed...');
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error during sqlite database setup:', error.message);
    if (fs.existsSync(backupPath)) {
      console.log('Restoring schema backup due to error...');
      fs.copyFileSync(backupPath, schemaPath);
    }
    process.exit(1);
  }
}

main();
