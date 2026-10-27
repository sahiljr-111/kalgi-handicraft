/**
 * Seeds the database with sample content and the first owner account.
 *   npm run seed          # only if the database is empty
 *   npm run seed:reset    # wipe content (not users) and reseed
 */
import { config } from 'dotenv';

config({ path: '.env.local' });
config();

async function main() {
  // Imported after dotenv so server/env.ts sees the variables.
  const { connectDB, disconnectDB } = await import('../server/db');
  const { ensureAdmin, seedDatabase } = await import('../server/seed/run');
  await connectDB();
  await seedDatabase({ reset: process.argv.includes('--reset') });
  await ensureAdmin();
  await disconnectDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
