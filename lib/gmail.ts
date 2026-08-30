import { db } from './prisma';
import { getValidToken } from './classroom'; // Reusing the exact same OAuth token logic!

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function fetchLatestAttendanceEmail(userId: string) {
  const token = await getValidToken(userId);

  // Query: Specifically find the attendance report from academics
  const query = encodeURIComponent('from:academics@kiit.ac.in subject:"Attendance report"');
  
  const searchRes = await fetch(`${GMAIL_API_BASE}/messages?q=${query}&maxResults=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    throw new Error('Failed to fetch Gmail messages');
  }

  const searchData = await searchRes.json();
  if (!searchData.messages || searchData.messages.length === 0) {
    return null; // No attendance emails found
  }

  const messageId = searchData.messages[0].id;
  
  const msgRes = await fetch(`${GMAIL_API_BASE}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!msgRes.ok) {
    throw new Error('Failed to fetch specific Gmail message body');
  }

  const msgData = await msgRes.json();
  
  // Extract the text/html body. Gmail API returns it base64url encoded.
  let bodyData = '';
  
  // Gmail message payload has parts, we need to recursively find the text/plain or text/html part
  function findBodyPart(parts: any[]): any {
    for (const part of parts) {
      if (part.mimeType === 'text/html' || part.mimeType === 'text/plain') {
        return part.body.data;
      }
      if (part.parts) {
        const found = findBodyPart(part.parts);
        if (found) return found;
      }
    }
    return null;
  }

  if (msgData.payload.parts) {
    bodyData = findBodyPart(msgData.payload.parts);
  } else if (msgData.payload.body?.data) {
    bodyData = msgData.payload.body.data;
  }

  if (bodyData) {
    const decodedBody = Buffer.from(bodyData, 'base64').toString('utf-8');
    return {
      id: messageId,
      date: new Date(parseInt(msgData.internalDate)),
      body: decodedBody
    };
  }

  return null;
}

export function parseAttendanceData(emailBody: string) {
  const records: { courseCode: string, attended: number, total: number, percentage: number }[] = [];
  
  // Format: COURSE_CODE-PERCENTAGE %
  // Matches: CE30072-14.29 %, HS30101-48.72 %, etc.
  const regex = /([A-Z0-9]+)-([0-9.]+)\s*%/g;
  let match;
  
  while ((match = regex.exec(emailBody)) !== null) {
    const courseCode = match[1];
    const percentage = parseFloat(match[2]);

    records.push({
      courseCode,
      attended: 0, // University only provides percentage
      total: 0,    // University only provides percentage
      percentage
    });
  }

  return records;
}
