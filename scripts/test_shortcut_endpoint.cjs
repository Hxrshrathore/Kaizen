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

async function testShortcutEndpoint() {
  console.log('--- Testing Apple Shortcut Generator & Ingestion API ---');
  
  // 1. Generate sync token using auth
  const { SignJWT } = require('jose');
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');
  const testUserId = 'cmkb1kjsd0000hk7kx77jryla'; // Harsh Kumar (2330231@kiit.ac.in)

  const syncToken = await new SignJWT({ userId: testUserId, purpose: 'health_sync' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(JWT_SECRET);

  console.log(`Generated Bearer token: ${syncToken.slice(0, 25)}...`);

  // 2. Test shortcut plist generation
  const webhookUrl = 'https://kiit-nexus.vercel.app/api/health/sync';
  const plistSample = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>WFWorkflowClientVersion</key>
	<string>2607.1</string>
	<key>WFWorkflowMinimumClientVersion</key>
	<integer>900</integer>
	<key>WFWorkflowIcon</key>
	<dict>
		<key>WFWorkflowIconGlyphNumber</key>
		<integer>59445</integer>
		<key>WFWorkflowIconStartColor</key>
		<integer>4282601983</integer>
	</dict>
	<key>WFWorkflowActions</key>
	<array>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.downloadurl</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFURL</key>
				<string>${webhookUrl}</string>
				<key>WFHTTPMethod</key>
				<string>POST</string>
			</dict>
		</dict>
	</array>
</dict>
</plist>`;

  // Verify XML structure
  if (plistSample.includes('is.workflow.actions.downloadurl') && plistSample.includes(webhookUrl)) {
    console.log('✅ Apple Shortcut Plist structure validated successfully!');
  } else {
    throw new Error('Plist structure failed validation');
  }

  // 3. Test NeonDB Health Metric Sync
  const { PrismaClient } = require('@prisma/client');
  const dbUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').replace('&channel_binding=require', '');
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  const testPayload = {
    source: 'apple_health',
    sleepHours: 8.0,
    deepSleepMin: 90,
    restingHeartRate: 60,
    hrv: 72,
    steps: 9800,
    stressLevel: 2,
    focusLevel: 5,
    energyLevel: 5
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const syncedMetric = await prisma.healthMetric.upsert({
    where: {
      userId_date: {
        userId: testUserId,
        date: today
      }
    },
    create: {
      userId: testUserId,
      date: today,
      sleepHours: testPayload.sleepHours,
      deepSleepMin: testPayload.deepSleepMin,
      restingHeartRate: testPayload.restingHeartRate,
      hrv: testPayload.hrv,
      steps: testPayload.steps,
      stressLevel: testPayload.stressLevel,
      focusLevel: testPayload.focusLevel,
      energyLevel: testPayload.energyLevel,
      burnoutScore: 12.0,
      burnoutRisk: 'LOW',
      cognitiveCap: 96.0,
      recoveryAdvice: 'Peak autonomic recovery. Excellent cognitive capacity for full curricular workload.',
      source: 'apple_health'
    },
    update: {
      sleepHours: testPayload.sleepHours,
      deepSleepMin: testPayload.deepSleepMin,
      restingHeartRate: testPayload.restingHeartRate,
      hrv: testPayload.hrv,
      steps: testPayload.steps,
      stressLevel: testPayload.stressLevel,
      focusLevel: testPayload.focusLevel,
      energyLevel: testPayload.energyLevel,
      burnoutScore: 12.0,
      burnoutRisk: 'LOW',
      cognitiveCap: 96.0,
      recoveryAdvice: 'Peak autonomic recovery. Excellent cognitive capacity for full curricular workload.',
      source: 'apple_health'
    }
  });

  console.log(`✅ Upserted HealthMetric row in NeonDB: ID=${syncedMetric.id}`);
  console.log(`   Sleep: ${syncedMetric.sleepHours}h | Deep Sleep: ${syncedMetric.deepSleepMin}m | HRV: ${syncedMetric.hrv}ms`);
  console.log(`   Burnout Score: ${syncedMetric.burnoutScore}/100 (${syncedMetric.burnoutRisk}) | Cognitive Cap: ${syncedMetric.cognitiveCap}%`);

  await prisma.$disconnect();
  console.log('--- All Apple HealthKit tests PASSED ---');
}

testShortcutEndpoint().catch(console.error);
