import { prisma } from "../lib/prisma";

async function main() {
  console.log("==> Auditing users and enforcing ONLY 2330231@kiit.ac.in as ROOT AAA...");

  const targetEmail = "2330231@kiit.ac.in";

  // 1. Demote any non-2330231 user who currently has ROOT or AAA
  const unauthorizedRoots = await prisma.user.findMany({
    where: {
      AND: [
        { email: { not: targetEmail } },
        {
          OR: [
            { userType: "ROOT" },
            { officialTag: "AAA" },
            { officialTags: { has: "AAA" } },
          ],
        },
      ],
    },
  });

  console.log(`Found ${unauthorizedRoots.length} unauthorized users with ROOT/AAA.`);
  for (const u of unauthorizedRoots) {
    const isRoll = /^\d+@kiit\.ac\.in$/i.test(u.email);
    console.log(`Demoting ${u.email} to ${isRoll ? "STUDENT (GENERAL_STUDENT)" : "FACULTY (PROFESSOR)"}...`);
    await prisma.user.update({
      where: { id: u.id },
      data: {
        userType: isRoll ? "STUDENT" : "FACULTY",
        officialTag: isRoll ? "GENERAL_STUDENT" : "PROFESSOR",
        officialTags: [isRoll ? "GENERAL_STUDENT" : "PROFESSOR"],
        permissions: [],
      },
    });
  }

  // 2. Ensure 2330231@kiit.ac.in exists as the ONE and ONLY ROOT AAA
  let rootUser = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (rootUser) {
    rootUser = await prisma.user.update({
      where: { email: targetEmail },
      data: {
        userType: "ROOT",
        officialTag: "AAA",
        officialTags: ["AAA"],
        permissions: ["ALL_AREA_ACCESS"],
        designation: "System Architect & Root Administrator",
        isApproved: true,
      },
    });
    console.log(`✓ Updated existing user ${targetEmail} as ROOT AAA!`);
  } else {
    rootUser = await prisma.user.create({
      data: {
        email: targetEmail,
        name: "Harsh Kumar",
        hasConsent: true,
        userType: "ROOT",
        officialTag: "AAA",
        officialTags: ["AAA"],
        permissions: ["ALL_AREA_ACCESS"],
        designation: "System Architect & Root Administrator",
        isApproved: true,
      },
    });
    console.log(`✓ Created user ${targetEmail} as ROOT AAA!`);
  }

  // 3. Print all users and their roles
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      userType: true,
      officialTag: true,
      permissions: true,
    },
  });

  console.log("\n--- Current Database User Roles ---");
  for (const u of allUsers) {
    console.log(`User: ${u.email} | Type: ${u.userType} | Tag: ${u.officialTag} | Perms: ${JSON.stringify(u.permissions)}`);
  }
  console.log("----------------------------------\n");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

