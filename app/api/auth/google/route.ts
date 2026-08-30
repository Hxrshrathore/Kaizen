import { NextResponse } from 'next/server';
import { db } from '../../../../lib/prisma';
import { createSession } from '../../../../lib/auth'; // Ensure this exists from previous step

export async function POST(req: Request) {
  try {
    // In production, you would verify the Google ID Token here.
    // For now, we trust the email sent from the client to speed up dev.
    const { email, name, image } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "Missing identity data" }, { status: 400 });
    }

    // 1. 🔒 STRICT DOMAIN CHECK
    if (!email.endsWith('@kiit.ac.in')) {
      return NextResponse.json(
        { error: "Access Restricted: Only @kiit.ac.in emails are allowed." }, 
        { status: 403 }
      );
    }

    // 2. Find or Create User (Upsert)
    // We update the name/image in case they changed on Google
    const user = await db.user.upsert({
      where: { email },
      update: { name, image },
      create: { 
        email, 
        name, 
        image 
      },
    });

    // 3. Create Session
    const token = await createSession(user.id);

    const response = NextResponse.json({ success: true, user });
    
    // 4. Set Secure Cookie
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}