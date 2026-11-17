import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  getProjectChatMessages, 
  sendProjectChat, 
  updateProjectLinks, 
  ensureProjectTables 
} from '@/lib/project-storage';

export async function GET(req: Request) {
  try {
    await ensureProjectTables();

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');
    if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });

    const messages = await getProjectChatMessages(groupId);
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureProjectTables();

    const cookieHeader = req.headers.get('cookie');
    const token = cookieHeader?.split('session_token=')[1]?.split(';')[0];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = await verifySession(token);
    if (!userId) return NextResponse.json({ error: "Invalid Session" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const body = await req.json();
    const { action, groupId, message, attachmentUrl, attachmentName, attachmentType, githubRepo, whatsappLink, role } = body;

    if (!groupId) return NextResponse.json({ error: "groupId is required" }, { status: 400 });

    if (action === 'UPDATE_LINKS') {
      const res = await updateProjectLinks(groupId, githubRepo, whatsappLink);
      return NextResponse.json(res);
    }

    if (action === 'SEND_MESSAGE') {
      if (!message && !attachmentUrl) {
        return NextResponse.json({ error: "Message content or attachment is required" }, { status: 400 });
      }

      const senderRole = role || (user?.officialTag === 'FIC' ? 'FIC' : 'MEMBER');

      const res = await sendProjectChat(groupId, {
        senderId: user?.id || 'anon',
        senderName: user?.name || 'Member',
        senderRole,
        message: message || `Uploaded an attachment: ${attachmentName || 'Document'}`,
        attachmentUrl,
        attachmentName,
        attachmentType,
      });

      return NextResponse.json(res);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/projects/workspace error:", error);
    return NextResponse.json({ error: error.message || "Failed to post to workspace" }, { status: 500 });
  }
}
