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

    // Try fetching extended directory details from Google People API
    let profilePicture = googleUser.picture ? googleUser.picture.replace(/=s\d+(-c)?$/, '=s400-c') : null;
    let fetchedDepartment: string | null = null;
    let fetchedDesignation: string | null = null;

    try {
      const peopleResp = await fetch(
        'https://people.googleapis.com/v1/people/me?personFields=photos,organizations,userDefined',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      if (peopleResp.ok) {
        const peopleData = await peopleResp.json();
        // High-res photo from People API
        if (peopleData.photos && peopleData.photos.length > 0 && peopleData.photos[0].url) {
          profilePicture = peopleData.photos[0].url.replace(/=s\d+(-c)?$/, '=s400-c');
        }
        // School / Department / Role from Google Workspace Directory
        if (peopleData.organizations && peopleData.organizations.length > 0) {
          const org = peopleData.organizations.find((o: any) => o.current) || peopleData.organizations[0];
          fetchedDepartment = org.department || org.name || null;
          fetchedDesignation = org.title || null;
        }
      }
    } catch (peopleErr) {
      console.warn("Google People API fetch skipped/unavailable:", peopleErr);
    }

    // 3. Domain Restriction Check
    if (!googleUser.email.endsWith('@kiit.ac.in')) {
      // Redirect back to login with a specific error
      return NextResponse.redirect(new URL('/login?error=UnauthorizedDomain', req.url));
    }

    // 4. Database Sync (Upsert User with Tokens)
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
    const preConsent = req.cookies.get('pre_consent')?.value === 'true';

    let user = await prisma.user.findUnique({ 
      where: { email: googleUser.email },
      include: { academicProfile: true }
    });

    // Sole Root Access: strictly 2330231@kiit.ac.in
    const isRootUser = googleUser.email.trim().toLowerCase() === '2330231@kiit.ac.in';

    const rollMatch = googleUser.email.match(/^(\d+)@kiit\.ac\.in$/i);
    const rollNumber = rollMatch ? rollMatch[1] : null;
    const isRollNumber = Boolean(rollNumber);

    // Look up student directory in NeonDB for official KIIT 7th Semester roster
    let directoryStudent: any = null;
    if (rollNumber) {
      try {
        directoryStudent = await prisma.studentDirectory.findUnique({
          where: { rollNo: rollNumber }
        });
      } catch (dirErr) {
        console.warn("Could not query StudentDirectory:", dirErr);
      }
    }

    const initialUserType = isRootUser ? 'ROOT' : isRollNumber ? 'STUDENT' : 'FACULTY';
    const initialOfficialTag = isRootUser
      ? 'AAA'
      : isRollNumber
      ? 'GENERAL_STUDENT'
      : 'PROFESSOR';

    // Resolved Directory Metadata
    const resolvedName = directoryStudent?.name || googleUser.name;
    const resolvedSection = directoryStudent?.section || 'ECS GROUP-03';
    const resolvedProgram = directoryStudent?.program || 'B.Tech in Electronics Engineering (7th Sem)';
    const resolvedBranch = (directoryStudent as any)?.branch || (resolvedProgram.includes('ETC') ? 'ETC' : resolvedProgram.includes('EEE') ? 'EEE' : 'E&CSc');
    const resolvedDepartment = fetchedDepartment || 'School of Electronics Engineering';
    const resolvedDesignation = isRootUser
      ? 'System Architect & Root Administrator'
      : (fetchedDesignation || (isRollNumber ? `B.Tech Student (7th Sem, ${resolvedBranch})` : 'Faculty Member'));
    
    if (user) {
      user = await prisma.user.update({
        where: { email: googleUser.email },
        data: {
          name: googleUser.name || resolvedName,
          image: profilePicture || user.image,
          department: resolvedDepartment || user.department,
          designation: isRootUser 
            ? 'System Architect & Root Administrator' 
            : (fetchedDesignation || user.designation || resolvedDesignation),
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
        },
        include: { academicProfile: true }
      });

      // Ensure Academic Profile exists with roll number & exact section from directory
      if (!user.academicProfile && isRollNumber) {
        await prisma.academicProfile.create({
          data: {
            userId: user.id,
            rollNumber: rollNumber,
            program: resolvedProgram,
            section: resolvedSection,
            branch: resolvedBranch,
            cgpa: 0.0
          }
        });
      } else if (user.academicProfile && isRollNumber && directoryStudent) {
        await prisma.academicProfile.update({
          where: { id: user.academicProfile.id },
          data: {
            rollNumber: rollNumber,
            section: user.academicProfile.section || resolvedSection,
            branch: user.academicProfile.branch || resolvedBranch,
            program: user.academicProfile.program || resolvedProgram,
          }
        });
      }

      // Sync elective allotment into AcademicProfile
      if (directoryStudent?.electiveSection) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE "AcademicProfile" 
             SET "electiveSection" = $1, "electiveSubject" = $2, "electiveFaculty" = $3, "electiveRoom" = $4
             WHERE "userId" = $5`,
            directoryStudent.electiveSection,
            directoryStudent.electiveSubject,
            directoryStudent.electiveFaculty,
            directoryStudent.electiveRoom,
            user.id
          );
        } catch (e) {
          console.warn("Could not sync elective allotment:", e);
        }
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name || resolvedName,
          image: profilePicture,
          department: resolvedDepartment,
          designation: resolvedDesignation,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: tokenExpiry,
          hasConsent: preConsent,
          userType: initialUserType as any,
          officialTag: initialOfficialTag as any,
          officialTags: [initialOfficialTag as any],
          permissions: isRootUser ? ['ALL_AREA_ACCESS'] : [],
          academicProfile: isRollNumber ? {
            create: {
              rollNumber: rollNumber,
              program: resolvedProgram,
              section: resolvedSection,
              branch: resolvedBranch,
              cgpa: 0.0
            }
          } : undefined
        },
        include: { academicProfile: true }
      });

      if (directoryStudent?.electiveSection) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE "AcademicProfile" 
             SET "electiveSection" = $1, "electiveSubject" = $2, "electiveFaculty" = $3, "electiveRoom" = $4
             WHERE "userId" = $5`,
            directoryStudent.electiveSection,
            directoryStudent.electiveSubject,
            directoryStudent.electiveFaculty,
            directoryStudent.electiveRoom,
            user.id
          );
        } catch (e) {
          console.warn("Could not sync elective allotment on create:", e);
        }
      }
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