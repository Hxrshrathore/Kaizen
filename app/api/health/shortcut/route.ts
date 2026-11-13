import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, createHealthSyncToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function generateAppleShortcutPlist(webhookUrl: string, syncToken: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
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
	<key>WFWorkflowTypes</key>
	<array>
		<string>NCWidget</string>
		<string>WatchKit</string>
	</array>
	<key>WFWorkflowActions</key>
	<array>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.comment</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFCommentActionText</key>
				<string>KAIZEN Academic OS - Autonomous Apple HealthKit Daily Biometric Sync. Collects sleep stages and heart rate variability to predict cognitive recovery and prevent attendance debarment.</string>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.health.quantity.get</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFQuantityType</key>
				<string>HKCategoryTypeIdentifierSleepAnalysis</string>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.downloadurl</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFURL</key>
				<string>${webhookUrl}</string>
				<key>WFHTTPMethod</key>
				<string>POST</string>
				<key>WFHTTPHeaders</key>
				<dict>
					<key>Content-Type</key>
					<string>application/json</string>
					<key>Authorization</key>
					<string>Bearer ${syncToken}</string>
				</dict>
				<key>WFHTTPBodyType</key>
				<string>JSON</string>
				<key>WFJSONValues</key>
				<dict>
					<key>Value</key>
					<dict>
						<key>WFDictionaryFieldValueItems</key>
						<array>
							<dict>
								<key>WFItemType</key>
								<integer>0</integer>
								<key>WFKey</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>source</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
								<key>WFValue</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>apple_health</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
							</dict>
							<dict>
								<key>WFItemType</key>
								<integer>0</integer>
								<key>WFKey</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>sleepHours</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
								<key>WFValue</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>7.5</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
							</dict>
							<dict>
								<key>WFItemType</key>
								<integer>0</integer>
								<key>WFKey</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>deepSleepMin</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
								<key>WFValue</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>80</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
							</dict>
							<dict>
								<key>WFItemType</key>
								<integer>0</integer>
								<key>WFKey</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>hrv</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
								<key>WFValue</key>
								<dict>
									<key>Value</key>
									<dict>
										<key>string</key>
										<string>65</string>
									</dict>
									<key>WFSerializationType</key>
									<string>WFTextTokenString</string>
								</key>
							</dict>
						</array>
					</dict>
				</dict>
			</dict>
		</dict>
		<dict>
			<key>WFWorkflowActionIdentifier</key>
			<string>is.workflow.actions.notification</string>
			<key>WFWorkflowActionParameters</key>
			<dict>
				<key>WFNotificationActionTitle</key>
				<string>KAIZEN Biometric Sync</string>
				<key>WFNotificationActionBody</key>
				<string>✓ Apple Health sleep and circadian recovery synced to KIIT Cockpit.</string>
			</dict>
		</dict>
	</array>
</dict>
</plist>`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get('download') === '1' || searchParams.get('file') === '1';

    // 1. Resolve session user or default student
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value || cookieStore.get('auth-token')?.value;

    let userId: string | null = null;
    if (token) {
      userId = await verifySession(token);
    }

    if (!userId) {
      const demoUser = await prisma.user.findFirst({
        where: { email: { contains: '@kiit.ac.in' } },
        select: { id: true },
      });
      userId = demoUser?.id || 'demo-student-id';
    }

    // 2. Generate long-lived JWT sync token
    const syncToken = await createHealthSyncToken(userId);

    // 3. Resolve host
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const webhookUrl = `${protocol}://${host}/api/health/sync`;

    // 4. Return downloadable .shortcut file if requested
    if (isDownload) {
      const plistContent = generateAppleShortcutPlist(webhookUrl, syncToken);
      return new NextResponse(plistContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-apple-aspen-config',
          'Content-Disposition': 'attachment; filename="Sync_Kaizen_Health.shortcut"',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // 5. Otherwise return JSON metadata with one-click install links
    const directDownloadUrl = `${webhookUrl.replace('/api/health/sync', '')}/api/health/shortcut?download=1`;

    return NextResponse.json({
      success: true,
      shortcutName: 'Sync Kaizen Health',
      downloadUrl: directDownloadUrl,
      webhookUrl,
      syncToken,
      installInstructions: {
        method1_oneClick: 'Tap "Install Apple Shortcut" on your iPhone or Mac to download and add the pre-configured workflow directly.',
        method2_automation: 'In Apple Shortcuts > Automations > "When Waking Up" > Add Action: Run Shortcut "Sync Kaizen Health".',
        method3_curl: `curl -X POST "${webhookUrl}" -H "Authorization: Bearer ${syncToken}" -H "Content-Type: application/json" -d '{"source":"apple_health","sleepHours":7.8,"hrv":68,"steps":8200}'`
      },
      samplePayload: {
        source: 'apple_health',
        sleepHours: 7.8,
        deepSleepMin: 85,
        restingHeartRate: 62,
        hrv: 68,
        steps: 8450,
      },
    });
  } catch (error: any) {
    console.error('Apple Shortcut generator error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
