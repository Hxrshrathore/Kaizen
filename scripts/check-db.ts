import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Connecting to Neon DB...");
  
  try {
    // 1. Count users
    const count = await prisma.user.count();
    console.log(`✅ Connection Successful!`);
    console.log(`📊 Total Users found: ${count}`);

    // 2. List users
    if (count > 0) {
      const users = await prisma.user.findMany();
      console.log("\n--- USER LIST ---");
      console.table(users.map(u => ({ 
        Email: u.email, 
        Name: u.name, 
        Created: u.createdAt.toISOString() 
      })));
    } else {
      console.log("⚠️ Tables exist, but they are empty.");
    }

  } catch (error) {
    console.error("❌ Connection Failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();