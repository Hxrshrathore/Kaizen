import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export async function POST() {
  try {
    const rootEmail = '2330231@kiit.ac.in';
    let user = await prisma.user.findUnique({
      where: { email: rootEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: rootEmail,
          name: 'Harsh Kumar',
          hasConsent: true,
          userType: 'ROOT',
          officialTag: 'AAA',
          officialTags: ['AAA'],
          permissions: ['ALL_AREA_ACCESS'],
          designation: 'System Architect & Root Administrator',
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          hasConsent: true,
          userType: 'ROOT',
          officialTag: 'AAA',
          officialTags: ['AAA'],
          permissions: ['ALL_AREA_ACCESS'],
          designation: 'System Architect & Root Administrator',
        }
      });
    }

    const token = await createSession(user.id, true);

    const response = NextResponse.json({
      success: true,
      message: 'Demo session created',
      user: { name: user.name, email: user.email }
    });

    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Demo Auth Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
