import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(new URL('/login?error=GoogleAuthFailed', req.url));
  }

  try {
    // 1. Exchange 'code' for 'access_token'
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Token Error:", tokenData);
      throw new Error('Failed to get tokens');
    }

    // 2. Get User Profile using 'access_token'
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userResponse.json();

    // 3. Domain Restriction Check
    if (!googleUser.email.endsWith('@kiit.ac.in')) {
      // Redirect back to login with a specific error
      return NextResponse.redirect(new URL('/login?error=UnauthorizedDomain', req.url));
    }

    // 4. Database Sync (Upsert User with Tokens)
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
    const preConsent = req.cookies.get('pre_consent')?.value === 'true';

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    // Sole Root Access: strictly 2330231@kiit.ac.in
    const isRootUser = googleUser.email.trim().toLowerCase() === '2330231@kiit.ac.in';

    const isRollNumber = /^\d+@kiit\.ac\.in$/i.test(googleUser.email);
    const initialUserType = isRootUser ? 'ROOT' : isRollNumber ? 'STUDENT' : 'FACULTY';
    const initialOfficialTag = isRootUser
      ? 'AAA'
      : isRollNumber
      ? 'GENERAL_STUDENT'
      : 'PROFESSOR';
    
    if (user) {
      user = await prisma.user.update({
        where: { email: googleUser.email },
        data: {
          name: googleUser.name,
          image: googleUser.picture,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || undefined,
          tokenExpiry: tokenExpiry,
          ...(preConsent ? { hasConsent: true } : {}),
          ...(isRootUser
            ? {
                userType: 'ROOT',
                officialTag: 'AAA',
                officialTags: ['AAA'],
                permissions: ['ALL_AREA_ACCESS'],
                designation: 'System Architect & Root Administrator',
              }
            : user.userType === 'ROOT' || user.officialTag === 'AAA'
            ? {
                // Strip unauthorized root privileges
                userType: isRollNumber ? 'STUDENT' : 'FACULTY',
                officialTag: isRollNumber ? 'GENERAL_STUDENT' : 'PROFESSOR',
                officialTags: [isRollNumber ? 'GENERAL_STUDENT' : 'PROFESSOR'],
                permissions: [],
              }
            : {})
        }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          image: googleUser.picture,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: tokenExpiry,
          hasConsent: preConsent,
          userType: initialUserType as any,
          officialTag: initialOfficialTag as any,
          officialTags: [initialOfficialTag as any],
          permissions: isRootUser ? ['ALL_AREA_ACCESS'] : [],
          designation: isRootUser ? 'System Architect & Root Administrator' : null,
        }
      });
    }

    // 5. Create Session & Cookie
    const token = await createSession(user.id, user.hasConsent);
    
    // Check where to redirect based on consent
    const redirectUrl = user.hasConsent ? '/dashboard' : '/consent';
    const response = NextResponse.redirect(new URL(redirectUrl, req.url));
    
    // Clear the pre_consent cookie now that it's processed
    if (preConsent) {
      response.cookies.delete('pre_consent');
    }
    
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (err) {
    console.error("OAuth Error:", err);
    return NextResponse.redirect(new URL('/login?error=InternalError', req.url));
  }
}