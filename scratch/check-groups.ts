import { db } from '../lib/prisma';

async function main() {
  const members = await db.$queryRawUnsafe('SELECT * FROM "ProjectMember"');
  console.log("PROJECT MEMBERS:", members);
  const groups = await db.$queryRawUnsafe('SELECT * FROM "ProjectGroup"');
  console.log("PROJECT GROUPS:", groups);
}

main().catch(console.error).finally(() => process.exit(0));
