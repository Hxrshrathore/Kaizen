import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getAcademicInbox, AcademicEmail } from '@/lib/mail-service';
import { upstashRedis } from '@/lib/upstash';

// ── GET: RETRIEVE NEURAL INBOX ─────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifySession(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();
    const forceRefresh = searchParams.get('refresh') === 'true';

    const result = await getAcademicInbox(userId, forceRefresh);
    let filteredEmails = [...result.emails];

    // Filter by Category
    if (category && category !== 'ALL') {
      filteredEmails = filteredEmails.filter(e => e.category === category);
    }

    // Filter by Search Query
    if (search) {
      filteredEmails = filteredEmails.filter(e => 
        e.subject.toLowerCase().includes(search) || 
        e.sender.name.toLowerCase().includes(search) || 
        e.snippet.toLowerCase().includes(search) ||
        (e.neuralSummary.relatedCourseCode && e.neuralSummary.relatedCourseCode.toLowerCase().includes(search))
      );
    }

    // Compute Metrics
    const unreadCount = result.emails.filter(e => !e.isRead).length;
    const urgentCount = result.emails.filter(e => e.urgency === 'HIGH').length;
    const deadlinesCount = result.emails.filter(e => e.category === 'DEADLINE').length;
    const classroomCount = result.emails.filter(e => e.category === 'CLASSROOM').length;

    return NextResponse.json({
      success: true,
      emails: filteredEmails,
      totalCount: result.emails.length,
      isLiveGoogle: result.isLiveGoogle,
      userEmail: result.userEmail,
      lastSyncedAt: result.lastSyncedAt,
      metrics: {
        unreadCount,
        urgentCount,
        deadlinesCount,
        classroomCount
      }
    });

  } catch (error: any) {
    console.error('Mail Sync GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch mailbox' }, { status: 500 });
  }
}

// ── POST: TRIGGER ON-DEMAND LIVE GMAIL RE-SYNC ──────────────────────────────
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifySession(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    // Force re-fetch from Gmail API and update Redis
    const result = await getAcademicInbox(userId, true);

    return NextResponse.json({
      success: true,
      message: result.isLiveGoogle 
        ? 'Successfully synchronized live academic threads from Gmail' 
        : 'Synchronized with KIIT Academic Feeds',
      isLiveGoogle: result.isLiveGoogle,
      emailsCount: result.emails.length,
      lastSyncedAt: result.lastSyncedAt,
      emails: result.emails
    });

  } catch (error: any) {
    console.error('Mail Sync POST Error:', error);
    return NextResponse.json({ error: error.message || 'Live synchronization failed' }, { status: 500 });
  }
}

// ── PATCH: TOGGLE READ OR STARRED STATUS ────────────────────────────────────
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await verifySession(sessionToken);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
    }

    const { emailId, isRead, isStarred } = await req.json();
    if (!emailId) {
      return NextResponse.json({ error: 'emailId required' }, { status: 400 });
    }

    const cacheKey = `kaizen:mail_inbox:${userId}`;
    const cached = await upstashRedis.get<AcademicEmail[]>(cacheKey);

    if (cached && Array.isArray(cached)) {
      const updated = cached.map(e => {
        if (e.id === emailId) {
          return {
            ...e,
            isRead: isRead !== undefined ? isRead : e.isRead,
            isStarred: isStarred !== undefined ? isStarred : e.isStarred,
          };
        }
        return e;
      });

      await upstashRedis.set(cacheKey, JSON.stringify(updated), { ex: 600 });
      return NextResponse.json({ success: true, emailId });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Mail Sync PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 });
  }
}

