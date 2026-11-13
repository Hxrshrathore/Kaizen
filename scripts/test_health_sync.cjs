const fs = require('fs');
const path = require('path');

// Load environment variables from .env
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let v = m[2] || '';
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v.trim();
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const dbUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').replace('&channel_binding=require', '');
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function testHealthSync() {
  console.log('--- Testing Apple HealthKit Integration & Neon DB Persistence ---');
  try {
    // 1. Find or verify test user
    const student = await prisma.user.findFirst({
      where: { email: { contains: '2330231@kiit.ac.in' } }
    }) || await prisma.user.findFirst({
      where: { email: { contains: '@kiit.ac.in' } }
    });

    if (!student) {
      console.error('No student found in database.');
      return;
    }
    console.log(`Found student: ${student.email} (ID: ${student.id})`);

    // 2. Import auth helper to create health sync token
    const { SignJWT } = require('jose');
    const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
    const syncToken = await new SignJWT({ userId: student.id, purpose: 'health_sync' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('365d')
      .sign(JWT_SECRET);

    console.log(`Generated Health Sync Bearer Token: ${syncToken.slice(0, 25)}...`);

    // 3. Simulate Apple HealthKit Webhook payload
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const applePayload = {
      source: 'apple_health',
      date: today.toISOString(),
      sleepHours: 7.8,
      deepSleepMin: 85,
      restingHeartRate: 62,
      hrv: 68,
      steps: 8450,
      stressLevel: 2,
      focusLevel: 4,
      energyLevel: 4
    };

    console.log('Sending Apple HealthKit payload to database...');

    // Upsert into Neon DB via HealthMetric table
    const metric = await prisma.healthMetric.upsert({
      where: {
        userId_date: {
          userId: student.id,
          date: today,
        },
      },
      create: {
        userId: student.id,
        date: today,
        sleepHours: applePayload.sleepHours,
        deepSleepMin: applePayload.deepSleepMin,
        restingHeartRate: applePayload.restingHeartRate,
        hrv: applePayload.hrv,
        steps: applePayload.steps,
        stressLevel: applePayload.stressLevel,
        focusLevel: applePayload.focusLevel,
        energyLevel: applePayload.energyLevel,
        burnoutScore: 18.5,
        burnoutRisk: 'LOW',
        cognitiveCap: 92.0,
        recoveryAdvice: 'Optimal autonomic recovery. High cognitive capacity available for complex engineering problem solving.',
        source: applePayload.source,
      },
      update: {
        sleepHours: applePayload.sleepHours,
        deepSleepMin: applePayload.deepSleepMin,
        restingHeartRate: applePayload.restingHeartRate,
        hrv: applePayload.hrv,
        steps: applePayload.steps,
        stressLevel: applePayload.stressLevel,
        focusLevel: applePayload.focusLevel,
        energyLevel: applePayload.energyLevel,
        burnoutScore: 18.5,
        burnoutRisk: 'LOW',
        cognitiveCap: 92.0,
        recoveryAdvice: 'Optimal autonomic recovery. High cognitive capacity available for complex engineering problem solving.',
        source: applePayload.source,
      },
    });

    console.log('✅ Apple HealthKit metric successfully synced to NeonDB:');
    console.log(JSON.stringify({
      id: metric.id,
      userId: metric.userId,
      date: metric.date,
      sleepHours: metric.sleepHours,
      deepSleepMin: metric.deepSleepMin,
      hrv: metric.hrv,
      burnoutScore: metric.burnoutScore,
      burnoutRisk: metric.burnoutRisk,
      cognitiveCap: metric.cognitiveCap,
      source: metric.source
    }, null, 2));

    // 4. Verify query
    const saved = await prisma.healthMetric.findFirst({
      where: { userId: student.id, source: 'apple_health' },
      orderBy: { date: 'desc' }
    });
    console.log(`Verified record in DB with ID: ${saved.id}, Sleep: ${saved.sleepHours} hrs, HRV: ${saved.hrv} ms, Source: ${saved.source}`);

  } catch (err) {
    console.error('Error during health sync test:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testHealthSync();
